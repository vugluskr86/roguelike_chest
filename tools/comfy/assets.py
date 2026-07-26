"""
comfy/assets.py — что генерируем. Промты и параметры по классам ассетов.

Отделено от batch.py намеренно: правится текст, а не логика постановки
в очередь. Сюда же добавляются новые классы.
"""

# Хвост общий: без него теряется ракурс, палитра и фон под выбивание
TAIL = (
    "on solid magenta background, limited palette, bone white and muted teal, "
    "dark fantasy dungeon, game asset"
)

NEG = (
    "blurry, soft gradients, anti-aliasing, 3d render, photorealistic, text, "
    "watermark, signature, drop shadow, gloss, bright saturated colours, noise, "
    "gradient background, textured background"
)

# Для текстур стен нужен свой негатив. Первый прогон показал, что модель
# на слово «стена» рисует сцену подземелья: дверные проёмы, факелы, арки,
# рамку по краю кадра. Всё это перечислено явно, иначе повторится.
NEG_WALL = NEG + (
    ", door, doorway, archway, window, torch, stairs, room, corridor, scene, "
    "perspective, depth, vignette, border, frame, panel, tileset, sprite sheet, "
    "grid of tiles, separate tiles, objects, props, character, ornament"
)

# ════════════════════════════════════════════════════════════════
#  Спец-клетки — ключи совпадают с типами из S.special
# ════════════════════════════════════════════════════════════════

CELLS = {
    "trap": "a dusty spider web stretched across a square stone pit, torn threads, dew drops",
    "rune": "a carved stone glyph socket glowing cold teal, thin cracks radiating outward",
    "portal": "a dark circular hole with three concentric rings of violet light, dust spiralling inward",
    "ice": "a square patch of cracked pale blue ice over stone, frost creeping from the edges",
    "lava": "a square patch of dark crust split by glowing orange veins, embers in the cracks",
    "fog": "a low grey cloud lying on a stone floor, soft edges, thin and semi transparent",
    "conveyor": "a rusted iron conveyor belt set into stone, side rails, arrow chevrons on the band",
    "gate": "a narrow stone doorway flat in the floor, two jambs, glowing amber membrane between",
    "plate": "a square pressure plate of green-grey stone, rivets in the corners, indicator light",
    "colorzone": "a square of dark violet stone with a bishop mitre engraved, diagonal hatching",
    "food": "a gnawed bone lying on stone, marrow visible at the broken end",
    "scroll": "a rolled parchment scroll with wooden rollers, faint gold glow",
    "pillar": "a massive square stone block from above, chipped corners, deep shadow at the base",
    "millstone": "a heavy round grinding stone lying flat, radial grooves, bone dust in the grooves",
}

# ════════════════════════════════════════════════════════════════
#  Предметы — ключи совпадают с id из RELICS и CURSES
# ════════════════════════════════════════════════════════════════

# Кости: тёплая слоновая кость и золото, предмет-талисман
RELICS = {
    "pawn_double": "a long straight finger bone with two notches carved near the tip",
    "pawn_omni": "a knucklebone with four short spurs pointing in four directions",
    "knight_extra": "a small horse skull fragment with a bone spur at the jaw",
    "slider_reach": "a narrow bone needle with a polished lens set in the eye",
    "light_lines": "a flat pale bone chip with three engraved parallel lines glowing faintly",
    "no_fatigue": "a thick worn vertebra polished smooth by long use",
    "trophy": "a small bone cup on a short stem, rim chipped",
    "free_swap": "two slender finger bones crossed and bound with thin wire",
    "extra_slot": "a bone ring with an empty socket set into it",
    "pawn_shield": "a small round bone medallion with a pawn silhouette carved in relief",
    "guard_pierce": "a sharpened bone spike with a split tip",
    "silence": "a bone seal disc pressed with a closed mouth symbol",
    "mirror_break": "a cracked polished bone mirror with a missing shard",
    "smoke": "a hollow bone vial stoppered with wax, pale vapour at the neck",
    "venom": "a curved hollow fang with a green droplet at the point",
    "second_wind": "a bone whistle with two air holes, faint breath curl",
    "concuss": "a heavy rounded bone club head with impact chips",
    "toxic_aura": "a porous bone sphere leaking thin green mist",
    "bulwark": "a thick curved shoulder blade used as a small shield",
}

# Швы: холодный металл и запёкшаяся кровь, предмет-увечье
CURSES = {
    "brittle": "a cracked bone splitting along a hairline fracture",
    "heavy": "an iron shackle clamped around a bone shaft",
    "marked": "a bone chip branded with a red target rune",
    "compulsion": "a bone puppet joint with a taut wire pulling it",
    "rusted": "a broken cog of corroded iron with a bone tooth missing",
    "bloodline": "a bone shard with a dried blood line running its length",
    "guard_tough": "an iron plate riveted over a bone surface",
    "dark_summon": "a small skull with black roots growing from the eye sockets",
    "mimic_reach": "a bone fragment with its own reflection offset beside it",
    "hex": "a bone pin driven through a knot of black thread",
    "glass": "a bone shard cracked like glass, translucent at the edges",
}

ITEMS = {**{f"r_{k}": v for k, v in RELICS.items()}, **{f"c_{k}": v for k, v in CURSES.items()}}

ITEM_TAIL_RELIC = "carved bone talisman, warm ivory and antique gold, single object, centred"
ITEM_TAIL_CURSE = "bone and rusted iron, cold grey and dried blood red, single object, centred"

# ════════════════════════════════════════════════════════════════
#  Стены
# ════════════════════════════════════════════════════════════════

# Путь по умолчанию: одна бесшовная текстура на биом.
# autotile.js уже умеет скруглять углы и подрезать стыки по маске соседей —
# ему нужна только заливка. Швов нет по построению, генераций шесть, а не 54.
# Только материал крупным планом. Ни одного слова, за которое модель могла бы
# зацепиться и нарисовать помещение: ни «wall», ни «dungeon», ни «masonry wall».
WALL_TEXTURES = {
    "halls": "extreme close up of dressed grey stone blocks with fine mortar lines between them",
    "corridors": "extreme close up of riveted rusted iron plating, dried blood in the seams",
    "maze": "extreme close up of stacked femur bones and skull fragments packed in grey mortar",
    "grid": "extreme close up of cut granite slabs meeting at sharp square joints",
    "arena": "extreme close up of cracked pale sandstone worn smooth by handling",
    "pylons": "extreme close up of dark basalt with hexagonal columnar fractures",
}
WALL_TEX_TAIL = (
    "flat surface filling the entire frame edge to edge, seamless repeating pattern, "
    "material sample, even flat lighting, no objects, no architecture, no shadows, "
    "photographed straight on"
)

# Путь Б: девять кусков под scale9. Собираются assemble.py в лист 3×3.
# Порядок ровно как в scale9Index(): строка × 3 + столбец.
WALL_PIECES = {
    "1_nw": "finished rounded corner on the top-left, raw broken edges on the right and bottom",
    "2_n": "finished flat edge along the top, raw broken edges left and right",
    "3_ne": "finished rounded corner on the top-right, raw edges on the left and bottom",
    "4_w": "finished flat edge along the left side, raw edges top right and bottom",
    "5_c": "all four edges raw, dense solid masonry face",
    "6_e": "finished flat edge along the right side, raw edges top left and bottom",
    "7_sw": "finished rounded corner on the bottom-left, raw edges top and right",
    "8_s": "finished flat edge along the bottom, raw edges left and right",
    "9_se": "finished rounded corner on the bottom-right, raw edges top and left",
}
WALL_PIECE_TAIL = "single wall block seen from above, sharp edges, no perspective"

BIOMES = list(WALL_TEXTURES)
