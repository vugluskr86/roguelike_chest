#!/usr/bin/env python3
"""Разворачивает ростер prompts/pieces.json в job-файл: фигуры × 8 направлений.

  python3 tools/make_char_jobs.py --group playable --out jobs/characters_all.json
  python3 tools/make_char_jobs.py --group bosses --only red_king --seed 90210

Seed фиксируется на фигуру (base_seed + индекс фигуры), чтобы все 8 направлений
одного персонажа шли с одного зерна — это главный рычаг консистентности.
"""
import argparse, json, pathlib

DIRS = [
    ("south",       "facing the viewer, front view"),
    ("south-east",  "facing front-right, three-quarter view"),
    ("east",        "facing right, side profile view"),
    ("north-east",  "facing back-right, three-quarter view from behind"),
    ("north",       "facing away from the viewer, back view"),
    ("north-west",  "facing back-left, three-quarter view from behind"),
    ("west",        "facing left, side profile view"),
    ("south-west",  "facing front-left, three-quarter view"),
]

ap = argparse.ArgumentParser()
ap.add_argument("--roster", default="prompts/pieces.json")
ap.add_argument("--group", default="playable")
ap.add_argument("--only", nargs="*")
ap.add_argument("--seed", type=int, default=770000)
ap.add_argument("--mirror-west", action="store_true",
                help="не генерировать west/north-west/south-west (зеркалим из east)")
ap.add_argument("--out", default="jobs/characters_all.json")
a = ap.parse_args()

roster = json.loads(pathlib.Path(a.roster).read_text(encoding="utf-8"))[a.group]
names = a.only or [k for k in roster if not k.startswith("_")]
dirs = [d for d in DIRS if not (a.mirror_west and d[0].endswith("west"))]

jobs = []
for i, piece in enumerate(names):
    for d, hint in dirs:
        jobs.append({
            "piece": piece,
            "piece_desc": roster[piece],
            "direction": d,
            "direction_hint": hint,
            "ref_image": f"endshpil_ref/{piece}_{d}.png",
            "seed": a.seed + i * 100,
            "_save": f"{piece}_{d}.png",
        })

out = {
    "workflow": "workflows/05_character_direction.json",
    "defaults": {
        "ckpt": "PUT_YOUR_SDXL_CHECKPOINT.safetensors",
        "lora": "PUT_YOUR_PIXELART_LORA.safetensors",
        "controlnet": "controlnet_depth_sdxl.safetensors",
        "cn_strength": 0.75,
        "sprite_px": 96,
        "batch": 4,
    },
    "jobs": jobs,
}
pathlib.Path(a.out).write_text(json.dumps(out, ensure_ascii=False, indent=2),
                               encoding="utf-8")
print(a.out, len(jobs), "заданий /", len(names), "фигур")
