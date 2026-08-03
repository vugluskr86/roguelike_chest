#!/usr/bin/env python3
"""Собирает API-format блюпринты ComfyUI для проекта «Эндшпиль».
Запуск: python3 build_workflows.py   -> workflows/*.json
Плейсхолдеры вида {{name}} подставляет tools/queue.py."""
import json, os, pathlib

OUT = pathlib.Path(__file__).parent / "workflows"
OUT.mkdir(exist_ok=True)

# ---------------------------------------------------------------- общие куски
CKPT = "{{ckpt}}"          # напр. sdxlPixelArt.safetensors
NEG_PIXEL = ("blurry, jpeg artifacts, photo, 3d render, smooth gradient, "
             "antialiasing, text, watermark, signature, logo, frame, border, "
             "vignette, depth of field, bokeh, human hands, modern")

STYLE = ("pixel art, 16-bit, limited palette, bone white and rust iron and "
         "deep teal and crimson, dark dungeon under a chessboard, grim, "
         "hand-crafted tileset, crisp pixels, no antialiasing")


def n(cls, **inputs):
    return {"class_type": cls, "inputs": inputs}


def base_model(ckpt=CKPT, lora=None, node_prefix="m"):
    """Возвращает (nodes_dict, model_ref, clip_ref, vae_ref)."""
    nodes = {f"{node_prefix}_ckpt": n("CheckpointLoaderSimple", ckpt_name=ckpt)}
    model = [f"{node_prefix}_ckpt", 0]
    clip = [f"{node_prefix}_ckpt", 1]
    vae = [f"{node_prefix}_ckpt", 2]
    if lora:
        nodes[f"{node_prefix}_lora"] = n(
            "LoraLoader", model=model, clip=clip, lora_name=lora,
            strength_model=0.85, strength_clip=0.85)
        model = [f"{node_prefix}_lora", 0]
        clip = [f"{node_prefix}_lora", 1]
    return nodes, model, clip, vae


def prompts(clip, pos, neg=NEG_PIXEL, prefix="p"):
    return {
        f"{prefix}_pos": n("CLIPTextEncode", text=pos, clip=clip),
        f"{prefix}_neg": n("CLIPTextEncode", text=neg, clip=clip),
    }, [f"{prefix}_pos", 0], [f"{prefix}_neg", 0]


def asym(model, positive, negative, latent, seed="{{seed}}", steps=28,
         cfg=6.0, denoise=1.0, tileX="enable", tileY="enable",
         sampler="dpmpp_2m", sched="karras"):
    """Asymmetric_Tiling_KSampler (alsritter/asymmetric-tiling-comfyui).
    ВНИМАНИЕ: в оригинале seed объявлен как ("SEED",). См. README -> патч."""
    return n("Asymmetric_Tiling_KSampler",
             model=model, seed=seed, steps=steps, cfg=cfg,
             sampler_name=sampler, scheduler=sched,
             positive=positive, negative=negative, latent_image=latent,
             denoise=denoise, step_range=0, tileX=tileX, tileY=tileY)


def save(images, prefix):
    return n("SaveImage", images=images, filename_prefix=prefix)


def dump(name, wf, note):
    wf = {"_meta_note": note, **wf}
    (OUT / name).write_text(json.dumps(wf, ensure_ascii=False, indent=2),
                            encoding="utf-8")
    print("→", name, len([k for k in wf if not k.startswith('_')]), "нод")


# ============================================================ 01 — бесшовный тайл
def wf01():
    w = {}
    nodes, model, clip, vae = base_model()
    w.update(nodes)
    pn, pos, neg = prompts(clip, "{{prompt}}, " + STYLE + ", seamless repeating "
                                 "texture, top-down orthographic, flat even lighting, "
                                 "no objects, no shadows cast outside the tile")
    w.update(pn)
    w["latent"] = n("EmptyLatentImage", width=1024, height=1024, batch_size=1)
    w["sampler"] = asym(model, pos, neg, ["latent", 0])
    w["decode"] = n("VAEDecode", samples=["sampler", 0], vae=vae)
    w["save_hires"] = save(["decode", 0], "endshpil/tiles_src/{{name}}")
    # пикселизация: 1024 -> N (nearest) ; N кратно 8 (32/48/64/96)
    w["pixel"] = n("ImageScale", image=["decode", 0], upscale_method="nearest-exact",
                   width="{{tile_px}}", height="{{tile_px}}", crop="disabled")
    w["save_tile"] = save(["pixel", 0], "endshpil/tiles/{{name}}")
    dump("01_seamless_tile.json", w,
         "Бесшовный тайл пола/стены. Asymmetric Tiling обе оси. "
         "Плейсхолдеры: ckpt, prompt, name, seed, tile_px.")


# ============================================================ 02 — сшивка швов
def wf02():
    """Roll на половину + инпэйнт креста + roll обратно. Только базовые ноды.
    Делает бесшовной ЛЮБУЮ картинку (в т.ч. из perchance)."""
    S = 1024      # сторона исходника
    H = S // 2
    BAND = 192    # ширина полосы инпэйнта
    w = {}
    nodes, model, clip, vae = base_model()
    w.update(nodes)
    pn, pos, neg = prompts(clip, "{{prompt}}, " + STYLE +
                           ", seamless texture, continuous surface")
    w.update(pn)
    w["src"] = n("LoadImage", image="{{image}}")

    # --- roll по X: [L|R] -> [R|L]
    w["cx_l"] = n("ImageCrop", image=["src", 0], width=H, height=S, x=0, y=0)
    w["cx_r"] = n("ImageCrop", image=["src", 0], width=H, height=S, x=H, y=0)
    w["rollx"] = n("ImageStitch", image1=["cx_r", 0], image2=["cx_l", 0],
                   direction="right", match_image_size=False,
                   spacing_width=0, spacing_color="white")
    # --- roll по Y
    w["cy_t"] = n("ImageCrop", image=["rollx", 0], width=S, height=H, x=0, y=0)
    w["cy_b"] = n("ImageCrop", image=["rollx", 0], width=S, height=H, x=0, y=H)
    w["rolled"] = n("ImageStitch", image1=["cy_b", 0], image2=["cy_t", 0],
                    direction="down", match_image_size=False,
                    spacing_width=0, spacing_color="white")

    # --- маска-крест по центру (там теперь оказались бывшие края)
    w["m_zero"] = n("SolidMask", value=0.0, width=S, height=S)
    w["m_v"] = n("SolidMask", value=1.0, width=BAND, height=S)
    w["m_h"] = n("SolidMask", value=1.0, width=S, height=BAND)
    w["m1"] = n("MaskComposite", destination=["m_zero", 0], source=["m_v", 0],
                x=H - BAND // 2, y=0, operation="add")
    w["m2"] = n("MaskComposite", destination=["m1", 0], source=["m_h", 0],
                x=0, y=H - BAND // 2, operation="add")
    w["mask"] = n("FeatherMask", mask=["m2", 0], left=24, top=24, right=24, bottom=24)

    w["enc"] = n("VAEEncode", pixels=["rolled", 0], vae=vae)
    w["noise_mask"] = n("SetLatentNoiseMask", samples=["enc", 0], mask=["mask", 0])
    w["ks"] = n("KSampler", model=model, seed="{{seed}}", steps=24, cfg=5.5,
                sampler_name="dpmpp_2m", scheduler="karras",
                positive=pos, negative=neg, latent_image=["noise_mask", 0],
                denoise="{{denoise}}")
    w["dec"] = n("VAEDecode", samples=["ks", 0], vae=vae)

    # --- roll обратно
    w["bx_l"] = n("ImageCrop", image=["dec", 0], width=H, height=S, x=0, y=0)
    w["bx_r"] = n("ImageCrop", image=["dec", 0], width=H, height=S, x=H, y=0)
    w["backx"] = n("ImageStitch", image1=["bx_r", 0], image2=["bx_l", 0],
                   direction="right", match_image_size=False,
                   spacing_width=0, spacing_color="white")
    w["by_t"] = n("ImageCrop", image=["backx", 0], width=S, height=H, x=0, y=0)
    w["by_b"] = n("ImageCrop", image=["backx", 0], width=S, height=H, x=0, y=H)
    w["back"] = n("ImageStitch", image1=["by_b", 0], image2=["by_t", 0],
                  direction="down", match_image_size=False,
                  spacing_width=0, spacing_color="white")

    w["pixel"] = n("ImageScale", image=["back", 0], upscale_method="nearest-exact",
                   width="{{tile_px}}", height="{{tile_px}}", crop="disabled")
    w["save"] = save(["pixel", 0], "endshpil/tiles/{{name}}")
    w["save_hires"] = save(["back", 0], "endshpil/tiles_src/{{name}}")
    dump("02_seam_fix_roll_inpaint.json", w,
         "Делает бесшовным ЛЮБОЙ квадратный 1024 PNG. Только ядровые ноды. "
         "Плейсхолдеры: ckpt, image, prompt, seed, denoise(0.45-0.65), tile_px, name.")


# ============================================================ 03 — семейство вариаций
def wf03():
    """Из одного утверждённого тайла — вариации (6 стилей стен), структура
    держится ControlNet Tile, бесшовность — Asymmetric Tiling."""
    w = {}
    nodes, model, clip, vae = base_model()
    w.update(nodes)
    pn, pos, neg = prompts(clip, "{{prompt}}, " + STYLE + ", seamless repeating texture")
    w.update(pn)
    w["src"] = n("LoadImage", image="{{image}}")
    w["cn"] = n("ControlNetLoader", control_net_name="{{controlnet}}")
    w["cn_apply"] = n("ControlNetApplyAdvanced",
                      positive=pos, negative=neg, control_net=["cn", 0],
                      image=["src", 0], strength="{{cn_strength}}",
                      start_percent=0.0, end_percent="{{cn_end}}")
    w["enc"] = n("VAEEncode", pixels=["src", 0], vae=vae)
    w["sampler"] = asym(model, ["cn_apply", 0], ["cn_apply", 1], ["enc", 0],
                        steps=24, denoise="{{denoise}}")
    w["dec"] = n("VAEDecode", samples=["sampler", 0], vae=vae)
    w["pixel"] = n("ImageScale", image=["dec", 0], upscale_method="nearest-exact",
                   width="{{tile_px}}", height="{{tile_px}}", crop="disabled")
    w["save"] = save(["pixel", 0], "endshpil/tiles/{{name}}")
    dump("03_tile_variations_controlnet.json", w,
         "Вариации от базового тайла (ControlNet Tile + Asymmetric Tiling). "
         "denoise 0.45-0.75 = сила отхода. Плейсхолдеры: ckpt, image, controlnet, "
         "prompt, cn_strength(0.6-0.9), cn_end(0.7-1.0), denoise, tile_px, name, seed.")


# ============================================================ 04 — scale9 набор
def wf04():
    """Три ветки: угол (без тайлинга), горизонтальный край (tileX), вертикальный
    край (tileY). Асимметричный тайлинг ровно для этого и придуман."""
    w = {}
    nodes, model, clip, vae = base_model()
    w.update(nodes)
    common = ("{{prompt}}, " + STYLE +
              ", carved stone and bone UI frame element, ornamental border, "
              "flat orthographic, straight edges, plain dark inner area")
    pn, pos, neg = prompts(clip, common)
    w.update(pn)

    # угол
    w["lat_c"] = n("EmptyLatentImage", width=512, height=512, batch_size=1)
    w["ks_c"] = asym(model, pos, neg, ["lat_c", 0], tileX="disable", tileY="disable",
                     steps=26)
    w["dec_c"] = n("VAEDecode", samples=["ks_c", 0], vae=vae)
    w["px_c"] = n("ImageScale", image=["dec_c", 0], upscale_method="nearest-exact",
                  width="{{corner_px}}", height="{{corner_px}}", crop="disabled")
    w["save_c"] = save(["px_c", 0], "endshpil/ui/{{name}}_corner")

    # горизонтальный край: повторяется по X
    w["lat_h"] = n("EmptyLatentImage", width=1024, height=256, batch_size=1)
    w["ks_h"] = asym(model, pos, neg, ["lat_h", 0], tileX="enable", tileY="disable",
                     steps=26)
    w["dec_h"] = n("VAEDecode", samples=["ks_h", 0], vae=vae)
    w["px_h"] = n("ImageScale", image=["dec_h", 0], upscale_method="nearest-exact",
                  width="{{edge_len_px}}", height="{{corner_px}}", crop="disabled")
    w["save_h"] = save(["px_h", 0], "endshpil/ui/{{name}}_edge_h")

    # вертикальный край: повторяется по Y
    w["lat_v"] = n("EmptyLatentImage", width=256, height=1024, batch_size=1)
    w["ks_v"] = asym(model, pos, neg, ["lat_v", 0], tileX="disable", tileY="enable",
                     steps=26)
    w["dec_v"] = n("VAEDecode", samples=["ks_v", 0], vae=vae)
    w["px_v"] = n("ImageScale", image=["dec_v", 0], upscale_method="nearest-exact",
                  width="{{corner_px}}", height="{{edge_len_px}}", crop="disabled")
    w["save_v"] = save(["px_v", 0], "endshpil/ui/{{name}}_edge_v")

    # центр (fill) — бесшовный по обеим осям, обычно почти плоский
    w["lat_f"] = n("EmptyLatentImage", width=512, height=512, batch_size=1)
    w["pf"] = n("CLIPTextEncode", clip=clip,
                text="{{fill_prompt}}, " + STYLE +
                     ", seamless dark parchment / stone surface, very low contrast, "
                     "no ornament, flat")
    w["ks_f"] = asym(model, ["pf", 0], neg, ["lat_f", 0], steps=20)
    w["dec_f"] = n("VAEDecode", samples=["ks_f", 0], vae=vae)
    w["px_f"] = n("ImageScale", image=["dec_f", 0], upscale_method="nearest-exact",
                  width="{{corner_px}}", height="{{corner_px}}", crop="disabled")
    w["save_f"] = save(["px_f", 0], "endshpil/ui/{{name}}_fill")
    dump("04_scale9_ui_set.json", w,
         "4 куска scale9: corner / edge_h (tileX) / edge_v (tileY) / fill. "
         "Сборку листа и border-image делает tools/slice9.py. "
         "Плейсхолдеры: ckpt, prompt, fill_prompt, name, seed, corner_px(24-48), "
         "edge_len_px(64-128).")


# ============================================================ 05 — персонажи 8 напр.
def wf05():
    """Спрайт фигуры под конкретное направление. Структура задаётся ControlNet
    (depth/lineart/scribble) от болванки-разворота; фон — чистая маджента,
    вырезается tools/postprocess.py."""
    w = {}
    nodes, model, clip, vae = base_model(lora="{{lora}}")
    w.update(nodes)
    pos_text = ("{{piece_desc}}, {{direction_hint}}, " + STYLE +
                ", single game sprite, full body, centered, three-quarter top-down "
                "view, solid flat magenta background, #FF00FF background, "
                "sharp silhouette, strong rim light")
    pn, pos, neg = prompts(clip, pos_text,
                           NEG_PIXEL + ", background scenery, floor, ground shadow, "
                                       "multiple characters, cropped")
    w.update(pn)
    w["ref"] = n("LoadImage", image="{{ref_image}}")
    w["cn"] = n("ControlNetLoader", control_net_name="{{controlnet}}")
    w["cn_apply"] = n("ControlNetApplyAdvanced",
                      positive=pos, negative=neg, control_net=["cn", 0],
                      image=["ref", 0], strength="{{cn_strength}}",
                      start_percent=0.0, end_percent=0.85)
    w["lat"] = n("EmptyLatentImage", width=768, height=768, batch_size="{{batch}}")
    w["ks"] = n("KSampler", model=model, seed="{{seed}}", steps=30, cfg=6.5,
                sampler_name="dpmpp_2m", scheduler="karras",
                positive=["cn_apply", 0], negative=["cn_apply", 1],
                latent_image=["lat", 0], denoise=1.0)
    w["dec"] = n("VAEDecode", samples=["ks", 0], vae=vae)
    w["save_hires"] = save(["dec", 0], "endshpil/chars_src/{{piece}}_{{direction}}")
    w["px"] = n("ImageScale", image=["dec", 0], upscale_method="nearest-exact",
                width="{{sprite_px}}", height="{{sprite_px}}", crop="disabled")
    w["save"] = save(["px", 0], "endshpil/chars/{{piece}}_{{direction}}")
    dump("05_character_direction.json", w,
         "Один персонаж × одно направление. Гоняется циклом из tools/queue.py "
         "по 8 файлам (east/north/.../south-west). Плейсхолдеры: ckpt, lora, piece, "
         "direction, direction_hint, piece_desc, ref_image, controlnet, cn_strength, seed, "
         "batch, sprite_px.")


# ============================================================ 06 — крупный арт
def wf06():
    """Карточный арт 512×768 (лор, кодекс, экраны) — как ваши текущие картинки.
    Генерим крупно, детализируем Ultimate SD Upscale поверх Tiled Diffusion,
    затем ужимаем nearest до 512×768, чтобы пиксель остался пикселем."""
    w = {}
    nodes, model, clip, vae = base_model()
    w.update(nodes)
    pn, pos, neg = prompts(clip, "{{prompt}}, " + STYLE +
                           ", illustrated card art, dark chunky border frame, "
                           "vertical composition, dramatic single subject")
    w.update(pn)
    w["td"] = n("TiledDiffusion", model=model, method="Mixture of Diffusers",
                tile_width=1024, tile_height=1024, tile_overlap=128,
                tile_batch_size=2)
    w["lat"] = n("EmptyLatentImage", width=832, height=1216, batch_size=1)
    w["ks"] = n("KSampler", model=["td", 0], seed="{{seed}}", steps=30, cfg=6.5,
                sampler_name="dpmpp_2m", scheduler="karras",
                positive=pos, negative=neg, latent_image=["lat", 0], denoise=1.0)
    w["dec"] = n("VAEDecode", samples=["ks", 0], vae=vae)
    w["upmodel"] = n("UpscaleModelLoader", model_name="{{upscale_model}}")
    w["usdu"] = n("UltimateSDUpscale",
                  image=["dec", 0], model=model, positive=pos, negative=neg,
                  vae=vae, upscale_by=2.0, seed="{{seed}}", steps=18, cfg=5.5,
                  sampler_name="dpmpp_2m", scheduler="karras", denoise=0.28,
                  upscale_model=["upmodel", 0], mode_type="Linear",
                  tile_width=768, tile_height=768, mask_blur=16, tile_padding=48,
                  seam_fix_mode="Half Tile", seam_fix_denoise=0.35,
                  seam_fix_width=64, seam_fix_mask_blur=16, seam_fix_padding=32,
                  force_uniform_tiles=True, tiled_decode=False)
    w["down"] = n("ImageScale", image=["usdu", 0], upscale_method="nearest-exact",
                  width=512, height=768, crop="center")
    w["save"] = save(["down", 0], "endshpil/art/{{name}}")
    dump("06_card_art_512x768.json", w,
         "Карточный/лорный арт под ваш текущий формат 512×768. "
         "Плейсхолдеры: ckpt, prompt, name, seed, upscale_model "
         "(напр. 4x_foolhardy_Remacri.pth).")


# ============================================================ 07 — Klein (опц.)
def wf07():
    """Klein Tiled Upscaler под Flux2.Klein. ВНИМАНИЕ: нода под некоммерческой
    лицензией — для релизного (платного) арта не годится. Держите как черновой
    инструмент или замените на 06."""
    w = {}
    w["unet"] = n("UNETLoader", unet_name="{{klein_unet}}", weight_dtype="default")
    w["clip"] = n("CLIPLoader", clip_name="{{klein_clip}}", type="flux",
                  device="default")
    w["vae"] = n("VAELoader", vae_name="{{klein_vae}}")
    w["pos"] = n("CLIPTextEncode", text="{{prompt}}", clip=["clip", 0])
    w["neg"] = n("CLIPTextEncode", text="", clip=["clip", 0])
    w["guider"] = n("BasicGuider", model=["unet", 0], conditioning=["pos", 0])
    w["sampler"] = n("KSamplerSelect", sampler_name="euler")
    w["sigmas"] = n("BasicScheduler", model=["unet", 0], scheduler="simple",
                    steps=4, denoise=1.0)
    w["src"] = n("LoadImage", image="{{image}}")
    w["klein"] = n("KleinTiledUpscaler",
                   guider=["guider", 0], positive=["pos", 0], negative=["neg", 0],
                   sampler=["sampler", 0], sigmas=["sigmas", 0], vae=["vae", 0],
                   image=["src", 0], seed="{{seed}}", scale_factor=2.0,
                   tiling_strategy="Detail-First", tile_size_mode="Auto",
                   tile_width=1024, tile_height=1024, padding=128,
                   color_match=True, mask_blur=48, adaptive_tiling=False,
                   skip_threshold=0.0, core_anchor=0.95, consistent_noise=True)
    w["down"] = n("ImageScale", image=["klein", 0], upscale_method="nearest-exact",
                  width=512, height=768, crop="center")
    w["save"] = save(["down", 0], "endshpil/art/{{name}}")
    dump("07_klein_upscale_optional.json", w,
         "ОПЦИОНАЛЬНО. Требует Flux2.Klein (unet+clip+vae) и ноды Klein Tiled "
         "Upscaler. Лицензия ноды — Non-Commercial: для коммерческого релиза "
         "используйте 06. Промпт держите коротким ('upscale this image').")


for f in (wf01, wf02, wf03, wf04, wf05, wf06, wf07):
    f()

# ---------------------------------------------------------------- валидация
print("\nвалидация ссылок:")
for p in sorted(OUT.glob("*.json")):
    wf = json.loads(p.read_text(encoding="utf-8"))
    ids = {k for k in wf if not k.startswith("_")}
    bad = []
    for nid, node in wf.items():
        if nid.startswith("_"):
            continue
        for k, v in node["inputs"].items():
            if isinstance(v, list) and len(v) == 2 and isinstance(v[1], int):
                if v[0] not in ids:
                    bad.append(f"{nid}.{k} -> {v[0]}")
    print(f"  {p.name}: {'OK' if not bad else bad}")
