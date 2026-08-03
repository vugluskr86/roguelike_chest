#!/usr/bin/env python3
"""Режет лист-разворот (сетка cols×rows) на отдельные файлы с именами направлений.

  python3 tools/split_sheet.py out/pawn_sheet.png --cols 4 --rows 2 \
      --names south south-east east north-east north north-west west south-west \
      --prefix pawn --outdir raw/pawn

Порядок имён — слева направо, сверху вниз. Дальше прогоняйте через
postprocess.py sprite (хромакей + обрезка + палитра).
"""
import argparse, pathlib
from PIL import Image

DIRS8 = ["south", "south-east", "east", "north-east",
         "north", "north-west", "west", "south-west"]

ap = argparse.ArgumentParser()
ap.add_argument("sheet")
ap.add_argument("--cols", type=int, default=4)
ap.add_argument("--rows", type=int, default=2)
ap.add_argument("--names", nargs="*", default=DIRS8)
ap.add_argument("--prefix", default="")
ap.add_argument("--outdir", default="raw")
a = ap.parse_args()

im = Image.open(a.sheet).convert("RGBA")
cw, ch = im.width // a.cols, im.height // a.rows
out = pathlib.Path(a.outdir); out.mkdir(parents=True, exist_ok=True)
i = 0
for r in range(a.rows):
    for c in range(a.cols):
        if i >= len(a.names):
            break
        cell = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
        stem = f"{a.prefix}_{a.names[i]}" if a.prefix else a.names[i]
        cell.save(out / f"{stem}.png")
        print("→", out / f"{stem}.png")
        i += 1
