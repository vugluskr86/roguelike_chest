#!/usr/bin/env python3
"""Пакует спрайты одинакового размера в атлас + JSON под sprites.js.

  python3 tools/atlas.py assets/sprites/*.png --cell 96 --out assets/atlas

Имена вида <piece>_<direction>.png группируются: atlas.json получит
{ "pawn": { "south": [x,y], "east": [x,y], ... }, ... }
Файлы без "_" попадают в группу "_misc".
"""
import argparse, glob, json, math, pathlib
from PIL import Image

DIRS8 = ["south", "south-east", "east", "north-east",
         "north", "north-west", "west", "south-west"]

ap = argparse.ArgumentParser()
ap.add_argument("files", nargs="+")
ap.add_argument("--cell", type=int, default=96)
ap.add_argument("--out", default="assets/atlas")
ap.add_argument("--cols", type=int, default=8)
a = ap.parse_args()

files = []
for f in a.files:
    files.extend(sorted(glob.glob(f)) or [f])


def key(p):
    stem = pathlib.Path(p).stem
    for d in sorted(DIRS8, key=len, reverse=True):
        if stem.endswith("_" + d):
            return stem[: -len(d) - 1], d
    return stem, "default"


files.sort(key=lambda p: (key(p)[0], DIRS8.index(key(p)[1]) if key(p)[1] in DIRS8 else 99))
cols = a.cols
rows = math.ceil(len(files) / cols)
atlas = Image.new("RGBA", (cols * a.cell, rows * a.cell), (0, 0, 0, 0))
meta = {}

for i, f in enumerate(files):
    x, y = (i % cols) * a.cell, (i // cols) * a.cell
    im = Image.open(f).convert("RGBA")
    if im.size != (a.cell, a.cell):
        im = im.resize((a.cell, a.cell), Image.NEAREST)
    atlas.paste(im, (x, y))
    piece, d = key(f)
    meta.setdefault(piece, {})[d] = [x, y]

out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
atlas.save(out.with_suffix(".png"))
out.with_suffix(".json").write_text(json.dumps(
    {"cell": a.cell, "size": list(atlas.size), "frames": meta},
    ensure_ascii=False, indent=2), encoding="utf-8")
print(out.with_suffix(".png"), atlas.size, len(files), "спрайтов,", len(meta), "фигур")
