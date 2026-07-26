#!/usr/bin/env python3
"""
comfy/check.py — проверить ассет на пригодность для доски.

Работа стены и пола — молчать. На доске уже висят штриховка угроз, янтарный
предпросмотр, точки ходов трёх цветов, глифы фигур, кружки статусов, кольца
модификаторов и виньетка голода. Фон, который спорит с этим за внимание,
делает позицию нечитаемой независимо от того, насколько он красив сам по себе.

    python tools/comfy/check.py src/assets/tiles/*.png
    python tools/comfy/check.py --role piece src/assets/pieces/bone/knight/*.png
"""

import argparse
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("Нужны Pillow и numpy: pip install pillow numpy")

# Контрастный бюджет. Кто громче — тот и виден; порядок задаётся здесь.
BUDGET = {
    "wall": {"std": 18, "dark": 40, "sym": 90, "note": "стена — самый тихий слой"},
    "floor": {"std": 14, "dark": 45, "sym": 90, "note": "пол тише стены"},
    "cell": {"std": 45, "dark": 0, "sym": 100, "note": "спец-клетка должна выделяться"},
    "piece": {"std": 60, "dark": 0, "sym": 100, "note": "фигура — самый громкий слой"},
    "icon": {"std": 60, "dark": 0, "sym": 100, "note": "иконка читается силуэтом"},
}


def measure(path: Path):
    im = Image.open(path)
    rgba = im.convert("RGBA")
    a = np.asarray(rgba).astype(float)
    alpha = a[..., 3] / 255
    rgb = a[..., :3]
    lum = rgb @ [0.299, 0.587, 0.114]
    vis = alpha > 0.5
    if not vis.any():
        return None
    lv = lum[vis]
    h, w = lum.shape
    left, right = lum[:, : w // 2], lum[:, w // 2 :][:, ::-1]
    sym = (1 - np.abs(left - right).mean() / 255) * 100
    # насыщенность: перенасыщенный фон тянет взгляд не хуже контраста
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)[vis].mean() * 100
    return {
        "std": float(lv.std()),
        "dark": float(lv.min()),
        "light": float(lv.max()),
        "sym": float(sym),
        "sat": float(sat),
        "colors": len(im.convert("RGB").getcolors(65536) or []),
        "size": im.size,
    }


def role_of(path: Path, forced):
    if forced:
        return forced
    p = str(path).replace("\\", "/")
    if "wall" in p or "tiles" in p:
        return "wall"
    if "floor" in p:
        return "floor"
    if "pieces" in p:
        return "piece"
    if "items" in p:
        return "icon"
    return "cell"


def main():
    ap = argparse.ArgumentParser(description="Проверка ассетов на контрастный бюджет")
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--role", choices=list(BUDGET), help="проверять всё как эту роль")
    a = ap.parse_args()

    print(f"{'файл':34} {'роль':6} {'разбр':>6} {'тёмн':>5} {'симм':>6} {'насыщ':>6} {'цвет':>5}")
    bad = 0
    for f in a.files:
        m = measure(f)
        if not m:
            print(f"{f.name:34} — пусто")
            continue
        role = role_of(f, a.role)
        b = BUDGET[role]
        flags = []
        if m["std"] > b["std"]:
            flags.append(f"шумно (>{b['std']})")
        if b["dark"] and m["dark"] < b["dark"]:
            flags.append(f"чёрные дыры (<{b['dark']})")
        if m["sym"] > b["sym"]:
            flags.append("зеркальность видна")
        if role in ("wall", "floor") and m["sat"] > 35:
            flags.append("перенасыщено")
        mark = "  ✓" if not flags else "  ✗ " + ", ".join(flags)
        if flags:
            bad += 1
        print(f"{f.name:34} {role:6} {m['std']:6.1f} {m['dark']:5.0f} "
              f"{m['sym']:5.0f}% {m['sat']:5.0f}% {m['colors']:5}{mark}")

    print(f"\nпроверено {len(a.files)}, не проходит {bad}")
    if bad:
        print("\nЧто с этим делать:")
        print("  шумно        → --flatten 16 или процедурное зерно вместо картинки")
        print("  чёрные дыры  → поднять чёрную точку: они читаются как проломы")
        print("  зеркальность → --mode offset и исходник, который ещё не отражали")
        print("  перенасыщено → --grey, цвет давать кодом по биому")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
