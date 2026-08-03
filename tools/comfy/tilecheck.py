#!/usr/bin/env python3
"""Проверка бесшовности тайла. Печатает метрику шва и кладёт рядом превью 3×3.

  python3 tools/tilecheck.py assets/tiles/*.png --preview-dir out/preview

Метрика: средняя разница между противоположными краями, делённая на среднюю
разницу соседних строк/столбцов внутри тайла. ~1.0 = шва нет. >2.0 — видно.
"""
import argparse, glob, pathlib
import numpy as np
from PIL import Image


def score(a, axis):
    if axis == 0:                       # проверяем верх/низ
        seam = np.abs(a[0].astype(int) - a[-1].astype(int)).mean()
        inner = np.abs(np.diff(a.astype(int), axis=0)).mean()
    else:                               # лево/право
        seam = np.abs(a[:, 0].astype(int) - a[:, -1].astype(int)).mean()
        inner = np.abs(np.diff(a.astype(int), axis=1)).mean()
    return seam / max(inner, 1e-6)


ap = argparse.ArgumentParser()
ap.add_argument("files", nargs="+")
ap.add_argument("--preview-dir", default="")
a = ap.parse_args()

files = []
for f in a.files:
    files.extend(sorted(glob.glob(f)) or [f])

for f in files:
    im = Image.open(f).convert("RGB")
    arr = np.array(im)
    sy, sx = score(arr, 0), score(arr, 1)
    verdict = "OK" if max(sy, sx) < 1.6 else ("шов" if max(sy, sx) < 3 else "ШОВ!")
    print(f"{pathlib.Path(f).name:32} y={sy:5.2f} x={sx:5.2f}  {verdict}")
    if a.preview_dir:
        d = pathlib.Path(a.preview_dir); d.mkdir(parents=True, exist_ok=True)
        w, h = im.size
        grid = Image.new("RGB", (w * 3, h * 3))
        for i in range(3):
            for j in range(3):
                grid.paste(im, (i * w, j * h))
        grid.resize((w * 3 * max(1, 256 // w), h * 3 * max(1, 256 // h)),
                    Image.NEAREST).save(d / (pathlib.Path(f).stem + "_x9.png"))
