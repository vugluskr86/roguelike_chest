#!/usr/bin/env python3
"""Собирает scale9-лист из кусков, которые выдал workflow 04, и печатает
готовый CSS border-image + метаданные для рендера в игре.

  python3 tools/slice9.py --name panel \
      --corner out/panel_corner.png --edge-h out/panel_edge_h.png \
      --edge-v out/panel_edge_v.png --fill out/panel_fill.png \
      --outdir assets/ui

На выходе assets/ui/panel.png (лист 3×3) и panel.json с border-image-slice.
Логика: угол берётся один раз и зеркалится в остальные 3 (симметрия рамки —
норма для UI и экономит генерации). Края берутся из tileX/tileY-версий, так что
повторяются без шва.
"""
import argparse, json, pathlib
from PIL import Image, ImageOps


def main(a):
    corner = Image.open(a.corner).convert("RGBA")
    edge_h = Image.open(a.edge_h).convert("RGBA")
    edge_v = Image.open(a.edge_v).convert("RGBA")
    fill = Image.open(a.fill).convert("RGBA") if a.fill else None

    c = corner.width                       # размер угла (квадрат)
    ew, eh = edge_h.width, corner.height   # горизонтальный край
    evh = edge_v.height

    # приводим края к толщине угла
    edge_h = edge_h.resize((ew, c), Image.NEAREST)
    edge_v = edge_v.resize((c, evh), Image.NEAREST)
    if fill:
        fill = fill.resize((ew, evh), Image.NEAREST)
    else:
        fill = Image.new("RGBA", (ew, evh), (0, 0, 0, 0))

    W, H = c * 2 + ew, c * 2 + evh
    sheet = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    tl = corner
    tr = ImageOps.mirror(corner)
    bl = ImageOps.flip(corner)
    br = ImageOps.mirror(ImageOps.flip(corner))
    top = edge_h
    bottom = ImageOps.flip(edge_h)
    left = edge_v
    right = ImageOps.mirror(edge_v)

    sheet.paste(tl, (0, 0)); sheet.paste(top, (c, 0)); sheet.paste(tr, (c + ew, 0))
    sheet.paste(left, (0, c)); sheet.paste(fill, (c, c)); sheet.paste(right, (c + ew, c))
    sheet.paste(bl, (0, c + evh)); sheet.paste(bottom, (c, c + evh))
    sheet.paste(br, (c + ew, c + evh))

    out = pathlib.Path(a.outdir); out.mkdir(parents=True, exist_ok=True)
    png = out / f"{a.name}.png"
    sheet.save(png)

    meta = {
        "name": a.name, "file": png.name, "size": [W, H],
        "slice": {"top": c, "right": c, "bottom": c, "left": c},
        "repeat": "repeat",
        "css": (f"border-image: url('{png.name}') {c} {c} {c} {c} repeat;\n"
                f"border-width: {c}px;\n"
                f"border-style: solid;\n"
                f"image-rendering: pixelated;"),
    }
    (out / f"{a.name}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2),
                                        encoding="utf-8")
    print(png, f"{W}×{H}")
    print(meta["css"])


ap = argparse.ArgumentParser()
ap.add_argument("--name", required=True)
ap.add_argument("--corner", required=True)
ap.add_argument("--edge-h", dest="edge_h", required=True)
ap.add_argument("--edge-v", dest="edge_v", required=True)
ap.add_argument("--fill")
ap.add_argument("--outdir", default="assets/ui")
main(ap.parse_args())
