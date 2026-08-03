#!/usr/bin/env python3
"""Пакетный прогон API-блюпринтов через HTTP-API ComfyUI.

    python3 tools/queue.py jobs/tiles.json
    python3 tools/queue.py jobs/characters.json --server 127.0.0.1:8188 --out ./out

Файл задания:
{
  "workflow": "workflows/01_seamless_tile.json",
  "defaults": {"ckpt": "sdxl.safetensors", "tile_px": 64, "seed": 12345},
  "jobs": [
    {"name": "floor_hall",  "prompt": "cracked bone tiles ...", "_save": "floor_hall.png"},
    {"name": "floor_mill",  "prompt": "rusted iron plates ...", "_save": "floor_mill.png"}
  ]
}
Ключ "_save" (необязательно) — имя, под которым результат ляжет в --out.
Если у workflow несколько SaveImage, файлы получают суффикс _0, _1, ...
"""
import argparse, copy, json, pathlib, random, sys, time, urllib.parse, urllib.request

def subst(obj, params):
    """Рекурсивно меняет {{key}} на значение. Если строка — ровно '{{key}}',
    подставляется значение исходного типа (int/float/bool)."""
    if isinstance(obj, dict):
        return {k: subst(v, params) for k, v in obj.items()}
    if isinstance(obj, list):
        return [subst(v, params) for v in obj]
    if isinstance(obj, str):
        s = obj.strip()
        if s.startswith("{{") and s.endswith("}}") and s.count("{{") == 1:
            key = s[2:-2].strip()
            if key in params:
                return params[key]
            raise KeyError(f"нет значения для {{{{{key}}}}}")
        out = obj
        for k, v in params.items():
            out = out.replace("{{%s}}" % k, str(v))
        if "{{" in out:
            raise KeyError(f"незаполненный плейсхолдер в: {out[:80]}")
        return out
    return obj


def post(server, path, payload=None):
    url = f"http://{server}{path}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def get_image(server, info):
    q = urllib.parse.urlencode({"filename": info["filename"],
                                "subfolder": info.get("subfolder", ""),
                                "type": info.get("type", "output")})
    with urllib.request.urlopen(f"http://{server}/view?{q}") as r:
        return r.read()


def run(args):
    job_file = json.loads(pathlib.Path(args.job).read_text(encoding="utf-8"))
    wf_path = pathlib.Path(job_file["workflow"])
    if not wf_path.is_absolute():
        wf_path = pathlib.Path(args.job).parent.parent / wf_path
    wf = json.loads(wf_path.read_text(encoding="utf-8"))
    wf.pop("_meta_note", None)
    out_dir = pathlib.Path(args.out); out_dir.mkdir(parents=True, exist_ok=True)
    defaults = job_file.get("defaults", {})

    for i, job in enumerate(job_file["jobs"], 1):
        params = {**defaults, **job}
        params.setdefault("seed", random.randint(0, 2**31 - 1))
        if params.get("seed") == "random":
            params["seed"] = random.randint(0, 2**31 - 1)
        save_as = params.pop("_save", None)
        prompt = subst(copy.deepcopy(wf), params)
        pid = post(args.server, "/prompt", {"prompt": prompt})["prompt_id"]
        label = save_as or params.get("name") or f"job{i}"
        print(f"[{i}/{len(job_file['jobs'])}] {label} -> {pid}", flush=True)

        while True:
            time.sleep(1.5)
            hist = post(args.server, f"/history/{pid}")
            if pid in hist:
                break
        outputs = hist[pid]["outputs"]
        imgs = [im for node in outputs.values() for im in node.get("images", [])
                if im.get("type") == "output"]
        for k, im in enumerate(imgs):
            stem = pathlib.Path(save_as).stem if save_as else pathlib.Path(im["filename"]).stem
            suffix = "" if len(imgs) == 1 else f"_{k}"
            dst = out_dir / f"{stem}{suffix}.png"
            dst.write_bytes(get_image(args.server, im))
            print("   ", dst)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("job")
    ap.add_argument("--server", default="127.0.0.1:8188")
    ap.add_argument("--out", default="./out")
    try:
        run(ap.parse_args())
    except KeyError as e:
        sys.exit(f"ошибка подстановки: {e}")
