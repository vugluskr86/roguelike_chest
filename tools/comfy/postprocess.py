#!/usr/bin/env python3
"""Пост-обработка вывода ComfyUI под пиксель-арт проекта.

  # спрайты: вырезать мадженту, обрезать по контенту, ужать до 96, привязать к палитре
  python3 tools/postprocess.py sprite out/*.png --size 96 --palette palette.json --outdir assets/sprites

  # тайлы: ужать до 64 и квантовать (без обрезки — сетка важна)
  python3 tools/postprocess.py tile out/floor_*.png --size 64 --palette palette.json --outdir assets/tiles

  # пересобрать палитру из своего эталонного арта
  python3 tools/postprocess.py palette screens/*.png --colors 24 --save palette.json
"""
import argparse, glob, json, pathlib
import numpy as np
from PIL import Image


# ------------------------------------------------------------------ утилиты
def load_palette(path):
    if not path:
        return None
    data = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    cols = data["colors"] if isinstance(data, dict) else data
    return np.array([[int(c[i:i + 2], 16) for i in (1, 3, 5)] for c in cols],
                    dtype=np.int16)


def snap_palette(img, pal):
    """Ближайший цвет палитры в OKLab-подобном пространстве (быстрый L*a*b)."""
    rgba = np.array(img.convert("RGBA"), dtype=np.int16)
    rgb = rgba[..., :3].reshape(-1, 3)
    # взвешенное евклидово (учёт восприятия яркости) — дёшево и достаточно
    w = np.array([0.30, 0.59, 0.11])
    d = (((rgb[:, None, :] - pal[None, :, :]) ** 2) * w).sum(-1)
    out = pal[d.argmin(1)].astype(np.uint8).reshape(rgba.shape[0], rgba.shape[1], 3)
    res = np.dstack([out, rgba[..., 3].astype(np.uint8)])
    return Image.fromarray(res, "RGBA")


def chroma_key(img, key=(255, 0, 255), tol=90):
    a = np.array(img.convert("RGBA")).astype(np.int16)
    d = np.abs(a[..., :3] - np.array(key)).sum(-1)
    a[..., 3] = np.where(d < tol, 0, a[..., 3])
    # подчистить кайму: полупрозрачных не оставляем (пиксель-арт = 0 или 255)
    a[..., 3] = np.where(a[..., 3] > 128, 255, 0)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def trim_and_center(img, size, foot_margin=2):
    """Обрезает по непрозрачному контенту и вписывает в квадрат size×size,
    прижимая фигуру к низу (ноги на нижней грани клетки)."""
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    w, h = img.size
    inner = size - foot_margin * 2
    k = min(inner / w, inner / h)
    img = img.resize((max(1, int(w * k)), max(1, int(h * k))), Image.NEAREST)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(img, ((size - img.width) // 2, size - img.height - foot_margin))
    return canvas


def pixelize(img, size):
    if isinstance(size, int):
        size = (size, size)
    return img.resize(size, Image.NEAREST)


def outpath(src, outdir, suffix=""):
    d = pathlib.Path(outdir); d.mkdir(parents=True, exist_ok=True)
    return d / (pathlib.Path(src).stem + suffix + ".png")


# ------------------------------------------------------------------ команды
def cmd_sprite(a):
    pal = load_palette(a.palette)
    for f in a.files:
        im = Image.open(f).convert("RGBA")
        im = chroma_key(im, tol=a.tolerance)
        im = trim_and_center(im, a.size)
        if pal is not None:
            im = snap_palette(im, pal)   # alpha сохраняется внутри
        im.save(outpath(f, a.outdir))
        print("→", outpath(f, a.outdir))


def cmd_tile(a):
    pal = load_palette(a.palette)
    for f in a.files:
        im = Image.open(f).convert("RGBA")
        im = pixelize(im, a.size)
        if pal is not None:
            im = snap_palette(im, pal)
        im.save(outpath(f, a.outdir))
        print("→", outpath(f, a.outdir))


def cmd_palette(a):
    ims = [Image.open(f).convert("RGB") for f in a.files]
    W = 256
    sheet = Image.new("RGB", (W * len(ims), 384))
    for i, im in enumerate(ims):
        sheet.paste(im.resize((W, 384)), (i * W, 0))
    q = sheet.quantize(colors=a.colors, method=Image.MEDIANCUT, dither=Image.Dither.NONE)
    p = q.getpalette()[:a.colors * 3]
    cols = ["#%02X%02X%02X" % tuple(p[i * 3:i * 3 + 3]) for i in range(a.colors)]
    pathlib.Path(a.save).write_text(
        json.dumps({"name": "endshpil", "colors": cols}, indent=2), encoding="utf-8")
    strip = Image.new("RGB", (len(cols) * 32, 32))
    for i, c in enumerate(cols):
        strip.paste(Image.new("RGB", (32, 32), c), (i * 32, 0))
    strip.save(pathlib.Path(a.save).with_suffix(".png"))
    print("→", a.save, cols)


ap = argparse.ArgumentParser()
sub = ap.add_subparsers(dest="cmd", required=True)

s = sub.add_parser("sprite"); s.set_defaults(fn=cmd_sprite)
s.add_argument("files", nargs="+"); s.add_argument("--size", type=int, default=96)
s.add_argument("--tolerance", type=int, default=90)
s.add_argument("--palette"); s.add_argument("--outdir", default="assets/sprites")

s = sub.add_parser("tile"); s.set_defaults(fn=cmd_tile)
s.add_argument("files", nargs="+"); s.add_argument("--size", type=int, default=64)
s.add_argument("--palette"); s.add_argument("--outdir", default="assets/tiles")

s = sub.add_parser("palette"); s.set_defaults(fn=cmd_palette)
s.add_argument("files", nargs="+"); s.add_argument("--colors", type=int, default=24)
s.add_argument("--save", default="palette.json")

if __name__ == "__main__":
    a = ap.parse_args()
    files = []
    for f in getattr(a, "files", []):
        files.extend(sorted(glob.glob(f)) or [f])
    a.files = files
    a.fn(a)
