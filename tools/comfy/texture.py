#!/usr/bin/env python3
"""
comfy/texture.py — вытащить бесшовную текстуру стены из любого кадра.

Зачем: девять кусков scale9 диффузия сделать не может. «Завершённый угол
сверху-слева, сырые края справа и снизу» — топологическое утверждение
о стыковке тайлов, а не изобразительная задача; модель таких понятий не имеет
и рисует девять независимых сцен с дверями и факелами.

Но материал в этих кадрах годный. Форму даёт autotile.js: он уже скругляет
наружные углы и подрезает внутренние по маске соседей. Нужна только заливка.

    # спасти уже сгенерированное: центральная ячейка каждого листа
    python tools/comfy/texture.py --from-sheets

    # или из отдельных кусков _5_c (они «сплошная кладка без краёв»)
    python tools/comfy/texture.py --from-pieces --comfy /путь/к/ComfyUI

    # из свежих текстур (batch.py walls без --pieces)
    python tools/comfy/texture.py --from-textures --comfy /путь/к/ComfyUI

Бесшовность делается зеркалом: кроп отражается по горизонтали и вертикали.
Стык исчезает математически, без блендинга и его артефактов. Симметрия
у камня под тёмной обводкой и скруглением углов не читается.
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

import assets

HERE = Path(__file__).resolve().parent


def find_root(start: Path) -> Path:
    for d in [start, *start.parents]:
        if (d / "package.json").is_file():
            return d
    return start.parent


def find_comfy(root: Path) -> Path:
    env = os.environ.get("COMFYUI_DIR")
    if env:
        return Path(env).expanduser()
    for c in (root / "ComfyUI", root.parent / "ComfyUI", Path.home() / "ComfyUI"):
        if (c / "output").is_dir():
            return c
    return root / "ComfyUI"


ROOT = find_root(HERE)
TILES = ROOT / "src" / "assets" / "tiles"
PALETTE = HERE / "palette.png"


def magick(*args):
    exe = shutil.which("magick") or shutil.which("convert")
    if not exe:
        sys.exit("ImageMagick не найден: https://imagemagick.org")
    subprocess.run([exe, *map(str, args)], check=True)


def best_crop(src: Path, size: int) -> tuple:
    """Окно с самой ровной яркостью. Диффузия рассовывает по кадру объекты —
    окна, арки, черепа; для материала нужен участок, где их нет."""
    try:
        from PIL import Image
        import numpy as np
    except ImportError:
        return None  # без Pillow берём центр, как раньше
    a = np.asarray(Image.open(src).convert("RGB")).astype(float)
    lum = a @ [0.299, 0.587, 0.114]
    H, W = lum.shape
    if H < size or W < size:
        return None
    best, bx, by = None, 0, 0
    step = max(4, size // 8)
    for y in range(0, H - size + 1, step):
        for x in range(0, W - size + 1, step):
            v = lum[y:y + size, x:x + size].std()
            if best is None or v < best:
                best, bx, by = v, x, y
    return bx, by


def make_texture(src: Path, dst: Path, crop: int, out: int, quantize: bool,
                 mode: str = "mirror", grey: bool = False, flatten: int = 0,
                 auto: bool = True):
    """Кроп чистой середины → зеркальная сборка → квантование.

    Кроп берётся из центра: по краям кадра диффузия почти всегда дорисовывает
    рамку, виньетку или обрез объекта, и в тайл это тащить нельзя.
    """
    tmp = dst.with_suffix(".tmp.png")

    # 1. кроп: либо самый ровный участок, либо центр
    spot = best_crop(src, crop) if auto else None
    geom = f"{crop}x{crop}+{spot[0]}+{spot[1]}" if spot else f"{crop}x{crop}+0+0"
    pre = [src] if spot else [src, "-gravity", "center"]
    magick(*pre, "-crop", geom, "+repage", tmp)

    if mode == "offset":
        # Сдвиг на половину и мягкая склейка шва. Симметрии не появляется,
        # в отличие от зеркала, но требуется однородный материал.
        magick(tmp, "-filter", "point", "-resize", f"{out}x{out}!",
               "-virtual-pixel", "tile", "-roll", f"+{out // 2}+{out // 2}",
               "-blur", "0x0.6", tmp)
        args = [tmp]
    else:
        # Зеркало: шов исчезает математически, но при заметной структуре
        # в материале видна симметрия.
        half = out // 2
        magick(tmp, "-filter", "point", "-resize", f"{half}x{half}!", tmp)
        args = [tmp, "(", "+clone", "-flop", ")", "+append",
                "(", "+clone", "-flip", ")", "-append"]

    if grey:
        # Серая текстура + цвет от биома в коде: шесть биомов остаются
        # перекрасом одного материала, а не шестью независимыми картинами.
        args += ["-colorspace", "Gray"]
    if flatten:
        # Сжать разброс яркости: фон не должен спорить с фигурами.
        # 100 - flatten % контраста, плюс подъём чёрной точки — тёмные дыры
        # читаются как проломы, а не как стена.
        args += ["+level", f"{flatten}%,{100 - flatten // 2}%"]
    if quantize and PALETTE.exists() and not grey:
        args += ["-dither", "None", "-remap", PALETTE]
    magick(*args, dst)
    tmp.unlink(missing_ok=True)


def main():
    ap = argparse.ArgumentParser(description="Бесшовная текстура стены из кадра")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--from-sheets", action="store_true",
                   help="центральная ячейка собранных walls-*-scale9.png")
    g.add_argument("--from-pieces", action="store_true",
                   help="куски <биом>_5_c из выхода ComfyUI")
    g.add_argument("--from-textures", action="store_true",
                   help="кадры класса walls без --pieces")
    ap.add_argument("--biome", choices=assets.BIOMES, help="только этот биом")
    ap.add_argument("--index", type=int, default=0, help="какой вариант брать")
    ap.add_argument("--crop", type=int, default=64,
                   help="сколько пикселей взять из центра кадра (по умолчанию 64)")
    ap.add_argument("--size", type=int, default=112, help="размер текстуры (по умолчанию 112)")
    ap.add_argument("--comfy", type=Path)
    ap.add_argument("--no-quantize", action="store_true")
    ap.add_argument("--mode", choices=["mirror", "offset"], default="mirror",
                    help="как делать бесшовность: зеркало (надёжно) или сдвиг (без симметрии)")
    ap.add_argument("--grey", action="store_true",
                    help="серая текстура — цвет даёт код по биому")
    ap.add_argument("--flatten", type=int, default=0, metavar="ПРОЦ",
                    help="сжать контраст на N%% (12–20 для фона)")
    ap.add_argument("--no-auto-crop", action="store_true",
                    help="брать центр, а не самый ровный участок")
    a = ap.parse_args()

    if not (a.from_sheets or a.from_pieces or a.from_textures):
        a.from_sheets = True  # самый частый случай: спасаем уже собранное

    biomes = [a.biome] if a.biome else assets.BIOMES
    comfy = (a.comfy or find_comfy(ROOT)).expanduser()
    TILES.mkdir(parents=True, exist_ok=True)

    made, missing = [], []
    for b in biomes:
        if a.from_sheets:
            sheet = TILES / f"walls-{b}-scale9.png"
            if not sheet.is_file():
                missing.append(f"{b} (нет {sheet.name})")
                continue
            # центральная ячейка 3×3 — та, что «сплошная кладка без краёв»
            src = sheet.with_name(f".{b}_center.png")
            magick(sheet, "-gravity", "center", "-crop", "33.34%x33.34%+0+0", "+repage", src)
            tmp_src = True
        else:
            sub = comfy / "output" / "endgame" / "walls"
            pat = f"{b}_5_c_112_*.png" if a.from_pieces else f"{b}_112_*.png"
            found = sorted(sub.glob(pat))
            if not found:
                missing.append(f"{b} (нет {sub / pat})")
                continue
            src = found[min(a.index, len(found) - 1)]
            tmp_src = False

        dst = TILES / f"wall-tex-{b}.png"
        make_texture(src, dst, a.crop, a.size, not a.no_quantize,
                     mode=a.mode, grey=a.grey, flatten=a.flatten,
                     auto=not a.no_auto_crop)
        if tmp_src:
            src.unlink(missing_ok=True)
        made.append((b, dst))

    for b, dst in made:
        print(f"  {b:12} → {dst.relative_to(ROOT)}  ({a.size}×{a.size}, бесшовная)")
    if missing:
        print("\nне найдено:", "; ".join(missing), file=sys.stderr)

    if made:
        print(f"\nготово: {len(made)}")
        print("Теперь autotile.js должен заливать стены этой текстурой, а не цветом —")
        print("патч в comfy/autotile-texture.patch.js")
        print("\nКуски scale9 больше не нужны:")
        print("  rm src/assets/tiles/walls-*-scale9.png")
    return 0 if made else 1


if __name__ == "__main__":
    sys.exit(main())
