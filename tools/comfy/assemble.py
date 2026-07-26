#!/usr/bin/env python3
"""
comfy/assemble.py — довести выход ComfyUI до ассетов игры.

Что делает: выбирает вариант, квантует в палитру проекта, выбивает пурпурный
фон, приводит к точному размеру и раскладывает по папкам src/assets.
Для стен в режиме кусков дополнительно собирает лист scale9.

    python comfy/assemble.py cells
    python comfy/assemble.py items --index 2
    python comfy/assemble.py walls
    python comfy/assemble.py walls --pieces
    python comfy/assemble.py cells --picks picks.json
    python comfy/assemble.py --palette          пересобрать палитру и выйти

Выбор варианта: по умолчанию берётся первый (--index 0). Когда набор отсмотрен,
удобнее описать выбор файлом:

    { "trap": 3, "rune": 0, "portal": 5 }

Ключи без записи берут --index.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import assets

HERE = Path(__file__).resolve().parent


def find_root(start: Path) -> Path:
    """Корень проекта — там, где package.json. Так скрипты можно положить
    куда угодно: tools/comfy, scripts, рядом с src — пути не поедут."""
    for d in [start, *start.parents]:
        if (d / "package.json").is_file():
            return d
    return start.parent  # не нашли — считаем, что мы на уровень ниже корня


def find_comfy() -> Path:
    """Папка ComfyUI. Обычно она вне репозитория, поэтому ищем в нескольких
    местах и даём переопределить через COMFYUI_DIR или --comfy."""
    env = os.environ.get("COMFYUI_DIR")
    if env:
        return Path(env).expanduser()
    for c in (ROOT / "ComfyUI", ROOT.parent / "ComfyUI", Path.home() / "ComfyUI"):
        if (c / "output").is_dir():
            return c
    return ROOT / "ComfyUI"


ROOT = find_root(HERE)
SRC = ROOT / "src" / "assets"
PALETTE = HERE / "palette.png"

# Русские названия для заготовки picks.json: выбирать кадры проще, когда
# видно, что это за предмет, а не только id.
RELIC_LABELS = {
    "pawn_double": "Длинный шаг", "pawn_omni": "Круговой удар",
    "knight_extra": "Гарцующий конь", "slider_reach": "Дальний прицел",
    "light_lines": "Светлые линии", "no_fatigue": "Ветеран", "trophy": "Трофей",
    "free_swap": "Быстрые руки", "extra_slot": "Широкое колесо",
    "pawn_shield": "Талисман пешки", "guard_pierce": "Бронебой",
    "silence": "Печать тишины", "mirror_break": "Разбитое зеркало",
    "smoke": "Дымовая завеса", "venom": "Ядовитый след",
    "second_wind": "Второе дыхание", "concuss": "Ошеломление",
    "toxic_aura": "Ядовитая аура", "bulwark": "Оплот",
}
CURSE_LABELS = {
    "brittle": "Хрупкость", "heavy": "Тяжёлая поступь", "marked": "Меченый",
    "compulsion": "Одержимость", "rusted": "Ржавое колесо",
    "bloodline": "Кровавая линия", "guard_tough": "Живучая стража",
    "dark_summon": "Тёмный призыв", "mimic_reach": "Совершенная копия",
    "hex": "Порча", "glass": "Хрупкое тело",
}

MAGENTA = "#FF00FF"
FUZZ = "12%"  # края пурпура после ресайза чуть замылены, точное совпадение не выбьет

# Куда и в каком размере кладём каждый класс.
# @2x берём как основной: на retina тайл 56 CSS = 112 физических пикселей.
LAYOUT = {
    "cells": {"dir": SRC / "cells", "size": 112, "alpha": True, "trim": False},
    "items": {"dir": SRC / "items", "size": 112, "alpha": True, "trim": True},
    "walls": {"dir": SRC / "tiles", "size": 112, "alpha": False, "trim": False},
    "walls_pieces": {"dir": SRC / "tiles", "size": 112, "alpha": True, "trim": False},
}


def magick(*args):
    exe = shutil.which("magick") or shutil.which("convert")
    if not exe:
        sys.exit("ImageMagick не найден. Поставь его: https://imagemagick.org")
    subprocess.run([exe, *map(str, args)], check=True)


def build_palette():
    """Палитра проекта из уже готовых ассетов — то, что сшивает источники."""
    srcs = sorted(p for p in SRC.rglob("*.png") if "comfy" not in p.parts)
    if not srcs:
        print("В src/assets нет PNG — палитру собрать не из чего.", file=sys.stderr)
        print("Сгенерируй первый набор, потом запусти с --palette.", file=sys.stderr)
        return False
    PALETTE.parent.mkdir(parents=True, exist_ok=True)
    magick(*srcs, "-append", "-colors", "24", "-unique-colors", PALETTE)
    print(f"палитра: {PALETTE} ({len(srcs)} исходников)")
    return True


def load_picks(path: Path, section: str) -> dict:
    """picks.json — вложенный по классам либо плоский. Ключи с подчёркиванием
    (_note, _labels) пропускаются: они для человека, не для скрипта."""
    if not path:
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    block = data.get(section)
    src = block if isinstance(block, dict) else data
    return {k: v for k, v in src.items() if not k.startswith("_") and isinstance(v, int)}


def names_for(cls: str, pieces: bool) -> list:
    """Ключи класса — те же, что даёт batch.py, и те же, что в именах файлов."""
    if cls == "cells":
        return list(assets.CELLS)
    if cls == "items":
        return list(assets.ITEMS)
    if pieces:
        return [f"{b}_{p}" for b in assets.BIOMES for p in assets.WALL_PIECES]
    return list(assets.WALL_TEXTURES)


def init_picks(path: Path) -> None:
    """Заготовка со всеми ключами. Генерируется из assets.py, поэтому
    не расходится с промтами при добавлении новых позиций."""
    labels = {**{f"r_{k}": v for k, v in RELIC_LABELS.items()},
              **{f"c_{k}": v for k, v in CURSE_LABELS.items()}}
    doc = {
        "_note": [
            "Какой вариант брать для каждой позиции. Нумерация с нуля:",
            "0 — первый сгенерированный кадр, 1 — второй и так далее.",
            "Ключи без записи берут значение --index (по умолчанию 0).",
            "Ключи с подчёркиванием скрипт игнорирует.",
            "",
            "python tools/comfy/assemble.py cells --picks tools/comfy/picks.json",
        ],
        "cells": {k: 0 for k in assets.CELLS},
        "items": {k: 0 for k in assets.ITEMS},
        "_labels_items": labels,
        "walls": {k: 0 for k in assets.WALL_TEXTURES},
        "walls_pieces": {f"{b}_{p}": 0 for b in assets.BIOMES for p in assets.WALL_PIECES},
    }
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(len(v) for k, v in doc.items() if isinstance(v, dict) and not k.startswith("_"))
    print(f"{path}: {total} позиций, все на варианте 0")


def variants(cls_dir: Path, name: str, size: int):
    """Все варианты позиции, отсортированные по номеру кадра."""
    return sorted(cls_dir.glob(f"{name}_{size}_*.png"))


def process(src: Path, dst: Path, size: int, alpha: bool, trim: bool):
    """Квантование, прозрачность, точный размер."""
    args = [src, "-dither", "None"]
    if PALETTE.exists():
        args += ["-remap", PALETTE]
    if alpha:
        args += ["-fuzz", FUZZ, "-transparent", MAGENTA]
    if trim:
        # предмет центрируем, но холст оставляем точным — иначе поедет в сетке
        args += ["-trim", "+repage", "-background", "none",
                 "-gravity", "center", "-extent", f"{size}x{size}"]
    else:
        # клетки и куски стен обрезать нельзя: они обязаны совпадать с сеткой
        args += ["-background", "none", "-gravity", "center", "-extent", f"{size}x{size}"]
    dst.parent.mkdir(parents=True, exist_ok=True)
    magick(*args, dst)


def montage_scale9(pieces, dst: Path, size: int):
    """Девять кусков в лист 3×3. Порядок ровно как в scale9Index()."""
    exe = shutil.which("magick")
    cmd = [exe, "montage"] if exe else [shutil.which("montage")]
    subprocess.run([*map(str, cmd), *map(str, pieces), "-tile", "3x3",
                    "-geometry", f"{size}x{size}+0+0", "-background", "none", str(dst)],
                   check=True)


def main():
    ap = argparse.ArgumentParser(description="Сборка ассетов из выхода ComfyUI")
    ap.add_argument("cls", nargs="?", choices=["cells", "items", "walls"], default="cells")
    ap.add_argument("--pieces", action="store_true", help="walls: собрать scale9 из 9 кусков")
    ap.add_argument("--index", type=int, default=0, help="какой вариант брать (с нуля)")
    ap.add_argument("--picks", type=Path, help="JSON с выбором вариантов по ключам")
    ap.add_argument("--palette", action="store_true", help="пересобрать палитру и выйти")
    ap.add_argument("--init-picks", nargs="?", const=HERE / "picks.json", type=Path,
                    metavar="ФАЙЛ", help="создать заготовку picks.json со всеми ключами")
    ap.add_argument("--out", type=Path, help="переопределить папку назначения")
    ap.add_argument("--comfy", type=Path, help="папка ComfyUI (или переменная COMFYUI_DIR)")
    a = ap.parse_args()

    if a.init_picks:
        init_picks(a.init_picks)
        return 0

    if a.palette:
        return 0 if build_palette() else 1

    if not PALETTE.exists():
        print("Палитры нет — квантование пропускается.")
        print("Собери её после первого набора: python comfy/assemble.py --palette\n")

    key = "walls_pieces" if (a.cls == "walls" and a.pieces) else a.cls
    conf = LAYOUT[key]
    picks = load_picks(a.picks, key)
    size, dst_dir = conf["size"], (a.out or conf["dir"])
    comfy = (a.comfy or find_comfy()).expanduser()
    cls_dir = comfy / "output" / "endgame" / a.cls
    if not cls_dir.is_dir():
        sys.exit(
            f"Нет папки {cls_dir}.\n"
            f"  Либо кадры ещё не сгенерированы: python {HERE.name}/batch.py {a.cls}\n"
            f"  Либо ComfyUI лежит не там — укажи: --comfy /путь/к/ComfyUI\n"
            f"  или задай переменную COMFYUI_DIR."
        )



    names = names_for(a.cls, a.pieces)

    done, missing = [], []
    for name in names:
        vs = variants(cls_dir, name, size)
        if not vs:
            missing.append(name)
            continue
        idx = min(picks.get(name, a.index), len(vs) - 1)
        out_name = name if a.cls != "items" else name[2:]  # r_/c_ — только для промтов
        dst = dst_dir / f"{out_name}.png"
        process(vs[idx], dst, size, conf["alpha"], conf["trim"])
        done.append((name, vs[idx].name, dst))

    for name, src, dst in done:
        print(f"  {name:24} {src:28} → {dst.relative_to(ROOT)}")

    # ── сборка листов scale9 ──
    if a.cls == "walls" and a.pieces:
        for b in assets.BIOMES:
            parts = [dst_dir / f"{b}_{p}.png" for p in assets.WALL_PIECES]
            if not all(p.exists() for p in parts):
                print(f"  {b}: не все 9 кусков готовы, лист не собран")
                continue
            sheet = dst_dir / f"walls-{b}-scale9.png"
            montage_scale9(parts, sheet, size)
            for p in parts:
                p.unlink()  # куски больше не нужны, autotile.js читает лист
            print(f"  собран {sheet.relative_to(ROOT)} (3×3 по {size}px)")

    if a.cls == "walls" and not a.pieces:
        print("\nТекстуры готовы. autotile.js должен использовать их как заливку —")
        print("см. comfy/README.md, раздел «Текстуры стен».")

    print(f"\nготово: {len(done)}, не найдено: {len(missing)}")
    if missing:
        print("нет кадров для:", ", ".join(missing[:12]) + ("…" if len(missing) > 12 else ""))
        print(f"сгенерируй: python {HERE.name}/batch.py {a.cls}"
              + (" --pieces" if a.pieces else "")
              + (f" --only {' '.join(missing[:5])}" if len(missing) <= 5 else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())