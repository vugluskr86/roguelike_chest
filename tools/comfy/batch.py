#!/usr/bin/env python3
"""
comfy/batch.py — постановка в очередь ComfyUI целых классов ассетов.

    python comfy/batch.py cells                 14 спец-клеток
    python comfy/batch.py items                 30 предметов (19 костей + 11 швов)
    python comfy/batch.py walls                 6 текстур стен, по одной на биом
    python comfy/batch.py walls --pieces        54 куска scale9 (9 × 6 биомов)

    python comfy/batch.py cells --only trap rune --n 8
    python comfy/batch.py walls --biome maze
    python comfy/batch.py --models              что ComfyUI видит в папках
    python comfy/batch.py items --list          промты, без генерации

Размеры считаются от тайла игры: 56 CSS-пикселей, на retina 112 физических.
896 = 56 × 16 и кратно 64, поэтому 896 → 112 → 56 делится нацело.

Файлы падают в ComfyUI/output/endgame/<класс>/. Дальше — assemble.py.
"""

import argparse
import json
import random
import sys
import urllib.error
import urllib.request

import assets

SERVER = "http://127.0.0.1:8188"
CKPT = "sd_xl_base_1.0.safetensors"
LORA = "pixel-art-xl-v1.1.safetensors"
LORA_STRENGTH = 1.0

STEPS = 28
CFG = 7.0  # выше 8 модель добавляет детали, которые на 56 пикселях станут шумом
SAMPLER = "euler_ancestral"
SCHEDULER = "karras"

TILE = 56
LATENT = TILE * 16  # 896

# ════════════════════════════════════════════════════════════════
#  Классы ассетов
# ════════════════════════════════════════════════════════════════


def build_jobs(args):
    """[(имя_файла, промт)] для выбранного класса."""
    cls = args.cls
    if cls == "cells":
        return [(k, f"pixel art, {v}, top-down view, {assets.TAIL}") for k, v in assets.CELLS.items()]

    if cls == "items":
        out = []
        for k, v in assets.ITEMS.items():
            tail = assets.ITEM_TAIL_RELIC if k.startswith("r_") else assets.ITEM_TAIL_CURSE
            out.append((k, f"pixel art, {v}, {tail}, {assets.TAIL}"))
        return out

    if cls == "walls":
        biomes = [args.biome] if args.biome else assets.BIOMES
        out = []
        if args.pieces:
            for b in biomes:
                base = assets.WALL_TEXTURES[b].replace("seamless tiling texture of ", "")
                for pk, pv in assets.WALL_PIECES.items():
                    out.append(
                        (f"{b}_{pk}", f"pixel art, a wall block of {base}, {pv}, "
                                      f"{assets.WALL_PIECE_TAIL}, {assets.TAIL}")
                    )
        else:
            for b in biomes:
                out.append((b, f"pixel art, {assets.WALL_TEXTURES[b]}, "
                               f"{assets.WALL_TEX_TAIL}, {assets.TAIL}"))
        return out

    raise ValueError(cls)


def scale_chain(args):
    """Во что даунскейлить. Текстуры стен остаются @2x — их тайлит autotile.js."""
    if args.cls == "walls" and not args.pieces:
        return [(0.125, 112)]  # 896 → 112, второй ступени нет
    return [(0.125, 112), (0.5, 56)]  # 896 → 112 (@2x) → 56 (@1x)


# ════════════════════════════════════════════════════════════════
#  Граф в API-формате
# ════════════════════════════════════════════════════════════════


def graph(prompt, prefix, seed, batch, ckpt, lora, chain, neg=None):
    g = {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt}},
        "2": {"class_type": "LoraLoader", "inputs": {
            "lora_name": lora, "strength_model": LORA_STRENGTH,
            "strength_clip": LORA_STRENGTH, "model": ["1", 0], "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 1]}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": neg or assets.NEG, "clip": ["2", 1]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {
            "width": LATENT, "height": LATENT, "batch_size": batch}},
        "6": {"class_type": "KSampler", "inputs": {
            "seed": seed, "steps": STEPS, "cfg": CFG, "sampler_name": SAMPLER,
            "scheduler": SCHEDULER, "denoise": 1.0, "model": ["2", 0],
            "positive": ["3", 0], "negative": ["4", 0], "latent_image": ["5", 0]}},
        "7": {"class_type": "VAEDecode", "inputs": {"samples": ["6", 0], "vae": ["1", 2]}},
    }
    # nearest-exact обязателен: интерполяция размывает края и убивает палитру
    src, nid = ["7", 0], 8
    for factor, px in chain:
        g[str(nid)] = {"class_type": "ImageScaleBy", "inputs": {
            "upscale_method": "nearest-exact", "scale_by": factor, "image": src}}
        g[str(nid + 1)] = {"class_type": "SaveImage", "inputs": {
            "filename_prefix": f"{prefix}_{px}", "images": [str(nid), 0]}}
        src, nid = [str(nid), 0], nid + 2
    return g


# ════════════════════════════════════════════════════════════════
#  Сеть
# ════════════════════════════════════════════════════════════════


def fetch_list(server, node_class, field):
    """Что ComfyUI реально видит в папках. Пустой список — сервер не ответил."""
    try:
        with urllib.request.urlopen(f"{server}/object_info/{node_class}", timeout=10) as r:
            info = json.load(r)
        return list(info[node_class]["input"]["required"][field][0])
    except Exception:
        return []


def check_models(server, ckpt, lora):
    """Сверить имена до очереди: иначе 400 прилетит на каждом задании."""
    ok = True
    for name, cls, field in ((ckpt, "CheckpointLoaderSimple", "ckpt_name"),
                             (lora, "LoraLoader", "lora_name")):
        found = fetch_list(server, cls, field)
        if found and name not in found:
            print(f"«{name}» не найден. ComfyUI видит:", file=sys.stderr)
            for f in found:
                print("   ", f, file=sys.stderr)
            print(f"   Передай нужный через --{'ckpt' if 'Checkpoint' in cls else 'lora'}\n",
                  file=sys.stderr)
            ok = False
    return ok


def queue(g, server):
    data = json.dumps({"prompt": g}).encode("utf-8")
    req = urllib.request.Request(server + "/prompt", data=data,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.load(r).get("prompt_id", "?")


def explain_http_error(e):
    """ComfyUI кладёт причину отказа в тело ответа. Без неё 400 бесполезен."""
    raw = e.read().decode("utf-8", "replace")
    try:
        data = json.loads(raw)
    except ValueError:
        print(f"HTTP {e.code}: {raw[:500]}", file=sys.stderr)
        return
    err = data.get("error") or {}
    print(f"ComfyUI отклонил запрос: {err.get('message', e)}", file=sys.stderr)
    if err.get("details"):
        print(f"  {err['details']}", file=sys.stderr)
    for nid, ne in (data.get("node_errors") or {}).items():
        print(f"  нода {nid} ({ne.get('class_type', '?')}):", file=sys.stderr)
        for item in ne.get("errors", []):
            print(f"    {item.get('message')}: {item.get('details')}", file=sys.stderr)


# ════════════════════════════════════════════════════════════════


def main():
    ap = argparse.ArgumentParser(description="Батч ассетов для ComfyUI")
    ap.add_argument("cls", nargs="?", choices=["cells", "items", "walls"], default="cells")
    ap.add_argument("--n", type=int, default=6, help="вариантов на позицию")
    ap.add_argument("--only", nargs="*", help="только эти ключи")
    ap.add_argument("--biome", choices=assets.BIOMES, help="только этот биом (walls)")
    ap.add_argument("--pieces", action="store_true", help="walls: 9 кусков scale9 вместо текстуры")
    ap.add_argument("--seed", type=int, help="фиксированный сид — сближает набор по контрасту")
    ap.add_argument("--server", default=SERVER)
    ap.add_argument("--ckpt", default=CKPT)
    ap.add_argument("--lora", default=LORA)
    ap.add_argument("--list", action="store_true", help="показать промты и выйти")
    ap.add_argument("--models", action="store_true", help="что видит ComfyUI, и выйти")
    a = ap.parse_args()

    if a.models:
        for cls, field in (("CheckpointLoaderSimple", "ckpt_name"), ("LoraLoader", "lora_name")):
            found = fetch_list(a.server, cls, field)
            print(f"\n{cls}.{field}:")
            for f in found or ["  (пусто или сервер не отвечает)"]:
                print("   ", f)
        return 0

    jobs = build_jobs(a)
    if a.only:
        keep = set(a.only)
        unknown = keep - {k for k, _ in jobs}
        if unknown:
            print("неизвестные ключи:", ", ".join(sorted(unknown)), file=sys.stderr)
            print("доступно:", ", ".join(k for k, _ in jobs), file=sys.stderr)
            return 2
        jobs = [(k, p) for k, p in jobs if k in keep]

    if a.list:
        for k, p in jobs:
            print(f"{k:22} {p[:100]}")
        return 0

    if not check_models(a.server, a.ckpt, a.lora):
        return 2

    # у текстур стен свой негатив: без него модель рисует сцену с дверями
    neg = assets.NEG_WALL if a.cls == "walls" else assets.NEG
    chain = scale_chain(a)
    sizes = " → ".join(str(px) for _, px in chain)
    print(f"{a.cls}: {len(jobs)} позиций × {a.n} вариантов = {len(jobs) * a.n} кадров")
    print(f"{LATENT} → {sizes}\n")

    for name, prompt in jobs:
        seed = a.seed if a.seed is not None else random.randint(0, 2**31 - 1)
        prefix = f"endgame/{a.cls}/{name}"
        try:
            pid = queue(graph(prompt, prefix, seed, a.n, a.ckpt, a.lora, chain, neg), a.server)
        except urllib.error.HTTPError as e:
            print(f"\nОтказ на «{name}»:", file=sys.stderr)
            explain_http_error(e)
            return 1
        except urllib.error.URLError as e:
            print(f"\nComfyUI не отвечает на {a.server}: {e}", file=sys.stderr)
            print("Запущен ли он? python main.py в папке ComfyUI.", file=sys.stderr)
            return 1
        print(f"  {name:22} seed={seed:<12} → {pid}")

    print(f"\nВсё в очереди. Готовое: ComfyUI/output/endgame/{a.cls}/")
    print(f"Дальше: python comfy/assemble.py {a.cls}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
