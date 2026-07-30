//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region src/state.js
/**
* src/state.js — глобальное мутабельное состояние игры S и хелперы.
* Экспорты: S (объект), has(), curse(), enemyAt(), isBossEntity().
*/
var S$1 = {
	walls: null,
	player: null,
	enemies: [],
	turn: 1,
	promotionUsed: false,
	unlocked: null,
	gameOver: false,
	floor: 0,
	hoverEnemy: null,
	selectedEnemy: null,
	special: null,
	biome: null,
	modalOpen: false,
	hoveredCell: null,
	godMode: false,
	challenge: null,
	bossPhase: 0,
	chainsBroken: 0,
	mercy: 0,
	millTick: 0,
	millFed: 0,
	party: null,
	runMode: "campaign",
	currentRoom: 0,
	rooms: [],
	keys: /* @__PURE__ */ new Set()
};
var has = (id) => S$1.player && S$1.player.relics && S$1.player.relics.has(id);
var curse = (id) => S$1.player && S$1.player.curses && S$1.player.curses.has(id);
var enemyAt = (x, y) => S$1.enemies.find((e) => e.x === x && e.y === y);
/** Пропустить сущность в общем цикле врагов — её обслуживает bossTurn(). */
var isBossEntity = (e) => e.bossId || e.king || e.linkedTo || e.fleeing || e.puppet || e.retinue;
//#endregion
//#region src/dom.js
/**
* src/dom.js — кеширование DOM-элементов и инициализация ссылок.
* Экспорты: dom (объект), initDom().
*/
var dom = {};
function initDom() {
	dom.cv = document.getElementById("board");
	dom.ctx = dom.cv.getContext("2d");
	dom.logEl = document.getElementById("log");
	dom.wheelEl = document.getElementById("wheel");
	dom.shahEl = document.getElementById("shah");
	dom.faceInfo = document.getElementById("faceInfo");
	dom.overlay = document.getElementById("overlay");
	dom.modalBox = document.getElementById("modalBox");
	dom.mTitle = document.getElementById("mTitle");
	dom.mText = document.getElementById("mText");
	dom.mChoices = document.getElementById("mChoices");
	dom.mArt = document.getElementById("mArt");
	dom.mBody = document.getElementById("mBody");
	dom.mActions = document.getElementById("mActions");
	dom.hungerBar = document.getElementById("hungerBar");
	dom.hungerRibs = document.querySelector(".hunger-ribs");
	dom.topbar = document.getElementById("topbar");
	dom.controlCard = document.getElementById("controlCard");
}
var en_default = {
	"app.metaDesc": "Endgame — a turn-based chess roguelike. You are a piece that changes form as you descend through the floors of the Dungeon.",
	"app.metaOgDesc": "A turn-based chess roguelike. Move or be taken.",
	"app.sub": "Move or be taken",
	"app.title": "Endgame",
	"biome.arena": "Arena",
	"biome.corridors": "Corridors",
	"biome.grid": "Grid",
	"biome.halls": "Halls",
	"biome.maze": "Maze",
	"biome.pylons": "Pylons",
	"codex.bones": "Bones",
	"codex.desc.assassin": "knight; poisons on capture",
	"codex.desc.bishop": "diagonals",
	"codex.desc.frost": "immobile; stuns at range",
	"codex.desc.guardian": "king + armor 2",
	"codex.desc.knight": "L-shaped leap",
	"codex.desc.mimic": "copies your form",
	"codex.desc.necro": "immobile, summons pawns",
	"codex.desc.pawn": "steps forward, attacks diagonally",
	"codex.desc.priest": "bishop; shields allies",
	"codex.desc.queen": "all directions",
	"codex.desc.rook": "orthogonals",
	"codex.enemies": "Enemies",
	"codex.kills": "killed: {0}",
	"codex.locked.bone": "not found",
	"codex.locked.enemy": "not encountered",
	"codex.locked.seam": "not encountered",
	"codex.seams": "Seams",
	"editor.status": "🖌 Editor · Pick an element and click the board",
	"editor.title": "Editor",
	"face.east": "east",
	"face.label": "facing: {0}",
	"face.north": "north",
	"face.south": "south",
	"face.west": "west",
	free: "Free",
	"help.ascension": "Ascension",
	"help.ascensionBody": "The top row is a golden line. End your turn on it as a pawn to transform into a chosen form, improved (★).",
	"help.biomes": "Biomes",
	"help.biomesBody": "Floors come in sets with their own generation, palette, and pools (changing every 2 floors): Halls — open spaces. Corridors — tight passages. Maze — winding corridors. Grid — 3×3 cells. Arena — wall-free field. Pylons — pillar labyrinth.",
	"help.bosses": "Bosses",
	"help.bossesBody": "Boss floors (5, 8, 11, 18) are authored arenas. Hunger does not drain. Tormentor (5) — three bodies, loses diagonals. Linked Rooks (8) — move in sync, avenge each other. Millstone (11) — crushes enemies, feed it three puppets. Red King (18) — invulnerable, break chains under retinue fire.",
	"help.capture": "Captures and Degradation",
	"help.captureBody": "No HP: a capture is instant. When an enemy captures you, you don't die immediately — you degrade one tier (queen → rook → bishop/knight → pawn), losing your current form. Capture as pawn = end of run. Pawn is your last life.",
	"help.challenges": "Challenges",
	"help.challengesBody": "Modes with special rules: Lone Figure (no switching), Blind Descent (radius 2), Storm (enemies stronger, +50% ash), Chaos Wheel (switch every 3 turns), Escalation (enemies grow per floor).",
	"help.checkmate": "Check and Checkmate",
	"help.checkmateBody": "All threatened cells are highlighted. Ending a turn on a threatened cell = check: the enemy must attack you. No legal moves on a threatened cell = checkmate: you are taken on the spot.",
	"help.controls": "Turn and Controls",
	"help.controlsBody": "Turn-based: your move first, then all enemies act. One action per turn: move, capture, switch form, or pass. Tap a cell to move or capture. Teal dot = safe, amber = under threat, crimson with cross = fatal. Tap an enemy to show/hide its threat zone. Tap a form slot to switch (costs a turn). PC keys: 1–5 forms, Q/E rotate pawn (free), Space pass, Tab cycle enemies, Esc reset, Enter confirm.",
	"help.editor": "Level Editor",
	"help.editorBody": "The «🗺 Editor» button in the menu. Place walls, enemies, special cells, doors and keys. Supports multiple rooms. Run a simulation and return to editing.",
	"help.enemies": "Enemies",
	"help.enemiesBody": "Standard chess pieces move toward you. Special: Guardian — double hit (armor). Necromancer — summons pawns. Mimic — copies your form. Assassin — knight, poisons. Priest — bishop, shields allies. Frost Mage — immobile, stuns at range.",
	"help.events": "Gold and Event Rooms",
	"help.eventsBody": "Enemies drop gold. Between floors an event room may appear: Bonesetter (buy a bone / remove a seam), Unstitching (remove a seam free), Sanctuary (sacrifice a form for a bone), Dice Altar (gamble), Blessing Altar (gift for next floor).",
	"help.exotic": "Exotic Forms",
	"help.exoticBody": "Unlock for ash in the meta-shop: Archbishop (bishop + knight), Chancellor (rook + knight), Beast (leaps exactly 2 cells).",
	"help.food": "Bones (Food)",
	"help.foodBody": "Cells with 🍖 restore hunger. The hunger bar at the top shows turns until degradation. Captures and Veins also feed; passing costs more than a regular move.",
	"help.forms": "Piece Forms",
	"help.formsBody": "You play as one chess form; a capture = moving onto an enemy cell. Pawn moves 1 forward, attacks forward diagonals, has facing — rotate free (Q/E). Knight leaps L-shaped over obstacles. Bishop attacks diagonals, +1 range on its own color. Rook — straight lines. Queen — all directions but shorter range. Sliders stop at the first obstacle; only the knight passes through.",
	"help.goal": "Goal",
	"help.goalBody": "Descend through floors, clearing all enemies. Each floor is a new random board with more dangerous foes. Death ends the run, but ash and records persist.",
	"help.loot": "Loot: Bones and Seams",
	"help.lootBody": "After clearing a floor, pick a reward. Bones are permanent bonuses. Cursed deals: Faustian (2 bones + seam), Altar (3 bones + 2 seams). Seams are permanent drawbacks. Shown in the Modifiers panel and rings around your figure.",
	"help.meta": "Meta-progression",
	"help.metaBody": "Each run earns ash (floor×3 + captures). Spend on starting slots, starting bones, an easier first floor. Progress and record persist across runs.",
	"help.pillars": "Pillars and Millstones",
	"help.pillarsBody": "Pillar — impassable stone block. Millstone — rolls in a straight line, crushes enemies and player; stops permanently once jammed.",
	"help.preview": "Threat Preview",
	"help.previewBody": "Hover or tap a move cell — amber hatching shows which cells will be threatened after the move. Red hatching shows current threats. Enable move confirmation in Settings for dangerous moves.",
	"help.rooms": "Rooms",
	"help.roomsBody": "A floor has 1–5 rooms connected by doors. Locked doors need a matching key (always in the same room). Clear all rooms to finish the floor.",
	"help.specials": "Special Cells",
	"help.specialsBody": "Web — lose a form, enemy dies. Portal — teleports to pair. Vein — removes fatigue and statuses. Ice — stuns on entry. Fog — hides threats. Conveyor — pushes after move. Gate — passable only along arrow. Color Zone — bishop only. Plate — opens a wall. Lava — spreads and burns.",
	"help.statuses": "Status Effects",
	"help.statusesBody": "Colored dots on pieces: Poison — countdown, death at 0. Stun — skip a turn. Shield — absorbs one capture. Haste — +1 range, extra step. Vein removes all statuses.",
	"help.tagline": "A chess roguelike: you are a piece that changes form as you descend.",
	"help.title": "How to Play",
	"help.wheel": "Form Wheel and Fatigue",
	"help.wheelBody": "Forms are in a wheel (slot 0 is permanent pawn). Switching forms costs a turn. After a capture, the form becomes fatigued for a few turns. New forms unlock when you capture an enemy of that type. The number on each slot shows how many moves that form has.",
	"hud.hunger": "Hunger",
	"hud.hungerFrozen": "{0} · hunger frozen",
	"hud.hungerFrozenTTL": "Hunger does not drain during boss fights.",
	"hud.hungerTTL": "Hunger {0}/{1}. Capture +{2}, food +{3}, pass −{4}.",
	"hud.mods": "Modifiers",
	"hud.roomClear": "Room {0} — cleared",
	"hud.roomEnemies": "Room {0} — enemies: {1}{2}",
	"hud.rooms": "rooms",
	"hud.turnsLeft": "{0} turns left",
	"hud.underThreat": "under threat",
	"legend.title": "Legend",
	"loading.hint": "Tap to continue",
	"loading.lore.0": "Deep underground, where the laws of chess took physical form, an ancient labyrinth awoke.",
	"loading.lore.1": "The Wheel Masters forged pieces that can shift their essence — but the price is steep.",
	"loading.lore.2": "Every descent into the Dungeon is a new game against fate itself. The rules are the same for all.",
	"loading.lore.3": "They say the Crown of Transfiguration lies at the bottom — an artifact of absolute power over form.",
	"loading.lore.4": "A pawn that walks the entire path becomes legend. But for now, you are just a spark in the dark.",
	"loading.tip.0": "Pawn rotation (Q/E) is free — face the threat every turn.",
	"loading.tip.1": "Stand on your own color as a bishop — gain +1 range.",
	"loading.tip.2": "Fog hides threats: lure enemies into traps blindly.",
	"loading.tip.3": "Traps kill enemies instantly — use them as weapons.",
	"loading.tip.4": "Portals teleport instantly — great for escaping a surround.",
	"loading.tip.5": "Switch forms only when needed: each switch costs a turn.",
	"loading.tip.6": "The Necromancer summons pawns — kill him first.",
	"loading.tip.7": "The Guardian wears armor: the first hit only breaks the shield.",
	"loading.tip.8": "Gold is spent at the Bonesetter between floors — save for rare bones.",
	"loading.tip.9": "Degradation saves you from death: you lose a form, but continue the run.",
	"log.default": "Move or be taken.",
	"meta.achievements": "Achievements {0}/{1}",
	"meta.bestiary": "Bestiary {0}/{1}",
	"meta.campDesc": "18 floors, four bosses, three endings",
	"meta.campaign": "⚔ Campaign",
	"meta.challenges": "Challenges",
	"meta.help": "How to Play",
	"meta.infDesc": "Endless floors, no bosses — just a record",
	"meta.infinite": "∞ Infinite",
	"meta.progress": "Meta-progress",
	"meta.record": "record: floor {0} · runs {1} · total captures {2}",
	"meta.runAgain": "Another Run (R)",
	"meta.shards": "Ash: {0}",
	"meta.startRun": "Start Run (R)",
	"meta.title": "♟ Endgame",
	"meta.toMenu": "To Menu",
	"modal.achievements": "Achievements",
	"modal.achievementsText": "{0} of {1} unlocked.",
	"modal.codex": "Bestiary",
	"modal.codexText": "Entries unlock as you encounter them in runs.",
	"modal.helpBackToMenu": "Back to Menu",
	"modal.helpOK": "Got it",
	"modal.loot": "Floor Loot",
	"modal.lootAltar": "☠ Altar of Sacrifice",
	"modal.lootFaust": "⚠ Faustian Deal",
	"modal.lootText": "Choose one. Cursed deals offer more power but bind a permanent seam.",
	"modal.promotion": "Line of Ascension",
	"modal.promotionText": "Pawn reached the line — choose a form to become, improved (★).",
	"modal.victory": "The King Has Fallen",
	"modal.victoryBreak": "💥 Break the Board",
	"modal.victoryKill": "⚔ Kill",
	"modal.victoryText": "You have traversed the Dungeon to the end.\nFloors: {0} · Captures: {1} · Ash: +{2}",
	"modal.victoryThrone": "♚ Take the Throne",
	off: "off",
	on: "on",
	"settings.all": "all moves",
	"settings.anim": "Animations",
	"settings.close": "Close",
	"settings.confirm": "Confirm moves",
	"settings.confirmDesc": "Second tap on a cell executes the move",
	"settings.lang": "Language",
	"settings.langSystem": "system",
	"settings.music": "Music",
	"settings.off": "off",
	"settings.preview": "Show move consequences",
	"settings.risky": "risky only",
	"settings.sound": "Sound",
	"settings.title": "⚙ Settings",
	"settings.tutorial": "Tutorial",
	"settings.tutorialBtn": "reset",
	"settings.tutorialDesc": "Show scenes and hints again",
	"settings.volume": "Volume",
	"settings.volumeHigh": "loud",
	"settings.volumeLow": "quiet",
	"settings.volumeMid": "medium",
	shah: "Check",
	"summary.ashEarned": "+{0} ash · total {1}",
	"summary.bones": "Bones",
	"summary.bonesSeams": "bones · seams",
	"summary.captures": "captures this run",
	"summary.dead": "Pawn Has Fallen",
	"summary.deadSub": "The last bone is broken. Nothing left to move.",
	"summary.floor": "floor",
	"summary.forms": "forms: {0}",
	"summary.formsOnlyPawnKnight": "pawn and knight only",
	"summary.journal": "Journal",
	"summary.record": "record: floor {0} · runs {1}",
	"summary.runOver": "Run Over",
	"summary.seams": "Seams",
	"summary.title": "Run Ended",
	"tooltip.colorzone": "Color Zone",
	"tooltip.conveyor": "Conveyor",
	"tooltip.door": "Door",
	"tooltip.fog": "Fog",
	"tooltip.food": "Bone",
	"tooltip.gate": "Gate",
	"tooltip.ice": "Ice",
	"tooltip.key": "Key",
	"tooltip.lava": "Lava",
	"tooltip.millstone": "Millstone",
	"tooltip.plate": "Plate",
	"tooltip.portal": "Portal",
	"tooltip.rune": "Vein",
	"tooltip.scroll": "Scroll",
	"tooltip.trap": "Web",
	"ui.actions": "Actions",
	"ui.editor": "🗺 Editor",
	"ui.help": "How to Play (?)",
	"ui.log": "Log",
	"ui.menu": "Menu",
	"ui.pass": "Pass (Space)",
	"ui.restart": "Restart (R)",
	"ui.settings": "⚙ Settings",
	"ui.wheel": "Form Wheel",
	"wheel.active": "Active form",
	"wheel.cd": "Form is tired",
	"wheel.empty": "empty",
	"wheel.moves": "{0} moves, {1} captures",
	"wheel.noMoves": "This form has no moves from here",
	"wheel.switch": "Switch (costs a turn)"
};
var ru_default = {
	"app.metaDesc": "Endgame — a turn-based chess roguelike. You are a piece that changes form as you descend through the floors of the Dungeon.",
	"app.metaOgDesc": "A turn-based chess roguelike. Move or be taken.",
	"app.sub": "Двигайся или будь съеден",
	"app.title": "Эндшпиль",
	"biome.arena": "Arena",
	"biome.corridors": "Corridors",
	"biome.grid": "Grid",
	"biome.halls": "Halls",
	"biome.maze": "Maze",
	"biome.pylons": "Pylons",
	"codex.bones": "Кости",
	"codex.desc.assassin": "конь; отравляет при взятии",
	"codex.desc.bishop": "диагонали",
	"codex.desc.frost": "неподвижен; оглушает на дистанции",
	"codex.desc.guardian": "король + броня 2",
	"codex.desc.knight": "прыжок буквой Г",
	"codex.desc.mimic": "копирует твою форму",
	"codex.desc.necro": "неподвижен, призывает пешек",
	"codex.desc.pawn": "шаг вперёд, бьёт по диагоналям",
	"codex.desc.priest": "слон; щитует союзников",
	"codex.desc.queen": "все направления",
	"codex.desc.rook": "ортогонали",
	"codex.enemies": "Враги",
	"codex.kills": "убито: {0}",
	"codex.locked.bone": "не найдена",
	"codex.locked.enemy": "не встречен",
	"codex.locked.seam": "не встречено",
	"codex.seams": "Швы",
	"editor.status": "🖌 Редактор · Выбери элемент и кликай по полю",
	"editor.title": "Редактор",
	"face.east": "восток",
	"face.label": "фасинг: {0}",
	"face.north": "север",
	"face.south": "юг",
	"face.west": "запад",
	free: "Free",
	"help.ascension": "Восхождение",
	"help.ascensionBody": "Верхний ряд — золотая линия. Закончи ход на ней в форме пешки — превратишься в выбранную форму, улучшенную (★).",
	"help.biomes": "Биомы",
	"help.biomesBody": "Ярусы идут наборами со своей генерацией, палитрой и пулами (сменяются каждые 2 яруса): Залы — открытые пространства. Коридоры — тесные проходы. Лабиринт — извилистые коридоры. Решётка — ячейки 3×3. Арена — поле без стен. Пилоны — лабиринт столбов.",
	"help.bosses": "Боссы",
	"help.bossesBody": "Босс-ярусы (5, 8, 11, 18) — авторские арены. Голод не тратится. Слон-Мучитель (5) — три тела, теряет диагонали. Спаянные Ладьи (8) — ходят синхронно, мстят за убитую. Жернов (11) — давит врагов, скорми три куклы. Красный Король (18) — неуязвим, ломай цепи под огнём свиты.",
	"help.capture": "Взятия и деградация",
	"help.captureBody": "HP нет: взятие мгновенно. Когда враг берёт тебя — ты не гибнешь сразу, а деградируешь на ступень ниже (ферзь → ладья → слон/конь → пешка), теряя текущую форму. Взятие в форме пешки — конец забега. Пешка — твоя последняя жизнь.",
	"help.challenges": "Челленджи",
	"help.challengesBody": "Режимы с особыми правилами: Одинокая фигура (без смены), Слепой спуск (радиус 2), Шторм (враги сильнее, +50% пепла), Хаотичное колесо (смена каждые 3 хода), Эскалация (враги растут с ярусом).",
	"help.checkmate": "Шах и мат",
	"help.checkmateBody": "Все битые поля врагов подсвечены. Закончил ход на битой клетке — шах: враг обязан атаковать тебя. Нет ни одного легального хода на битой клетке — мат: тебя вскрывают на месте.",
	"help.controls": "Ход и управление",
	"help.controlsBody": "Игра пошаговая: сначала твой ход, затем ходят все враги. За ход — одно действие: переместиться, взять фигуру, сменить форму или спасовать. Тап по клетке — ход или взятие. Бирюзовая точка — безопасно, янтарная — встанешь под удар, багровая с крестом — там забег кончится. Тап по врагу — показать/скрыть его зону боя (красная штриховка). Тап по слоту формы — сменить форму (тратит ход). На ПК: 1–5 формы, Q/E поворот пешки (бесплатно), Space пас, Tab перебор врагов, Esc сброс, Enter подтвердить ход.",
	"help.editor": "Редактор уровней",
	"help.editorBody": "Кнопка «🗺 Редактор» в меню. Расставляй стены, врагов, спец-клетки, двери и ключи. Поддерживает несколько комнат. Запусти симуляцию и вернись к редактированию.",
	"help.enemies": "Враги",
	"help.enemiesBody": "Обычные шахматные фигуры двигаются к тебе. Особые: Страж — двойной удар (броня). Некромант — призывает пешек. Двойник — копирует твою форму. Ассасин — конь, отравляет. Жрец — слон, щитует союзников. Морозный маг — неподвижен, оглушает на расстоянии.",
	"help.events": "Золото и комнаты-события",
	"help.eventsBody": "Враги роняют золото. Между ярусами — комната-событие: Костоправ (купить кость/снять шов), Распайка (снять шов бесплатно), Жертвенник (отдать форму за кость), Кости судьбы (ставка), Алтарь благословения (дар на ярус).",
	"help.exotic": "Экзотические формы",
	"help.exoticBody": "Открываются за пепел в мета-магазине: Архиепископ (слон + конь), Канцлер (ладья + конь), Изверг (прыжки на 2 клетки).",
	"help.food": "Кости (еда)",
	"help.foodBody": "Клетки с 🍖 восполняют сытость. Шкала голода вверху показывает ходы до деградации. Взятия и Жилы тоже кормят; пас — дороже обычного хода.",
	"help.forms": "Формы фигур",
	"help.formsBody": "Ты играешь одной из шахматных форм; взятие — перемещение на клетку врага. Пешка ходит на 1 вперёд, бьёт по передним диагоналям, имеет фасинг — поворачивай бесплатно (Q/E). Конь прыгает буквой «Г» через препятствия. Слон бьёт по диагоналям, на своём цвете +1 дальность. Ладья — по прямым. Ферзь — во все стороны, но дальность меньше. Слайдеры упираются в первое препятствие; сквозь ходит только конь.",
	"help.goal": "Цель",
	"help.goalBody": "Спускайся по ярусам, зачищая всех врагов. Каждый следующий ярус — новая случайная доска и более опасные враги. Смерть завершает забег, но пепел и рекорды сохраняются.",
	"help.loot": "Добыча: кости и швы",
	"help.lootBody": "После зачистки — выбор награды. Кости — перманентные плюсы. Проклятые сделки: фаустова (2 кости + шов), алтарь (3 кости + 2 шва). Швы — перманентные дебаффы. Отображаются в панели Модификаторов и кольцами вокруг фигуры.",
	"help.meta": "Мета-прогрессия",
	"help.metaBody": "За каждый забег — пепел (ярус×3 + взятия). Трать на стартовые слоты, стартовые кости, облегчённый первый ярус. Прогресс и рекорд сохраняются между забегами.",
	"help.pillars": "Пилоны и жернова",
	"help.pillarsBody": "Пилон — непроходимый каменный блок. Жернов — катается по прямой, давит врагов и игрока; после забивания встаёт навсегда.",
	"help.preview": "Предпросмотр",
	"help.previewBody": "Наведи или тапни по клетке хода — янтарная штриховка покажет, какие клетки станут битыми после этого хода. Красная штриховка — то, что бито уже сейчас. В настройках можно включить подтверждение опасных ходов вторым тапом.",
	"help.rooms": "Комнаты",
	"help.roomsBody": "Ярус — 1–5 комнат, соединены дверями. Запертые двери требуют ключ того же цвета (всегда в той же комнате). Зачисти все комнаты для завершения яруса.",
	"help.specials": "Особые клетки",
	"help.specialsBody": "Паутина — теряешь форму, враг гибнет. Портал — переносит к парному кольцу. Жила — снимает усталость и статусы. Лёд — оглушает. Туман — скрывает угрозу. Конвейер — сдвигает. Ворота — проход только по стрелке. Цветовая зона — только для слона. Плита — открывает стену. Лава — растекается и жжёт.",
	"help.statuses": "Статусы",
	"help.statusesBody": "Цветные кружки у фигуры: Яд — обратный отсчёт, на 0 гибель. Оглушение — пропуск хода. Щит — поглощает взятие. Ускорение — +1 дальность, доп. шаг. Жила снимает все статусы.",
	"help.tagline": "Шахматный рогалик: ты — фигура, что меняет свой тип по ходу спуска.",
	"help.title": "Как играть",
	"help.wheel": "Колесо форм и усталость",
	"help.wheelBody": "Формы лежат в колесе (слот 0 — неудаляемая пешка). Смена формы тратит ход. Форма после взятия устаёт на пару ходов — в неё нельзя переключиться. Новые формы открываются, когда берёшь вражескую фигуру её типа. Число в углу слота — сколько ходов даст эта форма.",
	"hud.hunger": "Голод",
	"hud.hungerFrozen": "{0} · голод замер",
	"hud.hungerFrozenTTL": "Пока идёт бой с боссом, сытость не тратится.",
	"hud.hungerTTL": "Сытость {0}/{1}. Взятие +{2}, кость +{3}, пас −{4}.",
	"hud.mods": "Модификаторы",
	"hud.roomClear": "Комната {0} — зачищена",
	"hud.roomEnemies": "Комната {0} — врагов: {1}{2}",
	"hud.rooms": "комнаты",
	"hud.turnsLeft": "{0} х. до деградации",
	"hud.underThreat": "под ударом",
	"legend.title": "Легенда",
	"loading.hint": "Нажмите для продолжения",
	"loading.lore.0": "Глубоко под землёй, где законы шахмат обрели физическую форму, пробудился древний лабиринт.",
	"loading.lore.1": "Мастера Колеса выковали фигуры, способные менять свою суть — но плата за это велика.",
	"loading.lore.2": "Каждый спуск в Подземелье — новая партия против самой судьбы. Правила едины для всех.",
	"loading.lore.3": "Говорят, на дне лабиринта покоится Корона Превращения — артефакт абсолютной власти над формой.",
	"loading.lore.4": "Пешка, прошедшая весь путь, становится легендой. Но пока ты — лишь искра в темноте.",
	"loading.tip.0": "Поворот пешки (Q/E) бесплатен — разворачивайся к угрозе каждым ходом.",
	"loading.tip.1": "Стой на клетке своего цвета слоном — получишь +1 к дальности.",
	"loading.tip.2": "Туман скрывает угрозу: заманивай врагов в ловушки вслепую.",
	"loading.tip.3": "Шипы убивают врагов мгновенно — используй их как оружие.",
	"loading.tip.4": "Портал переносит мгновенно — отличный способ сбежать из окружения.",
	"loading.tip.5": "Меняй форму только когда нужно: каждая смена тратит ход.",
	"loading.tip.6": "Некромант призывает пешек — убей его первым.",
	"loading.tip.7": "Страж носит броню: первый удар только снимает щит.",
	"loading.tip.8": "Золото тратится у Костоправа между этажами — копи на редкие кости.",
	"loading.tip.9": "Деградация спасает от смерти: теряешь форму, но продолжаешь забег.",
	"log.default": "Двигайся или будь съеден.",
	"meta.achievements": "Достижения {0}/{1}",
	"meta.bestiary": "Бестиарий {0}/{1}",
	"meta.campDesc": "18 ярусов, четыре босса, три финала",
	"meta.campaign": "⚔ Кампания",
	"meta.challenges": "Челленджи",
	"meta.help": "Как играть",
	"meta.infDesc": "Ярусы без конца, боссов нет — только рекорд",
	"meta.infinite": "∞ Бесконечная",
	"meta.progress": "Мета-прогресс",
	"meta.record": "рекорд: ярус {0} · забегов {1} · всего взятий {2}",
	"meta.runAgain": "Ещё забег (R)",
	"meta.shards": "Пепел: {0}",
	"meta.startRun": "Начать забег (R)",
	"meta.title": "♟ Эндшпиль",
	"meta.toMenu": "В меню",
	"modal.achievements": "Достижения",
	"modal.achievementsText": "Открыто {0} из {1}.",
	"modal.codex": "Бестиарий",
	"modal.codexText": "Записи открываются по мере встреч в забегах.",
	"modal.helpBackToMenu": "Back to Menu",
	"modal.helpOK": "Got it",
	"modal.loot": "Добыча яруса",
	"modal.lootAltar": "☠ Алтарь жертвы",
	"modal.lootFaust": "⚠ Фаустова сделка",
	"modal.lootText": "Выбери одно. Проклятые сделки дают больше силы, но вешают перманентный шов.",
	"modal.promotion": "Линия восхождения",
	"modal.promotionText": "Пешка дошла до линии. Выбери, чьи кости прирастить — форма войдёт в колесо усиленной (★) и ты станешь ею прямо сейчас.",
	"modal.victory": "Король пал",
	"modal.victoryBreak": "💥 Сломать доску",
	"modal.victoryKill": "⚔ Убить",
	"modal.victoryText": "Ты прошёл Подземелье до конца.\nЯрусов: {0} · Взятий: {1} · Пепел: +{2}",
	"modal.victoryThrone": "♚ Занять место",
	off: "выкл",
	on: "вкл",
	"settings.all": "все ходы",
	"settings.anim": "Анимации",
	"settings.close": "Закрыть",
	"settings.confirm": "Подтверждать ход",
	"settings.confirmDesc": "Второй тап по клетке выполняет ход",
	"settings.lang": "Язык",
	"settings.langSystem": "системный",
	"settings.music": "Музыка",
	"settings.off": "выкл",
	"settings.preview": "Показывать последствия хода",
	"settings.risky": "только опасные",
	"settings.sound": "Звук",
	"settings.title": "⚙ Настройки",
	"settings.tutorial": "Обучение",
	"settings.tutorialBtn": "сбросить",
	"settings.tutorialDesc": "Показать сцены и подсказки заново",
	"settings.volume": "Громкость",
	"settings.volumeHigh": "громко",
	"settings.volumeLow": "тихо",
	"settings.volumeMid": "средне",
	shah: "Check",
	"summary.ashEarned": "+{0} пепла · всего {1}",
	"summary.bones": "Кости",
	"summary.bonesSeams": "костей · швов",
	"summary.captures": "взятий за забег",
	"summary.dead": "Пешка пала",
	"summary.deadSub": "Последняя кость сломана. Дальше нечем ходить.",
	"summary.floor": "ярус",
	"summary.forms": "формы: {0}",
	"summary.formsOnlyPawnKnight": "только пешка и конь",
	"summary.journal": "Журнал",
	"summary.record": "рекорд: ярус {0} · забегов {1}",
	"summary.runOver": "Run Over",
	"summary.seams": "Швы",
	"summary.title": "Забег окончен",
	"tooltip.colorzone": "Цветовая зона",
	"tooltip.conveyor": "Конвейер",
	"tooltip.door": "Дверь",
	"tooltip.fog": "Туман",
	"tooltip.food": "Кость",
	"tooltip.gate": "Ворота",
	"tooltip.ice": "Лёд",
	"tooltip.key": "Ключ",
	"tooltip.lava": "Лава",
	"tooltip.millstone": "Жернов",
	"tooltip.plate": "Плита",
	"tooltip.portal": "Портал",
	"tooltip.rune": "Жила",
	"tooltip.scroll": "Свиток",
	"tooltip.trap": "Паутина",
	"ui.actions": "Действия",
	"ui.editor": "🗺 Редактор",
	"ui.help": "Как играть (?)",
	"ui.log": "Журнал",
	"ui.menu": "Меню",
	"ui.pass": "Пас (Space)",
	"ui.restart": "Заново (R)",
	"ui.settings": "⚙ Настройки",
	"ui.wheel": "Колесо форм",
	"wheel.active": "Активная форма",
	"wheel.cd": "Форма устала",
	"wheel.empty": "пусто",
	"wheel.moves": "Ходов {0}, взятий {1}",
	"wheel.noMoves": "Отсюда эта форма не ходит",
	"wheel.switch": "Сменить (тратит ход)"
};
//#endregion
//#region src/config.js
/**
* src/config.js — константы, настройки, биомы (6), статусы, JSDoc-typedefs.
* Экспорты: CFG, CFG.HUNGER, CFG.ROOMS, GLYPH, NAME, BIOMES, STATUS_META, loadSettings(), saveSettings().
*/
/** @param {object|null} byEnemy — null при аварийной деградации (мат §6.3) */
/**
* @param {{x:number,y:number,facing:number[]}} piece
* @param {Form|{type:PieceType,r?:number,homeColor:0|1}} form
* @param {(x:number,y:number)=>boolean} isEnemyCell  — клетки, которые можно ВЗЯТЬ
* @param {(x:number,y:number)=>boolean} isBlocked    — прочие занятые клетки
* @returns {{moves:Cell[], captures:Cell[]}}
*/
/** @typedef {'pawn'|'knight'|'bishop'|'rook'|'queen'|'archbishop'|'chancellor'|'beast'|'king'|'infiltrator'|'bastion'} PieceType */
/** @typedef {{x:number,y:number}} Cell */
/** @typedef {{type:PieceType, r:number, improved:boolean, cooldown:number, homeColor:0|1}} Form */
var CFG = {
	CAMPAIGN_SEED: 42,
	W: 13,
	H: 11,
	VIEW_W: 11,
	VIEW_H: 9,
	TILE: 56,
	BASE_R: {
		pawn: 1,
		knight: 1,
		bishop: 3,
		rook: 3,
		queen: 2,
		archbishop: 3,
		chancellor: 4,
		beast: 1,
		king: 1,
		infiltrator: 1,
		bastion: 1,
		guardian: 1,
		necro: 1,
		mimic: 1,
		assassin: 1,
		priest: 3,
		frost: 3
	},
	MOVE_ANIM_MS: 300,
	TILE_ANIM_SPEED: 1,
	SFX_ENABLED: true,
	ANIM_ENABLED: true,
	MUSIC_ENABLED: true,
	MUSIC_VOLUME: .35,
	LANG: "system",
	FATIGUE_K: 2,
	ENEMY_CAPTURE_CD: 1,
	CONFIRM_MOVES: "risky",
	SHOW_PREVIEW: true,
	ANALYTICS_ENABLED: false,
	ANALYTICS_ENDPOINT: "http://localhost:8787",
	ANALYTICS_ADMIN_TOKEN: "",
	HUNGER: {
		start: 20,
		cap: 30,
		perTurn: 1,
		passExtra: 2,
		capture: 4,
		vein: 8,
		starveDegrade: 1,
		food: 10
	},
	EXTRA_SLOTS: 2,
	LADDER: {
		king: 6,
		infiltrator: 4,
		bastion: 1,
		chancellor: 10,
		archbishop: 10,
		beast: 8,
		queen: 9,
		rook: 5,
		bishop: 3,
		knight: 3,
		pawn: 1
	},
	DIFF: {
		budgetBase: 4,
		budgetGrow: 2.5,
		minEnemies: 3,
		maxElite: 3,
		cost: {
			pawn: 1,
			knight: 3,
			bishop: 3,
			rook: 4,
			queen: 7,
			guardian: 5,
			necro: 4,
			mimic: 5,
			assassin: 4,
			priest: 4,
			frost: 5
		},
		unlockFloor: {
			pawn: 1,
			knight: 1,
			bishop: 2,
			rook: 2,
			queen: 3,
			guardian: 3,
			necro: 4,
			mimic: 5,
			assassin: 4,
			priest: 5,
			frost: 6
		},
		queenCap: 1,
		queenCapDeep: 2,
		queenCapDeepFloor: 7,
		rangeBumpFloor: 4,
		rangeBumpFloor2: 7,
		necroEvery: 3,
		enemyCap: 10,
		priestEvery: 3,
		frostEvery: 2,
		frostRange: 3
	},
	ROOMS: {
		startMin: 1,
		startMax: 3,
		growEvery: 3,
		cap: 5,
		budgetExp: .65
	}
};
var KEY_COLORS = [
	"red",
	"blue",
	"green",
	"gold",
	"purple"
];
var KEY_GLYPH = {
	red: "🔴",
	blue: "🔵",
	green: "🟢",
	gold: "🟡",
	purple: "🟣"
};
var KEY_COLOR_HEX = {
	red: "#c0392b",
	blue: "#2980b9",
	green: "#27ae60",
	gold: "#d4a017",
	purple: "#8e44ad"
};
var GLYPH = {
	pawn: "♟",
	knight: "♞",
	bishop: "♝",
	rook: "♜",
	queen: "♛",
	archbishop: "♝",
	chancellor: "♜",
	infiltrator: "◆",
	bastion: "◈",
	beast: "☣",
	king: "♚",
	guardian: "♚",
	necro: "☠",
	mimic: "◆",
	assassin: "♟",
	priest: "♝",
	frost: "✳"
};
var NAME = {
	pawn: "пешка",
	knight: "конь",
	bishop: "слон",
	rook: "ладья",
	queen: "ферзь",
	archbishop: "архиепископ",
	chancellor: "канцлер",
	infiltrator: "лазутчик",
	bastion: "бастион",
	beast: "изверг",
	king: "король",
	guardian: "страж",
	necro: "некромант",
	mimic: "двойник",
	assassin: "ассасин",
	priest: "жрец",
	frost: "морозный маг"
};
var NAME_EN = {
	pawn: "Pawn",
	knight: "Knight",
	bishop: "Bishop",
	rook: "Rook",
	queen: "Queen",
	archbishop: "Archbishop",
	chancellor: "Chancellor",
	infiltrator: "Infiltrator",
	bastion: "Bastion",
	beast: "Beast",
	king: "King",
	guardian: "Guardian",
	necro: "Necromancer",
	mimic: "Mimic",
	assassin: "Assassin",
	priest: "Priest",
	frost: "Frost Mage"
};
var STD_TYPES = /* @__PURE__ */ new Set([
	"pawn",
	"knight",
	"bishop",
	"rook",
	"queen",
	"archbishop",
	"chancellor",
	"beast",
	"king",
	"infiltrator",
	"bastion"
]);
var MOVE_AS = {
	guardian: "king",
	assassin: "knight",
	priest: "bishop"
};
var BIOMES = [
	{
		id: "halls",
		name: "Залы",
		enName: "Halls",
		light: "#39404e",
		dark: "#2a303c",
		accent: "#c9a227",
		wallStyle: "halls",
		favorEnemies: [
			"bishop",
			"queen",
			"mimic"
		],
		favorTiles: [
			"portal",
			"rune",
			"lava"
		]
	},
	{
		id: "corridors",
		name: "Коридоры",
		enName: "Corridors",
		light: "#31393a",
		dark: "#232a2b",
		accent: "#58b3a4",
		wallStyle: "corridors",
		favorEnemies: [
			"rook",
			"guardian",
			"assassin"
		],
		favorTiles: [
			"gate",
			"plate",
			"conveyor"
		]
	},
	{
		id: "maze",
		name: "Лабиринт",
		enName: "Maze",
		light: "#2d3338",
		dark: "#1f2429",
		accent: "#b08d5c",
		wallStyle: "maze",
		favorEnemies: [
			"knight",
			"bishop",
			"queen"
		],
		favorTiles: [
			"rune",
			"fog",
			"portal"
		]
	},
	{
		id: "grid",
		name: "Решётка",
		enName: "Grid",
		light: "#38342e",
		dark: "#292620",
		accent: "#c47a4a",
		wallStyle: "grid",
		favorEnemies: [
			"rook",
			"guardian",
			"priest"
		],
		favorTiles: [
			"gate",
			"plate",
			"conveyor"
		]
	},
	{
		id: "arena",
		name: "Арена",
		enName: "Arena",
		light: "#35302a",
		dark: "#24201c",
		accent: "#d4a03c",
		wallStyle: "arena",
		favorEnemies: [
			"queen",
			"mimic",
			"assassin"
		],
		favorTiles: [
			"ice",
			"lava",
			"colorzone"
		]
	},
	{
		id: "pylons",
		name: "Пилоны",
		enName: "Pylons",
		light: "#3b392f",
		dark: "#2b2a23",
		accent: "#8fae7a",
		wallStyle: "pylons",
		favorEnemies: [
			"knight",
			"necro",
			"frost"
		],
		favorTiles: [
			"fog",
			"colorzone",
			"ice"
		]
	}
];
var biomeFor = (f) => BIOMES[Math.floor((f - 1) / 2) % BIOMES.length];
var STATUS_META = {
	poison: {
		name: "яд",
		enName: "Poison",
		color: "#6cbf5a"
	},
	stun: {
		name: "оглушение",
		enName: "Stun",
		color: "#e0c341"
	},
	shield: {
		name: "щит",
		enName: "Shield",
		color: "#5bb6d6"
	},
	haste: {
		name: "ускорение",
		enName: "Haste",
		color: "#e08a3f"
	}
};
var GOLD_DROP = {
	pawn: 1,
	knight: 2,
	bishop: 2,
	rook: 3,
	queen: 5,
	guardian: 4,
	necro: 3,
	mimic: 4
};
var BESTIARY_TRIO = [
	"guardian",
	"necro",
	"mimic"
];
var RELIC_TIER = {
	pawn_double: 1,
	knight_extra: 1,
	light_lines: 1,
	free_swap: 1,
	guard_pierce: 1,
	silence: 1,
	mirror_break: 1,
	venom: 1,
	pawn_omni: 2,
	slider_reach: 2,
	trophy: 2,
	pawn_shield: 2,
	smoke: 2,
	second_wind: 2,
	concuss: 2,
	toxic_aura: 2,
	bulwark: 2,
	no_fatigue: 3,
	extra_slot: 3
};
var TIER_META = {
	1: {
		name: "обычная",
		enName: "common",
		cls: "t-common"
	},
	2: {
		name: "редкая",
		enName: "rare",
		cls: "t-rare"
	},
	3: {
		name: "эпическая",
		enName: "epic",
		cls: "t-epic"
	}
};
var relicTier = (id) => RELIC_TIER[id] || 1;
function tierWeight(tier, flr, biasHigh) {
	let w = tier === 1 ? 10 : tier === 2 ? 3 + flr * .6 : .5 + flr * .5;
	if (biasHigh && tier > 1) w *= 2.5;
	return w;
}
var SETTINGS_KEY = "chessrogue_settings_v1";
var SETTINGS_KEYS = [
	"SFX_ENABLED",
	"ANIM_ENABLED",
	"SHOW_PREVIEW",
	"CONFIRM_MOVES",
	"MUSIC_ENABLED",
	"MUSIC_VOLUME",
	"LANG",
	"ANALYTICS_ENABLED",
	"ANALYTICS_ENDPOINT",
	"ANALYTICS_ADMIN_TOKEN"
];
function loadSettings() {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (!raw) return;
		const data = JSON.parse(raw);
		for (const k of SETTINGS_KEYS) if (data[k] !== void 0 && typeof data[k] === typeof CFG[k]) CFG[k] = data[k];
	} catch {}
}
/** Сохранить настройки в localStorage. */
function saveSettings() {
	try {
		const out = {};
		for (const k of SETTINGS_KEYS) out[k] = CFG[k];
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(out));
	} catch {}
}
var SHOP_PRICE = {
	1: 4,
	2: 8,
	3: 14
};
//#endregion
//#region src/lang.js
var bundles = /* #__PURE__ */ Object.assign({
	"./lang/en.json": en_default,
	"./lang/ru.json": ru_default
});
function detectSystemLang() {
	if (typeof navigator !== "undefined") {
		var list = navigator.languages && navigator.languages.length ? navigator.languages : navigator.language ? [navigator.language] : [];
		for (var i = 0; i < list.length; i++) {
			var code = list[i] && list[i].slice(0, 2);
			if (code === "ru" || code === "en") return code;
		}
	}
	return "ru";
}
var _cachedLang = null;
var _lastLangKey = null;
function langKey() {
	if (CFG.LANG === "system") return detectSystemLang();
	return CFG.LANG || "ru";
}
function currentBundle() {
	const key = langKey();
	if (_cachedLang && _lastLangKey === key) return _cachedLang;
	_lastLangKey = key;
	_cachedLang = bundles["./lang/" + key + ".json"] || bundles["./lang/ru.json"] || {};
	return _cachedLang;
}
/**
* Получить строку по ключу с подстановками.
* @param {string} key — "module.key"
* @param {...(string|number)} subs — значения для {0}, {1}, ...
* @returns {string}
*/
function L(key, ...subs) {
	let s = currentBundle()[key];
	if (!s && langKey() !== "ru") s = (bundles["./lang/ru.json"] || {})[key];
	if (!s) s = "[" + key + "]";
	subs.forEach(function(v, i) {
		s = s.replace("{" + i + "}", String(v));
	});
	return s;
}
/** True if current resolved language is English. */
function isEnglish() {
	return langKey() === "en";
}
/** Сбросить кешированный бандл — вызывать после смены языка. */
function invalidateLang() {
	_cachedLang = null;
	_lastLangKey = null;
}
/**
* Выбрать поле объекта по текущему языку с фоллбеком на русский.
* @param {{name:string, enName?:string}} obj — объект с ru/en полями
* @param {string} field — 'name' или 'desc'
* @returns {string}
*/
function LContent(obj, field) {
	if (!obj) return "";
	var enField = "en" + field.charAt(0).toUpperCase() + field.slice(1);
	if (langKey() === "en" && obj[enField]) return obj[enField];
	return obj[field] || obj[enField] || "";
}
//#endregion
//#region src/content.js
/**
* src/content.js — контент-данные: кости (RELICS), швы (CURSES), мета-апгрейды (META_UPGRADES), челленджи (CHALLENGES).
*/
var RELICS = {
	pawn_double: {
		name: "Длинный шаг",
		enName: "Long Step",
		desc: "Пешка может ходить на 1–2 клетки вперёд.",
		enDesc: "Pawn can move 1–2 cells forward."
	},
	pawn_omni: {
		name: "Круговой удар",
		enName: "Omni Strike",
		desc: "Пешка бьёт по всем четырём диагоналям (в т.ч. назад).",
		enDesc: "Pawn attacks all four diagonals (including backward)."
	},
	knight_extra: {
		name: "Гарцующий конь",
		enName: "Prancing Knight",
		desc: "Конь дополнительно может шагнуть на 1 клетку прямо.",
		enDesc: "Knight may also step 1 cell straight."
	},
	slider_reach: {
		name: "Дальний прицел",
		enName: "Far Sight",
		desc: "+1 к дальности твоих слона, ладьи и ферзя.",
		enDesc: "+1 range to your bishop, rook, and queen."
	},
	light_lines: {
		name: "Светлые линии",
		enName: "Bright Lines",
		desc: "Стоя на светлой клетке, твои слайдеры бьют на +1 дальше.",
		enDesc: "Standing on a light square gives your sliders +1 range."
	},
	no_fatigue: {
		name: "Ветеран",
		enName: "Veteran",
		desc: "Формы больше не устают после взятия.",
		enDesc: "Forms no longer fatigue after a capture."
	},
	trophy: {
		name: "Трофей",
		enName: "Trophy",
		desc: "Взятие врага снимает усталость со всех форм.",
		enDesc: "Killing an enemy removes fatigue from all forms."
	},
	free_swap: {
		name: "Быстрые руки",
		enName: "Quick Hands",
		desc: "Первая смена формы на каждом этаже бесплатна.",
		enDesc: "First form swap each floor is free."
	},
	extra_slot: {
		name: "Широкое колесо",
		enName: "Wide Wheel",
		desc: "+1 слот колеса форм.",
		enDesc: "+1 form wheel slot."
	},
	pawn_shield: {
		name: "Талисман пешки",
		enName: "Pawn Talisman",
		desc: "Один раз за забег взятие в форме пешки не убивает.",
		enDesc: "Once per run, capture as pawn is not fatal."
	},
	guard_pierce: {
		name: "Бронебой",
		enName: "Piercing",
		desc: "Твои взятия пробивают броню стража с одного удара.",
		enDesc: "Your captures pierce Guardian armor in one hit."
	},
	silence: {
		name: "Печать тишины",
		enName: "Seal of Silence",
		desc: "Некроманты призывают вдвое реже.",
		enDesc: "Necromancers summon half as often."
	},
	mirror_break: {
		name: "Разбитое зеркало",
		enName: "Shattered Mirror",
		desc: "Двойники больше не копируют тебя — застревают пешкой.",
		enDesc: "Mimics no longer copy you — stuck as pawn."
	},
	smoke: {
		name: "Дымовая завеса",
		enName: "Smoke Screen",
		desc: "Начинаешь каждый этаж со щитом.",
		enDesc: "Start each floor with a shield."
	},
	venom: {
		name: "Ядовитый след",
		enName: "Venomous Trail",
		desc: "Враг, взявший тебя, получает яд (гибнет через 2 хода).",
		enDesc: "Enemy that captures you gets poison (dies in 2 turns)."
	},
	second_wind: {
		name: "Второе дыхание",
		enName: "Second Wind",
		desc: "Начинаешь каждый этаж с ускорением на 2 хода.",
		enDesc: "Start each floor with haste for 2 turns."
	},
	concuss: {
		name: "Ошеломление",
		enName: "Concussion",
		desc: "Твоё взятие оглушает врагов рядом с целью на 1 ход.",
		enDesc: "Your capture stuns enemies adjacent to the target for 1 turn."
	},
	toxic_aura: {
		name: "Ядовитая аура",
		enName: "Toxic Aura",
		desc: "В начале твоего хода враги вплотную получают яд (1).",
		enDesc: "At the start of your turn, adjacent enemies get poison (1)."
	},
	bulwark: {
		name: "Оплот",
		enName: "Bulwark",
		desc: "Когда щит гасит взятие, атакующий оглушается.",
		enDesc: "When shield absorbs a capture, attacker is stunned."
	}
};
var CURSES = {
	brittle: {
		name: "Хрупкость",
		enName: "Brittle",
		desc: "Усталость форм длится на 1 ход дольше.",
		enDesc: "Form fatigue lasts 1 turn longer."
	},
	heavy: {
		name: "Тяжёлая поступь",
		enName: "Heavy Tread",
		desc: "−1 к дальности твоих слона, ладьи и ферзя.",
		enDesc: "−1 range to your bishop, rook, and queen."
	},
	marked: {
		name: "Меченый",
		enName: "Marked",
		desc: "Слайдеры врагов бьют на 1 клетку дальше.",
		enDesc: "Enemy sliders hit 1 cell further."
	},
	compulsion: {
		name: "Одержимость",
		enName: "Compulsion",
		desc: "Нельзя пасовать, пока есть другой ход.",
		enDesc: "Cannot pass while any other move exists."
	},
	rusted: {
		name: "Ржавое колесо",
		enName: "Rusted Wheel",
		desc: "−1 слот колеса форм (форма в нём теряется).",
		enDesc: "−1 form wheel slot (form in it is lost)."
	},
	bloodline: {
		name: "Кровавая линия",
		enName: "Bloodline",
		desc: "Промоушен закрыт, если на этаже было хоть одно взятие.",
		enDesc: "Promotion disabled if any capture happened this floor."
	},
	guard_tough: {
		name: "Живучая стража",
		enName: "Tough Guards",
		desc: "У стражей +1 брони.",
		enDesc: "Guardians have +1 armor."
	},
	dark_summon: {
		name: "Тёмный призыв",
		enName: "Dark Summon",
		desc: "Некроманты призывают чаще.",
		enDesc: "Necromancers summon more often."
	},
	mimic_reach: {
		name: "Совершенная копия",
		enName: "Perfect Copy",
		desc: "Двойники бьют на клетку дальше.",
		enDesc: "Mimics gain +1 range."
	},
	hex: {
		name: "Порча",
		enName: "Hex",
		desc: "Враг, взявший тебя, накладывает яд (2).",
		enDesc: "Enemy that captures you inflicts poison (2)."
	},
	glass: {
		name: "Хрупкое тело",
		enName: "Glass Body",
		desc: "Щит на тебе не действует.",
		enDesc: "Shield does not work on you."
	}
};
var META_UPGRADES = {
	startSlots: {
		name: "Наследие форм",
		enName: "Form Legacy",
		desc: "+1 стартовый слот колеса форм.",
		enDesc: "+1 starting form wheel slot.",
		max: 2,
		costs: [8, 20]
	},
	startRelics: {
		name: "Расхитительство",
		enName: "Grave Robbing",
		desc: "Начинать забег со случайной реликвией.",
		enDesc: "Start each run with a random relic.",
		max: 2,
		costs: [12, 30]
	},
	headstart: {
		name: "Разведка",
		enName: "Reconnaissance",
		desc: "Первый ярус тише (−2 врага).",
		enDesc: "First floor is quieter (−2 enemies).",
		max: 1,
		costs: [15]
	},
	archbishop: {
		name: "Архиепископ",
		enName: "Archbishop",
		desc: "Форма «архиепископ» доступна в забегах (слон + конь).",
		enDesc: "Archbishop form available in runs (bishop + knight).",
		max: 1,
		costs: [12]
	},
	chancellor: {
		name: "Канцлер",
		enName: "Chancellor",
		desc: "Форма «канцлер» доступна в забегах (ладья + конь).",
		enDesc: "Chancellor form available in runs (rook + knight).",
		max: 1,
		costs: [12]
	},
	beast: {
		name: "Изверг",
		enName: "Beast",
		desc: "Форма «изверг» доступна в забегах (прыжки на 2 в любую сторону).",
		enDesc: "Beast form available in runs (leaps exactly 2 cells).",
		max: 1,
		costs: [15]
	},
	infiltrator: {
		name: "Лазутчик",
		enName: "Infiltrator",
		desc: "Форма «лазутчик» доступна в забегах (пешка без фасинга, бьёт по всем диагоналям).",
		enDesc: "Infiltrator form available in runs (facing-free pawn, hits all diagonals).",
		max: 1,
		costs: [14]
	},
	bastion: {
		name: "Бастион",
		enName: "Bastion",
		desc: "Форма «бастион» доступна в забегах (стационарный танк с бронёй).",
		enDesc: "Bastion form available in runs (stationary tank with armor).",
		max: 1,
		costs: [16]
	}
};
var CHALLENGES = {
	lone_figure: {
		name: "Одинокая фигура",
		enName: "Lone Figure",
		desc: "Только одна форма на весь забег. Без смены, без деградации. Взятие = конец.",
		enDesc: "Only one form for the entire run. No switching, no degradation. Capture = end.",
		icon: "🔒"
	},
	blind_descent: {
		name: "Слепой спуск",
		enName: "Blind Descent",
		desc: "Видно только поле в радиусе 2 клеток. Враги и спец-клетки скрыты за пределами обзора.",
		enDesc: "Only a 2-cell radius is visible. Enemies and special cells are hidden beyond.",
		icon: "🌫️"
	},
	storm: {
		name: "Шторм",
		enName: "Storm",
		desc: "Враги сильнее и быстрее находят тебя. +50% пепла.",
		enDesc: "Enemies are stronger and find you faster. +50% ash.",
		icon: "⚡"
	},
	chaos_wheel: {
		name: "Хаотичное колесо",
		enName: "Chaos Wheel",
		desc: "Каждые 3 хода форма меняется случайно. Игнорирует усталость.",
		enDesc: "Every 3 turns, form changes randomly. Ignores fatigue.",
		icon: "🌀"
	},
	escalation: {
		name: "Эскалация",
		enName: "Escalation",
		desc: "С каждым ярусом враги сильнее: +1 дальность, с яруса 5 — броня. ×2 пепла с яруса 5.",
		enDesc: "Enemies grow stronger each floor: +1 range, armor from floor 5. ×2 ash from floor 5.",
		icon: "💀"
	}
};
var ACHIEVEMENTS = {
	first_blood: {
		name: "Первая кровь",
		enName: "First Blood",
		desc: "Возьми первого врага.",
		enDesc: "Take your first enemy."
	},
	deep: {
		name: "Глубоко",
		enName: "Deep",
		desc: "Достигни 5-го этажа.",
		enDesc: "Reach floor 5."
	},
	abyss: {
		name: "Бездна",
		enName: "Abyss",
		desc: "Достигни 10-го этажа.",
		enDesc: "Reach floor 10."
	},
	collector: {
		name: "Коллекционер",
		enName: "Collector",
		desc: "Собери 5 реликвий за забег.",
		enDesc: "Collect 5 relics in a run."
	},
	cursed: {
		name: "Проклятый",
		enName: "Cursed",
		desc: "Прими 3 проклятия за забег.",
		enDesc: "Accept 3 curses in a run."
	},
	toxin: {
		name: "Токсиколог",
		enName: "Toxicologist",
		desc: "Убей врага ядом.",
		enDesc: "Kill an enemy with poison."
	},
	polymorph: {
		name: "Полиморф",
		enName: "Polymorph",
		desc: "Открой все стандартные формы за забег (пешка, конь, слон, ладья, ферзь).",
		enDesc: "Unlock all standard forms in a run."
	},
	bestiary: {
		name: "Зверолов",
		enName: "Beastmaster",
		desc: "Встреть стража, некроманта и двойника.",
		enDesc: "Meet Guardian, Necromancer, and Mimic."
	},
	flawless: {
		name: "Безупречно",
		enName: "Flawless",
		desc: "Зачисти этаж, не потеряв ни одной формы.",
		enDesc: "Clear a floor without losing a form."
	},
	wealthy: {
		name: "Богач",
		enName: "Wealthy",
		desc: "Накопи 100 пепла.",
		enDesc: "Accumulate 100 ash."
	},
	merchant: {
		name: "Торговец",
		enName: "Merchant",
		desc: "Соверши покупку у Костоправа.",
		enDesc: "Make a purchase at the Bonesetter."
	},
	pacifist: {
		name: "Пацифист",
		enName: "Pacifist",
		desc: "Пройди этаж без единого взятия.",
		enDesc: "Clear a floor without a single capture."
	},
	web_master: {
		name: "Ловец снов",
		enName: "Dreamweaver",
		desc: "Уничтожь 3 врагов паутинами за один забег.",
		enDesc: "Destroy 3 enemies with webs in one run."
	},
	arsonist: {
		name: "Поджигатель",
		enName: "Arsonist",
		desc: "Убей врага лавой.",
		enDesc: "Kill an enemy with lava."
	},
	speedrun: {
		name: "Спринтер",
		enName: "Sprinter",
		desc: "Зачисти 3 этажа подряд без единого паса.",
		enDesc: "Clear 3 floors in a row without passing."
	},
	marathon: {
		name: "Марафонец",
		enName: "Marathoner",
		desc: "Пройди 25 этажей за всё время (суммарно).",
		enDesc: "Complete 25 floors total across all runs."
	},
	collector_elite: {
		name: "Архивариус",
		enName: "Archivist",
		desc: "Открой 75% бестиария.",
		enDesc: "Unlock 75% of the bestiary."
	},
	architect: {
		name: "Архитектор",
		enName: "Architect",
		desc: "Сыграй забег в каждом из 5 челленджей.",
		enDesc: "Play a run in each of the 5 challenges."
	},
	glass_cannon: {
		name: "Стеклянная пушка",
		enName: "Glass Cannon",
		desc: "Дойди до этажа 5+ в челлендже «Одинокая фигура».",
		enDesc: "Reach floor 5+ in the Lone Figure challenge."
	},
	storm_chaser: {
		name: "Охотник за бурей",
		enName: "Storm Chaser",
		desc: "Зачисти этаж 7+ в челлендже «Шторм».",
		enDesc: "Clear floor 7+ in the Storm challenge."
	},
	kingmaker: {
		name: "Делатель королей",
		enName: "Kingmaker",
		desc: "Доведи пешку до промоушена 3 раза за забег.",
		enDesc: "Promote a pawn 3 times in one run."
	}
};
//#endregion
//#region src/assets/act1to2.png
var act1to2_default = "" + new URL("act1to2-BmIxcxOD.png", import.meta.url).href;
//#endregion
//#region src/assets/act2to3.png
var act2to3_default = "" + new URL("act2to3-Dqyvuu9N.png", import.meta.url).href;
//#endregion
//#region src/assets/altar-blessing.png
var altar_blessing_default = "" + new URL("altar-blessing-CmYa88vj.png", import.meta.url).href;
//#endregion
//#region src/assets/altar-sacrifice.png
var altar_sacrifice_default = "" + new URL("altar-sacrifice-DXBQ9ed5.png", import.meta.url).href;
//#endregion
//#region src/assets/bonesetter.png
var bonesetter_default = "" + new URL("bonesetter-DWkQuUtJ.png", import.meta.url).href;
//#endregion
//#region src/assets/cells/colorzone.png
var colorzone_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwCAMAAADxPgR5AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAABCUExURZRlZRckNSonOFA2S11UX6mdktGvkaPPwFIwNL6TclibmycZK359gCwzShIXKi9RYggKFvHv0+jRqMRMSxoySAAAALYA5HIAAAABYktHRBXl2PmjAAAAB3RJTUUH6gcaDAgG3i8v9gAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNi0wNy0yNlQwOTo0ODo1MSswMDowMHnyclQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjYtMDctMjZUMDk6NDg6NTErMDA6MDAIr8roAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI2LTA3LTI2VDEyOjA4OjA2KzAwOjAwGOL2igAAAtp6VFh0cHJvbXB0AAA4jbVVy27bMBD8FUJn2Yn8Tm995BDUhwIueikKYS2uJcIUqZIrPxLk37uk6kcM9VK0N2mXOzsz1EAvSZa8Ey9JocH7nI4N8mvyscJi21hlaGlBoluputGYpCJRpmnJdyPbhnIDdZzwMj/ofA0e82x4P/SwQULjrfPJ6yvPjXq2LK2DDv8GWXPjjNyoA+oBOBoc9GCXDbM34DzoyaEpqcprK1HzCBO4LhdaNefq6cx31p2K+x9c+t3vKtmPSHfcZ8ry6ctXPNCjKRjkhjJx48xWMNtUgPA/W3Ao7EZIcFuxU1YjCU/WoNgrqvjIWvnKNqJWzFYwXwc7lKmQCkprQIsKqKiUKVNBthlIuzcMg/tUWCO81UqKGko0xEhQbEtnW8PjWjEgStEALyRMxTqurLgowPBMG7qEoNOO2gYYwh+FbE2J1qSiZPcFq0dKri0aXSya/K1Fa906d0yZ/oYEC5aK+Xv2y5AagFbgo96xFHyB/HGkoqksWcdslSdVsBWMlIo9ELqa2TOUKg1Q61ipdGynr4CtYhXaekZeO1VWbHw4AkF5YbVtHXeMVZ6HTizemBi2MKS8Kv7Ji2mPF491Q8clrzP0FO7oxo29klTx0+Jhxo0KA8Pz6zrceu7Vc0CaxRWznhWfVxByeRsfjyj5YTLL5vPxaDKNYcAmNEeLoGBT8uO8S0mHcE4btuENTIGcH9AxX0WFMpRDfwvOQYydxGheT7JGp2Q11itSO4zV8alqsIRzdXKq6uhUrqJVoTONnah93qP92/vHT9jzlXWCfISYncB3gOeEjzrMRQ9mvKdVwaH5cLyBbRsf6nmNVNngLsvgbHsa4AEK6nwKB9ZHbt4Ps1Gw/aJmflHz0LN5xbHv+0o2SmO4mrxxuFGHeENGhnDeFai1vwtfsnvmdOdZNkpOKzv5i8vO7P7/yn0r9npx3+/lH6idzm7EssJu6esv9Dcw/TrpZ4sAAAmUSURBVGje7VrbYuI2FNTl2Mg1kgXl/7+1M3NkcLZ9sTf71GizIQHjYebcpYTws37Wz/pZP+v/sOJhpfSHwXLOyWz6rIRn8p+DS8AS3qyv2xQMv1r5Q5DZpsUsGrEIiofFstlff9kfQSzAo4A2vwWdpxVPTNM9l++nVwrkg3qZMnL5oz6CfbclLRfctWBZTinWqq8YoW/GZ8Dz0/daEmh3Wgv/s7V9xdiM9EQ9wJu+DVGRkISHmzsW0GJr0pRKF1gyfoslcy4Ws1tND8T5rPcL2bYGQ/62rpmR1wyEKF2xSiFb61hN0JBVmuYIQF78e4gZvhiVWSyRX3Ixu6/W4EGDZdI19ruWhGUEx5zSBh7hVixBRvhrg3kbghRXwdjhMiDSJu6Um8e4yVuQrpvQxupdjMVyWXRVwrrkPJlZkmEwzSS5wClczrb+iphoyLCE4cs05HmaBZGFN6acqCqySh1469cFWcmp8eMFpFok+BCYY8/BgVi457wik6VIuJA7il/sB7z+IemIxGy4nqpYrqcAq8SUPEtV1hS//gE5QDvJxssq3nBXxrVzgElwUFNYqQIv0T3fGNPj0R34g4irYId5ikoF53qBpNDKE50H+cyzWf+w64/Hw/qHZ08ttbZrYkz1JxkGB5xUkopn6j7IofIS8NEZLQOQeLBfCm/AkwwVd6oPORXI9SEYnvPjs6bBsTMakUvpOyEzyZ2VFH5GP6lI3Jl3ezuM0sDjkQHG9dY5SlIYE4m35bCcBFxgvLYMSXGbj4My0QEPS5BvKyL4VRiZJVpezgJKUnZL8h/Wh/Z20ImaZgn63BmurRf5plIvuIaTTrOMLDq7i/dDhumSVHhTODydvWDyU8KaZwFlQy9LFPUIiBRTxvqSeJQqxHBp+X7aS9GmtfswYS5fEguS5TJjIWfaETCPxkCSnvVSZFO4eGVnVsjwcGOk8jBrhelp/aukSFHVA+osINoTShoWKnXQrofbGxCIh7jwro6SAvBCagPDCcHBupi/AOLJv3dApM4PIHqesgOeTm0TExpcNYRVTvMuE/l2K2EuACvPec0Utb8lBeD9dwCdKru1d3iTAGrrsoBdmDPSwLAiGKZRYZYrgIsDDru8naaz4eigCIKQtOP3247oUwZLt10IfNUI1FO4ncLi4KIEZFwAdV2hufW304hissuSohNDW/QlLBiQ6DwCFJ2DrWXdIxSAlIJhX9USX2K4wCPtGBZwRdjNekaRCis1X3f6nmnu00WngYwAZOt3BAQ7At4zymJoLSx3AurVIWkObEva6Z6mVjEMPqnkAyAHlvtNETA9n5lPlP6WVLOUnKZekhQuUNMnDvEtO+L0xAz6mBI3MZJ3jJ1zlhW8gQX4vKSFYYFpYWITVQZeyY6YWYMfEwfiPKzIONyLxQVJB0PtxJjtohXdniuxUiZlvXUo3vM+Q02XJC2yIfI07ktAtoRoxogow4osuQ8jevL2ye46Q/6YBVjQupGhIwLrodm4MBjwMvpghUXeAS87jaYT3hfmcoY598NYkYsY4oGX2CjBl+MQ0eF7BuiQcMviwzx8ZV4fGCHgn9qi4cu5jy7W6jXA4TTLqowFSXnb1VM5spo4Ql7zclmKAOVN0DSWKwwxD7FN9IqfBSgPJSCLb58J6HmhyHsoB8dzaxcAjYDcTZNLdr+tVyAAsh6uDkhNB0PPbLPCYrsch5xMCFj2GGTEzHMJkJRBSLy8Axb0VUre5ZqkY79EDMv6BqQBUQthU39mANKngleL05LGN0NzhomRPvIaAIk+ijzXOpym2Gii0kWn2YMKDFf+3wEB8bAsFcXQFIfciUv+lksMCRjjqIcc/QCYXFICutBD0jzi0Djm2yWGo6eh0zlDAKj4mcM/lMgZCB6GLul0mxeE/oWw2ASo1LiEkljsCLCuznBdHwWF0AEZFTQza7L7TEtnt008Dn3Y8wJlpeXRCQoQQOnD0ESdPZShK6n9vA23SkBuJApcE83KeECsO2AWoKdSfSK5TIAgDXXlbLWI24apV36a3Ns1bZTe3UkEWEbD0bhBNipFQlPSaj/tNGAoQOX+7Dvbvs1OyF7Ghil+7H0EYNGwZtuW+hVJY8ypxa0hLOLo9zUbZU2+zCxZPzrHMlRIvLxXAMZ49lSKTlOhTqxq3oWGqh8PO977eZdeGU1+TBF9W7+wYVoIyP0lmkP3LGP6+2XtrxR9roi3QNQL+/twyobPCk/d+Wlwm1ANbjfuSAuNP3mGQVdj6RUrFW1XGAIjdhiEe9pt6IXnguaNEEaDxv0jBaDv5ry2CMDYzh8mJJBLfG+n22xx88MQy++EWW0/JBlq6iKYgIAIk5NHmaITEU7cZ8PNvApoivfNtMgdUvnsQBUe+EVuVpPw2X2aKRAQ7WbUFp+f/Sg6+mG5+eSvVRfRBLEpRs4CGtwFIZw6fIdc8cnlPxlegblpnu+IN29cK8l1JgvuO27dM9RJQO1EtrQ17eZ3srQNMVc41z/pMM+pshGAshsl6DzT4KFJJeB0gWHDzePLOlXtDHmotdGVdFLDr6knPFU5oAkQl+KXJIZnt77uU2icZ8ALoRxlONxdvmvxyVPZuS16Ck8qowKvkWv39uu0pA6IG2woN54jzYMl+ekQuRMQ5qKJ8To+CtNaucJwAELUuvVKqeiAcv+OGOkhdIRi993/5FfVjlKhd10A5FSpw13ei6dLyOJ+sgXAh2H4nexZGTeAQ6xX+nJNtauWXHEaU/tMRFQp0Opw/UpbwfGRQUtZnpPOahSMkcGzoZIwE1xjqObSqx94UNC0CZkms3574hsk7sSpI24kZxn7H+cA2Y7GPIpSaY32iQzEASivYeVS5gNYZ2Uqo1BplI3nAflhva6j2IJla4OhuymPKIwmhitXnqXszYClC4CBgJo+XdbUegJc9HLXuqdUENdxNOv0oOfJ9SpDje3ZaSLYCMkA2XjUDH4CZN3tg9roJ69KmnztZwZwf0SiAMGqmQPSQ/t+TeK/cZZ4VtLRQ9hxVZrSVJP5ZxisIV1d2uGatL/vJCDGmDAFAX7apcq6y1qsspDYBiRa9dBaCZAHGq+zgJW7Qma/MiTkxoLALMNGtBPwC0O9MZ4ERBbGepm96kv1oMYXVtOxHtZGaVVB2PnU10t/8YJH9G3GK1FlTgGi9SYS34nvG9s/AbZhLwC+Ni40kl0lih2zA770cI6gc3wNQJRdB0ysGqLzqkmvvNgVxDdgdaK45MKfn8V/L34MtPhInZu+89y3/eeVp/n9rJ/1s37WN65/AMHymXBHJhSmAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/cells/conveyor.png
var conveyor_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/cells/fog.png
var fog_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/cells/food.png
var food_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/cells/gate.png
var gate_default = "" + new URL("gate-CWbN6aBT.png", import.meta.url).href;
//#endregion
//#region src/assets/cells/ice.png
var ice_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/cells/lava.png
var lava_default = "" + new URL("lava-FdBdLg-_.png", import.meta.url).href;
//#endregion
//#region src/assets/cells/millstone.png
var millstone_default$1 = "data:image/png;base64,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";
//#endregion
//#region src/assets/cells/pillar.png
var pillar_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/cells/plate.png
var plate_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/cells/portal.png
var portal_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/cells/rune.png
var rune_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/cells/scroll.png
var scroll_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/cells/trap.png
var trap_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/codex-bg.png
var codex_bg_default = "" + new URL("codex-bg-CgKroZGG.png", import.meta.url).href;
//#endregion
//#region src/assets/dice.png
var dice_default = "" + new URL("dice-BJ5twm5g.png", import.meta.url).href;
//#endregion
//#region src/assets/endgame.png
var endgame_default = "" + new URL("endgame-C3kTgt2k.png", import.meta.url).href;
//#endregion
//#region src/assets/ending-break.png
var ending_break_default = "" + new URL("ending-break-BzrQ0n2i.png", import.meta.url).href;
//#endregion
//#region src/assets/ending-kill.png
var ending_kill_default = "" + new URL("ending-kill-CKOJIu6k.png", import.meta.url).href;
//#endregion
//#region src/assets/ending-throne.png
var ending_throne_default = "" + new URL("ending-throne-DcucopEt.png", import.meta.url).href;
//#endregion
//#region src/assets/freegame.png
var freegame_default = "" + new URL("freegame-DVAwPVZl.png", import.meta.url).href;
//#endregion
//#region src/assets/help.png
var help_default = "" + new URL("help-CagCDMvX.png", import.meta.url).href;
//#endregion
//#region src/assets/linked-rooks.png
var linked_rooks_default = "" + new URL("linked-rooks-Dm_TJjX3.png", import.meta.url).href;
//#endregion
//#region src/assets/loading.png
var loading_default = "" + new URL("loading-DPdvo6XR.png", import.meta.url).href;
//#endregion
//#region src/assets/logo.png
var logo_default = "" + new URL("logo-ChAK2Kni.png", import.meta.url).href;
//#endregion
//#region src/assets/millstone.png
var millstone_default = "" + new URL("millstone-3hnGnTXC.png", import.meta.url).href;
//#endregion
//#region src/assets/pieces/bone/assassin/east.png
var east_default$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB1UExURQIFCgQCBQQFBS02SSUrPTpEWBojNFVjehEUHoiEiba+yW14j5OovDsnMQICCWM3LX5JN4FaS8N/XYnY/EVPW05Wbe64jkkvMKFsUGV+h4h5ZmFZYzs6RqlaPtqnZSMmLK+hl1dDRffZiuiZbVtVUOTu9gAAAJhzy94AAAAndFJOU///////////////////////////////////////////////////AINWl9kAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAuhJREFUSEudlu16oyAQhQ+f6lojWhTdaGy31fu/xH0Gk6YFTLt7foVhXs8IIwTbfwph4LMAHM4fTDDOGYcQQh6x6SiDArSUIiPlqaRUbGNcFcRJz2WZSmQlQtvGpLhxv47IOOLBHFp/GGZZFqfFERLHHfSeZZQXBXZB7+DV9CkXYWI4vmoHr55lCfwjuNtlAERIpkH+yfCJo6piyzT42RCn2jSA/AnItcbNsASQtz8Dmb6DistnRc3+E5AKBZFUKOSzIlKegqSvQxIV6j2kyCxkl2V9D4B9zYpB+DqV8J4Suu17Ak/fgdBwrh7aUXkSUH3fWZy+A3c/WdXt745IQPT92CN4wxBkO5eVZeaG5ryT3Fr1DchAy0JcWYq8GYYJ+b5SEefBW/WcWlII2nKUpdJ8GBraGp06dnyIkfi+fSSdaVlaK9EMDQ0PQf+DHu1BY5AJIKORG0xVwR2DzLcZOFBgmGco/wgrANR4DHKAcXrReej7mR6jtRZSA6Z+WOpNHmz53nQ5YBqX4hLgwDkuAJZlWZpmqPdnhGkRyKUoXl7A6aOHGwbHabGMCfMiEPIMIYoOqCq31ysE4KL1icbSN4FHnKuNq16NQYUiSgzG1D1FIa4NQ/QrgKqI3jIck6W23e1c9bVKVFFaDG4Q9gUC6Ej0iankHZmICIv2QhckOsJlJxNcCgTavr+g/UN1dp2UNk5KgBxz2/Y9G1qNZYHsui48xL3CGNOY27e3FheJ9/cFUnWJWzUNwszzac7L9fS+ULHhUbwrCnLQXprF2nWFB1NLkwApVjewo7Wr74AulXIAOurSDzKVkgY3YALGUa0rn1R6bQ7AaToTSZ7qXxw3wBbFlUxnHIAcmCYq164rT6ccRHMJau1xHMcDz3RwUkVBnyGhK0x4N/qcMEDy59P5jMqfPDDRuXEE0v+T89nvYUV04js+BGt/FdwUX1ZpkJGlMYlD8a70FAMq51yqxJuOpq41huG7Hkw91l+S4E9K8xPmnwAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/assassin/north-east.png
var north_east_default$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABpUExURQQFBQIFCjpEWAICCQQCBSUrPS02Sa+hl214j1VjeoiEiUVPWxEUHhojNLa+yX5JNzsnMSMmLKFsUGM3LYFaS0kvMGFZY8N/XVdDRU5WbalaPuiZbe64jjs6RmV+h9qnZeTu9ltVUAAAAE7NnD4AAAAjdFJOU/////////////////////////////////////////////8AZimDlgAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAADLklEQVRIS52Wi5ajKhBFz7GFEZEB7UnSD7Vz8/8feVcVmvhIdzJTayUGUpuiXggu/yhYj8DVkFyNl7IESRR8uQ5LGGsNyfXikywm+YtVUVwnSmOMdSK3uYXc5lCzrp2d9yacUc45d2fDC9BWhW9msAyTwd+/75NL0FrGGFWnDALOBp1zKJfU2kcQKcYWEh5sQbP1czVmSkCUKO7B7WbXCxFt7CKE+ztQbL5G/JnBG/oIvLBtmvYwgdmmfO24HXhBQhJOQeWeBIlWuRVoHoCSK7RU0Gau0YfZF/saLEuEkDlrM9iEYJ1Z1P4ka1AQcAal1Cijp8DsoLVSp8aQgMw8AC9lVhOuEA6mKIqCIexc3EZVfFTQOWctwvF0OnUR4UFwtEZzKgTk4U16yxpwb3Lt48QF4YJBCO9VVVXOFvyurWT6iikYAkNwrgpVJe24wW5gTuEsztkQII5WqCq393CxVc2hZk04FwKykJXzP4KSCkm+7lAWARG7DxZV8aPFLBQuiIOyBOJnf4q4x21BTJvNpYbY9X33oafQVnbgzLUEKWD/nMVGKaSUEkh0fe9/HR+DOUIghERKiJ1/r+vjPo0rUJPZRm1JAIcDgJdjLXteaE2yW0vaQ0sBQJOa4xG+uMPtwCs3sQPp6ycsCoPG2hkNoCFH8vKygTfB0SPAWhNMMGZKjKn5xRd+rckVqEE1xgpk9BMCTcCp/6K8GZayGJV6OhpjaEIwtNZ7E6h113fIr7+bbH2U84miz8J7L0/G0+dniX4ToQ1YykXjClJB4OMD3XA+r3S36bhcJIwiPj9M27yR0RTen5c296C6KTuW+wtN+1/L7ovvo/fVkrwHSmQzKBsfBrkmkZVf2dyDGAYKeA3VVKocvR/P1xDdBdVG/lnX16uVkP48G92BuQby+xADBl/Xw6TEcRQyj3agdCLJBPlHWtN7zocxUPlxzDbvgsKmJLcW4+tVN2L8FpSggnp0XKAuvjeLfzXQqraYzCLHAJFA6Boana3OXVAkLwscYgO8HdXfrcp2YiElDvFwiBHxda+2n7mJtmdKeP1bUN1FK+z+LP8RFNEW2U4+A34n/wPtchwU+sUuxAAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/assassin/north-west.png
var north_west_default$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAByUExURQIFCi02SSUrPQQFBVVjejpEWAQCBba+ya+hl9TNtRojNL65oYh5Zjs6RhEUHoiEiWV+h35JN214j1dDRYFaS0VPWzsnMU5WbWM3LUkvMKFsUNqnZWFZY6laPiMmLFtVUAICCe64juiZbcN/XfP07wAAAFDB+CgAAAAmdFJOU/////////////////////////////////////////////////8Ap3qBvAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAADNUlEQVRIS52W63raMAyGP0lORgw4hI0YUyhlJfd/i3tkJ5TY6dZVv7CtNzrbYPimIN94CFTyzQ/55AgAERFLfvCQRRAgE4VZPkOXQFQJiyTX+XGSBVBjU+iHMYaYFzRUym2smqaJpAqRXXa2ALHebKWRiSSyhUqUYheNq1rsvgGiaRox8v/gDsCu6qJJUtAu5rUABWR2e+mEyJiKFFzMTgGmVvspvxQ02j4WSyZL8AD0vfzq5MAjuGiyBAGrKKCgMUxkndqs53ZLsBYH9NDsKMlM1gKCLEcLYA3VS2kdQQu4f4G1OGbux35NlYxklqICBJP3zMcOMcSxIopmevPlIOF4ejl7dhdxcbqsnUiZpacAX5mpP12tCxKn2VpLnEyKghM9B+taPPZ7L51F0B4yhhVMpBX5SG4BAvv9/gCrZGwea23kXILt2xI41HJQcF9p3wmRJmhkkPydgBLUzMNXYDgm5ghGSB39UC+SY/lyuXQCsAWIEwkl56o5OOB0u/3uAGa2EbQaZXk5567icrvd3sVaRVzEx9iyEcm/czbmdjuJtc6xmuHoZUTnZAGuvX/XEAVACHGqMcJ/6xyx+1ULCSF0XS+J7HU4iyDnK6labM9Xzbwcj8dksY/k35sch1UFEPoQjtCyxeD6EIK20lz1eSF0AJGqi8iYEyVDCH1OTovYFPCrw5SJJxm9nZPjbznfV0AF4xk2lYArq0WsPsjZtTOCb829WYv3z+n3qfo+hqky4KkgI4i2aUQn/gS41xH0Xke/imS8bIehAGvZbOTyYgzah8nKe40LlWeOzs5a5xGviFxe319k3dzv60iCfIw3NV7ff14OkeNFVs292USbgNeapgHLGyfvHKlldW+voyL0BWJWT3Mu71WNdnW9qm/pZOJytRIcROJkTOmOGFGhV2wM+nSg3W4nMv3JKvSKjUG2bdseHuAAou1XYhxkG/Umzeh2UYwlcBDstOTjgl1sty+AQAtq28lV99r3arVQKzbOW7Q6XFNy0s0xXvxPetlaOtkcga6bfKv1Ilj425GBErpOuk6vqvyTmWTHtQtBQtBnYsHKs+TfjS+LAG9FUJnk4Jfl2+Afic0xM2HXaRgAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/assassin/north.png
var north_default$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABsUExURQIFCgQFBSUrPS02SRojNAICCQQCBVVjeq+hl9TNtYiEiUVPW5OovLa+yW14jxEUHn5JN05WbTpEWKFsUEkvMCMmLDsnMWV+h+64jqlaPjs6RldDRWM3LWFZY/P07765odqnZcN/XeTu9gAAANCODWAAAAAkdFJOU///////////////////////////////////////////////AFgsDQ0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAA2BJREFUSEudlomS2ygQhv/mtGE3liVFVyxnPHr/d9xq0AHITm2la2SLNp/64AcNlr80lI7DEKz0bvbxBxKSTX2akPm12W+NktKyyQ9k4gYu0Ov9zln5gTy8uLqr9pE0SjH3z7+fyd2pr+4K7+P4CMigOio4bAdxveKyghwwBbcCUjvAC354f6vYEcCN/NDZpMa7r1E1TFIBvgt5gAZo26rhmCnIa/lncFnQti39rDo6gW9yzVxEaKuqInUCz30tnsXZUoWyxje5lkkQgThkCr7NtfRQRy0FeSe5SoVExtFy0JBqW4CZPCSwy3i1HOS2tG0CehVJbnhO7qAxxkAd4Cq6DVRK0bIk+R6glLKWt7tSCMFK8C4E0lVJlSN7y62HtBl4D2Btra2TbDPlwN4jKALIc5W0PvRVFgdQek8K1lqg9gFUSlmrlJW8qJBSZI3NHqK47eDtfALLgClIoakM3hhUChuIuq5rJcT7VI1shnGEAjx2MMg95vGxRkx+GMcK4SC2lvNWVm1ZYByGoU7IYx3h6Nc4EoM3QBwgFBY8xmaYU63vt7jDUcyGAwQQVoFzx7Lg0czy8hZ0HtM0BbDrOgQwXBGE1rN7JwDIem05wJEjwZdgL4BpwnrsJiDg3do2jhP6sV3bJ7d7OALFz+eT3BwXirdWsBV48IPweATycQJRh2cmXCyx65qGvx8EiD5ZyXhnfktrv5qGgu5SQ9swiZYqAF8luEDY4Su2pgSr14s4/ONnMwyHevbvV4PL88pNlBBCKN5gdQBerxeXO96aocHze93MG2hopOeveeaTCnIFoUSNNpISmkbjvf+OQfekjaZrBPlPgM8QKFnzG4VPPpYd1X3v/fc36+CodjGXy2UOvWUlMMiqWEG9LJplsJMJuBhiYWkd4DsrOjwCHHATm0bv/Y8nMjD+sIK8JyJYcaKHStH3fX8GV3FxSaGS3RKS8zqBk5O8R/Zms4r93PeJvKMVY6rhnIu7Kxr85BzrO5t3AkMeIgM5/k2d/qk7jWfnhM4OUEjnTgHPIKZJFCcooJw7TcyHNIUSszcagq98Qeag6UKvc6cGQQNd7s1H1HVVVR3bPBi6tqr4/Mq92WgF86R0G8E/pboQW1GNMZrf1sXMslnGmGwxdl/pLMH/bX8N/gfEtwgMVNrpoQAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/assassin/south-east.png
var south_east_default$7 = "data:image/png;base64,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";
//#endregion
//#region src/assets/pieces/bone/assassin/south-west.png
var south_west_default$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB4UExURQQFBQIFCgQCBS02SVVjeiUrPTpEWNTNtYiEiWV+h7a+ySMmLEVPW1tVUJOovE5WbRojNH5JNxEUHr65oW14jzsnMUkvMKlaPmM3LaFsUIh5ZoFaS4nY/Ds6RgICCe64jtqnZWFZY8N/Xa+hl1dDRfP07+Tu9gAAADFTtP0AAAAodFJOU////////////////////////////////////////////////////wC+qi4YAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAPmSURBVEhLndbrdqs4DAXgvTEi5GCKTQKB9FCStgnv/4azZMgFQme6Rv8Af9jItgyG/xlY3pgCJJf3ZrEOIxpjDLj+NMT6I5g4jkVEnh5H8zGswuBGen8eJdykT3INQuJ4+2eSt7ZMkuxZrsBIxv5mMqJJLTf5Xa5A7TDEmxSFGBfawpc2Sbj7FxihiOO3e4cSIDLvkSTJfeQrEGK33L+NdIKopPR1jae8rkATk8A+SIUOA2rvUdfPjV8gxJIqjcoAiao+NFU1W0orkKw0yLcJOug15ktwFfp2pPupR1bIlg0X11GkkDj692MF7ieIaumWUARCk/ylrwCQEyQXA32BESlk9zexgSFMh3KAH7OWCwirQ01M0Z+MMd0ITWK6uqabydUez2nf9/u+UOgcis9PL0I6fETaZg0OKDUXSd/3/ZcFRQiz/fw2sVFKQRStQzp9c2JtUfQI0Ly3ZbHf70WMMZTJvULdSKFLTY8ATdNWst+TzhLEvf0SAoCj07lwLrimhi1YWMZP7AWybaif6UIA3jeAS0qdynnZm8MI57YFRCWV1TWccwkTi8Nh1nYBZU+QUObbsTuAhuTnKct+rnJRmXZCZiPzgBNTlgAOp/6cdt1P3xih04VG3UZ1DZSirgR5OJzPOpYfIO05JEEXOOCciJQltZ7jgCxNz2atdGhp4Xnc/o3XNa5Wc6SQ5zR17lGrHpA9NHG6cgAR37a+qQF6/dYBuizy77VixfcT2KNhSoPGixFx+Dy1mqSaAylx2pUrcMB3jx6aSQvAt6122Hq/CVClyCpk18Mfwoqj6JoDUCN1aVlqezqTaj2+jfYx1Mu1O+EA3Y8UTagAtWdaNY1WOIJhjnebUd4grxdrTUukcBkLEZMIDb3fNaH4DDgUmvA8vWyCmSCvV2u3lBPBPGdhRGIjhWYYWZbpdmm1PvNrt9k9ICYXiirzHNqliMIshL6gDkfC8Xg83uHHzYXtmOV5xmIMhblegzzidNTvnjYlNNHXP7YITm9kmcKRkupyHDeXzRd6XQq3gH5eYbc3NzB8U0GVuME8v1y+dI7vLsC93T7WElNNnqV2ymmo38x3m+O8mAf46E+rlU27jjrTsc5elnf6jVNKHoEB1+3sXaB0Y32xmgAdeanl7qlJaDZgcZ7oMEeoD8JCStPnP6UxXm4M4DaZikQ0DOhsOg592Wx5rQtH/wC1ZYBU9uKWkN4jDwf37WgCw0HwIucwqr2vUZEM59LYQo+v83JkSxg6y8jb0TIO/n2ZwBc4ROMeeg6UwLfWgHm8DOElULUemP/k/Aai0jpXLf4AfgVDLN1/w3Bivs7GL+AP8Q8pIy8HoiHEkQAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/assassin/south.png
var south_default$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB+UExURQQFBQIFCgQCBSUrPTpEWAICCVVjei02SdTNtYiEiTs6RpOovL65oRojNH5JN0VPW05WbUkvMGM3LSMmLKFsUBEUHm14jzsnMVdDRcN/XYh5ZmFZY4nY/IFaS+64jqlaPuiZba+hl1tVUNqnZfP07/fZira+yeTu9mV+hwAAAAbRogkAAAAqdFJOU///////////////////////////////////////////////////////ADKo8FwAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAABB9JREFUSEudlu16ozgMhX2wAzUdfwWIQ5iQJpOZlvu/wX0kQ3DSZPbZPT9aIvRaQrYEYvqfEo+GmwQA/OX2o2FWASmVUvJ2vwA2ucMLUEgpVVmqqpodCoU3IPfIrlcJxkhVlbyhNN7qjHwKztz7ShZQWuOHWbN9BgojZYp3I2HhtINaQ74CF9J4X2GCsRbOuX9JlSpDEKdqfAWEbWNDQF6dFyA/4vs7oVVlENotQsiL+gwUHYG7HYDd+wyKEJo77glYEOgJI70TaPjy3u0RLArRddJ7ADHGRBLY6b+DQkoGGdtHKgiD8lXEIv2DlBIJRGt7ewgApyppicxxBQvO0gwDg0D1E5WN3CEElkdLQbF5BKfCkJQ6DmCu+qlQk2skEj2dd9LtzK1tUxRQyvsW9EBVpVQ/9rIeEng8lqVzVfagd8WB8tXAIKpRjeO4Gx1dIxzLHW1s5puDhYAnkkHVj+M4OgdDYCh3gCxfHTlCfCVBG6eUIwFGIoSq3En/EqTDLb2UBiCyHylRA4QgK8B5+SpVnD5OgJQU0IDbaOaMUQD2+2fFMRuc+o+PUwMkkg4o/QmB40u53++a9aSvoFToT6cTKCYTJmHMAWa/3zn3BITUGtZuMd3IhNEvMqJpnFlzzUDos6Mbc0PheLQhUI91HVk7QOthHno56I7QNQ1ANE0To7V7aqvE8XLyoqtlWuZg1AMYpJAxNSOd327uKNrksrzluoCoB7hmdgFTixr6w8vVurzN5Bs4nIdlaeqIsLVt27Zbqo61lgYVUKuU0h2IwRjs6b4xiDHQKaK2Rvurba2NTCqdCryCtPsAd7ng/cPWUkgK2Fr7VjOodnowaK5XsYAA+rEHJ2SMp/2CEIIHQBBa6rQjSYfr2wLi1+8Nxh6Whr3xXtGuz5kiWGiq8QScylJK/PhxpsQYjHHs0du0Kg8XLztFoESw9hyBSD1A7wR5OBwWcEJsGssBAdk0DYFSei953mWikEIQNBcHOydTQHm5XJoGBHF70hkl4Xi9njFyWqQ54vWPcxVFJO5yIRDee18xyJbj+fom2q2Y51wGgl6EiaNcE0fgvNbl7SweugOff9wXPeCUvOiQccj0EpltFy7KM5AesWmaS6qOB4jNTN/GIz4/Ezeh5lKQCzzXmKvKtvyT4wbOASfUmqvObckpePpB0t/BNeCEutZa19wD/HoRgmzJ+AR0C8hedZ09TMHtxMYVIok8IDvJeQ4kFdMk6u5+MRaBX18rSC/IRx+Irtb5Nw4pgTcjjYfhbtSTj3F6niqZkcCVuxy5hPc+BY3/w7fiCLFYNgI4XEJH3X7nE+P+8LjeMnNo4WitxSFQ096p2MS9iK29+9LNwE3gcTZ/XuQSEbTo0lHJll0G0sMXdFKa0PFFRB5N38Ox0q0X4H/TP75QKPBdbNqkAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/assassin/west.png
var west_default$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB1UExURQIFCgQFBS02SRojNAQCBREUHlVjejpEWLa+ySUrPQICCUVPW9TNtU5WbZOovIh5Zm14j4iEia+hl35JNyMmLDsnMWM3Le64juiZbYFaS9qnZaFsUFdDRcN/Xb65oUkvMKlaPjs6RmFZY/P07+Tu9mV+hwAAAEN3HKIAAAAndFJOU///////////////////////////////////////////////////AINWl9kAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAxlJREFUSEudlu12oyAQhl8+hEV0I0XNtm5CjY33f4l7Bk2bIKa7+/7ICZN5mAGGIZj/U0gNnwJYarpXHmQAOOfiCZoDZcEViXOxHzUDQkdsIYVMf161BbGE+3GLGY1SAo9TbEDcwpGMEaIkq7SoHtNOQVb/vIVbwegBi+pg4hyrNqBoiCTmDgSsQ/VyH3IDmtIupDIkQSQ8rNbAvfMWBFbyE2zhPbS29mmqBl2LL5JAwPddh8d9zYDet81nsgR6D3Rd4pkFASVWEAKt7yhe4piOaY0kS2VgjCnQ9dtw+6CJ9WPWWYrUKwNKieMvzjm44twAStFn6pUHX4/HI6dbxanc34bfmRVmQWuP2oDzArU6DXFnsdb6nTaGuTy7owU4YIdTxxtlrcFasndKx/PMCq0ZccMwMN00TUMk+DfnSNmihFk4XjdA06i61jy5kBlwZlRm3vfM6BqKL0cCCKy1GifIgZKq0zMIoYFaqSJipFKSolMOnCVxhYDRlDM8ZjCaRwiUK5cHEQITRgCFsaYeBnKSK3rrXjsgCjo/IFbD8T16UcPCbZ07IATVd1EAhm7Y5hDzoAR+U1bELTfFZrwyJnbCGEJEAlrnnMqUagYEAiPMex/QUlR3MRm3ZAhME2Ph7XQ6EQjUtYb5BoyUtRY9G7yvvKcGVTfa4BkI4OPjw5IAxhzcsjN1vCiPUPS/fbl8NA31zuv1GhfoOorI3UudbQB3EZvrVS/UzND7c++XiLXOHeMXyLBS64MMlMC7UsvXBybqbjKUtwEDPRRgTikVb2Im242BJFHjPIF6nLpeDc7TNKWO6TiKwGmapvPp7e04GOKq1DEdRy0Rp+rMhn54l4dzVb2ky8yCM4Hn6tCywTMPxg6Hw9+BMysZA5Xasi2SlX8JyrkE2rZtM/u5aMcs5xkjhXN2zLvkrSSMo3NuHP8RpOIZSf+YKgu9oNs4bh+NVTvmEDwCcDEi23D2QQTqOgHO2Z1c89b48AA4AMi8/6S8lYTuFZcL/eFIf4nKW2Oy3nsQmNbMoidgCKFH7vmP2jHfusAe9gT8Tn8AJ5VR3EWlDwoAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/bishop/east.png
var east_default$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABaUExURQUDBgIGCjUrKVBANVg/OmNSQkM4L4NqVMKQaHRfSwUFBUpCMJd3WEAsKqmQbSskJCEZIzIhJjcdI1gXH0ETGCkWHzEYKnIkJN9jW3JORoFYTWcQJ04YOQAAAH2HiEQAAAAedFJOU///////////////////////////////////////AOwYHF4AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAoFJREFUSEut1uuSoyAQBWAO2I1tAjTJ6t7G93/NrdZszQzBGWdrz6+U+FUjkFa3/mNce+Fs/id0sLRX2zxD+BAG4s9sCx04jqMQETNcO/omzdDkL9dRJCUisaLHVRto9ch7n5gZebzyoXwPJ1zG5HcIuo5jDEeygSUa86qaQCIfyHdwAlk9VUDBzCJjjgezfQsnItqZZYPXw8d8B2u93Srg1tVNUOUgcbxO965spoqNbT9LIJKY3T19Dl/joLUkInJ3qefh5LDBlL7dRWr3GPSg03me9xValqXWWjq0C2cLi53YnDPVUvRJ9uA6mWMeaE8IoZyDK4BSylbPcjk51XXFsuzP+Eg7/hGst1orvlvpnjuGt5RSwg8gxi/AaVmWJaUUS/l5HX/1ZB+uwDJ7k+MY4c/D7dDCp0TxGuP5xZlUtRSgpr3ztOOWHpxUPQ0hAN72//S/Y1Jv/wsKAiAM+QuQyHMWCeVw+3vQKeBzTMIXhqo+n+8tfQjknMQTSHw6fXIcrF/57D0hQ9L5DgDlUuC3F08GvgIH8tuyXC7Iub86XWi7YfJCkRRyHvq9YiUahsF3j2oP7gcVUO9/v1hrPw0L5SwFqi8vto1d14WqHPnxBgG+UFE1RD9DfYwxcKc1WnoQgSJVqIYQ2M5re4elA1drjX8nCjtG7Q2WLrQnY6CEcGHm5Tz0LFGAEKMIL8vck10IzwNtzbyUWmvtyQ6c1Pbeo5QkRUPg+XYKWqfaVkWKiL1weD5X0QpaRKQIhX2F25u60L4bFGAiWKfb3q7P8hmafA0zp7Q8vije5vnK6qa51hBU1T4h+aAjd+DqNmjZWDu8pwcf38iPtIOPdOGZ/DP8A8PaFy7geQw6AAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/bishop/north-east.png
var north_east_default$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABIUExURQUDBgIGCkM4L0pCMDUrKWNSQnRfS6mQbZd3WEAsKgUFBVBANcKQaCskJDIhJiEZI4NqVGcQJzEYKlg/OikWH3JORjcdIwAAAERM4kIAAAAYdFJOU///////////////////////////////AM0TLuoAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAmpJREFUSEut1m2TozAIAGBBICpN8KrX/v9/ekNsd2cN3mV3jumnyDN5Jx2eP4zh3NAb/xcO4HFu/RoRBEQcEf9OAwjEkiaReQY+f/uMFi6kfGNCZKX5utMGDkByk5xzZkYol7KBC+AtHVAA6VI2ELJIdWDGwuVKhlDdgYGIaKFYtpCmqTqwrCJCnXDBVdCsnoDRocw5lGc4QCnVmdmILCLYB1/HrUocmWWk+AQ10KdpRqqOaZ4Jfn0DkqqKpPTu/ZxxAReXaxL2mOfZLJARfD69F0kejFW2aW2LB9zfg3xFm9a2eMD9M+IpXkJE9Bkilvv34P2H8BirQx/r+bNHBJe6Hi5LKXe498IFDIzoc0ntnOHRwsUsA82IiEAyUbT7F5AgO2QgJl2p83YshhkykddVydOqk4YygOaQNwTILOlGXg/OWQH0SwX7PouA5m21NSXuhESwl8ICc8Y8JfOydU6KoO+iQ0bALLXaRUeghV47zCEBqbstrHMNHHyOZsTMABkgK/dBWGuhIhRhPzYk0glzmsCPHDP77GjkaIoR9I4sE6kedRnSFsgAbsfJNiLfCUlp7drHofwu/ia/b4aphKvTwppOhLKuo791KOEFaeAT9tqVX6v62BkZdsFlB/K7+B6rv8zBurbw6b14tUEkOh68x94HzcNfONk2g8L8ePTAxchYKvaAsm1zJ7RN0E+cSVYD2/dgpCFcuMLsv2OS55wQPqGuqoiJZOU63HNKCJfaCSLaqAp+7Dp7HMBQPrbRy0E0xQAefzt9rOJnx/Y9/HMVwfogq6oi5jrSKClqq/Ex0vOHV1zCf8WP4R96Wd2+tKUH0gAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/bishop/north-west.png
var north_west_default$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABIUExURQIGCkM4LzUrKVBANXRfS6mQbWNSQiskJEpCMMKQaCEZIzIhJgUFBUAsKlgXHykWH4NqVAUDBjEYKpd3WFg/OnJORjcdIwAAAHjQlIMAAAAYdFJOU///////////////////////////////AM0TLuoAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAodJREFUSEu1lm1v2zAMhE8kLTpUPDlOG///fzqQTrvBYrG0wO5LkMs9oV5pY/+hcDZe1X8CETq7odx9CiWUZlLzEEAsMonULJR5h6BzraXUi1RKUol1CKa1kinJpWaDTawQWkOtZqpyudRkgUYnhNaqQAFVFREdY6PjCk4EBlNlkWSSo+NCIxFhGGBE08vgVZ0TZt9+aywyxkYndmIRkcqsZgCatjE2Om6i1BqgV8xPXWLtO36BqMQ4mb3oOfAFeBxtTNPkVZ08J3Lwar0tXF0yrfPLFW99WZaFZXLFup4TodG93Z5DfWobI67UBfq2bVvv8ZFGvgC3bSu+I1JK+Qno9/FbFa/YtlZEWow0jeQgeu+9NeeOBToHvgT/iAj5RibWjr6sUqGFSimLk8nZGZ0dbVkLEWOevTkSQC91ALR2f7vfSRgHaKAylhyN3s3kIqs6WCupgmxsAaPR6zRNJO9a4TupZOnyDMatA7jfiZUdbKrmS3uOjeA17jyJ0gG27v80xEZwh1Y1KFd8F6TqvcY0pkjUuzfmITcYDnpJQIOjaFbrkBuM3UfooFGAZtBpGk/AaPB0nFIjVzRW1FcOAK3TtPokiSiG/DJYJXrpIRYytPdlzA2GUYBW1nVdef4oOuQGY1G/RjBlZqaDegyxAbwC7/JRBYj3jpdAPB6eNzNiLt6xYr6nVA7W6pf+TdZ1FTHXORTB8/fHYwnwKZVqyTUewehwCjNmFfHGKj7YcyoBo8WZiZK/bkgp8Q5xDmXg7uOsVdcnOHO2NinoN0MLozDP/lzuPUudjZjl5zb620B5FbzFA4DimRwNMptiCt6A3pqfOJ6j6jnhSs2/nh7nHz719S//0I/B39vV1excxm6SAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/bishop/north.png
var north_default$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABLUExURQUDBgIGCkM4LzUrKWNSQoNqVHRfSzIhJlBANcKQaAUFBTEYKkAsKpd3WCskJCEZIykWH1g/OqmQbUETGFgXH0pCMHJORjcdIwAAAHSnTvsAAAAZdFJOU////////////////////////////////wABNAq3AAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAJqSURBVEhLtdZhk+IgDAbghoQQW0ywe+75/3/pTWC92yJ1qzP3zvihyDMQQOp0ezNT33A0/wNOAH3Tt+zCCULAJ3IPToAU+Yncg5CETpzSrtyB84ISTyxvwEzndyBUGGV/rs8hAuztyRjOM6QvqC/BySBRPEUA0DKWYzgbgMbqXoJ+aszLAwuhjKscwGkGMEQrpZQQtIzXZwSXpY52z7KMZjuCJRGhtaiKHIU3SFRzuVyIROToVG+3zUzHJe7AZZPjcFqWnHNGxBDC69DLfBHO4LJB35v+e88ATnXvloSeVPfU+j4jCIC0WVMkHQzawwlEVSPoPSCrijzSDs6qGaOu57sEW5WiioZObuGkqjnKqmcI7fQA6fkU6AjksEYN/yDG84X1J2iEyixKDj+YfUQhVqX+CulqrGsod/jBDEhJBq6HM4CSYnW/PogIAQklPF5a/YhqADkgCBFViICY/O55CmfvUDfdoR86xNqgV4BuOTYPuLbDYohYFzUg1ksZAOJ2yA2cF1pX1gqbC4hmANd1XbuXQQcDB+9ohphdufNnJHoOucE+DrvV6aBfbL42SBw9zDl7Q23/3rWHn591vHorekKoNYLZZ3fmtmvcT3GTTc8eMufSSiIyCz6oT7Lk2O3GwyHP+XerqJYYmWrRJefnI/pZdSd+DbTY9WuZtx17WOs0EWbl+tG2QX2nIbSUmI1PkZiZjQSPwdlSuhhzbJDAN6TvNICzv0gV0FdUg/+fA4DBe+4BTiX9/UG0IJaDMJVLm2WL2SHob4CiIYhLvvqZe9yLIfw6eV9HdbCDLUPouVfYt9+zC3/K2/APfWHdHoLI/OQAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/bishop/south-east.png
var south_east_default$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABdUExURQIGCkM4LzUrKWNSQlBANXRfSyskJAUFBTIhJkpCMCEZI8KQaEAsKikWH99jWzEYKlg/OtRKSTcdIwUDBoNqVFgXH0ETGKmQbZd3WHIkJHJORoFYTWcQJ04YOQAAAL64uyMAAAAfdFJOU////////////////////////////////////////wDNGXYQAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAL0SURBVEhLnVbRktsgDFwkEFgxZzchsS9t8/+f2ZGT3kyw7nLtPoXVbgRIBnD7T6AnvgvfiA09+wQ3irDhS6sXAwVmjimKF33ACeUyhMCUmJm0D37AMaIMqlKYv1ynEwGpKkpBOqTRid/hBEAAakXg9IbiCDbs+Vyo2iSnMKe3HzjuFRv29KmUzTeV2NqPM3DqFRv2xtvpdMpAKWVurZ3xSU181ra2DNza5YLip/zEiFpK4HS5pM9SuqQZj2XMl/OSzlBX45I5ox4rzq21FNTvAo88VVTgfN46lhTqrdIz5qqq4ziWqYhItD7qJb7xBhEhonVZlkYUxHPuGQMk8gcSk6NyKJssICEsG2Zx6+Fxt1ueJmu7fD9CXI1LmnHC+ztUgfO/GDFNR7y95RjxdvFTelzOwHS8AtwOP4HgNp1DZSsc6phSauvhesQ24161I8wnIUBLSWuagRFcStlVsh+bLwxDjCglPTb1WtJYe2E/zioyJObDiBJT4iCAlOVa+sNnb4wppqXFEdCQFjOG9ee1zK+MgK6xzUnCY6LAtdbrtRf2463bDmOLNEDvgMZ53m1rP7bNAa0UKQIpxRgw2T/sdHtCgiAwMWQBUqzn6ej1654QDgoRBbAskPfj8Qiyw73TPQ/tAuCtBqDUFIs135ZxfWkE7EpVnWc7cuz3lrv/mLthzrosplSiX7/MKJZdlftG743Wz2skqP7+PYmYLTTgO8a4stXuo/xsM5DGXxtVVcat6BRTa42j0KPXn4W98QbldbU+VYoGgtidPtKLzXl8xU8QYhBeGbdyRLWMY7CUA1ZiWAt0uuehXYwxbdvIrbUWoyrad9Z4Q6XItkZVq8YwiNiZ08v2xhtqNekYknBKwzAE3p84ntFWWXWUdCBOKYQhRNlN1DVmy6nctowhBO9r9Iy5bs8cCkHuT0ibwV62Z3Kt9gn+BTGX4ryS9kyuhlLulyMRkXp3+d54O51gr5XyaDmnhgaPu+/sA33kLz4NvMJ/G/8Amv4PO+ZJtHwAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/bishop/south-west.png
var south_west_default$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABdUExURQIGCkM4LwUDBjUrKWNSQnRfS0pCMAUFBSskJEAsKiEZI8KQaINqVNRKSVgXHzIhJlBANSkWHzEYKkETGKmQbZd3WHIkJDcdI1g/Ot9jW1cxLXJORmcQJ4FYTQAAAOaFLeAAAAAfdFJOU////////////////////////////////////////wDNGXYQAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAALiSURBVEhLnZbhcuMqDIWPjGTLCg3g2DfZ7m7f/zF3RNreWaCTdM8fDyf6IoEFGG//KLTGs3oEwtWarqH5KYCqBlED61MTAjOL0DyIGlgfWpSZOYQgo5S986EFQAVXEsLU/vwVOC12OkVoUFVdY5+yM+6aFuCFmWCAqfLT4ILzS2Si5G/DLEtHtuO7JsNLjEwp3cmSY24ix+BiiDEyV/AN2LZtewaczHC5RF/S5AGj9mnHVZPhvJ8vDnaZPjS0FweP8wXfBYEL+xzPPru+yqqBOcFQyNuNzmf4oGubMbiYZdVSSkopBDMrg6ABuJh5r+z7vrNzSfuYITiZeZmfsj7ENXAXqEZP6Bn1i7UZge8v/F1pOMMvwQIz4D9cr9dvgIsjN8aPH98DF8Mr0ukQIKTrddCnrs6bYBuuiKcoIj/rtrLRwrbWspUtiUeLxDUVPyBtRLYOtnTcdy+80gIhWlfrq22MZbv+vDmomZlXIJz8mdTafm1A3K63I0RAZWfypMI7r4P+6cb8utrNDzefJ4iCUD4G/dONbV0ZUKuCc6dj9EZ6w+PBlJkzkJUkqhfQxXUGgCLIHAUJyhoVunZTbMEJCAEbBMyWRBFCgDL3e7Jd1TqfbcOB15tI9lWxG3N4COqxK/CLCMgiks1g4YnFgbKvzWbrSoDNs4/gW7q96MagL62q1idMuD6byGZ4+633lw+A9toERjF6yU3k38P3U8MCRdHdl9jgyTuuBRFCrqUSkfJxLzXvR34IKkLdua6Z+KPqhxmX4GtvmWaagbD7XR6yb5O/4zqwztHbe55jRFx3b1MRetg5fsT51UGzf25gr1XPWZ8A35BelchvK637C/C/aKNGYCnhDlI8ZfLzpp/hCHzzL5tAIqISxVbzu7WNGYFL8RSe1Cuuh0gZXK09OJXiwKe2rWyDa6B3JpSUyI8O5pxSKlspgy+I3qnHAJBd6f3TahA1sO76v9b2l7u+sB/rn8E/slcNTDQmOc8AAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/bishop/south.png
var south_default$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABgUExURQIGCgUDBjUrKUM4L2NSQiskJINqVCEZIzIhJsKQaEAsKkETGNRKSTcdIykWH3RfS1gXHwUFBVBANWcQJ6mQbVg/OjEYKnIkJN9jW3JORoFYTVcxLZd3WEpCME4YOQAAAAKZM7QAAAAgdFJOU/////////////////////////////////////////8AXFwb7QAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAAC7ElEQVRIS52W63LjIAyFj3UBSrYmpti7aeLN+7/ljnA7syakTXr+caxvBEgRwfWHQms8qi9BVLXupju2aQARM3M/pO+aBpAIidwhu2aVcUYqay+o51VBxQkJ9GkQSk5IAe3uteeZ4ANeDFTgOTDK4ZfUjMBrJ6pjmTBGSb+OUgv5+iTo3NGYOz3Q867XaRxF3OFw6Gcz9W2MLHI4uPxmKduvVXfckQXH4vIb4O+EtIZtdMI44uicEw7wD59x8BiBY7SO4xAAjEMb0wUn8p5misuyLCFwCDp2ojrW5MkTkZRSioQQQuwds2NdofWH8Sl9vMmtwWvCImRN13439c1lGxqbeie8Cy44At4Dv/H6LPgHMeLPM+A0AcsJ0Jd3Ak5WyE7UrTXYDhFmpy/v2Z0JQOyQrTPAe2YjnQOyM45ivEWb9WQYFwO3KyUglBhjbIu5Xw6eWUSykcR1pgIlxkuMXvcN24KJ5SI5JQBc5JOj99j2XbsBKpxWybkWsZaS44Uu7/HURu6XUyUzzYjRV4HD+Xw6ndrbaZYDwBci8UBKOecMqGgw7msQdQBnAgqSHTUE6DyH2wnSXI4y1xG8sJFzCHMdAdB1xRe3OthDUcklZxTgPG+grqtiT+7ASQuwZVwWe1Ixz3NdK1D2T8geDFqs9gDe/q71NYavIErx+97ZL4IIk7UnFq+bajZVTek7cKt7Lb+1jxNLqXNq3tcGZPYeV3gfOTnnVi0eCqsSyxfghFArbTk558yq1rTVSM3Q2i9e58D+/50i1X6HcvtX4Ba0m/SiOX9cDQkB/D0ItoQ+pZTs0UEhe5bZWvY+eEWgutEt3VaOsu28nef71XWyoeFzTkm38W/F+DjyPrJZmjOGcEo+vTgRyillf7QStbp1JoQw69lOKOLWlLK9rW1UF7Qu88q8ruu6Xe1D4DCO42cVN5nRRvVAP4ZAOed6O5TzOI7LbditYz9nkJE5Z6Ks/X8PHcvcvdrPpq75iH4M/gNw1A3tB1rq0AAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/bishop/west.png
var west_default$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABXUExURQIGCgUDBkAsKmNSQlg/OkM4LzUrKUpCMHRfS8KQaINqVFBANZd3WCskJCEZIwUFBVgXHzIhJjcdI0ETGCkWH6mQbTEYKnIkJIFYTd9jW3JORlcxLQAAAD/jNfsAAAAddFJOU/////////////////////////////////////8AWYbnagAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAACjklEQVRIS7WW65KbMAyFDwgJX7AJKbDtlvd/zo5MdndiREt2pudfTvSNbFmywfZNoTau6r+B2FXb/wAboKWu67g9hh2dTwHSExE570N7SFr//lSDSCAiZiHnhy5VkWcgZBi8BzOziLB3fA1sJAzeEykpIkKeroEIwQ9EESnnXMhQrdUGRw7eu56ZkbGjzj3XxwbBgw87qFLUOXparQmONww+UM85l8MHME33+/0CeGuGUI7isb7m0D8miMndGj1DSdkMOAGBybnbDxFJSRONdYDqCDZIadIt7e09z/NskQewySkxLcuiXdqnScGmDjJBiZ22tkobbp7nQ4zqaAJx2UUkIuYwmuDn8O6aVivEBjck4A33UqLnY/+S5eJnAH6hbdv2fp+vZ8S7Dy7noKCWxgg5AX83Oht/5yxwQxiGQG2rFT0rqgluQBqobfeBOulW00VH5FogUYw6WvX/KttcKCqnLeRiqi+4PaY2ivbNkaMlpkgmaVg6ybq1zBwkLJJgLdawtm1cJ+pA4mRZSm5jPEywWckBJLKIFtY8EcvbxhW494gkQGJrh2cgbjcXyyKF4kvgGzmnjSNEJGaMaY4ZsRD6PsorGXOPrPP/GGajqDa4AQuQUkYKy0BmSsvbmrwoqU3eBjYb5wwkBgJnzBxe6dURbgF0Lqb3QPGFBgDy8CiM7rT+X2WZI2YE3+pdp8+VmdAG53VF9IgABcfp6nEop5eUPlVErA9WHXICrivznDqXCCmlpPNRx9jgPDFH51wq7VourONij+A4YprKV0Z0LunnSsY1cJo0T98jxphKQqtbj2CDWT6+Uz505AxQW5yZe6Kcc4zlUa8jTsByPcaHTrgT8Plxrf8rst0L+jb4B4i5DckMnwuMAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/guardian/east.png
var east_default$5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABXUExURQIJBwQFBQICAmBpee319AEGCdzJpRsiLys0RrnFzkBQXJajrs/f5Vs7JkRKYaZcIiQgOHqIl/TpzI9zUr6nhnJUOMiRXqmPb3QvF6BEGzElL1gfFgAAACC+9b0AAAAddFJOU/////////////////////////////////////8AWYbnagAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAAC0UlEQVRIS53W7bKjIAwG4LzyFUVo1FKh9f6vcwf37M6u4o5n86+QZ4imoaXtP4OOC7+DCMelP6MNO9o2Uhpkjju/ow2N3QDHvVaXsg1h4Qblve/Hq3ovYAA553yMjyt5Ba0FgURN3LdTmquEEOxsF4Bk4PZjNiBRTyGEp7U2AcSmO2bUOEGQfvUeIYRltXZNZPItSEp7pYQICIu182xxq1REXSbFFEeFVIudZxv+TvmKAyRfggjGkQUhWTvbeZ6bDTnBSQS9GphCWIBnhbYlj6WqKJhiNAYhLAldV6tNfyftcYJKKDKxQQpLIoOU2kce3yqUU46MqWKxCwG12OdZHqFRTpFxzhBCWm1Ky9x+yiPcwGYYQYaAlNbnc3+zd+A2wDyUCEWEtCxfcD1mnSERwenomRXCsti09/J85BF2QRcHV0rPXFvyxDpjxvntHOEGqJ5L0dqLqs+JZDHTKe0MOzg3lbH4LEKODEId6fOAnCCcK1PRXu3QEVKyrYvyCDtWhdl7r1gycub6XW8ceIIQ1uM4DlxdVN4rpGPOHqfFDgC8zu834Iof+6FVaAPWywNAfgPMvh8fmW9COOdcPfb9jmqa8kduws65WCmROObPB03Xhq6O1h6fD7UPbEAQwbD5Cal+ajTjDDuw6jXRL0gl34QsnHoN+uRcHsj5ldGUR7ghc/F+otoUyjnbjHQPIseiV4jIu97nBWj+eJyhjlx8gYgvJUPEtftxglvtfZlIlNcFyHK/HZ93nHTVrwrzbdiBOQJqxAuOvgHrfNA6DtbSDvM3IBc1AQtWwrdgHcmx3lR2H7DbsN7mDEvP2dZOtF0bdsAK2Gdqt3CPJvx5f6QE5Pb+JdwgwuKQacRFxsUyRKJyhJge7b8A/4Ilg0TC59bfla/oILnOPpmL2biEApDqh/buHu2tTgRxerzG635cwA4Q+Qw+tOu8hDXq+MN888Qb8QNjNg++gcfbVAAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/guardian/north-east.png
var north_east_default$5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABaUExURQICAgQFBXqIl0RKYSs0Rr6nhgIJB8/f5WBpeRsiL5ajru319Fs7JtzJpSQgOLnFzo9zUqmPbz0nG0BQXKZcIqBEG/TpzHQvF3JUOMiRXjElL1gfFgEGCQAAACTMUGAAAAAedFJOU///////////////////////////////////////AOwYHF4AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAxhJREFUSEudlo2SqyAMhTkQC0GlP8jS1ev7v+adYHemRVr33jPTjqP5epIYoGr9T6n6xrMU3j9uP1FY1xXQ2pBctdQG0Z0snDVg378h34CDLtwAcrZNvgEdfM+MYVRB/wOoAGcDsRqGEaEZ0gYB+MCstBq6Ee3+tED0OIEZZ6OGy/XW5Nqg9z6eYL0hXC6XW/28qA32XgtNhGG4jE3LBgh3mRyzT0SIwPg11BGiGsxqheu9Q28dBTjcxq+vlmUNIimlvQuwiRmOGffxq5XsDowTkqfT2WcGjAxBNx6CiArskSfCWcyYxfHeAXuyAu1wNgU0YiYcFNB9H4Ar2M5Z5RQQBHzITkeOK6b8DaicF5DkybDIdI6NXF9TdddlQQjIWZwkWUpdTwycnuNEr+CyCMgMBSZDDE/XlBKn1OfKswJnooI4F3QkZPLWpuTPOtS51o6kwaRJB6NJQDMle3Z8UOOqFDkwedJBF7DLWSfvBj4AS/eLIxXHhXJ2PpKxsSZfUy3vjmcKmogCAbQQSZ28s6xBYoR5LonO84w5xsk7AH+e40TVyAmo5nl2Gzhvo7P329W4zdk8k3fCzSzUiY5BGRIoqGD8BsqkG3IHYF/WApzUSiRm2xIh2p8+LzdOBoB8iij8VMiEnedrc4yBYagy4gBCKCwzeqota9AIiCXnlLYlAvm27tAxRoCAnL/HdEPOQkdvrFueA2tQDKU4SG9TkkZt1ZJNH5fViiB9JeSy20DmTuoMwac616pmXIA7cmaWJOUQ2EDnfX4NrcEOmJ7AFEMIJxgn5/NLZN1lKUnlWxZQXb0XMICcDPpLYA2KZJsrYOp8zLLllXp/AXLpTlb5O23v8gqKvwEJ+XZ7LClItwZF/hiUJaIg722b8ssdQ0d9NectsISX35cxvV/LPHwcuU3bcnhcEsfdPlXUBs3DMBD51vJ/Axo2pcQVIZi6KT9qgTLm20yrYHTYbXBFLZBIhr1cBkOcsd843oDx56xAMCbDT8s+3QYoy/BxWd6/oVvjb1kDfNJ2oqtWrvs7zyp7QH1z02fwg/4b/AttaASoPscz0QAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/guardian/north-west.png
var north_west_default$5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABaUExURQQFBQICAhsiL2BpeUBQXHqIlwIJB+319Cs0RrnFzs/f5dzJpb6nhiQgOJajrnJUOKmPb1s7Jo9zUvTpzHQvF6BEG0RKYaZcIsiRXgEGCT0nG1gfFjElLwAAACs6rlMAAAAedFJOU///////////////////////////////////////AOwYHF4AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAA1xJREFUSEudlu16mzAMhY/lDwTUJk2F6Qrc/23ukWk7cCDdpj/FynkrW5IFWP/TUDu+DICpfXu7AEHW+VB+vFLUjmJoLMCtRQf0F5LaoYaO6QWR2gRvh1PJBWgZNxBR45FeTyUXYET/CkSizjKd5+gUJPTDKzyIOOFUcQFiuA9gmxAJCM25pnao4T68gjm1gG9TOtfUDvXdhsEQs0/G+dR4S7XiCnzrwYgkqWXr30Z7Kqod64r+rQcsiGzXsb011qwYa2G93gLeQZxBbnyJ7DsLM0pdlEcQfd8PWn0QjQ1Fnjzyu6nLclwahID+PnyBnIh4ErRscuMO2gqUN8bNGHyClH8VMKem5aO02oCRqTEmMIoRZZBMYuTDduYpCGPbLKEBxRhLWBGBwfvHOIWjcr8IMCHaph/ZIzJHjSqCGDE76Y/l3C/QTI3wOI4tJwVt1l4FOIJmjbzTHiNCfNuNXdcmCJhz4uwzMkc4nnl+AiLG1I9pch+zhvSevePEMVjm+Qm4xjj6LnmRd9nA6G1MvMAyVx1w/C+5yS4nK7IAC7O37G20y7JVZy+tQOamsawGWspfnyNvINGTrcIYk2+j7osWJbPnZVGQ+Sm4gshsTbMU0BZQS+LoWa+CyGm7bOCyaHqUW7fmPUj3C5387Lb2Ljv0lmMIP4MA6Vl+qaqEZQ7aPPqLMaC01+6eDTeahAC9lRqDtwcFHXSaXIBwtkEg3VgIsbQ4gKBNCof5Ne+0R1CSTSGYFbLdC5lEe7uc0SJfg8N7IstYDeZZxMjUT/IBsJ6X8yVoZjupxugF1GzIWCoKZhgw8+Em70DdaSbAI8YYndtGjwjyNkmOQ2cP2sZmLYNykpIeUkgPaXUH96rku0fkElG5nNL0B7xpgl6OI3kPsm5uLYnJKY1/wOnxVh3B7bZqIeZ+LOBSwLMPlz3oEmPQmn2aLCU3ODbpl3r36DqHF6zQFwCC1mWr/0/gaoAXPeTnq0MLpFkhPt7EzaoclzMquCWjNEB9oT6ltaPchN1Q+wdwBSfmLzHgqHpRbf7aUUD7DUJQT5vNTlyloN8BBdqpteQE1CE3sovfOwW+F3t7cEFaEnLf+TCgvwJNXLLNh9bEw4dD8dYOY4xB5HjSngd7AIv99EF+Cf6F/Tf4Gyvy+mP+p1lbAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/guardian/north.png
var north_default$5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABXUExURQICAgQFBWBpeQIJB9zJpe319M/f5ZajrqZcInJUOEBQXFs7JnqIl0RKYbnFzj0nGxsiLyQgOCs0RqBEG8iRXgEGCXQvFzElL1gfFr6nho9zUqmPbwAAAJQreLIAAAAddFJOU/////////////////////////////////////8AWYbnagAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAADVklEQVRIS72WwXbjIAxFeThYCYUEiVa4Hf//d84RTlo7cXraWczbFBC3soQEcfM/yt0vrPSd7Ymxr8IPfYx7a9cueMA8Y0YAMM6w2aP2QBzcDAIdTyD8CjxhQAQFjwjg9HPwZQQiUkjIGM4vvwA9hohEBA/4y89BeBAWEfx+WnfBDKJSEnlmIsQfg3NGoFIoUObzr0AwhSIUqudARe7NXc/AyolCSnwk6fVjFbHRBkRdpih+LJ7GRBwSL8TNdtNm5nJwVptwQsjpNQnOAszOKsk/BTHP7nwG8vAGTij1VRmeHSBADeUZ2I+Og4LwZhVXasoMD2eHqaEMCbRiv4ZOggw6EhMGA4p45cGDASp1jO0tyCpB60/FWGkkTmBmoKgqw8YlFxrpGMo6sWtwqjWM52O1zSKAApLtn1R/HkOtOl1PZguCpI7jMU0XMOfshQHxIsy4aKrjWL0PXz5XYJCcao2iYJGUhHP/I4zYck3Vt5D3wBlVvFd9ndCkI6lzwphINSWpK4cbMJCI6gULGCWJTyKtYbqoivgRb7vgDBxPsTVwM4cGxpQ6KCJ6THiSVbsJEWVCaa2JsCQpYh4Zk3jr6s3e9QR2CA7cwSaUi7RmoIn9UxAiUq5ga81TvI4AFBH/rABmpA469N0sRAsIzAZKegJ2Y28iI8ESI2NobbDgunHtcgNmGWzunIXEHIV5GIbBtgOD5KdgKWVJnRVdT4kwL7uxWPfA/sbAisqq+0sOalZvn7Ffq0zxCmJSqL5DD2qDHmME4rohV2CKDv2srHcVVrQfOlm4fdEDQrsgZbv7e4AidmMs6o31LRhym/pXMYv3llbmovBxAXGZZD9GywM+sICAamFlRYrMbG9m1x6Yi3P2/DpmJaiq3ToK0n4FHeyrl18FDyDwYs/vNLGv5rCTjjz3FOFlScEDOLv3P/3Zdk71AKPYPNqRWIwnnN53C8C68aMH0TO6YAZdI8OfTUeuu+P2IsEqDwYW7aV2Xd5s3YJdFqwD3Ke/u95ftAcmEfdVAJD1uX9qD9x0njXi3mO+B24a6L6dbtoD460tl2kp61fqpkfQQTYuOvhI7oPrjb8At/lf8rve0fUIwsvSure5NcvjtscV6y+sK9E8ru3X5fuFn+r/g38BP0H5oPpucpEAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/guardian/south-east.png
var south_east_default$5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABXUExURQQFBQICAgIJB0RKYdzJpRsiL3qIl5ajrqmPbys0RiQgOLnFzls7JvTpzEBQXO319GBpeb6nho9zUs/f5XJUOD0nG1gfFqBEG3QvFzElL6ZcIgEGCQAAAExYYRkAAAAddFJOU/////////////////////////////////////8AWYbnagAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAAD1ElEQVRIS52W4bqjKAyGPyMRQ1FRqGBP7/869wk9M0etnZ3d/Ggh5H0gIQni+T8FZ8VO8MfFs0KlofpHrf5/wC+1ZPSHuLP0fFLfnNdVLkEYPEksu5ulJ5lrm7NCBX4A8WidTIH+A0jk54GIxcpk278HEeC9GUDkrNxG6i9srkCiQN77xfREIlawvNtcgYiBGd773ixE3Aq9mVR51wozEZFPs5mJBf7dROVdCyY7Wbr3ZhhmWjGD+N3qCiRrnSioJMzQk+YB8jEP3kCEII6BZIZBSTPMd7JEVv4NbJmYySfAKGmMaWgiO50S7wDqGgRCDL8oaYZhMAswITIge+MDiAwKIEtMflkI0AAZQHfMFMfPYBlAakaEpNeIeRhMSkTWLlFexfbLdjemgDz5dWsjEfxiFs28waQFZGXKx3DsZujQsEz2IbaS/TzPxuiOgHXWlk87QqJ17na7WbkpmFKvd2n6RBKcL+Xo1n4sNuc8WSvjWMkKDiZRKyLiPoPMOUTTdUGEuLppMAzGY+RSjtwebMCl+BxCSNIRB80eg4EMwFzKqWntfWynECSHMZe8EXMg9AbaOrQwz83ucFRMcRSRstw3MDMjKTQ3BdAS+ehjA+omBcsdyDZYSqmnHm0BaGT8IXMYiPcNALacb9FS8t7DZmBkkP0ENno+pRTkYOPNavLZdK+qSWhXIafrCN/o5qTNtkouq2rGWOy+i/wMGxCYR2Y8ATgnIn60k4WGRhxWO+1z52eItosaPc1IIpBzW8nJFpC+B6jhuga3cJuAmsna5gjrWtZRj/ms5Jo/gGt5hLZWOQoqWYXqAXUWpisQKKONuV4WdLM78ABBc+2bpH0K/IBTGXPMK+OpSQKglIe5FyBnr88klsXumsAPKIJis/oI5i3rHZQ+F6DEIBppg7hzcjcCyiOAnuSc6/qlYAPqzyNnR/AGbbjY8fm830PsNCrOBfUWq3POqYs5+hops2uQe3dFCG0XyLkuL3oA5QpYOx8aoE9XwamHzTGGgbZsHyCmUkrZtDLmnjSzDnV1GPu265ol4Q7qew3rVsE0D4cG9zLejRusbQQ8sJhhTqg7AvpS7s1ecgRHTD0Bvn89Ga/bT8nvnfuWg6aBx3xX0Jhqi1JbyF88rDVlHCft3t9z5vHdwzewqrYRvzcB2I2nZ+O1cFZUMLS/Qq9H1Vo5G12CyPPvWq8Bcl181ene6jR/ReTnrvXQzoU8rV8nq+NUpcEYf2dz02j/cW34KzDEfeW9Qo0/fTx8qyQv+cP31I9crDciZT18YVzJ1Tro6+vramEv/7b+Uf4Bg0XuZFeDDg0AAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/guardian/south-west.png
var south_west_default$5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABaUExURQQFBQICAgIJB2BpeSs0RpajrnJUONzJpc/f5UBQXCQgOO319BsiL3qIl/TpzI9zUls7JkRKYb6nhqmPbz0nG6BEG7nFzgEGCXQvF1gfFjElL6ZcIsiRXgAAALmIFugAAAAedFJOU///////////////////////////////////////AOwYHF4AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAA8BJREFUSEudluu2oyAMhbchXMSoqKUH2/H9X3NW7Ll465qzJn8KMR8bQ4jF8p+Go2NjqI6ejV2ClRIgsz6sLkOuQZUCWwYty0Lu+Hi1KxAeCyjUkS0t8Eqf7Q0IYxuxNjJ0lSu78sKDTMO2FQF1Dlcx16Dz1FpuBdR7n/BK0jHo6FCDJ8tGkLxPKcFckReuZUHCwAI3eqegDOEcdva8wBiV61MCgWQ4h509SwVMdIvwnR8TTAigi6i9q8p69HC+m9B1nR97kOS7/SeIwYIset/1vutWSRIZBnsugsNaaCw15L1Xvc4DCSIi8ZzXraMiIAZqCKPqeQ84BxFCPHF7cAgxW0Mf+pLdqHq9QwVDH8vCh0u2WwqDtTYQOec776CFo8fREEA5H9Kxn+WGLVGvij1S7/sENCaitB68D91NirVsCauiH8dROQqcjWmEiGiz2z04pxwV7DU10+R0u8GwvQcW9k3aRO/ByBzZaG6892OvOSUTrW1yNveWt8H7d5RbKXFYQXjvdKPE0tquCVlkL7KdLEApkbUDKJhATCb2pjbZlHJ7vFdcAF67BRG8gzFCt9szD0NORqt9G7kZL4AAwOxARH6tNty45JnZ3Bt8vAORIYMQDE0TTT3YthPApdyYg8W+9+xACRDG7Cw55xzuweYIVZ0DoHW3Df4ZVmSSXlrMRpfH/R4sRx2pibxVrFKYkgHRY55t21prn1MdP0kx748DxXqQZnVGaoIxhZkj0SpXa499kxyUqRSAsaCa25wLmLVASdOtW7fDda3CZYC0rgDUj7nMpMei4AJQY8225rbDxujCq/brxVZsnnWpmutn1tEVCE3p+lt0z7mAyjpaUCMHW5drkIZ2dLSA+QnM+eZXCEAE5JZDrkvzE75d427JA1yHDEF5ZoVyijFiAXKbmTcvuQMBLbHnEzQDRemcLb9Ak1V+E70ZmolQoRQIlRhj1MjGthwf2ghCfZt/gve1OjlUmhvR7CgoeGbLDwy2Xi/cG3A95wWjA8r8KA8F8fzTP9CZEMr+07ObrA7f9QlFNQswjgRUfY+2HdLuepzByWtze4HafCbAVRSG+e3t+PK49AIB9GPX6c4xNajf3o5vl0iMWKsEzvtJwRHHPx9XIA96C19j55w81vo5Rh3my7Lcip75Jygiw64tftnJp52xxCifVw+DqX8FgpuWUeavryHKqNfjbAdflZs8RIF8K2qCfwGuidGG9q1ogvmVIlBtOzbYhF3H+HlydOwNKf8p/wNWnArz1X/zf4FXZ7/apfM39hdWn/V6Iv6CSAAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/guardian/south.png
var south_default$5 = "data:image/png;base64,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";
//#endregion
//#region src/assets/pieces/bone/guardian/west.png
var west_default$5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABaUExURQQFBQIJBwEGCe319HqIl5ajrrnFzkRKYdzJpc/f5WBpeSs0RqZcIhsiL1s7JgICAnJUOEBQXFgfFqmPb49zUsiRXvTpzKBEGyQgOL6nhj0nG3QvFzElLwAAANGocAcAAAAedFJOU///////////////////////////////////////AOwYHF4AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAArZJREFUSEudluGO4yoMhQ9DXAgugUnbQMr2/V9zZdqVVkD2Tq7/cXw+OYCxgtf/DLTCXwH8I3uYgvrSE16vrzbxiSMQpC9GStoDx5E8X6aJHDPOgZivZpq891DL2DEGQUwTB0At9gwYmNkDiNbaZTk425EY+PuD2WVZFMnhdjHU1jd2uy/LsoAemntbr4i42G2zNi4LFPBNVG+08bSCaPfK2dsCN0/wPCXtVGtq1hKPbdtsrYjM84zsfaLW2K5FenMB8qn8bS7w2f0ARP3OGxDv9S6YCdm51tiua8EY73IfFWQwu+xcaG3NuhbcLAKijVEqAtnlruAA3CTuMdpdOOUB5fzPQDnRfa+chHfg9jIG4F7Bfb/HCDjFmdKwW1tJtnh7g08wMxkNpVRrG4HYsN2wy4lOPKerR9LX0vo6MABbsBERgPOkdUqOnG9tPfgKULCCeeV9oZRo8h79yOrBgPp6vYf3xZFOzuXc2XrwFW7S3aasWFc2RMRcBt/aCa9XiBGZaGIUZjZmnjX3L7kTRAuBZkoB4GeZHcLoIntFRJNmIpOB57t7WsMhmEsiY3KuHSfjtXUcglg/I9J7b34OGiH/dPiZiqUySkYcGPgKA9dAeoFR3qzQpMkA7QAYgwXFloKYSsHFUWL+EYi4V1CKBp50+l7XjhuCvwAIpVwO5WqTWftXNQKlUXLOKHQxKPQw7HRv6xUJ5FwQEk3BUQlh1DoDqYKyQxk2TjsebfFfoF9Bk4IZPI1jUM7UY2MiOtPkbxAxBKJihgUPwU/faPnXGXqGosgBsM8HcFDwCKxP626xS/e0qRpHYO0dmZLnQGB2KMhGOqhNvmMoh6LT5IFcx0ebfcdQDsU8nzJwHmfBOhHl/aPkfGaPNZS6THzycCSw6isZsD8LBufWVTZ6FvxMq1b+E4eJ/4rfEkQa75OU2tgAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/king/east.png
var east_default$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACTUExURSUiIRcZHxIZFmdHNerGgbWRYPHUm085MnpXPtu5fYpkRoVUQKd+UgQFCZpyTQEJDQILF/fipsykbh4kMwEGDjwuLRMZKgcSHy0jL4ibqWZ2g1BGX5ituvbmvEtdaSYtRDRCVOfy9is3SUZUaHyNnAIFBT5LV6u70M7e5llpfK7AwQYNISwvOEgoMnQ7PXYyNQAAAKS1Xv4AAAAxdFJOU////////////////////////////////////////////////////////////////wAfmk4hAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAANaSURBVEhLndZhk5o6GAVgbJCQLHCEBJdQ1pCACG235f//ujthdx0FvNieT47JMwdfguqN/xhv/sazeQQ9z3u09JGV1d039z7x9/9rl0vf/MDzRo+GAftLyH3fG3eUvviR636QJYy9xPfGEZSEQYL56jVLOO52vrvGHSFJwA/z1a+sQFCWZh4gCI188qhzBY6S8jTfAUdK9z7dzZc/sgZHEJ4GHvBKqc+w3rkGiwQ53wcBAOozmc/Xp6zBPCM4EM5ZVtCEpcFq5QrMKclzDx4NX/w0TVUp5ztc1iAH4SHd5ZQXRbL//p3Pd7gsIQij8ijCMOScZzSgfkbnex5BRunxePS8oijCzMfqXNcgYYztiUvBAUTpc3AEAQDGGCFeFCBN0zW5BlGWqkLMGIsd87O3p2CMk9a6NgZhyP1DmqaRXLkhCxhbrZuybZvGgBCeSiSSZ8vKOTxD666sqkvVdj2kdNMh0duycg5RT64ypuoMJE8BkkFuN6LWTal6Y0yl6h6I3sCYfGMLuQZVZSY41D3yBImb7DbUWgihTFVVw6DbHwAS5qfDFowba8t2qCY3DLp3pyHx/U2IxlrbfjprtZWEEAR84eYwto2t665pTg5etAUhAcNyNnM4oikrN1Mz1NYOGgIyzNJteAYkgLZt+6q0Fq/21ABY3v85hOlRq9Y9HugshG6VOUHfb5qygJASuKi2BiBqVVdmeBICWrvCV6FdmhbVEzBum+qHcfb1I0IIVOJ+05R5o7ZaX4wBDoefv3IS5qYC1PZwYthhGOreDAc30zzPW/vUVGWvh0GZUmvUSh0AUVrZmU14BvQwtG1/krZTpq9FUUA25ni3a8o9jLtOawcbqU/KqFq8F5C4bEJ0gPvGcXBQpp0gwpUrvYfoOsCqqjfK2kGpFuK3eAffgnHXdZAQU6ZDKx0slid8Bl2hlMhfAiUSfjDuAL3/Lv6sFd5CVygdJGx/AsMVbjV+FiInUR8CaCS6Eg/cDcRUGLu/K5QmCUotRde7c3MHvnIHJzfGU68q9TSm0F/5/p/B8roDWl2qAVprQsjqbbyF5RVCl+Xp46mERHy+7rnJDWyvv2auSmRsv3qNn7md6vVVrLWOOFv9Jf7K7LH6yPkM5FEURX8LXaYP+C9wK/8BQm/a+xDdAlkAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/king/north-east.png
var north_east_default$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACHUExURSUiIerGgfHUmwIFBU85MnpXPopkRjwuLQQFCRIZFgEJDQEGDhMZKmdHNZpyTRcZHywvOC0jLwILFx4kM/fiptu5fbWRYAACCYVUQMykbgcSH2Z2gz5LVyYtRJituqd+Uis3STRCVOfy9ktdaUZUaM7e5oibqXyNnKu70FlpfPbmvK7AwQAAABOafzsAAAAtdFJOU///////////////////////////////////////////////////////////AKXvC/0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAA8NJREFUSEud1dl2ozgQBmBws6WESIwaT4IWVwlZhAnv/3xzhEnC5vSc/i98geo7kqgiica/TLR9MCeKHq3MebAcxfEpfrB2z8Hir2nDJM1O+XZpkQNYJNNvnmbxD/IAPkXjCACs5FXMYbv6mT18Pj1F49PLy7l+5tkpeyT3MIqjaHzORVn9jpLqVD1tC+45gM0FxigvxekUR3l1+v8wbTic81Lw6nTKz1WzLwnZP/2HN010PpdJ9VxVccwftHP/tEh401zO5WsTAUvTLNuXhBw8ZTlP4yTJmujtDaB9Pig5hADQJpzHlyrLsuycpnxbMWUHhVRtSMo5T5Ikqet6WzJlB7Vpy6S6JmXZtm0NkF8atq0J2cACDNYlb+L4LRUl55znFZyOpmcNC0KL9TmN4zhuzi9Nw3nOi+b3gVzBgjo0WOdZ/PraZNemLAEA0qeqWFbds4QFuRv6Es7ZNc9eU95CbUwHDNgfIJC3ugdgQogsL9v63RIRAbz9fFQYyHvdgwPGRFm2zBIZY6SC6t+9XMDig3rSQngXbgZg0RtjjJeOXX6Gg3WIjEh63wlxw8Fba43xzsG+lcs7MisRofc9ou+FpcGYIH1PuKias2oHs54m6Am1x8FPUgkhfjxqmBsddkTvfaclDoMxxhrRd7rbySX8BQMAYxN0Quphkt73Wg+7S676CAbMB/TaexNgkN4bIu/3I7DsowcA424glHJODI5QSqmUtYbtNly1I4ybccaEv8YMOqsQEa218qAba0gOQsuN0QBAfuj63koJbH/QDUQAFZw1UoIYwlYMwpAvxZzlyykRyzCdUygADC8mHHxRNWc1OUSIXWiBMWbQGvB+4duHWlTNWX+PREA0nTbAuq4R2XsYxEXVnOUdw8dHAETkZgjA7I26binmLPtIJAOE6cjBkfmwYeDdUsz5hqBISiKlFE19BACtte5vpifajeo3LJRSUpKSshVt2DbI1jlvTS817jr5BSE4SVLK+26AiAyc673x+O52W37CwsmQTkqphRBOKaUAAx86tG7fyE8IQYU97wlOARIDrY11uNvwExbDfM6FU9OJ3bvSzuit+4IrN28I3W0AyNPr5fYQjtDRDpKxhiBJqwt/fMexYBungKRXBEmSnPdXXAzA/F6/NwyfMQJAwQ7calbDm11siCj9weucs/w6RsZCH7/g4N+Nggd0BcciyDCu4Z2Krn/Hl8vB/42QNRxHYIwh3qHQIrlcTtfdnIZsYUhRFKAY0/qFX6/X69H/42MYAkFD+C0O3UP4x/w1/A8RN7C2sa4LtwAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/king/north-west.png
var north_west_default$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACBUExURSUiIRcZH+rGgdu5fQILF4pkRk85MgIFBXpXPgQFCRIZFi0jLwEGDgEJDfHUm8ykbmdHNRMZKrWRYAcSHx4kM5pyTTwuLffipqd+UjRCVHyNnJituis3Sefy9ktdaT5LV2Z2gywvOCYtRKu70IibqUZUaM7e5q7AwVlpfIVUQAAAAHlSKRcAAAArdFJOU////////////////////////////////////////////////////////wAjyafQAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAOySURBVEhLndZhk6I4EAZggYA48o6o0bWTDslkgnL8/x94FWZuVgO6V9sfLIv0Uw1tk7ga/zJW6YWHWD1ffr4yjlleFE/Xny6MIs/Laiq5TpdiPIUiz+t6E799fabxDL7lRb1tmgbjmL2lizGW4Vq879os22+32bh6e19KWro2rtv8UB2L90xGuMqXkpaujchPVVa/51Ju5Yh2sbVL18bidN7mv8p6K7dbVEW5lLR0LSvaPD+cVqcos11RI814AldlWdYC23p33p/yoq6aNOMJ3GdHgd2uvZzP5XvZVksFF+FY1u25rusiL6q6PgosySUIZOcqRttm+6MQpGSasghxuGQAcDwes+2lrMVRc5qzBJGjXbVt2x6P7S7P83oF0pj1ZwY37znabVsVxbmKLi8rkGFKn3MG0bbxPhtUebvblXWEbLiziZxDAE5phaaq6lNZncoPQHtjEzmDB8ASkfmEkOeqlB8fAJQ3gR4fM4XI0fdKa2uNEGIvpWhAUD4E6h5KpnCEjU7rQFcIIQTQR2gD3R5KppDZBq2NMcHxVUCIENgC3lozvISehxCMMZ/BkZEhaKYQHDzfzMvmwEspTSwYBg6emaiL0AaTzMAj3HTcKwpG6wid5xCCDWEAUdy27mMG2YWpN8PATlK81+DAgHtZcd0oxUq74Nzg2UkbQmAF3DRuL+G4bq7G9L1zA/MwQUvorp1GA/3yd1xvYk8tMQ/G7dE0gNO603D0ODozuG7gwlW5brgNcW6nadAB/R/guGmml6Nxxkn0gzYTtAC/hkDjtSLmiO2EtNYOtOfHbSCBm06b2AdlGd73327ohbX2ZVfB7AzAHkL8wI49/ghDx2xM3AG+YU/EkDbGwzmZQt0pRVdzvZEQ0jORl3HDs4NNtoBkcnzfKX1l76d8xJMV1g2wg3OPMplVZqU+r7rrp1c4SnjpnKMuwvubTaAmqz6VYmrARJHGvcs517mkZFrRWDs49vAeFBsCsY8VJ+jcnUybw1dD3sc5ib+AtVP+F3oF906z15oQxzuBffze/8gE6uvhVJ0R39yvil+3OAWRc7+3yOQZ94fDqT3DauN4knfQ0XB3gqSz2lRVdQZ3YfiCd/fq3P0Jm74d42azAcDsPSzFw+C3O97nzWAMoFdRUoz/WI9XsxoD4EHf1CBBPyWtTf8IzCEOh4+P220Y9g3ZbzhjC3Dzz6/dofYxpvNOEqGZHeRLsLxcLpe23UsJstOspilTzGBs69TY+EYtmynm8H/GX8N/AQHYnRpYhzMDAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/king/north.png
var north_default$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACHUExURRcZHyUiIVBGXxIZFvfipvHUmwEJDYpkRjwuLU85MnpXPgEGDgQFCS0jL9u5fZpyTerGgfbmvKd+Uh4kM2dHNRMZKsykbrWRYJitugcSH4ibqXyNnEZUaAILFzRCVD5LVys3SSYtRKu70AIFBefy9ktdaSwvOGZ2g87e5llpfK7AwQACCQAAACHZsagAAAAtdFJOU///////////////////////////////////////////////////////////AKXvC/0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAA9lJREFUSEu91m2XsjYQBmDtrjeSAFJJFBPMi4Yn0vL/f1/PgK6I9NT2Q+fsWSTmYpJMAFf9f4zVvOERq9Vq/du8cRJ/B7++vzebDebNz1iA6y/6lyTblA3nPJv3oFiCmzUdsiwD7/s+H0/nsQQL6oldlu2Afp2X/wKue5S/Z9gU6PPt53BfrCuIzW5XCpnnBfsUZulhL6XYFAM8FmxxbZfgVhSVZMmmODBJCT9d1Z6L/bHK90XB2LrYp4sJFyF4Uh6kEEKsiiIZavIey3CblGVeVVVZJik+zoga21SU39/fm1IIeVKL8h0CQksp0/3heKxOJ6nF4mDfIBouqq1gsqqqSrJUngXMQs53aPk2TwvGyrIsk6RM8xTGvOecw0xqzvPD6EjuckC5f4IZvLkYbAVLWFmyMkkSkQMX597WdgqvsNaaIDnfspSVYrfb5UkOILi2MTM6hbCN1gPkUrJiu2Ps/Os8QBWbpnnZehOIxip9seHEKaSkdT2TQzCXOsb2ZaJPCGeUCuFiLoDHgDk/nx1Qm0sISlftdLA/EK4xKoQQzAXce0oEzoEBUrtuvZ/IB8zaMaFSBI36CUNQ1begdeu7p3zC2nRKqa5zCrzxzjmljHPOUBm7RinV+tsC7HkXYqO6O1RKueFPdYD2Xdcp5UKcLM9zcXgXlOk656JGO4Wx867rOhP0dFmfMMvaEGhwbgZpVbyjfIur2sNWqOvonNYAwS4SBLT2VVPfIl8uxxW2phI4rd1QCxgzfnDRW3DgjxaTvfOso8o4Lb6LEYia0lIy1TnEaGGi4jwu1LHPdAD+pCujsnVdh9vtdgt1XbthM3DOEZah92EY2dn7tp6Ee2yj4PxSOTJb+1DXmmA3hdF7GBqC02Zxjq4OVAucT95NoXNngL4JevoEecCrV7egtAEszs5ammZd19YYd7IWiJ0Kyvhnyju8eq9UjIZgtDidKAWFlDxGA4B2XTu5Pe4wi8HQrkEPO3Yc70hwY+i8B6fBTp7Nj4zch5vWoA0Uo6HB3TeBiQOkIge68Az2PLZVnlNCG6O11voBxHiHPaqqmr4MHhnR1VIkXxhgFWMk6EjR0QGMVZWybxmz7lLJPGfAve9rGLC1XInbwhxP8nBcyZzTFGN0c8gZZHo8/nqDfQ8hGKNiLIZBlhzFdmED3H8Q3bu9mBHS99Mn8hP2177HAhyHTfI6cVNI22DoM9TuCU1Dh/n76gVewYcb7xWOO2j+m+UF0hp5T/ffDzMYWub53iEfYM8H2jTAeKkPoFJ66Da+dIZHg1IvT9Qx5jDLMv46n+tbyxBz+HH8//Av9omgZxhk/aoAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/king/south-east.png
var south_east_default$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACWUExURSUiIXpXPurGgS0jL5pyTTwuLU85MlBGXwEJDdu5fYpkRgcSH8ykbhcZHx4kM/HUm2dHNbWRYBMZKqd+UvfipgIFBQILFwEGDgQFCZitugACCSs3SWZ2g0ZUaM7e5iYtRD5LV+fy9jRCVIibqUtdaau70PbmvCwvOK7AwXyNnFlpfDo6QoVUQHYyNUgoMnQ7PceyWgAAAN+4VhQAAAAydFJOU/////////////////////////////////////////////////////////////////8ADVCY7wAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAAERklEQVRIS53W7ZajKBAGYBVl3qhBjQZlQRExk4bd7t3c/83tIdPbk885ma0/yUGfUEJZITr9z4huB74ien4pxNOrUZyQ27HL+AVMk+x0OtFvuL10jgcQIUmyifMkL05ZnrwMozLAONnmUcHIb8BtlkanU7yNk4owkm9eh0lMTgCpy6phhOSvw7wihJAdzdsuZ+w3YL3pMkJ2pG6rMmLsVbhHUZcVYQw0b7oS/FWIHFmeVBk4aJyUIOntHed4ANMYNN9UKXgUJ2Wfpg+nvIcD3VCQOC8Tgrjtuoq+CE89LTMSZXGedF0n6jLDH7i3D+AeNCaERISQtv1WJw0g1Z18AE8A6riO4zKuKpqk24jz8U7ewz1AKbBlESFt03CgBcbpNts7CL0DaJrWNEprcF51fQPMpliu5S2EHK2YOaV1jU2FqgsRBzjOV/IGQoaYFGgco+66LqzspsHCCrHK+eLOazhIqZRSs1lQlxWyrusG3gJYmBGLvJzyCu6lnJUQBzsaIG6+A2nMSwAcxzfj5Hghr+CgRyeEMWKdNGgepkLcAk0KLa2T7hmEVtYaYyY7G6DcAMjz73nbxWDSO/MMDlozdjDGWOtng3bznTctUJIYnOl1Nc+eEXpVizWTtd5Lg6xtkXZA1QLaam1U/xgOXkplhRDCe6XkFJ4wr7quStFrp9WVu4R7eLuMwgrvfdhMoEadJFVKwLX26J/B0wBMZhy99+t4kA6oKf4sqz4F50r9AmJZsRgzLmE79Rgy3fyVpU0KDvQ9Lhf1OlUJAShnndRaQ0uGtOq6EowD6M1Vsf6EewAS0xo+pNRgSo2LRtNAa+7cZBbJHsLBA9BY7AjOOV+cVlb4BdC64KH0xfoYYrVvBjpUJucF0/7AVjFZr6QuCqmlm55BraU0Ic8Ai6KQVqnVrpIVRaF/AQctvZImMM4LSoqCfUaxcL4oYdxjeNKzt9OsDuBcs+J4rCk15s3RDAvnrOeM6cdFjnm1h8MiOdfL7DlYlikn9ZGLseeoYyYuG9Yl1Ku309jzQmtvJwvs/Ko1nHEaSEs2XfbIyyJn6+qmMRTmaoVxkmeEMMbd5BhICWaeQvVmjNuFirbGOsnfs4xlZ4DtFi179lqhZ/pca6OYDpZz/vH+QTKCgjMGtO2T9rhnI4srp9M0vIg8QPL+kWUfPCxoGLt0lwUwa0aTtwUJYCceCoj8/fFOPorxZifO8QWxzIxRMTlkWIUR6xfcWs7YVU8N8RPOM2PHY97UKBZnlQSwDRA7Da7X9Ub+B4d51qG8MkqxO/8PYAiHnXcsbsUJ8E+hYj+WAJCL9ys/DwNsFS6sC4Yr9xOOin0eTDAKc/icACzsUOiuVw3n6hlV8ePLHl7L/7r9wNiR5nlyf4K42I7P3xy0Tjfl5337oUeWpWlKn874FQPL26q5mCA0uLtMH8A96oT+c5vZXdzDc7u7PSrcxwP4WvwLcC2zgpqLpe8AAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/king/south-west.png
var south_west_default$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACQUExURS0jLyUiIdu5fQIFBUZUaGZ2g/HUm4pkRjwuLQEJDcykbnpXPurGgRIZFrWRYIVUQKd+Uvfipk85MhcZH2dHNR4kMxMZKppyTQcSHwEGDgILF1BGX5ituis3SQQFCa7Awefy9jRCVD5LV4ibqSYtRFlpfHyNnM7e5ktdafbmvKu70HYyNXQ7PUgoMiwvOAAAADJBkGkAAAAwdFJOU///////////////////////////////////////////////////////////////AGKl0HgAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAA/pJREFUSEud1mF3mywUB3C0Iv7VOTGilUGCATFPui3f/9s9h3Rd1aY56e6LnAT4nQt4IZLLPwbZNiyDRNuW97gHo/hO782upyQ005Rl2573uAkRM3JBnhfXlNHNCd+GJSMA+5bn2eUSVV+A+feI1Jx9a0LC7AuwJoTxvCDALmLlFyAhWVyyloiGRGW92/aHuAWfSNdVad9mz6ITZdk+DAFUvGYZuk6kZbsbsB3xCYxa5GXRAGjTlGVgD0KwHlVZAIjTsiBDXT0Km5TzvkVT5qyVQxs3j0AAIPEPxTmv+rbpRBO3t9wWgmqgLn+0VUGiToiuYRn26zGvsYagNGxJHRdpk+dFUVy3aDXkLTbwkAAMUuZV30TRbge02W25hE/ojAYq8LCljEVtW/VRWPVi0Fss4JNIAqx4zDnnQ1rJtmgBpeh4Qy4gjrTTGnVgnPMUqArAjFrrG3IFrXEurBF5cE0c3HHy3o/6g3yHGKmZHQqgr5tKyjINLvFqVmo6ipXawMmeBOKwLYCUWV8Ah5MyRimVfEj5DgdzsolDlbL/6hoSLAeMtsYYo6y/Ay+dOmmHKOSsc5nyHGacrAqSCuE2crk5RmvvwNI90h5138PoaVJKGetO0x14gdc0QM5TFh77rCm9SjV5rae1XEFMWoPUaVoWaIGD1jq5Sqs1Pd2DIwUKpPkpalpgcgeqKaXH42zUtu6Wa6TAMKCIURd5jwAnHZIaYz4W7Kpyrv2oOE8rCN3BOa2pmn0C+qFel49DO6MsBOqcYRyp1xJaJ8MAqCRMZumWUIxUaxeeGMSkrHd0dGEGoz1AOuC4yrmCs9fOSXGa/Hz23dkfnZBSSgwC8mCTz+E5QAhBLaVUjfo5MCmen6WZvXOruS4hNQefQIquc865TkqZhQ8JY6bQ8llGdGF1GOH8wZisabMMElK6eXTTNDm3dCuoRFGEvZB69D7LMoHpdHQSejrP07Se6QrOIo8BaiyO0ykUwEHRo3PQfvbTtspXp6PbFd/hZw9BCOmEN8omb9BtSmcB96Lf7QioAQghL8+d98ZS5zD62Sd6c6GvipzVBS4YkGWEvEgM/mzspEHPZrbJ5xmv/zj7AH9m5OUXBiQKA5CJa6wLZw2vgSN+kpcrvEbfdzZljTh+WnKv8bSAozIWMUbFi2yb8gOEgwZ5+UUC9NYCQz3bK1zJLQynOaF4IbhcIPQ46oHVLSFCiHFcnskPEBB0Dscp/NCUjgIIyxVC+7tQ5vXvt4qGPRv7ZzTg7kH0vO/7zL2eoXDrafo2Wv79FmIDB8YYy7JhGEKdoI3j+u9x2t/d1f1+/36hoeW8Z+6Bl4dNgMW/0/aRt45NhORye6H+ibvwXvwPjDSvp4Pm1cgAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/king/south.png
var south_default$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACcUExURSUiIWdHNdu5fQQFCQEGDi0jL8ykbppyTTwuLad+Ujo6QurGgU85MhcZHxIZFnpXPopkRvHUmxMZKgEJDQILF7WRYB4kM4VUQEgoMvfipgIFBVBGX4ibqVlpfCYtREZUaEtdaSs3SXyNnCwvOAcSHzRCVK7AwQYNIefy9mZ2gz5LV5itus7e5vbmvKu70HYyNXQ7PWKMuceyWgAAAC00PugAAAA0dFJOU////////////////////////////////////////////////////////////////////wBLVyJlAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAS3SURBVEhLndXrlqI4EABgQSMg2ECqKLWHBBISuTndvcv7v9ue0NNqKzNnztY/oD4qVC6spv8Zq8cbt1it/vDwD3Dl+X+Si4/Wm2li28AP/dU0bdaPj+dYhKsonNh2FwfBakqCxZQFuN7tHZxeXoL9fnJwtdo/Ji3BfRysUgezPOPT5HmrfPuctQSzmKVpCC95Fu+Red4qXhrt8619VqQsDSnKszgixlichY85i3DaJ0UahpQXWeSgfwgXPnEJTvsoDYn2URztGWPbw5JbhJD4RMTjOOKMkZ/8NdyHXsw5j6OIE8WMeY8JLpZg6G3Tgu2jKOJpnGUMHhNcLMLw6G1Pc+RFyv4OvgJMzDsej1H8o0wLxlKW4rR5to8QhERkXhDF8Y/Ki9k2ShGxVg9pC1BLRC8MwyiKY7+IPNY0BrV6KvkdrsGeZYuHMAgMmyPL0sSYs5KP8h4CWGs7B5NtDrlrDvlFSsZ0qq75d3oHwdq+d7BNIM9Pm8++vnxCXTfDN3mDMAxDP9rStK3J8ux0iv3TyfdzYwx21VlTXd/LOyiHsutKe8YWM9NiURRFBBCQMRc7dudaL0OQM+w+Ydu2kEUAsAkA8WK7rtP6W8kvCEJWuiu7sVc9Zj62Jtn+DABgG2CvRFl2RETVTV5hLaum1No6iNFP6UcBBL7/cxtAr4TS49gP1D/DicahrrXt+0GVkEQy3cLGT9Miw2GQQmmth6GzV3fXHH5Rtbaql8oCAGQ5gB8AIEoplVBC204sfOM0QXWxtVbqcikVJpjlp1MegIfYv3W9EsJ2YnNzd12tTFWWSpV1aXuTJJsgzwtvnyEKLd6UEp3YLHXV9ZVQCFVaa3vDsxRO2xoyD1Eo4Soi1vAMX2ECKAUC2r7vUZnMjzCKogwkWiEsIfZnQIDXRyhHkAjaGkRAVVUQuAUXgawkuhh6RAJ7m4+voUr5hlIaF1KqSgsFbsWpSkop27Y1hiR2mr7cDVbqzRlnpZL6TbhJUWIUfGjblmjeI4qeK1blrkznisZITdqOYynEKKQ1ravYmpL6fhFedk2QJLPk1goxauHGObs2SQLS3Xg7CK5Q6UvYGIPGKMM550ROcc6YUXNJQ+N4d/Z8QS60Dj/rKct5kobduTuHnseMmiF5VOlnuFai7ENjyDmhDQ/Dvu+HMORcCyXblpDT3OsnqLsyDH/B8qIB+mEYjNGXL5hw3Z2f55FIKkQio5Rz2hyJiDGj9aUUUhpCIlLqqeJE9VkeDk5+OnOk45G9G6PLS1lJQ5SmpBdOABJneYijPRmDeNHGfHzBCwIaoiA/0Pm5Oa8kOimlg7bsYGPMx/F4fH93r+nKComCpuGLkCi4wlE4+DHDarzClM63HXndj5AURQYOilI4+PELirF2kKdFkd5W3A1OgICN644VQimD+HF8R9dk4dqNEuF+H9/BCf5pmgkQlQszATsCfF7gBJOUpH8L51fCIIRQxv281hO4FTX/bQB+C1/BnWLQNENzXVobJXa73W6++jbSezi58wTSomia6wpZc7XbbbfeNzPHPXQuPBV51jTXxA3fBcHp9CyfYLErsruuT2uzC5J/k/uzeI4HOLnT/+Ht+DARn/EI/zr+Awqey/BHF0RlAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/king/west.png
var west_default$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACTUExURQEJDSUiIQIFBTwuLdu5fU85MhIZFurGgWdHNRcZH/HUmwILF7WRYHpXPopkRqd+UgcSH5pyTQEGDh4kM/fipsykbgQFCS0jLxMZKnyNnIVUQEgoMlBGX67AwYibqWZ2g87e5jRCVCs3SSYtREZUaOfy9j5LV0tdaZituqu70FlpfPbmvDo6QgACCSwvOHYyNQAAAJmW2bUAAAAxdFJOU////////////////////////////////////////////////////////////////wAfmk4hAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAM/SURBVEhLndbRkqMoFAbg3xFb2kQzHlFDelsTECX2buL7P90WpmeqWsm0Nf9FLoAvJxBAMf1lsGzYmj9ABEEQLBt/5zn8ETIWOfjysuxyeQ5fYsb56xQECfPJp3C3Z2kUvUxBwrLXZecfIPYxjyJMU8AOwc9l73OIQ8z57AL26iv4BCKfHahIRO6r9wR+OqIiKfkrLbvn+GBF8YHXACXJnlfL3s/4YEoxD4jipEwj4uGy+xEPJCH2PGAsz/iRONsOIUshxCkNQ1DN+dvbcsAcDzz9w/d1nYdhGKRZWGV8OWDOGkaM8TgsU55l0ZEQxf71WUOAs0NWFEVxPO44ZzFfj/FBlKKqKKq5y54xxrn3j1xCEkIISg4154wxAPC7FUQSO1oRY6zCe9O22AirXIiEWH464Xy+XJTu/HIBieUEIMl4RabrpWwHrbvlt7ss2iAOKYCsApmhsVdrnfSVXEJUZeoqwoyDNcZaOwz64pELWAqKS4gDcFaNMcacrdwCqRQfSV4dChg1NtZJawelvoUTPmKWg+jaqXG01hqrdVFsgPTBsn/BXcFxllbKtvet67KlStJdxKGUGh6ykb3W3brkCnIm8giqu7qaQ9d13eXSbYAkhJsjVKs6Jed1baTHreBUEdTlAijVvZ+l/A9wW2ktV3CayEipQP1ABEgpLzBmPWzdMpG9jlK5E9U116srh22wgtQuhbOk3ec2OKHQP112Wmt6P1vZym1zbMyN8ygMdzuQMUppTZtgpeUtDEMAu8aMqhmHjXA6trcd0LQ9tG5MM16OdhvEsa61NbbTujVyHBWwPss+WDnYmGbQuj3LcdSq7zdB1PV9/o2PikpjKwzrCLJpRt1e3UEGPNIDq7q+hyAi0u5BULg93/f9YqQP3ut76NwhK9rk4B7p1K9KeuAPervXRISyujRJOkMnvw71wAl3onaEBO3PzfwSsRWC9LUoiPIsdFtoIsJxKT2wiuPULQr17nTQvN3cun6dpQ+mKedaawxXO/y6GaHb76ELAbfbTcrh+BhOWn49Wx74CE5xeXPH+XM4QX43xzmUfog8z9xR/tX0/aq6UJblubsoyfvO8RxO7qrx3Iq/8xR+l/8Bcuzc/Dp3W4AAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/knight/east.png
var east_default$3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABvUExURQIJDQECCdnLpurkxGNaRwUGC2l7gZe2tYuhonJmUQUFBQQFAsS1jj9TUkNHUbGjfp+TcxsiJ1FHPEVBPFxOOTAxNgYOEIZ4WiQtMC04NUgvKl1mbLy2qX96bcLRxtbc2To8RCMtOoSIjPj69gAAAMclCe4AAAAldFJOU////////////////////////////////////////////////wA/z0JPAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAJnSURBVEhLrdXrbqMwEAXg47EnrcEBBodgIGzSNO//jCuTvWjBqHG1Rwo/7Pk0DgMCj28G64VX878hgD+/dNLrirThw9s7rNbFevOZNCyhnToeKnaaeb35zA4sWdeAajRLumIf1q6OyYSPEsYVjuvW7xTsQZwaIiaqbafWe8+kIZ9NTVrrCNMVaVj0um6esKEm3TINjSZaIJHu0/NIwlIZbUiTJqt7Tj8BaViwMUSayBhGFgRbirGMHFh4D7t0tOx9xn8sTA9bkyZnubEZsAyerSOtneWhy4CPgk3j4jic5fQYd+CDDSnnHDuT7rcPT47GcRwpFxaqH8E89pILuVMytjzyTsEOLEUUx6Mywk7LNCxERJhZiYSsu8rGRCoixuTC8Ew+NMbaeM2G7hmzN8g0LP7CUx4Mtl+cNVnjKKW18RnXurYhZLzIZWjr2gzDYKhpd1omYRGsCGJCsHkwANI3p1Ok6Xkk4QMIEoZhGDDtfVmTyxw7/sr75fWjLif1JgCToJ1/pGqSkI9AT5qEtGPM11tqIAlYHOMRGUYMMwAFlbg/W1gCFSAiUMv144bLtmoLy2O8k93vxHle8bYp28ICuAFd287zPEcouJ6xPesG8gEVbj4yZ7tOzumGG1jigNhwnufG2S6cobvpnJDrFT7ieAGWk9a+AzQw4X1dtoW3peMljiHmogX35PO6hgw5TEBV3e+fn1WcC9CFsG25XuAPAIfYNaaqJmCwdP4aFkGWB3yaDveFt5YafqFjySIheL80nKhv29Z7334N4/cGEO993zRN08Yopbav1hbG8L9Zb8ek4Qv5NvwJtNVmK9+OmQ0AAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/knight/north-east.png
var north_east_default$3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABvUExURQIJDWl7gdbc2XJmUbGjfurkxJ+TcwUGC8S1jhsiJz9TUkVBPC04NVFHPENHUYZ4WiQtMAUFBQYOENnLpmNaR11mbCMtOjo8RFxOOQQFAkgvKoSIjHGJf7y2qYuhojAxNpe2tX96bQECCfj69gAAAJHsg3UAAAAldFJOU////////////////////////////////////////////////wA/z0JPAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAL9SURBVEhLnZWBjqwqDIb/GUBARKpUHWePM8e78/7PeIOzJzfRbtZ7/kQSS78USil4/aWwN5zVtyBQvjLKEicKcLkCSpvK7ie/JILOeFvXCJUJzf8CrTURLUJyJM4XiROd73NZ7lv72bdEs/W+qrTWPmedWHQRQTRArHTO2eZcpSBuUwDtAKImF9AYk5MSfEQQI4iiyUkX0ORKSSGPoJ0KeEvGGOfKkG4nwQs8MfWNMqYsN9/OghN8kwhA1DFnk5PECWA3Ak3SNwDNG2SJPIKzRe/ZbRUQOZe8Hp0k8GVBIM4qhJi4HIlICqYa5AuZs8sbaLJwIAJYzh9EzFxpt1WBOwV2NbwigIgIKmdj9f1+BpyBXinyJTkKNuV4v/fd3ksC7QdCUtF775Fg7/c7unnvJYCvjhBSrt7kLVngGE8E7S/4lLPjjQQ6iZPAbmrB2vwh99NfkuxYcNNJG6fI+++6jmS2zQNss8kVM9F4PIoiCXxhAJLLxmlmGkUXEbS1B1IqVepYjePp5ABg9gU0ziklhzwau8uIoJRPWpf61olJCimAIxpWUCltYHIpHJ2+AZ/MSEqVVlUultgCjuBrtsQElTibckF8GfY+IliaB1hxyuT77fWgcxG3vDJH3aBvmhJP4CRwnrcosQeC/fbBEmxdjRjDBvSegGn5EEJKoAenqqoqVMZkpGqQ1iqBdYPt5bBNjBGwgo8IzmgetmhrO0S/z+1xntE3AHy5i89Ny6mlzuVOfVxLrNDGGNd1mBb8s3c7gHZqB9TAtX8gxMi8rusaFhza3A7s6m1fgwFMjxhj5Kpa43Lc5s4wox3hQQ+D9moABOa88hP1ntxHnAAfAmw7oG2NKbVaUtUvP4Cl2ram+FVr/efn53CZ2uWniK/Ob6dABDyGYXjjUr3u/+f+GW1yLiUFYLn2w/VymSb82jvu/2frEayPIUS1/hfO/wiWtYYQo30+WSmXlQq0PSH7EjiAr26rU+tLsalVNcHjVMn90Ru31h7S8pZsPaG/Bv8FFaZUG6pBzZsAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/knight/north-west.png
var north_west_default$3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABvUExURQIJDV1mbNbc2VxOOYZ4WgUGC2l7gZ+Tc7GjfnJmUTAxNgECCYSIjHGJfxsiJ9nLpj9TUgUFBQQFAsLRxry2qSQtMMS1jouhogYOEFFHPC04NerkxGNaR0VBPCMtOjo8RENHUfj69n96bUgvKgAAALJtif0AAAAldFJOU////////////////////////////////////////////////wA/z0JPAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAMbSURBVEhLnZXtjqs4DIZfICaEwyRpaaD5oNDu3P81rkLblYa4q9F5f1TF9oMTxzj4/kvhaPitPoHIDuy/vD54UNUAGiHo6HmLB9G2kB2U6v8cXW+xIA1fGgZZR9d/Yj0EgCwgAZyOzpc48IzxogGHSQjFBWRxdsyDnscrQGZS6sNyOSugtRuuxhjjVdcJtkAMiHYcLxVgjOm8NBN/JCx4uXxZKGNMEDEm/WuQtHME0ZnOL0KTZgtU2qidxxBGqMmYSeo/aIygMikHjuMl1DOJyURJQNMYmQqSAauvryoMLVRnotFumZppmgqSAW89AAuk1MVoUkqNUuoX4DcFe41AQEpKpdQ0jVKajq3HgCcMFrEGtPM+OEdEik7nQxQHaq2djrTkDtq/SkLZPAyIYZx1ANKyf1ZEJOiYjwPzcYyoIeWqn95TsUEerOZ52L9GoV3pfqv0kK1uGogQ3aL5Ps0qwW+6ob7QVpMU/jPJgnqoCdWFJuVe2yzF2bFt1QxU41WR/kRy5jyrMNdkByLhPxSIs5LF0NLWYqWuE47fJgu6YOuatg3SdyI5xxwjBxKcC20ESHa+kyI5LmUJUtvONrQG6DqpZdcIr5mULBhCJXsIIbyWshEylD3OgGesk/QLCSEE7WBgRg4Dfp+IAIIQ0kHKRgZ2lnM20ter9k3jkaTURFwMC+732z5bQwgE3TMr5UASlKLaaQC3vmdvVwY8QXeGLjFGmDjJD/cVZyOi25qzXd9pmSjGdCatCdZWc7xnETTTASV4JuecA6y1dtvWtb/nSVnUpwAzpx6PR3iucV03a+u6zFmA5JbHU9W67jt96+eIPIJncv7xkF0mMxfvdW3tOI6j/XkoB/CsSS+LlOKh9zlwx7blDsz6X5C2PWYP3eIQ8+O2rQ7Y5p/1OYJVhaptWxfvQybyC3RWcZaHx9NrWfnw978ppWUJri/69Qiu5KqqiqG+x9YBSphoiFJfjI9jVSkv6imCUsuSEsGjnK5HQ+43rb1vjBEq9Vh8lisvyCP4HADeJyX+6fse9NQxiAOzXuEs8RIP/kJ/Df4LIHdX1/Ap2n4AAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/knight/north.png
var north_default$3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB1UExURQIJDYSIjLGjfjAxNp+Tc+rkxMS1joZ4WgUGC9nLplxOOUVBPHJmUVFHPAUFBWNaRyQtMBsiJ7y2qS04NcLRxgYOEHGJf4uhoj9TUmRjPDo8RF1mbENHUQQFApe2tX96bUgvKml7gdbc2SMtOgECCfj69gAAABoHKvAAAAAndFJOU///////////////////////////////////////////////////AINWl9kAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAA19JREFUSEudlt1y6yoMhVcwAmRDADtuXP/UTXK23/8Rz+D0Jpjudvaa8YWFvhFIMjK2fxRyw2/1LQggPd+v54ZdAE4ClSSlTb72pSIIJq7RCLKuOeeLXyqCBiAGhHehuJ5UWgAQQRLap0OWPMog2hYASaOUUlH4gksRBEJ3uQBgIlail/boUwLxdr0MEbbxTKSY31kVYx5seGvHScF636idZKFUoSZHcB5HqMYK3VESKxb+N+AZXWiRwEpra4m0EKVT5qYF104wghWiCaku2glWBTK34KPreGVYq+SzjE4x8ZHMDWYKHU8TKqskP8E61eVA5u8buq4b0KS9ElvnnKiZmFhnnkdw3sPAe28tM7NipRQxZ5k9gBtObU+9g++cTdJCMdUmr+UBxOk09wQdEZ6CscyEzx/BW8QV0DoVI0lrGK0/zZL5vb5uG6adY9ZdjBEbDERjPpFxR9BMQAsraCdhts0Y7XC4CA7ghhuqG6witZOpC81venUPeZkgiZSOMRaYXUdwQ1UZIqOIta7Dd7dOwWyqrjNvrVHKsPbfkQXrgu5+MQzbM7H0dSju9gguKTuPvfNSq2ntwyGlRRCYZ2B8QAqviLjWTYk8gLgOj4cYASGEF/SeYlYHryNoTqchrALQQhgp1DsRC1sYBDm4oKq8cLBCCEip2BO5UNhrDm6mruvaWC2lAKRwmmwI/+WdWgDTxIG3WktAylpy+rKOAQvg8/bw3kNKWYuAUJw7BRs0gBCAtOkYgf5a8soN21kD9PURJ4UKp0LvHMEFJwgiCGaltdYkfrvVM0YAPUwaHcLFlK3cpwQuMWK+nv4kmQRV4ePj6JZbliXdNJjncZ4NUD0V2twvB5dzVa3rGgGM4/1+vwPrau1YtTmag1Wz7uqfKb3TH4PVrmt3+Ql067oCExGtYwqIPtVm7d7+Dp6D64G+BVJagPs9IlK4AFN2s76Ci8E0cXvqMcAJoR3myzPqDbdX19e38zSkOI/HDZXXzL5Kf3VvFdKRXzs9i4g4DMMOxxhj+gvYWYzD9Ffw/Jj2mFpLufdbGnNyn+nDD8lJRbeuST1KZEBE0jmXeuLVMQe3c3TNU6tB1MasTVOFwiTIwTRhkkKzCiGldLrpYIw53AEH8Evmq5BJ+dqusvUX+mfwfwCQU4V82RAkAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/knight/south-east.png
var south_east_default$3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAByUExURQIJDcS1jtnLpurkxIZ4Wry2qYuhogECCQUGCyQtMEVBPGNaR2l7gRsiJ1FHPF1mbJ+Tc7GjfgUFBVxOOT9TUnJmUSMtOi04NZe2tTAxNgYOEEgvKgQFAsLRxkNHUXGJfzo8RISIjNbc2fj69n96bQAAAGeUPf0AAAAmdFJOU/////////////////////////////////////////////////8Ap3qBvAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAADB0lEQVRIS52WbbPiNgyFT2SXWhYOcYJvGmBvUxb//7/YUbizMxuLll19CPjkPLEtv6L+ZmAvvBuvQADQ517/ES/eoCPngT8O+oE/9281XoCBI5HgeAQ6F/ZvNV6AFcl3PU5Ig8OvgNrCoA/vkEyPKVZ4n3NGznnwvwKOk89EgYjyEICzZbK0GkpHzjkiGjIz0tFwGVINMijnKGciZsaH4TKkGqJXsOucc35mBnNraxUFhYiUGwTcM+a/WlurbH0kR9RnAbB4xmx0slVqDVPewARAOp8wz62tVWoN2kWaegCXTvTHcBlSKJoVmnzf954mhlGfBW71OaKpIyLqZ/C7oFaokyYPRYSVs6ZOK41X6YIj8kg6+OjLm+AtXa9EXUHRrKRY9HdvMsHxcr1OAQNSSjx7P8MYRgOstzEkFL9xZSAfYS1lA6x1DAFIiblkbbPVUhvU3G71ZaJc8M0yWdoXN5fOJe8XfBotfQGOnOIkOmOD4JvFvQR5ko4cdXixc9jgjVmUc50OIh8sk6XVwMUrR51PMr+9OuqNZeNcHjyLIJ2MvLZKraEvg982K+8hIpj/bm2tUsfeE4mCXuePyCUura1VNKWcAjM7Lx4QSW/2cWRNB8BMRXS/sjgLrAHMLECahye4N2hY4nZModc6e/1vbMcmOC7LuiDhsrU3SsQ/hsuQbhAPT44gOWcdkjfBZ1tjjNiOHq+lvcMER/Cy6C4OBF3Rl/tquFppZF6eoeN5+H7Hp7V3NOAtLDE+NNZ1gbtsKTLaulduYZnKsIEPsLvj+/H4ud4PDbov38IsuXtydwDr8/IBHHarcgfeRsx9LkXdLuF8Rhm8LOcZ6+4834FhfX4fzgVgPcDrGkn4OOO/awynUzofj3oV080GGIbSx5S08POVbgeOXxUCp5POAhGZlqSxz84eXOeP8/EIrZGXhXUsuRTh5nq1L3/lEIjkXHheduQSU9pPgT247eEpxhgfJZTyeJQ+Rm65FtxOnADeZk/RL0Tm0HAG+Iyva2fQaW5gr8H/jd8G/wXwmlZG/6eaCQAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/knight/south-west.png
var south_west_default$3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAByUExURQIJDQUGC4Z4WrGjfmNaRwUFBTAxNlFHPOrkxHGJfxsiJz9TUtnLpml7gXJmUZ+Tc8S1jiMtOsLRxlxOOby2qS04NTo8RCQtMNbc2YuhooSIjEVBPF1mbENHUUgvKgYOEAECCQQFAn96bfj69pe2tQAAABay96gAAAAmdFJOU/////////////////////////////////////////////////8Ap3qBvAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAADF0lEQVRIS52W4ZKkKBCEs0pUGhFobcVR+1yd6/d/xQuc2Y1YLWP7Nn9MxCT5BQUC1Xj9pXA03tUlCFwO7boaJc4Udh1HvnXl50WZETRut4vEhf165YaIoVHRceRLVyABsEQ1AJm8AMl5HwLdgaaRI6ILatkFm2Z91FUnTimBxMy2VdZmGeqqj1JGBl2wtm2ttRkhPoaHFBI907K2bWlDQP0xjqNUqwCSiiDXlmWwmQO6aISQAJKyCqAysyEEhaF7vFcquaACgB109DGMXSORR4uctSpMEawTiHqYu1E6dkeLnHNKKcVah8x1uN+72D+PKQn8h5xrE8nKOfQAZvGGHL3ccEuEIrZKRdMBGst4DCWdPCKCAxBjNIDRy/J8a8ZULBPRCyB0njIyTYMfx5AEvnLaTwpMdJ56jY/mnV39pdyYLgtMQP3xP8HI6ciNQFcJKcHatRrjgnWkKzTohZRgJa3GtFniZhrquxSSvMQt4MDUzNTc5JsseWm+kolpqJZhNJCWKIO5adkSUb8M6aGrpZDkrablwCpDt4GWuRdfKwFcc+OyzKssXUtdz/conTnBWmPrlffkgweyubo/pLf17Kx5ZE4ge8/Yns8Yb8Iqz84rj5Fb7wneM6O+eX//Or2/SQBfFKNPpPPMjPv9/e9IMbapTsXM5UWLlMw8AsU0TUDX0XLRXCUvjzFd410D7AxhUy9AZg5ak9baQLORWqQArgQ4qzPSBPTPXthSEVyNSTVSqrWaAZgPaZEnazVA3evl87MZ05PadV337yklgIR5n6aqUkvFNG3b80Gn2BFcqUp11ukFB1AUW1IpbOvBySvgG9WfAxXF7B7bphrkv+fOIPBEdMz73gxAr7zd3A0n8gDSM73+iq12/RPQmmgOW29w6h/HNQKLMa1i76moU92a0iEaT+/O8X8yxpiyTI3uq8Ohquu0z8dTcAZLV/wUMM+p9vR1/gyaQrG3WmtonX5cPecq7fMhdwJfZIppUmrbaKNt2y8XgHPbORkvoqIopqncP/03d55QAPemnPry/kca33U58Cf9NfgfHXBcwIA+nwAAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/knight/south.png
var south_default$3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAByUExURQIJDbGjfurkxMS1jlFHPMLRxml7gQUGC0VBPAYOEGNaRyQtMIZ4WnJmURsiJ5+Tcy04NdnLpl1mbISIjFxOOWRjPDAxNnGJfz9TUn96bYuhogUFBfj69jo8REgvKgQFAry2qSMtOpe2tdbc2UNHUQAAAE+mxDEAAAAmdFJOU/////////////////////////////////////////////////8Ap3qBvAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAADTUlEQVRIS52V627bMAyFjy6J7jfHdat6aeo1fv9XHOgWAyIrSDb+MKxjfRYpUiLW/zS0wrN2DwQAerT6X7vzBYxxIXE43mXvyEpryYU0sJyr9uNmd8AVTkovEQQ3/wIqClF7CSFM7DvbFVVILDPGGIQ3OBx6k3qasikpxkphDMAwnHpr9qQxlfJSCivMBx3gDr01O0opqZRSGOdsCjqYkPNrZ1orrCqEworgnPOSg9c64O1tP62jBMaY5zx577P3Xpua3zvTdkKgXZFeG4NMIFBy3gfZCsqywguTkjIZgrfeiCo6QTaCskxwXkbijCnBWwNXcz4+AGcvOBc8jUlKOZYNDM7l045rQOVL+SVESokyEkL2RoeAc6cCmhU/2Gx5EilslkdnPODiw129fHyA80SBbQZI7ycX3Z5sQPXxQQkIgTYVcHLLx9E82pyNhE1AQIwxW8a8BgwegutFIaTtuokxv9DR0vg0QzttD67rrBTWlTgvBAtBn84dTzvgZuSoF1yEEMwnOp7eAdWyjMQJFgw/97g++MMZloL5PKNTcH1wXkbiuI6euCWjc9F1wNmNfhR8u3HMgPz2pKs/HC/MpmCWAVieA0F+Cv7CmU3JYiH73ZnWCrP2xPEXkZIhEnKapj25E2bnaGMsnS1Yay2kfAq80MGw3I4pAemHHPf7ugPXGc4ZVxKRhsice/nYg6uCM84RuPmac7dH7qV5MiB3RyklDGG9Gu+C0zQB7vsoA2l4ErxgCokZmxKdRncA9pdqF9y66hnUO/ghfhkMz8V4UTFGYIpKYXs1A947ZKtsEU7T5M7n49eX+TxiwDT9flgAxElZa0U9A7gOiKD/HHddpxkrHWqt1VRe8etkiJ2mWms+YL6deQvOiEEDtSKez+Z6Oi1fp9MJtebXNsyb4XylxL3iEzgPkLQgFuBwot7VOHszUsOAa6XZx3dEyzn3y/FqsAzm7bVp5zejy3etDAs9LR3kBByPmx9oCv32N2oZKN2AtNaOdKbsRMPrgLZF3g4vVDU6hJ9kfhslZ7dgm445xuikFGWrODLDtY4x7uq1Hc+KQCmDpXxSRg2BbTL24HqhphNlJVpKqbUmN5vs98DNtpjI6KX9+G135Mf23+Afy0NMuRRzFzwAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/knight/west.png
var west_default$3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAByUExURQUGCwIJDdnLprGjfgECCXGJf9bc2YSIjOrkxCQtMBsiJz9TUsLRxgUFBTo8RCMtOlxOOTAxNkVBPIuhooZ4Wp+Tc8S1jmNaR2l7gXJmUVFHPF1mbC04NZe2tQQFAry2qQYOEPj69n96bUNHUUgvKgAAAF+NeHsAAAAmdFJOU/////////////////////////////////////////////////8Ap3qBvAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAACf0lEQVRIS52W25KjMAxE1Um4+EaCDYONHZjNLP//i1smO/sAdrJMV57aOiVLFqrQ8kPR1vhfvQYJ2FrfegUCOJ0vW/ev8iBQlBWyKbMgasaFxOmktidPZUHFamqudKNMRMZeFmqJigI6F5D1oWGkzBeZAdF1HbgQDXV9mkyDdProOjKmaaA/PpLtyYDD0JEpy1Jaci4ZkzSXhUZH1lfWWjh3IONCzgGCEYB0wlegDFLe7TGQus5RFaSUHl2fHNckOK1gCEWssesO1EhsdLhi1aHmKGoZcJeyCmDsCNjGflbSBADJEjPgQhrwviJZ2TSXAydF4BylnP0xMM65kKiMOQ5SbCt5n4nI2MuiYDCXhq7pryoLAjVHaQqOTETOni1gKiv4JfmKWRB+nRshLjgGLoQKJg7B5WBXISDvBh7dMZCGeM8AiINbjoYh1ljG3/bsqRfgyLyVcr5M28NVOVC3NPattbahdFuzoHY0DCFc0aTvmgEXhLBWiSYzrGk3jhwPYz80/FhXP8k9Fw4AliaT4ISh7VHXZ9SnHrxKzUAKBLjDL+prx08PwCZvmwCVsEAFEI0h7izgnki5ByfEPSUEAgcYexa6DUqB5MFjbNuyx2NsAXyVibnbgwpiBuet1o+ouFkh92F7Z1GwK9j/A8vEUt6DE8EboNWPR0QD8Fk2+yp34ERMxJXKxnHse6cJRZ36uHagAoPAlwTwfIsZmOdd2A5UTVz9X1fMM+fGWFvAe9zpbUYF6nu+rgxr14w2jsL8FqSA37fzOT5fRL0HwDkv3oKK9Bh1u8X/VvHjYIxzTrv32ILLQqSUUkRuGAatNa3aBqXAb1GkU8hT2YN3+jH4BzWpdxvW3nN7AAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/pawn/east.png
var east_default$2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABsUExURQEGCQADCH6Bj9K4jUU0Oq/Qz8CkeW5PR4FlTquRay8pMvf68ltBQaGDXpN0V0ZhbObQon9cTfjpwgUGCW2WnHNANTZMXRoeIUQoKVsuJCZAUvHdsJ9/OLJoRlEmKvbn0WpSPAgUE6JgMQAAAGVnz1gAAAAkdFJOU///////////////////////////////////////////////AFgsDQ0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAfdJREFUSEvt1dGOmzAQBdB7a4LtxWYHJ8SbpSzd8v//WJlWrRSNEfR57+MwR1bG8gTrfwbPhaP5gjvZgyD4XPubHUh8g6nKGgTJ5oLW1mQFwjnfvnQIIdY6ngtbgD4EXLpXtq3Xz1QhbO9FNihyBnLwkq6X26V7vYrXpQZhC8RlvO0cWYFRhAXeGdr2BHTRC+/j7ZaReqdeSQWWa7i/PR53JhmGwzAwpUC8vwOkPwX9lGxExneiOQWdTxbj/CBgjDpWDRY5ROv5BiClJNpcVbgi5/zi+cCUSo7DFYDlOI8sUngcFkkS7XRNV38KGgN8kB4eveKq0Kfk+SAtHd0JyDalyJkEoPeoxQ0acmbQDttSgy5NBbrK9ypcaZbMH5zOnrjSXVP5gVKTNQh8iqSUqiu5AmEtRWTotbvfUoG0ni6KudbWagWWdTXBOUdpKkeqkDEMfvIke2sr46nAQay1nGltpz5jHSI0wcvSceayeNdrPRqki00s4cwYozHqgJQa3UuMYowp0Igk0d6VAlEuomyMApeyAeJRWP4BCvzJRkTEH4YuxgLKe2y9j1lpUiBCRP9nOGDOOYt2lRoMbD6BnMvqKFvOHB1OYDQppaUsutCaXnMaXMG+740xH93ILc8NJRpc19/9uOhft+x8Kvy59C97cDdfcCe/ANhYbiyH1e2zAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/pawn/north-east.png
var north_east_default$2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABpUExURQADCAEGCSZAUquRa/jpwtK4jZN0V/f68oFlTvHdsG5PR6/Qz39cTUU0OubQoltBQcCkeW2WnDZMXXNANWpSPFEmKlsuJKGDXhoeIQUGCbJoRkQoKQgUE6JgMS8pMoFfL1JCL/bn0QAAAMVomfMAAAAjdFJOU/////////////////////////////////////////////8AZimDlgAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAACf0lEQVRIS+2V3XLjIAyFpcoQUPhL4hSn7aaN3v8hd4TbdOxkW7bXPRfMCM43AkYIkB8K1hO9+gU/deO7mfgUAlxX8QGXi1+ASIOxH8u46QQRwJnBE8/rsO0E0YUQm1wz4Ha7WTnvguCCpaRyueXsBNEFWxSjnFNBPeF2t97sXZCVG5p8IkTc7Ha7DhCWYEDY/QfoZ84ncoj7w2G3OyxNi2gWjteM3lMDj4fH/fcZMVuilLz3PiWqjAL740PPrWYO1aSUTMl5ZM0EU08BYGaulohqHgYTTiJyeDo+LE33QIGYma21IdJg2KEgPmPHVkUgZ1ZFJsfGouCxZ6sz2QTT5FxFOTw9dmWcHyPokMEiCmBfRmaM7IeAiDAygOBzDwhVwThNL2QMImiZ/1kb17FOFcMMMfthojRQS4VPa+M6FgHjLQO4GOM50DCTXWCtAQRCSX6EsQyD0a2+ro3rWASDPnqg4n3NkF0aPCI+fna8WbegtBqBYLy3uTWtEAsiDN+/DlUDk8so4MBHGrxfWv8FoiXv32JW8s3EakzpAjFYzWgVFHAKXpvzrPsg2kqlFGoZRQC40Nxhr7oLgh11p977MpOilbvyLMNZQIm5kR9gX61iiC5t2oNkbp2jD0RmPody2WzS5ZKSFo7gUwcIgc5jVb21sWrJddSqALuzScYY44wx+oNgJziCndtx1CHRGQU6QGQAS0qmBmqv6joj5hGt1YYco/51tYGvPSDFl5NeSoy1VnuaIgqum9wdUPDEJZ1epglwmqbJOgXXhXMP1KomP1wuMer/WB2KHDeH/cqzDN8FUKsxMZKp7YgC2+/POEur+l1zfGNYT/TqF/xCPwb/AqqCUJRMO0WCAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/pawn/north-west.png
var north_west_default$2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABsUExURQADCAEGCauRa/HdsObQooFlTvf68ltBQW5PR39cTa/Qz22WnNK4jZN0V3NANUZhbFJCL1EmKvjpwqGDXjZMXVsuJCZAUhoeIbJoRkQoKUU0OsCkeS8pMoFfL2pSPKJgMfbn0QUGCQgUEwAAAJ+oIz4AAAAkdFJOU///////////////////////////////////////////////AFgsDQ0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAmBJREFUSEvtldF62jAMhSXZiewiMYhh6RzKGHn/d9xnJynFhNXrdc+dxPk/ObFygPGLgrJRq2/wJiiNZX0TwkdzPQhkbPNux7YtnE9BJmPJ4YzWg8BZ3vvkgPZlU5DrIAI7sSJCmklotz9eakAgu2MvxqTjOsR2s91vKkAga7tJ1gbHeDhuj8efeOf5WCwCMuYG+gW8866B6Mgu5ATC4XjAz48KnsjMZ53AEfq7cz4DXSCxk4QyeHzd19wj+LDbZVYoOJcm/qqZOEJwXcdKRJlLYDlwHURtOolOVZvEwYjb12PFUUG0GZqTy0pc+jhKY1nnXhN2fT9va+bGsRz4BGyQYdZ8fW+lsaxzD7xHQHSdMqPL7/Ot7q0CoEjs+1OMyE1iXktjWS+CzgTsDDNyo4iV1zGOaLpBIUZ2CKzq0tPeO9ZBkM42cLYpPEZgZQI/3FtXQbCJi2oNEaY4SCB9DoLtRBmYjBlcCo4M5vD5YLqrppZ0ogDsrDGDT68UAlaBISiMwDEaQxkcAbgCzIsJzMEmcLp/XDboZrov35UG0jDQQu6rNidzg8np2LBPjdoFgDiBxCx5ZNWS56Bzzp2dc53ElADj79JY1pOQUsi1tjXU/A8IYdI5hKAaA2IdiJEo/+OcRUQGn0ZWPSPGkOP4ElMiDz5y5WeFoJL/AeKU5Ijjw/0/A6ckP/VWVP2JYd8eCtMqeAIIGkI49app3RlgU7M52Dv+c+2vCND3V1FlePQ9NJJAB9NdLpcYOyuheXi+7CkbWRB0EJEYKYQybGatd9OXtaj8adaz/qf6Bv+hL4N/AWr2XF4NfD3JAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/pawn/north.png
var north_default$2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABmUExURQADCAEGCauRa/jpwtK4jZN0V/f68oFlTubQom5PR8CkeVtBQUU0OhoeIa/Qz6GDXm2WnPHdsH9cTTZMXXNANUZhbFsuJFEmKi8pMggUE7JoRkQoKWpSPAUGCfbn0YFfL1yOrAAAACpXRXUAAAAidFJOU////////////////////////////////////////////wAN0MNxAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAJzSURBVEhL7ZXdduMgDIRH/NiA3BKcpN02u9nl/V9yj8B27NQtOb3uXAWYzyIgCeRvCvcTj+oH3Ghr/QIEsFmlzehzEEobu1qm7iEQ6I12yt/WHwIJIbBosE80TXXPG3IXJBvcJBOn7VJ3aIKIwTldlJxRo3jQPR+Oa/IzsHJa6wU8nM4NkHycA2qtXRiZcsbz4XQ+N8Flq9rN4PHldD6/3lz74C2kM3EBX47TCYt2wUIW1JlgvYBCrrldEH4spHPGqOh9zTX8WnN7YCaWmKpo9DVgfju9v7bukZi991bkvWcuHsJl490DM7igIuYaMGec2mAmQSfN/+z0viH3wUxSjEWXGbyrzn0QoN8xaaeYF//tE3W4HsyCsgCe3kpIFaoH782IcM4CRmtjFDimVEx4aYFwLnpgKCKOoZKtiIQkHQM+SOJEBnqVElELRNASL8NHKUbrKWNUKRngdXOs9yDFwmX4kuTKS2WMygzuAugvqoOsLU1GzFqHAmaM45CQtFu570G5+jJvS8RQwAzYMMgZ33wfwCqMNtS+8aduD2yN6dsgjUqFlILqa8icMYQHQHirUlHf16r68JTsglDMyglnIg+xemhTx/sg9eY61aN3atpgIwFEciVsrl13vSbTjzz1nCZIyhjjYxHzoOpdtkFYo7VmUxTCkOYsaIPBac/zEzCEULOgDfa9cUOaGrl2g+nL89oEJb96zO+jM7ADJCL9bYA0RgByMirGaKWJlE5HrfaIMaQAeprlgy3JM2X/YlsPpikbGUlfr/XVAdcMuHTH49q1+r3MyVZtuY4YZd919l8rYtHSkG+GrfUzsKkf8At9G/wPWuE8C+McjSAAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/pawn/south-east.png
var south_east_default$2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB1UExURQADCAEGCSZAUq/Qz8CkefHdsPf68m5PR+bQoquRay8pMkZhbBoeIZN0V0U0OltBQdK4jWpSPPjpwqGDXlJCL/bn0X9cTW2WnFsuJAUGCTZMXYFlTrJoRlEmKp9/OAUIBXNANUQoKaJgMYFfLwgUE4F7VAAAAAhlThcAAAAndFJOU///////////////////////////////////////////////////AINWl9kAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAnhJREFUSEvtlcFy2zAMRLEOKJKyKFCkLcthkiZpq///xA7lpAcT6Wh6bfeg0UD7BgYBwrT+peg+sFf/KKiEFLUuHH7HQO3nT7Vf8ICPF2LDH++tFLA7YEtG1hjn+9axqQ2jOxKGEJhH4RhGrydtwEMFpyCjSS7LOGYnjaeqCaJ7OB4pO3c6n8+OOTqZtZwKeDkeYVLaSGOMOXmrkA1In+BGVo7ZNi4FxOWyLORS1SQ1Y+TQuFrwejguy0Le3dCTMdGYPeCBHpflEZmd9y6l0bExHntqXOkRmMR7IiITfa5c61JAAOKSzXV2qPclECkJWxDL0zNxsoHwAkgpoJdd4IpnkPU2OwBg9idoJX4B0tBnl74hpWS47/eBr08LEcnsXZ2CZJin1qSBqGcBEuFYm2li1hJq4EQrQiGaKV3T1Vx3g28Au62NmTwywl7wCSGmgnEEqFBR26+Cr/DJ1yJFAALpK0AB38mlAkzW2gpz2gsuhIwVk/ehFBFx6uk0IAwoJ6w0+Wg4l2vO+yYHKcVrJJymYnpjtjLvPVUtyHa+FkBCqdffi4qpoIsFInPcMo7yBdmAVKZpwizelLo1ohd7b9nUgBCOBV6CCduqEquu1RZcCaDezmKn2gvpolV/bAsOb5Bx9Obc9V3XnbnMsmsh1yGXPlfdnhxtaV0a+I6xdzHG2NdHdC5rfzttCE+gsK3jYdvJKcbdIEK9+3wDXVQvpA4W750Lg6vyoWjDqoDf63iGEIhyziGEK3ae6kJkLYABP4ZhGPrIO2sEYY4ppbGu1eTYa91QwOfuAIQQ40g/I7MPu3fOBetad9yn7g03KWElpGifS9F/8A/6BcepeR27iaE9AAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/pawn/south-west.png
var south_west_default$2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAByUExURQADCAEGCff68jZMXfHdsMCkeZN0V0ZhbEU0OubQoltBQQUGCauRa9K4jaGDXlJCL39cTa/QzxoeIW2WnPjpwm5PR1EmKiZAUi8pMlsuJIFlTrJoRkQoKZ9/OHNANWpSPKJgMYF7VPbn0c7o9wgUEwAAAESfEx4AAAAmdFJOU/////////////////////////////////////////////////8Ap3qBvAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAACcklEQVRIS+3V3XLbIBAF4HMcUGC1YNWBVMbOT9Po/V+xg5zMdAzOaHLb7oU8Xu0nIRArLN8MXCe2xj8K0cm10SkiL7/48grtOezu1iSNHfBxjU60kLv7Wu6s8VZw87ZteqwQKhqi7KNOU1tSo8li9+P+Dgcjzjn1XkSm7ngbyN3DPa0Y771PyXmjU+7JDnxEVjXGmJQkpeS1e8tr+HN+ODLbMVRZXTI6SUc2kHdHxgtb3Va4LDgwJjVmvjCjWjZBPJ4Im3T2KVlVrzrkTXDhmYCWYrSuvqqIbISP5BPLMAIgYk4pfL69f0cD+Xw6AijlBXgiY062dFwLF4JgtMGSpNesXdeDZyDaOqMck48yH9qaPnwGtUKTjNcoN7ZHm+UTsMLkvYrwxp7swFdAR480mjEDDNqVLcQrUaBQ/qoLaZOP1yU1WsgzlkoLCEdOPm2FdTkOBJwTEUdNvjfWa0gipBSM3ZdpyjnLVojAgsG4Ya81ssCn7uw00AcgW4dzNMnqJPC+XBethdf/p2lCHrBA02yiCEvZBBdrh9pLsffJmCjZsf/qNMmPFkw9m9nkEEWakjXaLB+5LCw2mGCysZv76gqJt1zbVfZRJG6HLMXusshU24a6sSc78MSioViz2827ZEJ23cdsUzhhCsHGGONcD3Eu2yBP2IfkQwjRhRCCncehI9sMj4Bfm/Hs1u0c2Rtrm1kIxFXWnpzMCq9ruvA3OWj9yr3XQ9DS/Sq3KTxQLrMCF+MwvBC9Vt7ChRCr4/s7ycPhQCfY+IzLghjS29sb1ykKW4daA4O1NqIuSRxyz92Al03yGdfn1uhnN8R/+EV8G/4BRfVwU1sGZtsAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/pawn/south.png
var south_default$2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACBUExURQADCAEGCRoeIX6Bj8CkefjpwqGDXvf68ltBQdK4jYFlTi8pMkZhbH9cTWpSPKuRa/HdsEU0OpN0V6/Qz+bQosCub22WnFsuJCZAUm5PR1JCLzZMXfbn0UQoKaJgMXNANQgUEwUGCbJoRp9/OFEmKoF7VIFfL14ZGs7o91yOrAAAAHUFVVEAAAArdFJOU////////////////////////////////////////////////////////wAjyafQAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAKnSURBVEhL7dXbctsgEAZg/S5gwJYWCI4jR46lNOlB7/+AnUVOawipPblt90pi+MRhF9TMn4ymbLg1/kF4+3fynlhlb8Dlax4F/HLRFUKqj2kGsf4DAW2ksZuPaAG329SvgRZCK6Pspm1X1YVXITrSTgrtvbdaheqYlxDru+12yw8UtZMyRiGE3oWuJjN4d7/fPswzeorxIKWUzkW92wVdkSV83CPBgaFzzu308Rp8fLq/3+8fGao4sHTOtc6RvgZxOl3A4cADOufIXoHz3CTH8KSSFMldh/Nmk7LRd+M4ioEEOTMB16Y6z5vT8zFJO47jSK2wBAB9xRUF0CQ3w2J8Hkdr7YSvN8Hj6QwNMI5CBB7QXIer0/M+NTRhGEfindlsoqq58lidzwIOwaRUGCJVHbCEaVf5AwEiRmcM+a5+sHL40i5rDBot4uQmg76ejRK+pGyYBAmEV4ZtbZUF5F2FYQhYvOIVYEjvZbFGhtErjRmeUwG/HBb7TuZ5xBGIkXhRsFZz8GNbkZcQEkC0lPYfRNa2y8Y01tp8aiWUpovnCoNyQoTzwWia0uWQum6yS9qgzNE5scy1FjmMMWBpgeLC0bp6Fjky2Pbd+UZDr9zRGafDR0PmuyrEAtH3wnG1Kh30Uk1l5Iue3orc9B3P1Sitda1uSojzQV4Fs+57TqM3qq9WebVWrfWW4noYZBTB+752sAr4tNSMENR1isP7tu1rsgqFlAeTQikfhboZWinTr4Pvch+EuAHyGgFLh7jA6MxGtLXtKXb1G0MNewgipjBhaltUiqCAfMlBkwcCEZEKgW/IWvVkcJtuOWgtop5Wb0G69p/L4fcfDzyuDlq5YeBFGtLVAcup/kxdmqZRKqWDiK+fvNMSRdvvTzdvUVXv4e3xH/4lPg1/AQoQmG24KDNeAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/pawn/west.png
var west_default$2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABRUExURQEGCQgUEwADCCZAUsCkefHdsH9cTVtBQebQoqGDXm5PR6uRa9K4jUU0OoFlTvbn0fjpwpN0V2pSPJ9/OAUGCRoeIYFfL/f68i8pMgUIBQAAADROzVAAAAAbdFJOU///////////////////////////////////ACc0CzUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAdpJREFUSEvt1duSmzAMBmBFldDB+LTNtinv/6Adk4udYeQs5Lb9L4W/AYwsYHszcCyczT8P4XasfGUOAeEHHotfmUIkpuUNiKJsjoAzO4GQZCQtvsxWHAt7gNaRlHPOEN9zBpmZpagmcw9lCCENKGutqmZX4MosUkfUbJFoUVTbQFXa09GA0S0jCJ2k1lZVNV2DpbRKOaeUksgFiKWYISKYfbQG5yGUkgF/wt28MaGch6QEI+aNOoQugkDcWgMAMrFyw7h1QthGmMnk8xMnbR5B1AGVTBacuRgSMip1Gadq4iK4gWHCBAsAUfyCM9ixoCNiamxX4AbbeEYAa40uwREUkXt6By5dsLZyHRJjrRSf4lcQVlwrFZwtmNXRGHrvGDfqCwj4i+8IRWYdMIXE7EQlPlNzCM6cnXktMtmeGAK7SHZebZFJ74QQPxL/XrO7u1oJp2MIwcxMxzxuajnHrxnC8duQ7MO7L3YW4pgA+th/O5r8kTySM9gedR8Dag8J52MAwVQ15x3yah53TwD3zcGse1J3DGUAQe9wAxxbY713H313XBNCTLyP1T8AdwAEzyfhhkYZ85jKra1dcg5cCLcxTXMfn8Nsdj5CODLwM8crz0zhd/kPX+Rt+BdqbRJqOaPYXAAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/queen/east.png
var east_default$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABpUExURQQDBQIGCTc6Sm91hiAmNklHVaSAYSEnPxQXJEk9PCcuNh0dOC4uPhodLmBNTVlXZbaWX1pice/ZztHJofb78gUFAxwhKPjgs5RvW+bCgnFeU4piZ8qlotevfQECCZiowoiSnOHp9wAAAEbba+oAAAAjdFJOU/////////////////////////////////////////////8AZimDlgAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAACTElEQVRIS63W63KjMAwFYI4tYwISSajTurTdS97/IXfkXDah8pZm9vzJhPBFxhaG5vhgmuWBtfnfsMHyyDIVCIcvqA0B57+QJiQiF8IjsAUo/rukCbtNDwwPwGPXgjw/AI/SooSquAIxEhE751xN1qDOD7B1VLtSGzYE3oF2He0x2dKEDRE2T+nAE1HafAfGCOo7cC+Snl9MacJDjJEZLr9sdq9zux6iczlvTguCgz09Fuxkzjqd5ALjzXY27Do3DGDnGGOtfyx4BIYBIs7hfZqSLU2oFIA4vE3T+3cgMOaUIIypsv41yMx9+oDg7VuwAXPw3OqK/Fj+eI4JtaBPnmeAajeWBbVggT2DxNvSgodyiYGZGbu2spAGbAg9tyl9zIzU4XU9HDDmspAj9rIb18JG9zeIMAFg2TyvhkSDgzhPEBGZV0MQOXdqOZFZZO1QD93JtamFjCJiu0+wibG4Ue8NHeraioingsQ+IefMed2NfADpJqyt9vwEEYKsg5eRAuOT6iy1Zl1AxFNBTf8TGSGsgqXgGZLohhWCYDkPJTWom462UK6VvIPXqQG0efQz89a+Pe7hcIXkiLak0Hb3sBnKE1EjkrN2Odq8AuLqkGcAMWy3+uX2nEtuIZzL18VA/BtL3sJm0IdGmZphIBV777235R0E3BWGEIL3v34nlV9B3d500xhUnqn3bL4qLVuOM466+jrYkhj1j+7P0nyCXKBuO5eQ2efLPoRDecoRUdiXONN9gqc33FLmEusKDXg+cDPUxRnnLOHqPAz/AO/XRYO/9MNKAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/queen/north-east.png
var north_east_default$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABjUExURQQDBQIGCVlXZWBNTUlHVW91hhQXJC4uPpRvW0k9PHFeU6SAYRwhKCAmNicuNraWX0c0PhodLjc6SlpicQUFA9evfSEnP+Hp9+/Zzvjgs+bCgh0dOPb78tHJoYiSnKGhqAAAAFbng9gAAAAhdFJOU///////////////////////////////////////////AJ/B0CEAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAqlJREFUSEu91QFP2zAQBeA8Eue6hEvxtXhjZiz//1dOz05psF2opmlPSIEmH2fsy9Gtf5mu/ODe/HvYofzkY2q4CTx8LmuInqLD4FDfvKa+N8oBhDJcYPMXND4bv028QLa1Ym4tugHXceKTGLGu/JofyweYFlwfD1ihbgGw4ijl7ZQmHJ8OyFE8TWN5O6UJV8CbmUD1xkJvQjVGFsxLa2cacBxFlgViZu4kOMr5uS1L2DMIdO67TT8Meh9kRdmgM5jCp06qUsIUhEAoAUGEq9Z6Z2/BYCIS0E8Hpu99WfYmZC0PIG2v9+UjbbhCSb1HCGO9ypQWPI9XqOhaj7QhRsBvYd+V91Ma8OzHrVOZl5/3HkcHj5gSFHgdlnbTNWAPxMi9DDj+EmHnlc804RlQZZO/BUwizr3afXC8QFX0hA8yN46khmRqMWoIhCKvL621VhBjrmcaFGMvw/FX80RqGLIzXoB+6pqugunFSFtKHgLgZeC8K1PALr2Kl4IWQoBfXPVq1BDxHaayLAk8H2v5EXYxH73LkJ0O4LAMX0FEI3RuX7B/XN6+gOdRCTlt8gbxKIFHWeq17mEHHnwqmOII1QMy17NuDwGTXJADij6Ac24Flt9l9+xgF804+TfoHKcVYuzTe/kJRBTvzU7vkOcfCVd4Lf+7Xn9EjJ6jbdsadW/8E2OMfmrNjx3s+z7D3ACaNpWwOTt2MITQm8jWOqrO5b6pqzFX2AGcwmHZXIacO43X+OOucu9kmDnzhwxZjgvei8vTu2+TzAu1wzzIwD+Ro/kLmGWOmc3zbFDnnBuqtqkgpSbJTrADVOV0apYsj/UCc1WebYyxta8FZKO/rxe2Xe+YAKnVEaPYMAys/nA6nYb7IGmMHK6qaTbzUj7ShqnqPuVtpg3vyP+HfwBCADJldyOVwwAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/queen/north-west.png
var north_west_default$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABdUExURQIGCUlHVQQDBRQXJFlXZZRvWwUFAy4uPmBNTRwhKLaWXxodLicuNiAmNm91hqSAYTc6StHJoYiSnO/Zzvb78kk9PEc0PlpicSEnPx0dONevffjgs3FeU6GhqAAAALBk3UEAAAAfdFJOU////////////////////////////////////////wDNGXYQAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAKcSURBVEhLvZbhdtowDIWvE4ICthyNQuN0Xd7/MXukpGfUUQrbOZv+QK71cR1blsH8l4FaeDb+FYjd8d0BCwQbR1MPfA827SGoJTony5Hm4yo2IDKwP9UpPojzqoL0CzqHc8G5VbKZZ0SbaKrHNVxwpjNmAJwJQN/Wwxo+2IYBjCU6l9sBdSGZwSISd7bSV2fwAONE2E/ZUX8c6YwULkqCE7Wb+e6ACfIy8DXnoJa319ttk1ILGuhOYAKPOYtIAb1uDB0QSYiIOILFHMs2xwGb2PedRt+DifQdnwPnuW1tMQFEoqKxzXFBC0RmtNG4WA9a+KCWm8Ro4E4FuKKCiGvgD0Dczte1Uu0nvCRPm0EpXM/6nsw8KVtn+CCIsqS381Ks04TeyXKkGTReM1EH1lqd1LJOcUF0KeVMqUcph0PgiZ8EGzpfJRHdYO8ozN7JcqRjC/zs0ikoaCfSK56tsuxieg8QWUB5GiQ6We18gl6hbwQ1zHQ6waBPcutZP+uivhx1suv77VnWz1Y2wwKapYh1gY2lA15S6g0sZhmW/vEQxFtKCXhHKQYS5Tyqc0XWIOJp0NOfgFLyQUlRSxb6SlZgE3/pdYHEAJds5DLXqbKswGPR44c+il4AxRDJ+jFx+ELWIGJEVlC74z0o0/QdqNewGmrLiJ/gSn4t9g2o2gK2XIItrJIkVPr+7kR74FLmaDlcli3RTZHQ0/1muqA2KG7B42XdTElkNfBoqkUPPVAM7Aa9Ed6ttz8Cp2maCqMECUO3zLXmPLApYRzHkdEPw7ASS9z/wXJAlDKOpTDMrDVE+zmaR6DW98SMO7ftReCBZc2+m+T2FtgICso4jgcQEMJuR94qc6NT1f0ozLq+k4O54Fo4v6MetvDVJ+L/gx/zrSGH1PRtFwAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/queen/north.png
var north_default$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABdUExURQIGCVlXZQQDBVpicS4uPklHVRQXJEk9PKSAYUc0PhwhKGBNTSAmNpRvWzc6Sh0dOLaWXxodLm91hvb78oiSnCEnP3FeUycuNtevfYORt/jgs+bCggUFA5iowgAAAK3w650AAAAfdFJOU////////////////////////////////////////wDNGXYQAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAALDSURBVEhLnZbrcuMgDIWPCSZukEVMStjudv3+j7kjjC9gO9npmf6whL4KkIBg/KFQO/5Xr8BXY68G0bwYfAEqXHA+WoNKzQ6l26bVyzBg1qjkKE117bJHQbcaKvvRfdy2cTtwvNmZHEFrvu5acTtwNImUTBOYvvbcHpxIpcaRLiRrO+YOwNHYHgazCOgPuCNwNNwBzmlNRAR01zpAdASOhu9wLKIB94+qEJMOwREgZu8vzIy1loVOvCD2/vEpOdeiFNp6jUnTE8HxxT8kJ2Fxmu2cV1AZ5n6WLLH9lKkSFifzMHdSmVGt/zzvTQJX5zb4ZAGgTIYBx2fkyJkK70JgphBwQh75rsCAISQNAj7riENQId4BDJMk+S86yLnzQGtNj6VVATwiUdzH7RxaPwL9QghBWpXQxfho34MKuvFNfAqYSDx1e2nijqxsxV2MDUWL0PqvL98G2FuMUXdcRdYg8Pseo4DUtswuBNgYn3/eZZQiXntrEQI75xyHQLD2oJS1Q01nP0j5U+cEplScOnA3VdMOSLuygBzAzVDnrMwWxDAC5sZOHwQ9wJaRJaiMLGeTcAYBW022svgmG7NyC2iHqh6lZVN3BqJpa3wGGTBE5VwL8BtWpx1NnPcLOIzQttyeEvzelML7zwkk5sHI2T4HpyLmEm5B2R2Uu1OBasyg9xlMf3LdvASVmjMK+HcDpvtkG1s1wDjmmS4gsXPVBTfF7Rxzl3r/lXdVLrx9XG3PXFYCHbPbBdZ2BYrkeO1ekMr+XsC+6/uu62c0vAFXbk43fbg3U4Wj+X3Jd+P8EO0WWdZRtmHScqsub061ysLaPkwgkktn4en8WCm1SRXCRXqgCUTp2ZHUZZItmLsKbjpbciU7t1xUy++zydoas8+5zRrlbNcRJ2AiL1l8zB2D6WzNk933d9KxN7/KSfVI1pn/rX4M/gOTLhTN5kprtgAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/queen/south-east.png
var south_east_default$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABpUExURQIGCS4uPm91hgQDBScuNklHVWBNTTc6Skk9PBQXJCAmNraWX9evfQECCVpicaSAYUc0PhwhKB0dOJRvW+/ZzhodLllXZfb78nFeUwUFA4piZ9HJocqlooiSnOHp9/jgsyEnP5iowgAAALH6Sg8AAAAjdFJOU/////////////////////////////////////////////8AZimDlgAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAADB0lEQVRIS52W4XajOgyER2Aj7GRJwYiwSbPr8v4PeY9MehqM2e7d+VXk+SphWyJY/lHIA3+rY/B4JelwGZRHtjoGq8+lus6Wko5AGPsk0RQ9ebB+BmAMP8HWbS2rctCf1kgNeJsMTZHbga5VUqP/E1wcnbH8qJfFd34BFlB5e3fgsvgLXvTW5+urCuAyJJJUgPf58qoS+MzJXJFHKDoOwIVPwBncYYRTR2F/DsDRSDuCfowMz9y2kjsOQEeuN8ZOV75CjCntawZWrCISNCEYY2AAs7U8tQGdD6sa1t0Jp/N1BspFbaI/kRIyM7xn+zzJV8eXymGIeAZut/sMf2DJAypARLn67R2QoqUIwgLCuIz3cXyHo5KnDLaXKwR4H8f7De5W8pRAvaVWydv97qBllzaoFCJbUXVCD9zfATg3l1x5QBN2145u61l4wM393rUHU6GPimiGVwFtiduBCCGcr5x60Z/ol5WDS7AJ1fVPZ/StThdq4AzulgXQHXq1Je0igBOgn3tUcsZvkzK+7WwF0FNF6RRYGE3wABrZv2YeqAF0pFlEJHDf98qJ7MZ5/lxj/r0ehMgUZ4L2lZNmd9ezxxreVEFvtmZk06Z+xAJhu7Xuwe466S1rmjBLqlG3FJJ3yfaprhHPd+htExEfKMyQNOf0f22sO/CkYyY1pPVR7XO647uj3DzW+o360Kog3jJf9NYdjOQc7HXSOOUsTXDW+l2Rq7agR68HDvho6RLAZvKhnPI1ViOuB6HTm5l6BDNxAKHwK+AVRIw6TwUixEEvWyCy4fvuUJBTTgpBO9G3gSiB+5QvICLpKE5d9KkQgg6Bb8BglVtBiTHSNAGIMZZq/YrURCGsCYdhEBkGnRxRVfg8voIAXdLHZlBZa6uu8z52VVUayZvNYU6dqKRV8HF9PKrqEeOfQehvhfR+KaeS1cfHh9V3fEWe7q8/tflTSAbF03D0ujF5RyWVQm4YKLWIqus6/ktwWbRUmrqkX2kq544DULtvrXSd5SVTKZb0WWqR+hP4nf4Z/A/aOzdPRq6z4wAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/pieces/bone/queen/south-west.png
var south_west_default$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABsUExURQIGCScuNgQDBW91hmBNTR0dOC4uPhQXJDc6SiAmNhwhKObCghodLraWX0k9PPjgsyEnP6SAYXFeU0lHVfb78tHJodevfZRvWwUFA8qloopiZ0c0Pu/ZzlpicaGhqFlXZYiSnIORt5iowgAAAPjrT1MAAAAkdFJOU///////////////////////////////////////////////AFgsDQ0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAwhJREFUSEudluty6joMhZcvOFIqaBKH+rQ7bNrm/d/xjBwyQxxDO3v9ACLrQ7YsCTD/o1AafqsfwMfLj1eyzMP12oJdjRautp5VW4BfrPbgQqg5qGr2ZgVBvO4VpWP5nLWSYKBdPr1w4fMcFH3HPON4agqfKjgrgBnkOG8SrycpXepg43GvozGlxwNwZg+EEEynXL+cc6sHIAYEOIo5XtVnb8ynAQEjHF4Jx/02VTtQPBEFtBipCTgzXn8JziYQkYLtaKIxMLuEZu3BeZ4DARAwm2Hw0C9SbX2q4Ax4HMfjW74MnxYR31dPHZwV+A+QKAIJIQfFpl7rIBjD+7n/AEhy2e31wCrAn3eLjww2NaeazUIE/ft0nt4X0PvSpQ5CkmA4T9OUQILpWOvmvUnjiSbTn3swY6RQmwMVy7CAOPf6OhJVB0jF0g4K8tJRyRunMXd+O4OS/gSw6VgYgwluqm22fNYzqoRGegsMb0Jw4zGlofDcgRZoWwXpFY1DbHyuPBYRe++3A5GbF0IveOELw+sUkX0NlAaI5HkjyeMklFMk5OiHuWoRReSkziIhiUijn52Ono1jCcKwz3eIQTBIjBkE8OZL8v7RwjH87Qr9IMTSNNrR5Ix5DqLRdY3iRURYb0E7ZZwiY5PULWg5Z09PCJ9MCrn4WgGPvRQhi+Tot2o6PsACwzEy5+kDJGx/PcpkLTtmgLlJIdxA0F+g2/juQWs1oInXBh8hh9Q8f8pvwAFDuJqI0CuZb0R+BK21IKRwNamFjreYNytouudTTkEoGFILxJ7ottmu24QsQbuCwSftkkC9zzdC9BuwQ+rTUmxZmlfazoEqqLsC4iWEEHLpan6IKD0Bs61TsfauiBwOhxyVfH8fsgKC3Jdj7i4XF2NUMEelfvPrUQO77uvLuc/x011ijGtEJnqWnFyrXRe+v78vigWRQ74Nq/8mnp8ROcLtnLeqUbvFfWfVQKbL5bpeBJH2VunzAOw6ni5Z16UlS5c6qA3Jq/R45XpW3TprLhaVK6seLvykfwb/B+vYNdVVU2VGAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/queen/south.png
var south_default$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB1UExURQIGCVlXZQQDBS4uPklHVXFeU5RvWxwhKKSAYUk9PBodLlpicSEnPxQXJDc6SicuNraWXyAmNvjgs/b78tevfdHJoWBNTebCggUFA4piZ8qlokc0Pq+Hj+/Zzm91hrB2VeHp94ORtx0dOKGhqIiSnJiowgAAAGHuMY4AAAAndFJOU///////////////////////////////////////////////////AINWl9kAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAA1VJREFUSEudlu164ygMhQ8WNo5soGxSmo+200m7vv9L3EfYmRhM2n1GPxIkzhsECAimvzSUgf9r34LfdX7bp77p/a4LCo+7y57mT6AhrTTd3M1PlH7T3iINSNNNj86sVRVwMn/ICffx+t2P4MSdxBrpY2mhylXAmZQceRhTo8bVwMl2AONmjK7CVcEJDszMnojABruaqBabpvEJYDdAEQF9VVMNTgj4BwP2UNgjVDXV4IQWB8DsQb739/1ZWx6E996JwQdzMM/+4L1HijhHNpPem411rpstYtcaAw/v2xa3YGTZ3S04TdYuP+4APJkXd/AtcBuRea2t5j8hBGGPOEKn8tlaLYqZO53P5xPAvDkZSVQGUm0nDpfXC05wDFdTlQEBIxxwPp3fzqdXAWsbsgkBnp5hCae3t/Pb+QiHA3m/1W0CpIj2sIzXy+V8kime/PAj2IBI7X17kePxKmsDdDQM3pcrVLptS/5dy/algxWA6PXgfR9LZeY1Ddyvvfc+RDCN4xgQvXdeHRhYlc0GTItDvRKuDR8f1AdEeNWXiW5B2AAgghUOzj3hN0NHwG7IIlXAvzuZHdMBL848BXEsKfnKpAV4eZZLI4GE3S+z2yXQWrwUVVB4V9qbeUG5JWNMa4QD8MxFsWdec1WfPi4gR0Y0Cxh5P+RXSO50nyogzrkyy2FOoI0Iw2eea+6gDWE+SDHKBWlMlCW1QJCayLTr9peBBkumzK4LXUcn8RMZga9MfG82AyxsWlRmuT1kdK1DENDKx/tKvWoel6kJ6FyPcQwBXdBBlkcGxfgAtM00JTBx0FqYRMqQsll1sGlmEJZcR2hJB60RuiDJJnBd5/muTkwMEHWE0JFS1BmMstL2/sgutgWZqCUISAnEGGO0oOxW3YJzpc4HXxN1qQJS8VCuzEG4NEdgHIGeqDeAT0W+yTX32C0DjqNS6HtoLZNOx8Nlb04OsrzECUsmJRBS8gIW5BpM5ZI454ZhkCsnaE20ZOEy8g42jXCp1MdRfX18vCfTenk8hFxt5Ao8LuWPqzw6w79iwyDccoaxroBiO1LoegXGkDKVqpF5l5pHoPzZuJm8qDVVGZjJq6xOsrSzpeIBKBd6ynJJtaqpBueFWKzsWexR/Ef7a/A/s7hD+lS5wlQAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/queen/west.png
var west_default$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABvUExURQIGCQQDBTc6SklHVW91hi4uPhwhKCAmNraWX2BNTR0dOCEnP5RvWxQXJKSAYScuNnFeUxodLllXZfb78lpicdevfUk9PPjgs+/ZzubCggUFA6+Hj4piZ0c0PsqlooiSnNHJoaGhqOHp94ORtwAAAMoRnkEAAAAldFJOU////////////////////////////////////////////////wA/z0JPAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAJ6SURBVEhLtZbrcqMwDIWPZRxBcGIMpKVN9tbl/Z9xRza9OfIm3Zk9PzKTw/lGIGQbrP8olMa9+n8gTOlk/R00AFUSFTvLwDYEPaK7mwwskcOu9EU3QAbQfhk0AKNBp2ZUcxP21PTwasE6aA5IOobySlYNhCMiYsZQSdRsRDemgq6WKI0kTJgtThHtA0IlUhpJsJMLjy7apUPQSd18DNOOOcbI8UugabunNjwNnbQo6tOqms/5TQAg7z3hUAZq4GpwviBaigCR77SaiiXCt91ZIEbfO3V9aN66YlmW5QyKUcZVzajmivOyfDegNHblxayK/bwsF+Gm01AhdXfFcgHDT1NwlZnTXRlWRBzdPDu9NzUQzMDg3PTDVUqq5opGwODmDGohzVtXhLZlsHPW2q+BJ+MmdKGdppN3YCWlWOJ2bXQOw07e49BpJRVL3N1DtLI1RifDo5W8dkTYDVEEbihCtp4yUQO7yAnNa4sV8soQGQNm7mJEO/lMXuWuDJFBl+40wlLoACbel8Hyf5Ix8LL2PabGSY9ofx+4PmMvNxvxMwiXwCJZAffMOAYCTnbrT38XiL0dcXH4lZcyQP1doAGNcgLMdHgFqS/uVQejTSCDIU+XwKKkCsJa5yMCcEgLUyupgnLI+cgIY+jfwc8lK+DxmOLB+zewIFVQOjKOYy+El5nbyFsg+g/KWDoKho+fEQooXNM0zfzK5uEhHz6W1MFmfnn53TTWWvsGevdpV9dA9CQF54z1SG/S0+dNSwN7oO+ZOf1ARmBd4YvtVQXfWwLwPoN0GxTSzkmBmfNSRLmfa+AKWYybto6Y8oNXBdOZs2kzTPmhXAFv65/BPxMlVTVAxkQDAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/rook/east.png
var east_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABUUExURQEFAwAAANrMrKGRdqyehO/pz7uvjwUFBQIDBVRbYjI/SENRVn91YW5oVFhTSpWHciMpMouXnmBtbrvN0CYuL7zKxRUhJniDhyM4NWxdUQMJBwAAAMXwJ/wAAAAcdFJOU////////////////////////////////////wAXsuLXAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAKFSURBVEhL5ZbRetsgDIWPDFIN2MUBnLjL+7/nPpGsXYG02S63c8EXxPktwAgH178U2sCz+kfAr8bGg1RbTMPBu0ZjqEGYyeiPkWMchuUKGKMgaqdXHwUsV6KCEMZ96o2tDVzBL8YAUJC0BebWMwIhTMbAuZqxNjyabReC8KRpPEyYeV6M0UDrGoGrTGTAOlnWZ4BZOtcIpGUSCDNeK+hhTES/PT2IJUZYBUlY6vbQU2AgirCGBWRMJAgA19kG4Haq72ISzeUS4JzbOtsIDDnnF4VV2bmSBlwPXhFC2ZBvCntxZXsSBGFL7zpvmrg1DcGQgS0oc07JA8kN9mYE6iJ/LRHYL2G0NwPwig11jec97zv2MFziCLwCm3MpZV1iPo4nq6MKCCGEWzPamS/AD709sLSBKiDGUgpiXLE8sLSBKoIRBUUWxLFlHCWwlFQwTeaPQCIwXEpnZot6R/YaRIkIYOjRUXBUxUOQFJQPUOt/gHYgea+3jSgYmG1B1GPf2gagvjt5B+sNCfjO1wYIp125Wc9bUbAAKfX10QZwwiWEW0KPmXkBcOBofT2oJ/R21hz23c0E7Psz4Bne54xT3oEEZOByQcJrZ2y6q+YKegm4S77/Cgf8j3Z72u5irFn1SoTTovIIuqXwobTOphtF2GrW7G4r1ZI0r+iq+TNIgAgzmxUniCrqWxVZu3L+3McbVkOGLfIFEzNz1MeY5VtQLJBng5z0FGgqEdHv8/o1SKvIy64rDLDTAllX3WZr6/+IT2r6RNj1QxPql+d25+iq5TtQz5z3zuWT5rHWGgV1tp2vC/jjCMGF+mK0OADQM2VVr8atqFsruh1913jk0S38m741PNL/AP4Ev+4AqR9hyDoAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/pieces/bone/rook/north-east.png
var north_east_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABUUExURQEFA9rMrAAAAO/pz5WHcqyehKGRdlRbYiYuL0NRViM4NTI/SAIDBbuvjxUhJlhTSmxdUQUFBX91YW5oVCMpMmBtbrvN0LzKxQMJB3iDh4uXngAAAI5smvgAAAAcdFJOU////////////////////////////////////wAXsuLXAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAKPSURBVEhL5ZXbduMgDEWPJS4GgtPiW5P8/3/OEm5nalC70nmcOQ+JEWdbFkYYj78U2sCz+kfA7+b0ySOI4WOSTrOHNBAsUZjBvM9CcSkhsiwpYJx7T82uz6mBjh0IMMZActGzIJxz8L6C3gN13JpUEOQwhgBjEGMS8KPYz6428CAMfDFxHHEhxAi+SOrWpYBAZgYmMK4vAHN+dUWxdQEPx0xCMMZRQBjlfXQRBMwl2yOvPLYtwHRpbQqYPAQkwxkJOTsCls6mgCICYJxFIrlCGDubAi5p3baKV62rD+Mz4ANL8GnDdggh+KRwGgjEGLe1KmwxxrrxWvUhhFpjqCCSlBh6lwYupxoR1kVZVAV8YFqWaX+vcU9QOQ2UKlN9UO+9T5NWoQ5WNIQwhhCSjn0JXv/U2O+2qi9AA5SCUX5+DA7DFJec0Z8aVV+ATtoq+pF/BBLMAa4CXkhFe5AwwZnfYAGRhnYgTQeYeYjrmjgD0zT1ZAdiAorDG/MwCjg44E0hW/BoYYPhAMfMw/E6G18HAjeASM6oLKBjTkC4tT4FTPsuGTgjrqt0WNzvyn5tAkBKIa33j8Zat+11RQr9s57HhHuSJiaE7W3fb7iBbjtCQorN8pxAWrzc++iNLcDfb/VyUVbnNMYi7yLnekCGRZhQ71Tm70Hpw9kx8zBYAHWRkDOzLfP3oJBmECvzjF0+A1XyGTgb24zFFFhbs5Z30NpsDboPXbOqs5hoLjlnAYv8EeHinG2f7Tyka+ZhPlYW6y6Q7AdrTTkbW/BBcykvL7DWWsCvcuDdkbl0/dyCD+k+qotirwh3v243KqXFFFAEm3PO7oopxhQ8nmrkqpqWSJpsmSbVowY/C6Rb9OgT+h/AX27UAOdjtXXiAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/rook/north-west.png
var north_west_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABUUExURQEFA+/pz6GRdgAAAJWHcqyehFRbYiMpMmBtbiYuL25oVBUhJruvj1hTSjI/SH91YdrMrENRVrvN0LzKxSM4NQMJBwIDBXiDh4uXnmxdUQUFBQAAADEfLI8AAAAcdFJOU////////////////////////////////////wAXsuLXAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjEyEwFHdAAAALhlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgARAAAAWgAAAGmHBAABAAAAbAAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS4xMgAAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJYAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAA2aealcm3C18AAAKMSURBVEhL5ZZhs5sqEIafFUGIBAVNkzb//392Fk87c4Scpv1472Ym4vo+YUF4Cc9/DM6Jd+M/An71rPvwI4ccjZ6km/0NyKCNX7enaJMMYup1HBRkENuKXoADT2D4AOuliTZXlTh3XJWnFXVAwzBYmKZK+MAwSI9sUobLYJEQtDfCPAxIbFQd8MnVEgXCFQQG4nugISkoXK+ICBDFUuf5UzQgjCNLlNUoF8EO4/gW6IDZxmiIMcbjrZhG1gHn5JTVGq01pramRtYBp+ycK6WUjYPaNh/eKFXJ5Jz3PpVCKTm7fW9VPRBICu6+xr7z1gJ4kreNqb595YCcW1UPnEJ2UEo5pqiU3JmbDvhkUtS5XMqtFB+6HfZAHWVKKU0K5wR8OytegMcEwZyU6iteg+O41O9ud6/BWcEQQneZ1ngJxnUNLqzr34EGVlmDDyJ/BzL9C2iMYWaVEHySFYzpsS1o9sRtjiLBea9beZ7nDtmAZkY/q0jw3lXzuPXIBtRXflPTiZP3OVX3gHakZ9Bwr/4kMerm2LUF3p91Dcjs58eGeunuvcOoU7K3C++cgAfkrdZ72AapPDq1nkDwkxrAvdzYtjsOtxWmXMf5Wfnpzvi6je4u51zAF0/WXQ13fPrU6elnZriweTBqGNm5nMg5g7uftklT6nfUMqzFUI4K97zlnKY/gBednSgidmBTQ1cz10LO83q+/a4jI+pB87jr6SEii27p5aw83cZxwZcfNlrKjEhcapfj8ifwEi24At+2O8tRKIPImTuDT2Ow7O6xbU4d/PCe69hwDah/HkZ2tUeStTbqGdvMTBf88Ea4LLrUtdqzQqObrPBTh9gutV/Rzx5hOgfx7/ji0dfxfwB/AjKl/zQ1P7t8AAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/rook/north.png
var north_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABXUExURQEFA+/pzwUFBQAAAKGRdruvjwMJB0NRVgIDBdrMrDI/SCM4NZWHcn91YSYuL1hTSqyehFRbYmxdUSMpMniDhxUhJrvN0LzKxWBtbm5oVIuXnpqeiAAAAKnOgWMAAAAddFJOU/////////////////////////////////////8AWYbnagAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAACdklEQVRIS+WV4ZqzJhBGDwtIJOqCBGXTvf/r7DO6Tb8Fsl/an+37w8SZ9ziAMPL5L0UdeFX/AfBZ/KEnBtSZeJJ+nnk7wZNH1+mnIEYZ/v75Kv/dUgcOG8acoDH6E/UPQUCur4JYxXBwzmHe1OXAa1cfHDHmgr9eJ4PCn8Ou1YSY7agXIcCglP2ab60mxDyPFkalePdfIJ0X0oLMxmhGNfJOUNa8DEb0NOlJWb1iTOAdiI2tB8YITNMJyluJMTW2DphSSoI+dMvpFVBI3CbaGfZtu7pM6+qBgCsi9l1+rrwIOkf23juHP0RyrasHpsH9OkVk7LWpB36CjzLDDbnuN9cbaQ/8JMVYSnHbMdPcq9cHpab3uEO+W+8JeKzsQ3XyVD8MM9M0kdI69x3PwOEBhr7jGWhMHseRlMLYd/wEqtEtArZHStQDtf4CY0xBobtkC2qdmR6gkRbSK9qA5DwwTflXsLfn6silFAhqymlUdokOq6ZJ9n3la0BKwgST80UJGPkIaoJS+1rwKsePLG3OLiUu5+55BeS272RAWQZg3/cSfe1rQUqkOLFzuW97IeKdb0tW96zcPSVtGvbNwe0WKR7/e3CFW8w3Lmef9D5KvbLUp6S61ViGTdrVcRLLzcvSzB/ytO/W+jkr7Hfm+fC/cSdYNX6stuTr70FWq0SW+x35O67vLNW+qx4TjBSEYK0FKzvHWrvK9+ObsQHXwB4Zdq3lrTvPhw28Zez6MyjNpuzOb2W53//qrkPINFwNHl+rnMvx1QkzaxCpZqA9cFmQDRuUUuZYphB6facTuhzVZFH+AC2zrR2iblCmKqvTT576Kfej/g/gn9DyDSNq1O4LAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/rook/south-east.png
var south_east_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABXUExURQEFA+/pzwAAAKyehKGRdhUhJruvj5WHciYuL2xdUQIDBdrMrG5oVDI/SFhTSn91YUNRVmBtbiM4NVRbYrvN0LzKxSMpMgMJB3iDhwUFBYuXnpqeiAAAACEtGg4AAAAddFJOU/////////////////////////////////////8AWYbnagAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAACpklEQVRIS+WW25abMAxFj3yDDBgLjJlpyv9/Z5dMppNgZVbax1YPiS2fbfkmJdj/0nB2vGr/APjM/9ueCEBfA0bVqM4dlkz9luH7Sb5M81XQQRBr/gAUrXMCOgFRm421PlleBXHgcM6fNRqIQKiMQefkU5pn0ROQ0F8kmKtxnXurZ3TWNQ4rYF0p4AwFgIZGpYHjQMZHEGGaQDQYUGhUGoiOBkCQeAFRQNcltLtUQOOCmcwgscIQLLoOL4E8y+5MmtnAWpuk178C+iXndS3gUuoBZc65b2QtuGPJOec+L/PMea1thdNA9GK5n6tlZrx0jztEKHQWalkA+FalgRtyXgWtELDy1qoUcAc4M6/CrmspS9y2t7NGBXdsW9/LqazrPDNv2hZVcJcFRuacmXlRsSfgjrGyse7xPHiY7saY4Cv1PuqKZ2AK2JASkNS68RzsBu8RBsgM58HDdDc68l5SckuDkhliGmgM3OD9JiCCllMqaLxHR8Hnjeh9k/VuGtqAR62hsRfQL3Wj2mM9e5CzcNTHOBD1DEcWYD7rWtBvUm86w30gihxNIgvl1Z0dt3uHzwJ6jpisPKKGfOxX5mMtPySrRqrlDijl2r68h359nTPA11JqyRJoBov/fLT3oBHoAoALOKMINMss8LjgVHjue7jiSAtmLFFi8irRWMAL5sfV3bdrtSnloy4yck1KqR8Zzn0H+mtEuTIwWRt+SuA6U+TrVXbM8532MWL+KBGIYyAxuYYQQpILipHz4yN47NS6FlMIwVVWLIQ01ZuN34AAhg7AOI7h0xIMopXDvpeeH8CYUoKVX1VjjosEkNANTQU59Y2RZLTBWodRfquStXaSEvSoa8BqZiIaLIy97fKi5bIG1rjyd+O2S1WjOm+Gg9cluvcF+x/AXy0kBcluOPgYAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/rook/south-west.png
var south_west_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABRUExURQEFAwAAAO/pz6GRdqyehAIDBbuvj2xdUTI/SH91YdrMrJWHcm5oVCMpMiM4NSYuL1hTShUhJkNRVlRbYmBtbrvN0LzKxYuXnniDhwUFBQAAAFb6bq8AAAAbdFJOU///////////////////////////////////ACc0CzUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAsBJREFUSEvlltty7CYQRRcX96ArBiSdif7/Q1PNnMQWwo4rj8muskbd7DVNawCZ81+KNvFT/WfAb0Y7Q+bvOywfQaM7iNOL5nHW18/WorolsW/nibdU0JlatzV1QOOtoKDjxDm9PizhPuMWZPC+IsBvUEZXZ94Y23gQMYq8wKnev+ksWmMbz4OZAw7LogX9inP2B+BpEAuMVq9AdM78CASvjILvc7CWGLEy3X23RDDORSYrJgS0FqKPuNUtA4QpgYwCbhQB78zN1gGXnLQ37z3ksr1pUG62LlhKKWBgPxKH/Cox3mx38CRX8tjzcYSylhJ7XA80rKWUTbWWdV1j7CycHpi1qxRy3rZ1XTUId1cPXPK+v3581b5n0t3VA+NSct5VHMeeSulxHfCEJeba5F5KTjrb1tIHFV3JqhACXewLUJfPh9rBl/pphiHArNjQd3wFTlNIDAP61w6+1E/jbEjoap06G6OqmzZ4WyK6Lyf5oslO1hjdxzkudiQp2EXvOVLC2zFuix1Tmqxj6a2AW0q5v8AUYxodieVmu4EGdPvbEMpircQ0WA8dsk3Un3y0FcSOBAZgu7d5TRh4rkx2FHJ9rJIi7M9/rEjimfTQMLWy5Q/gV+R5f7SX0JAJmed+wHFssNW7urPL1tT4dG9y3f0H5L3UxrbjeB550TOAb0DUEdSUfxU9G3ejcwAejwfh+na+fI063h+EkCHkQKlfNHjvB7TPi/cSwLvzDz2O66HMITBZaxXkmS7ez8HJO7OIrRKZdLbYsR7qbNcmG/ABs5awQ72QwhO8dp0Lbxfr5+A0s+hEDTKLiMwDhLJVTPLXT7WWfExCoL5qXidHPZtzaAq2YN2MzIgM0+S8R/wQ9b28rm2Ja/jK8Xo8VgajL1XqIm5NTVyFNigizhlj7v/iVHXBU/1GZ90OfOiboe/1fwD/BH2Y8oyhWo5JAAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/rook/south.png
var south_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABaUExURQAAAAEFA9rMrKGRdsWybayehO/pzwIDBQUFBQMJB7uvj25oVFhTSmxdUTI/SCYuL5WHcn91YUNRViMpMlRbYmBtbrvN0LzKxRUhJiM4NYuXnniDh5qeiAAAAHnnjrUAAAAedFJOU///////////////////////////////////////AOwYHF4AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAArFJREFUSEvl1uuSoyAQBWAOrK2C2IriLcn7v+ZWa6YmUeK4+2ur9lSFmgBfuATMqMdfRu0rrubfgmdtp43YV7zmBEKfySOU3uvLaPP197HXsQq/nmPBGIGfxj1CPMfaIDKdQSr3OUBD+ZOYYi2zDKB10m/Zw9yQBowBYMq1NAr2AlSGtJIhnQOVrjLGqNxu2/Tecfc+9z5DDcMMIgLY5BW0aX6ED7jM5pRzCSLbgkF50xxdAsJDE4Fh27athKO5sqsIQKUtM7fawINcC/AFmHd9D8QIbDBzQHUNdl3fR3ynZ74CH+i6nuNQD8M4jsXY933KpSDQT/GZMfZzj8TeJGARGOh4g6hnAPUlCJbdeUkI3SWYc9dhGIaBt1UO3HX5vlMKPoAuSIZ1rgtzaokpuO7PSkMIMtd985okFPmdfeOWNFRA03jAOSCxPskHOAlktPZPR5ygdcOFlpuxb9zyAQKkG+YPV0qSggrTDNJzXKFBqk8CKjVh4myDOZoGdWrQA1TTNJU8ZURzjAU1IkM4yj1U01SWzIWldo4RpPOmkeNwkHsoT46JYekJyWzyZ4hlATgjgzkG5UhnwBKP9+MdKjliSydl0Zcl4GitKY9H7w2qKQR0NXAbxyjFDcVtvJUhoNw/P3awDKGs4yDPuYUhnwDUtxoVyjMoOxMqoAfCEqUMN6CvAe8RwvTa9xXmt4DKA5XcRqAOoQbquoYzxgPL25CvEDf56Ps9q0rAu/UyxnJBlulzqGSq3mdEmixZrbWpUIcFaKvDIXhfY+c9lDfGWSJytP5ebfMO4X4CHzKeh9x8Z62z1lo0vax2CfvDsz8A3ntt5Iv4jjxD0PF8Bh8PmSm8RZV9BbrxQs9OzlYjP60AVSRxTu7V4aSmoET+v7mvWb+UfbMkDaVhTRpJPsKf8j/A3xzrFV10HpZ7AAAAAElFTkSuQmCC";
//#endregion
//#region src/assets/pieces/bone/rook/west.png
var west_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABRUExURQAAAAEFA+/pz6GRdqyehLuvjwUFBQIDBVRbYmBtbn91YSYuL0NRVjI/SBUhJlhTStrMrJWHcmxdUYuXnrvN0CMpMiM4NbzKxW5oVHiDhwAAABlCzpUAAAAbdFJOU///////////////////////////////////ACc0CzUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuMTITAUd0AAAAuGVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAACAAAAMQECABEAAABaAAAAaYcEAAEAAABsAAAAAAAAAGAAAAABAAAAYAAAAAEAAABQYWludC5ORVQgNS4xLjEyAAADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlgAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAADZp5qVybcLXwAAAmpJREFUSEvl1d2amyAQBmC+GYggYNTgX+7/QvsM7m63iNX2sJ0DNYQ3MCAT9f7LUGXD3fgH4Fn7V5x1wOf986GMEwj6AF8PZdQhmDgDxaRR7VVrwhvMO/x4qIxagTDI/XMws6rO9wihH9RkaR2YlQLoFlQgaps8pIdcA8jcgQATGcRI6ABFjdcfCf8SB4gIJmMQQfBPEPV5vmW3KlSDyYkRBBrwgEO3CrTAoBXQk1Ejeh7A8DemqvDaN8IYo2DMIM/3YEgSu5aw1t6BbwTr3JSQeUoR3ldcDWKe58l9RnLe145IBYaclXMua0Qg3oOTtd9TRAjTLSgyBCs5LssCpGmamrJPFb4xecxLznBKyU+1FKvwDWAOOSS/GjuBIn9G+eUeJ3BdPYbBy+XPIK9dhlPtROWow0Zg33vnuf8jCJ4cSKDuT5KsQQVm77odElcOYxUq1YG5+wa7Gj00qa4DTON26DyRRjcfp1tCJbVUG7iZdthmeXzNS4jtBdbd7LodOsVSgNwlVIibvC5zR5TPFoBlg72EmPGCW5YH8JBaLA5w3RXEiDkmICS8UtoAOVhWeDlCCddcnRBCkvuWAONixHh4DUrYtsMIOU/OIkZJUaY7juMlND2N+3FyNua71lrzFZQSTBLtiuSkKOfPzIcNOUCRQ0s04tUM+Ud6Y1pg+z3E2inwurY0wi0yIrN+Pke8yg05jNjmtUe7ItgFLRYo4LFYFJXusD1oZTX25bGyqEuAtcvVdshsc2Jas34Cm/NpQwyhdFW4L2XLI+QPxwbMN46VNCnZFJltrpN+rpbICpSA+upbU+fwOv4H+AO0tvljTqI4qAAAAABJRU5ErkJggg==";
//#endregion
//#region src/assets/prologue.png
var prologue_default = "" + new URL("prologue-BZ07YA3x.png", import.meta.url).href;
//#endregion
//#region src/assets/red-king.png
var red_king_default = "" + new URL("red-king-D8DNiu6-.png", import.meta.url).href;
//#endregion
//#region src/assets/run-over.png
var run_over_default = "" + new URL("run-over-3BF4EUX_.png", import.meta.url).href;
//#endregion
//#region src/assets/tiles/arena.png
var arena_default = "" + new URL("arena-Bv9rCyKp.png", import.meta.url).href;
//#endregion
//#region src/assets/tiles/corridors.png
var corridors_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/tiles/grid.png
var grid_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/tiles/halls.png
var halls_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/tiles/maze.png
var maze_default = "" + new URL("maze-BK9GODGH.png", import.meta.url).href;
//#endregion
//#region src/assets/tiles/pylons.png
var pylons_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/tiles/wall-tex-arena.png
var wall_tex_arena_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/tiles/wall-tex-corridors.png
var wall_tex_corridors_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/tiles/wall-tex-grid.png
var wall_tex_grid_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/tiles/wall-tex-halls.png
var wall_tex_halls_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/tiles/wall-tex-maze.png
var wall_tex_maze_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwBAMAAAA0zul4AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAtUExURVibm11UX1A2SyonOH59gKmdklIwNCcZK76TctGvkfHv0+jRqKPPwJRlZQAAABGR4JEAAAABYktHRA5vvTBPAAAAB3RJTUUH6gcaEBUTWaL9FQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNi0wNy0yNlQxNjoyMToxOSswMDowMGCI5wMAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjYtMDctMjZUMTY6MjE6MTkrMDA6MDAR1V+/AAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI2LTA3LTI2VDE2OjIxOjE5KzAwOjAwRsB+YAAAABBjYU52AAAAOAAAADgAAAAAAAAAAJuleyQAAAmiSURBVFjDpVlfa9vIFle57Nt96FE2IzdBD/JSOexiuLmBFLbsw36DTaFJNpCHUchIVdGDXKJxXfzgQGzVwQ992DZp2YfsEtkd44dsoU1dAvcryEtkr8N8l3vGSWCftQoYZ45+M+fPb86ZOda0O998Pb86F7l89rj4x5cB7tC7Gj53yF2AOc4j/Js9kbu8s/bjf5XwDl370eCcsRk0Yi5jz+AnAKqABOAreMBYdCtlnIdfzxMF/BcAGDfz3QpxSQIKCFQteDPpjU4hAv6jaV/BMpBrRapxHN+sSWFuDpGwjMKb9VDYujYGhfCT9hPRwXBnM/4sxPs3SqSAuBYCUVUFxMHnb4X4ZaZRFIJFv5rJHnCG0L0tIcQHXByBXAFBKQxcAV3+EIWnGwhj/NlsVpTOrXJl9EuhHnQTAtky3DxzTKnK+Ux4pJzId5RQmT937dNboFqR7SAE0HxYZdeq3gBnfl1Wrlu5q62o8Li8rUQ9jAxOw1jlf7CyAv8uqe84FF5LUVV0x4p2Z0VbhjsR+stlvPM3oMue3YU5lD1g0d+AE84i9L2LMo1Ye3FbHLVcnorLA3lp3IazApRA6TaA4bbc3BYmj6ovRS/e0CnaWI2Hoo8hCltLPe4YtxTiDIDxW8KENm/vV3HWKr4ct9BG4NXDa2Ct5fc5UQZ6KtbsAcAzpljRVGZSPkyq3WvgeYvPgEp9Bey8XXhFkBcsVhRSscQP9Z0ht+i9k/cTBVSOUMC5qNorxCkOtX8bVJO+AWQvFqdxk7sAEffiLRFvUAiHfmv6bQ+nN+NGu+Uua3pUOYsu+Jjz3a2uITaRLXuowlGTc0o49zC6PQTCgQhrp+uc1/mVu1hyLY1E/Lw5iBHIO4PsBJ0R7SEtNxG4jMzwDpDAG2p0IZhO8KV6PPUOuUs1I3InCzVJK0CqU3GeFvZlbW2z0UZgiE70eoWD+a5capiHYtCiUCKye9KJ3FArRQZf7I/1egGqk+NJp7A/eW7c+91jik7Iheb3r8I3naXGpHPcaUFjbNWHZzx0K5qLwIkYQ7XQMIbtix/iZvw89nsxglzkaBS3k/hN7MV/XvX6YaHRgrroIDDSIuqE4ZdR1Fgr2JQaJhT0wufTp+fja2D98OPWu4bVgDQkxGnMF9zyF8OwiYtAwuGU7DXab2Z8qZ6Xqo2k3iBMARktjP1Cq3LYmnHoea+wQbcA/Y1AE9AHYe2TKcQfwz+QCiEy+iKsMLX1WMm4Qt4bGPbv+t8Jkb7oqrchdbWKOaEVx6l9qgD8JpLEIWEUbg14heC2jGiJT08N16C274tvAUovurZdIp20pI2m7KQnMzGuHhyviZODx51qdn/rdejFths5cdN4cvooaE0eby6I+ePNVl0Esr3ABmVtQgX0TAWkbChEwhBo86j+ToIbgfw8drmDQOYL0WdEAdM2CNLRMOBCAd1tIU6Giejfa6W4s9rJToPQwqrfwz1lVl8Nhd9fEOIyUkCBhNDMzg5r1/2hK6WcnqIisXtCwRByGthONpAiBLIQxWjM1gBfifrJuMdWJ6kG+tL4Ca8NWLjCRXq/y8du34trQgwUcCpEN24OozqvPTIFXzHYtMtf1/ct0PRCxlwh1uzoqH1yP5v+3HLbXvNhxpgkVDIWfPCavaj6yyB4tNB76TrzQkQsaFgaLS/F7la7RdjBZ2Nx5B27rP/xSRISlhJqMmr4r58OWXTcLJ+F7zYZrfZOo3h/RDTG4PhVaHsppprwauTySrkd97gNx2uEzh+Dw/HfUYlH5QsDk4/ZdIx7x8AYAi1MERxM5ja63vhjXAna4pNrgw6EggVO9EL0slL8tN6sFSKWqndBvwWqylWsNruL48WzZjELKoGNI7aDH05WyoKit3hWP6t5raKqidfAeL3IIGKoy4s/pwvj9/ARyVxJia4XbadoWdQs4cBTeFs/GfzwCS1hLrDibqxJ9B8LwRv26ldt5nYvsrbYH6vi5s4SKoX6kugFV7WI9S7G7X4TMPOyQGpStwmtp57ok+nTbm1wUcEswwlkgOnUgwAo1pvN0tW0W/s4oEPRNMeEOpbU9CVKygE5F7tkr9V9+3DDrfvvPtVNUlAZtUHT8YvPyTja+/C+Vt2g6+KQZiNK9i3NlDSDwO7LjEdhpeK6ET2K22GaXZfHwDR68UviRlGpZLg8kEMHXycSKYcut4BciIjaeFaJqNR9cSKLt8CiXBCJJRHKI4e44opioHRVWE1beaA6zExTWY25V5xTrAPXpRyzPzkU+EX5ME2Dfkv5zUlBo0WGlujVYRNAEilT0xKvdQsoQ3oAI6BbT4SemlJSCeD1WxZaz4qKcuWDbdRh8p4qrWGUAtYPIJszXYMDHA2HYJZB6UfedtCiy80REgBwItNhDt/qFnWC1lJjUGEOA1wBNQBms9I0RPbp1CrWTrnN7BRVA62hbLGpDd4Xp+gwZkt/XIxHdorbDbeP6ZTjYj2RSlK0vzTBIYqIpKDpNHPwEPFy03nx16+4SJD17YkE5KpsemiVA7LjDIMMl//r10/2wREeU+yAYBypHNlNMM0R23r3gzmS2WkRZJpZ1yTXA1NCcSuQ5fTPz6esnKbgOWVJUgSak2B95vonFwkUOn7PUiB2DWQKrLeTSQP8q9ezEO1mnRSB6HNUSp2VGBskq8G6OFdbiupU7UdiEbW1DsVutuNP1bswpwyY7UecJhvBDjW+HyTxyzfig7WywsyYzZ44ZSsr+kPx/Cj2p7+HZBXKwexgqD3exmkIsRcwpcbB5NJPRCIGGI1mMCpnODubCl/4yXYnw2ONf+Igq4BdPtYupZoYP0Q/IIEc+a+/w3SuU1MGcZzJlFiYxP94kpRlRrOhmL2KH9saBjObb1Ky67eKFIeIbZwssgCjEBSLGcYlY2cLoTMTFavJOiXeWoCkQZKzbNJkJPE3bBlvNoAZQ0egPmYgZZaiFcLuhwwKB7F09hKfMq8TYM7CFVnzfjP1/YEbxDBJgcHuCSQYEqUShsKHhXUcNDsQZ9E0SUzvkcfUilC2LCIxi4TorqJNAlK/ZFg+ihgIWsTCwbbHNKMOJrjMwAwlqa6P4J8Ac6ua3zk5w5GbALkpl5vkubdV7o2cO3XkTla502PuhJy7BOQuOrnLXO7CmruU5z485D6u5D4g5T6S5T4E/oNjZ86Dbu6jde7DfO7rQ+4LS+4rUu5LWe5rYO6LZ+6rbv7Ldd7rfO4GQu6WRe4mSe62TO5GUO7WU+5mV/72Wt6GXu4WYu6mZe42ae7GbP5WcN7mc+52d+4Ge+6Wfv4fEXL+bPF/gPr/CFZuk+sAAAAASUVORK5CYII=";
//#endregion
//#region src/assets/tiles/wall-tex-pylons.png
var wall_tex_pylons_default = "data:image/png;base64,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";
//#endregion
//#region src/assets/title-bg.png
var title_bg_default = "" + new URL("title-bg-BDiiDrVx.png", import.meta.url).href;
//#endregion
//#region src/assets/tormentor.png
var tormentor_default = "" + new URL("tormentor-BJoG033t.png", import.meta.url).href;
//#endregion
//#region src/assets/unstitch.png
var unstitch_default = "" + new URL("unstitch-Dh3b-NLj.png", import.meta.url).href;
//#endregion
//#region src/assets/victory.png
var victory_default = "" + new URL("victory-D2k7sxrH.png", import.meta.url).href;
//#endregion
//#region src/assets.js
var FILES$1 = /* #__PURE__ */ Object.assign({
	"./assets/act1to2.png": act1to2_default,
	"./assets/act2to3.png": act2to3_default,
	"./assets/altar-blessing.png": altar_blessing_default,
	"./assets/altar-sacrifice.png": altar_sacrifice_default,
	"./assets/bonesetter.png": bonesetter_default,
	"./assets/cells/colorzone.png": colorzone_default,
	"./assets/cells/conveyor.png": conveyor_default,
	"./assets/cells/fog.png": fog_default,
	"./assets/cells/food.png": food_default,
	"./assets/cells/gate.png": gate_default,
	"./assets/cells/ice.png": ice_default,
	"./assets/cells/lava.png": lava_default,
	"./assets/cells/millstone.png": millstone_default$1,
	"./assets/cells/pillar.png": pillar_default,
	"./assets/cells/plate.png": plate_default,
	"./assets/cells/portal.png": portal_default,
	"./assets/cells/rune.png": rune_default,
	"./assets/cells/scroll.png": scroll_default,
	"./assets/cells/trap.png": trap_default,
	"./assets/codex-bg.png": codex_bg_default,
	"./assets/dice.png": dice_default,
	"./assets/endgame.png": endgame_default,
	"./assets/ending-break.png": ending_break_default,
	"./assets/ending-kill.png": ending_kill_default,
	"./assets/ending-throne.png": ending_throne_default,
	"./assets/freegame.png": freegame_default,
	"./assets/help.png": help_default,
	"./assets/linked-rooks.png": linked_rooks_default,
	"./assets/loading.png": loading_default,
	"./assets/logo.png": logo_default,
	"./assets/millstone.png": millstone_default,
	"./assets/pieces/bone/assassin/east.png": east_default$7,
	"./assets/pieces/bone/assassin/north-east.png": north_east_default$7,
	"./assets/pieces/bone/assassin/north-west.png": north_west_default$7,
	"./assets/pieces/bone/assassin/north.png": north_default$7,
	"./assets/pieces/bone/assassin/south-east.png": south_east_default$7,
	"./assets/pieces/bone/assassin/south-west.png": south_west_default$7,
	"./assets/pieces/bone/assassin/south.png": south_default$7,
	"./assets/pieces/bone/assassin/west.png": west_default$7,
	"./assets/pieces/bone/bishop/east.png": east_default$6,
	"./assets/pieces/bone/bishop/north-east.png": north_east_default$6,
	"./assets/pieces/bone/bishop/north-west.png": north_west_default$6,
	"./assets/pieces/bone/bishop/north.png": north_default$6,
	"./assets/pieces/bone/bishop/south-east.png": south_east_default$6,
	"./assets/pieces/bone/bishop/south-west.png": south_west_default$6,
	"./assets/pieces/bone/bishop/south.png": south_default$6,
	"./assets/pieces/bone/bishop/west.png": west_default$6,
	"./assets/pieces/bone/guardian/east.png": east_default$5,
	"./assets/pieces/bone/guardian/north-east.png": north_east_default$5,
	"./assets/pieces/bone/guardian/north-west.png": north_west_default$5,
	"./assets/pieces/bone/guardian/north.png": north_default$5,
	"./assets/pieces/bone/guardian/south-east.png": south_east_default$5,
	"./assets/pieces/bone/guardian/south-west.png": south_west_default$5,
	"./assets/pieces/bone/guardian/south.png": south_default$5,
	"./assets/pieces/bone/guardian/west.png": west_default$5,
	"./assets/pieces/bone/king/east.png": east_default$4,
	"./assets/pieces/bone/king/north-east.png": north_east_default$4,
	"./assets/pieces/bone/king/north-west.png": north_west_default$4,
	"./assets/pieces/bone/king/north.png": north_default$4,
	"./assets/pieces/bone/king/south-east.png": south_east_default$4,
	"./assets/pieces/bone/king/south-west.png": south_west_default$4,
	"./assets/pieces/bone/king/south.png": south_default$4,
	"./assets/pieces/bone/king/west.png": west_default$4,
	"./assets/pieces/bone/knight/east.png": east_default$3,
	"./assets/pieces/bone/knight/north-east.png": north_east_default$3,
	"./assets/pieces/bone/knight/north-west.png": north_west_default$3,
	"./assets/pieces/bone/knight/north.png": north_default$3,
	"./assets/pieces/bone/knight/south-east.png": south_east_default$3,
	"./assets/pieces/bone/knight/south-west.png": south_west_default$3,
	"./assets/pieces/bone/knight/south.png": south_default$3,
	"./assets/pieces/bone/knight/west.png": west_default$3,
	"./assets/pieces/bone/pawn/east.png": east_default$2,
	"./assets/pieces/bone/pawn/north-east.png": north_east_default$2,
	"./assets/pieces/bone/pawn/north-west.png": north_west_default$2,
	"./assets/pieces/bone/pawn/north.png": north_default$2,
	"./assets/pieces/bone/pawn/south-east.png": south_east_default$2,
	"./assets/pieces/bone/pawn/south-west.png": south_west_default$2,
	"./assets/pieces/bone/pawn/south.png": south_default$2,
	"./assets/pieces/bone/pawn/west.png": west_default$2,
	"./assets/pieces/bone/queen/east.png": east_default$1,
	"./assets/pieces/bone/queen/north-east.png": north_east_default$1,
	"./assets/pieces/bone/queen/north-west.png": north_west_default$1,
	"./assets/pieces/bone/queen/north.png": north_default$1,
	"./assets/pieces/bone/queen/south-east.png": south_east_default$1,
	"./assets/pieces/bone/queen/south-west.png": south_west_default$1,
	"./assets/pieces/bone/queen/south.png": south_default$1,
	"./assets/pieces/bone/queen/west.png": west_default$1,
	"./assets/pieces/bone/rook/east.png": east_default,
	"./assets/pieces/bone/rook/north-east.png": north_east_default,
	"./assets/pieces/bone/rook/north-west.png": north_west_default,
	"./assets/pieces/bone/rook/north.png": north_default,
	"./assets/pieces/bone/rook/south-east.png": south_east_default,
	"./assets/pieces/bone/rook/south-west.png": south_west_default,
	"./assets/pieces/bone/rook/south.png": south_default,
	"./assets/pieces/bone/rook/west.png": west_default,
	"./assets/prologue.png": prologue_default,
	"./assets/red-king.png": red_king_default,
	"./assets/run-over.png": run_over_default,
	"./assets/tiles/arena.png": arena_default,
	"./assets/tiles/corridors.png": corridors_default,
	"./assets/tiles/grid.png": grid_default,
	"./assets/tiles/halls.png": halls_default,
	"./assets/tiles/maze.png": maze_default,
	"./assets/tiles/pylons.png": pylons_default,
	"./assets/tiles/wall-tex-arena.png": wall_tex_arena_default,
	"./assets/tiles/wall-tex-corridors.png": wall_tex_corridors_default,
	"./assets/tiles/wall-tex-grid.png": wall_tex_grid_default,
	"./assets/tiles/wall-tex-halls.png": wall_tex_halls_default,
	"./assets/tiles/wall-tex-maze.png": wall_tex_maze_default,
	"./assets/tiles/wall-tex-pylons.png": wall_tex_pylons_default,
	"./assets/title-bg.png": title_bg_default,
	"./assets/tormentor.png": tormentor_default,
	"./assets/unstitch.png": unstitch_default,
	"./assets/victory.png": victory_default
});
/** Нормализованный ключ: имя без расширения, нижний регистр, без разделителей. */
var norm$1 = (s) => String(s).toLowerCase().replace(/\.[^.]+$/, "").replace(/[\s_-]/g, "");
var BY_STEM = /* @__PURE__ */ new Map();
var USED = /* @__PURE__ */ new Set();
for (const [path, url] of Object.entries(FILES$1)) {
	const file = path.split("/").pop();
	BY_STEM.set(norm$1(file), {
		url,
		path
	});
	const flat = path.replace("./assets/", "").replace(/\//g, "");
	BY_STEM.set(norm$1(flat), {
		url,
		path
	});
}
function pick$1(...names) {
	for (const n of names) {
		const hit = BY_STEM.get(norm$1(n));
		if (hit) {
			USED.add(hit.path);
			return hit.url;
		}
	}
	return null;
}
var ART = {
	logo: pick$1("logo"),
	loading: pick$1("loading"),
	title: pick$1("title-bg", "title"),
	help: pick$1("help"),
	codex: pick$1("codex-bg", "codex"),
	runOver: pick$1("run-over", "death"),
	victory: pick$1("victory", "win"),
	loot: pick$1("loot", "freegame"),
	cover: pick$1("endgame", "cover"),
	prologue: pick$1("prologue"),
	act1to2: pick$1("act1to2"),
	act2to3: pick$1("act2to3"),
	endingKill: pick$1("ending-kill"),
	endingThrone: pick$1("ending-throne"),
	endingBreak: pick$1("ending-break"),
	tutorial: {
		controls: pick$1("help"),
		threat: pick$1("help1"),
		forms: pick$1("help2")
	},
	boss: {
		tormentor: pick$1("tormentor", "boss-tormentor"),
		spawnedRooks: pick$1("linked-rooks", "spawnedrooks", "rooks"),
		millstone: pick$1("millstone", "puppeteer"),
		redKing: pick$1("red-king", "redking")
	},
	biome: {
		halls: pick$1("halls", "biome-halls"),
		corridors: pick$1("corridors", "biome-corridors"),
		maze: pick$1("maze", "biome-maze"),
		grid: pick$1("grid", "biome-grid"),
		arena: pick$1("arena", "biome-arena"),
		pylons: pick$1("pylons", "biome-pylons")
	},
	event: {
		bonesetter: pick$1("bonesetter"),
		unstitch: pick$1("unstitch"),
		sacrifice: pick$1("altar-sacrifice", "sacrifice"),
		dice: pick$1("dice"),
		blessing: pick$1("altar-blessing", "blessing")
	}
};
//#endregion
//#region src/content/script.js
/**
* src/content/script.js — сценарий забега: реплики, диалоги боссов, интерлюдии, эпилоги.
* Основные экспорты: SCRIPT, SCRIPT_EN, getScript(), pickLine(), actForFloor().
*/
var SCRIPT = {
	floorIntro: {
		1: "Ты вышел из ямы. Кости под ногой ломаются.",
		2: "Стены сложены из рёбер. Некоторые ещё тёплые.",
		3: "Здесь кто-то считал дни. Зарубок больше, чем стен.",
		4: "Ров кончается. Дальше — ровный пол.",
		5: "Ров кончается. Пол выложен лопатками — кто-то потрудился.",
		6: "Пол расчерчен. Ты стоишь на клетке.",
		7: "Сверху натянуты нити. Они уходят в темноту.",
		8: "Здесь кого-то тащили. След не кончается.",
		9: "Цепи движутся сами. Никто их не крутит.",
		10: "Клетки мокрые. Пахнет железом.",
		11: "Впереди — жернов. Он не остановится.",
		12: "Клеток нет. Просто пол.",
		13: "На стенах — записи. Все об одной партии.",
		14: "Здесь стояли троны. Остались подставки.",
		15: "Кто-то оставил фигуру на полу. Она смотрит вверх.",
		16: "Свет ровный. Тени не двигаются.",
		17: "Дверь. За ней — дыхание.",
		18: "Тронный зал. Он ждёт."
	},
	enemyLines: {
		pawn: {
			act1: [
				"Добей.",
				"Я помню имя.",
				"Сколько я здесь?",
				"Не подходи.",
				"Ты идёшь вверх?",
				"Там нет верха.",
				"Оно ест меня снизу."
			],
			act2: [
				"Не я.",
				"Рука сама.",
				"Стой. Не могу стоять.",
				"Он смотрит не туда."
			]
		},
		knight: {
			act1: ["Куда ты скачешь?", "Мой конь ушёл."],
			act2: ["Приказ.", "Я держал фланг."]
		},
		bishop: {
			act1: ["Диагональ пуста.", "Он ждёт на белом."],
			act2: ["Нить.", "Не по этой линии."]
		},
		rook: {
			act1: ["Прямо. Только прямо.", "Я не умею иначе."],
			act2: ["Линия занята.", "Ты встал на мою."]
		},
		queen: {
			act1: ["Я была всем сразу.", "Теперь я в твоей руке."],
			act2: ["Нить на шее.", "Он играет мной."]
		}
	},
	deathLines: {
		act1: [
			"Спасибо.",
			"Наконец.",
			"Ты такой же.",
			"Скажи им, что я был первым."
		],
		act2: ["Спасибо, что перерезал.", "Нить. Не меня."],
		act3: [
			"Прости.",
			"Я не хотел.",
			"Он не заставлял."
		]
	},
	boneVoices: {
		pawn: ["Я не пойду туда.", "Там мой брат."],
		knight: ["Слишком высоко.", "Я боюсь падать."],
		bishop: ["Не по этой диагонали.", "Он ждёт на белом."],
		rook: ["Прямо. Только прямо.", "Я не умею иначе."],
		queen: ["Я была всем сразу.", "Теперь я в твоей руке."]
	},
	hungerLines: {
		.4: "Кости начинают ныть.",
		.25: "Под доской стало тише. Оно слушает.",
		.1: "Пальцы крошатся. Ты слышишь, как оно ест.",
		0: "Ешь или будь съеден."
	},
	bonesetterLines: {
		bySeams: {
			0: "— Ты чистый. Это ненадолго.",
			low: "— Швы держат. Пока.",
			mid: "— Ты гремишь при ходьбе. Слышно с яруса выше.",
			high: "— Я не знаю, что ты теперь. Возьми ещё. Хуже не будет."
		},
		byBones: {
			many: "— Ты стал тяжёлым. Тьма любит тяжёлых.",
			few: "— Ты почти пешка. Так дольше живут."
		},
		repeat: {
			2: "— Ты вернулся. Плохо.",
			3: "— Опять. Я начинаю тебя узнавать.",
			5: "— Слушай. Может, хватит?",
			10: "— Я перестал считать. Бери что нужно."
		}
	},
	bosses: {
		tormentor: {
			appear: [{
				ch: "log",
				text: "Он стоит в конце зала. Три тела сшиты в одно."
			}, {
				ch: "speech",
				kind: "boss",
				text: "Мы были инквизицией."
			}],
			phase1: [
				{
					ch: "speech",
					kind: "boss",
					text: "Я жёг."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Я держал."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Я записывал."
				}
			],
			phase2: [{
				ch: "log",
				text: "Одно тело отваливается. Оно ещё шевелится."
			}, {
				ch: "speech",
				kind: "boss",
				text: "Нас двое."
			}],
			phase3: [{
				ch: "speech",
				kind: "boss",
				text: "Я записывал."
			}, {
				ch: "speech",
				kind: "boss",
				text: "Я всё записал."
			}],
			death: [
				{
					ch: "log",
					text: "Он рассыпается. Три пешки бегут к стенам."
				},
				{
					ch: "speech",
					kind: "enemy",
					text: "Не нас."
				},
				{
					ch: "speech",
					kind: "enemy",
					text: "Мы только держали."
				}
			],
			mercyKill: {
				ch: "log",
				text: "Ты добил всех. Ров затих."
			},
			mercySpare: {
				ch: "log",
				text: "Ты дал им уйти. Они не поблагодарили."
			}
		},
		spawnedRooks: {
			appear: [
				{
					ch: "log",
					text: "Две Ладьи. Сросшиеся спинами. Они не смотрят друг на друга."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Он предал первым."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Он лжёт."
				}
			],
			banter: [
				{
					ch: "speech",
					kind: "boss",
					text: "Ты открыл ворота."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Ты назвал моё имя."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Я держал левый край."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Ты держал нож."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Мы могли уйти."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Мы и ушли. Сюда."
				}
			],
			blocked: [
				{
					ch: "log",
					text: "Они упёрлись друг в друга. Впервые за века — стоят."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Отпусти меня."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Отпусти меня."
				}
			],
			firstDeath: {
				ch: "speech",
				kind: "boss",
				text: "Наконец тихо."
			},
			secondDeath: {
				ch: "log",
				text: "Второй не сопротивлялся."
			}
		},
		millstone: {
			appear: [{
				ch: "log",
				text: "Жернов идёт по линии. Он не видит тебя."
			}, {
				ch: "log",
				text: "Он никогда не видел никого."
			}],
			death: {
				ch: "log",
				text: "Жернов встал. Внутри — кости. Много. Некоторые ещё сжимают чужие."
			}
		},
		redKing: {
			appear: [
				{
					ch: "log",
					text: "Он сидит на троне из собственных костей."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Ты дошёл."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Садись. Или ломай цепи. Мне всё равно."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Я устал быть сердцем."
				}
			],
			chainBreak: {
				1: {
					ch: "speech",
					kind: "boss",
					text: "Одна. Хорошо."
				},
				2: {
					ch: "speech",
					kind: "boss",
					text: "Ты быстрее прошлых."
				},
				3: {
					ch: "speech",
					kind: "boss",
					text: "Прошлых было сорок."
				},
				4: {
					ch: "speech",
					kind: "boss",
					text: "Никто не доходил до четвёртой."
				}
			},
			orders: [
				{
					ch: "speech",
					kind: "boss",
					text: "Иди."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Не он. Ты."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Простите."
				}
			],
			alone: [
				{
					ch: "log",
					text: "Зал пуст. Он остался один."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Все."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Больше некого послать."
				}
			],
			queen: {
				appear: {
					ch: "speech",
					kind: "boss",
					text: "Я знала, что кто-то придёт. Я просто не думала, что пешка."
				},
				fight: {
					ch: "speech",
					kind: "boss",
					text: "Он не заставлял. Я сама легла на алтарь. У него не осталось никого."
				},
				death: {
					ch: "speech",
					kind: "boss",
					text: "Скажи ему, что я не жалею."
				}
			},
			rooks: {
				appear: {
					ch: "log",
					text: "Две фигуры. Они не поворачиваются на звук."
				},
				fight: {
					ch: "log",
					text: "Они бьют по линиям. Не по тебе. Просто по линиям."
				},
				death: {
					ch: "log",
					text: "Она упала беззвучно. Как и стояла."
				}
			},
			knights: {
				appear: {
					ch: "speech",
					kind: "boss",
					text: "Сир. Сир. Сир."
				},
				fight: [
					{
						ch: "speech",
						kind: "boss",
						text: "Я держал правый фланг."
					},
					{
						ch: "speech",
						kind: "boss",
						text: "Правый фланг. Правый."
					},
					{
						ch: "speech",
						kind: "boss",
						text: "Где мой конь? Я и есть конь."
					},
					{
						ch: "speech",
						kind: "boss",
						text: "Который час? Который век?"
					}
				],
				death: {
					ch: "speech",
					kind: "boss",
					text: "Доложите королю."
				}
			}
		}
	},
	interludes: {
		prologue: {
			title: "",
			lines: [
				"Ты проиграл битву.",
				"Ты умер.",
				"Тебя сбросили в Ров, к остальным.",
				"",
				"Сто лет ты лежал среди костей и не двигался.",
				"Тьма под доской начала тебя есть.",
				"Ты пошевелился — и она отступила.",
				"",
				"Теперь ты знаешь правило.",
				"Двигайся или будь съеден."
			],
			button: "Встать"
		},
		act1to2: {
			title: "",
			lines: [
				"Ров кончился.",
				"",
				"Из груды поднимается фигура. Когда-то это была Ладья.",
				"Граней не осталось. Только обрубок и мешок.",
				"",
				"    — Ты идёшь вниз.",
				"    — Все идут вниз. Никто не возвращается.",
				"    — Возьми что-нибудь. Мёртвым не нужно.",
				"",
				"Он открывает мешок. Внутри — кости."
			],
			choices: [
				{
					label: "«Сколько?»",
					mercy: 0,
					desc: "Кость бесплатно"
				},
				{
					label: "«Что ты хочешь взамен?»",
					mercy: 1,
					desc: "Кость + 10 пепла"
				},
				{
					label: "Забрать молча",
					mercy: -2,
					desc: "Две кости"
				}
			]
		},
		act2to3: {
			title: "",
			lines: [
				"Партия осталась выше.",
				"",
				"Ты спускаешься туда, куда не спускают фигуры.",
				"Ступени вырублены в кости. Кость — одна, целая.",
				"Ты идёшь по чьему-то позвоночнику.",
				"",
				"Внизу — свет. Красный, ровный, без источника.",
				"",
				"    Оттуда доносится дыхание.",
				"    Медленное. Усталое.",
				"    Кто-то очень давно не спал."
			],
			button: "Спуститься"
		}
	},
	endings: {
		kill: {
			title: "Разомкнуто",
			lines: [
				"Ты бьёшь. Он не закрывается.",
				"",
				"Кости трона рассыпаются. Свет гаснет ровно, без вспышки.",
				"Наверху, в мире живых, тысячи солдат падают на землю",
				"и остаются лежать. Просто лежать. Впервые.",
				"",
				"Ты чувствуешь, как швы расходятся.",
				"Чужие кости отваливаются одна за другой.",
				"Последней остаётся твоя. Пешечная.",
				"",
				"Ты не помнишь имени. Но помнишь, что оно было."
			]
		},
		throne: {
			title: "Ходи",
			lines: [
				"Ты садишься. Пол смыкается на щиколотках.",
				"",
				"Он рассыпается у трона — тихо, с облегчением.",
				"Ты чувствуешь нити. Их тысячи. Каждая — чья-то рука.",
				"",
				"Внизу открывается яма. Оттуда несёт голодом.",
				"Ты понимаешь, чем Короли платили Тьме.",
				"Не собой.",
				"",
				"Первая фигура выходит на поле и ждёт приказа.",
				"Она смотрит на тебя, как ты смотрел на него."
			]
		},
		breakBoard: {
			title: "…пробудить",
			lines: [
				"Ты бьёшь не в него. В пол.",
				"",
				"Кости Павших в твоих руках трескаются разом — все двенадцать.",
				"Пол расходится.",
				"",
				"Под доской нет Тьмы. Под доской — череп.",
				"Огромный, старый, пустой. Подземелье — трещина в кости.",
				"Игроки — не демоны. Это сны, которые ему снились,",
				"пока он ещё мог спать.",
				"",
				"Ты падаешь внутрь черепа.",
				"",
				"Там нет клеток. Там нет правил.",
				"Там ходят фигуры, которых не бывает в шахматах."
			]
		}
	},
	repeat: {
		prologue: { lines: [
			"Ты снова в яме.",
			"Кости уложены иначе, но это те же кости.",
			"",
			"Ты помнишь, чем кончилось.",
			"Они — тоже."
		] },
		enemyLines: [
			"Опять ты.",
			"В прошлый раз ты упал здесь.",
			"Я ждала.",
			"Сколько раз ты уже?"
		],
		kingSeen: [
			{
				ch: "speech",
				kind: "boss",
				text: "Ты уже был здесь."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Ты уже выбирал."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Выбери иначе."
			}
		]
	}
};
var SCRIPT_EN = {
	floorIntro: {
		1: "You crawled out of the pit. Bones crack underfoot.",
		2: "The walls are ribbed. Some are still warm.",
		3: "Someone counted days here. More scratches than walls.",
		4: "The ditch ends. Ahead — flat floor.",
		5: "The ditch ends. The floor is tiled with shoulder blades — someone was busy.",
		6: "The floor is squared. You stand on a cell.",
		7: "Threads are strung overhead. They vanish into the dark.",
		8: "Something was dragged here. The trail never ends.",
		9: "The chains move on their own. No one is turning them.",
		10: "The cells are wet. It smells of iron.",
		11: "Ahead — a millstone. It will not stop.",
		12: "No cells. Just floor.",
		13: "Writings on the walls. All about a single game.",
		14: "Thrones stood here. Only the pedestals remain.",
		15: "Someone left a piece on the floor. It stares upward.",
		16: "The light is flat. Shadows do not stir.",
		17: "A door. Behind it — breathing.",
		18: "The throne room. He waits."
	},
	enemyLines: {
		pawn: {
			act1: [
				"Finish it.",
				"I remember the name.",
				"How long have I been here?",
				"Stay back.",
				"Are you going up?",
				"There is no up.",
				"It eats me from below."
			],
			act2: [
				"Not me.",
				"The hand moved on its own.",
				"Stop. I cannot stand.",
				"He looks the wrong way."
			]
		},
		knight: {
			act1: ["Where do you leap?", "My horse left."],
			act2: ["Orders.", "I held the flank."]
		},
		bishop: {
			act1: ["The diagonal is empty.", "He waits on white."],
			act2: ["A thread.", "Not this line."]
		},
		rook: {
			act1: ["Straight. Only straight.", "I know no other way."],
			act2: ["This line is taken.", "You stepped onto mine."]
		},
		queen: {
			act1: ["I was everything at once.", "Now I am in your hand."],
			act2: ["A thread on my neck.", "He plays me."]
		}
	},
	deathLines: {
		act1: [
			"Thank you.",
			"At last.",
			"You are the same.",
			"Tell them I was first."
		],
		act2: ["Thank you for cutting.", "The thread. Not me."],
		act3: [
			"Forgive me.",
			"I did not want this.",
			"He did not force me."
		]
	},
	boneVoices: {
		pawn: ["I will not go there.", "My brother is there."],
		knight: ["Too high.", "I fear the fall."],
		bishop: ["Not this diagonal.", "He waits on white."],
		rook: ["Straight. Only straight.", "I know no other way."],
		queen: ["I was everything at once.", "Now I am in your hand."]
	},
	hungerLines: {
		.4: "Your bones begin to ache.",
		.25: "Below the board it grew quiet. It listens.",
		.1: "Your fingers crumble. You can hear it eating.",
		0: "Eat or be eaten."
	},
	bonesetterLines: {
		bySeams: {
			0: "\"You are clean. It will not last.\"",
			low: "\"The seams hold. For now.\"",
			mid: "\"You rattle when you walk. Heard from a floor above.\"",
			high: "\"I do not know what you are now. Take another. It cannot get worse.\""
		},
		byBones: {
			many: "\"You have grown heavy. The Darkness loves the heavy.\"",
			few: "\"You are almost a pawn. They live longer.\""
		},
		repeat: {
			2: "\"You came back. Bad sign.\"",
			3: "\"Again. I am beginning to know you.\"",
			5: "\"Listen. Perhaps enough?\"",
			10: "\"I stopped counting. Take what you need.\""
		}
	},
	bosses: {
		tormentor: {
			appear: [{
				ch: "log",
				text: "He stands at the far end. Three bodies sewn into one."
			}, {
				ch: "speech",
				kind: "boss",
				text: "We were the Inquisition."
			}],
			phase1: [
				{
					ch: "speech",
					kind: "boss",
					text: "I burned."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "I held."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "I wrote it down."
				}
			],
			phase2: [{
				ch: "log",
				text: "One body sloughs off. It still twitches."
			}, {
				ch: "speech",
				kind: "boss",
				text: "Two of us left."
			}],
			phase3: [{
				ch: "speech",
				kind: "boss",
				text: "I wrote it down."
			}, {
				ch: "speech",
				kind: "boss",
				text: "I wrote everything."
			}],
			death: [
				{
					ch: "log",
					text: "He crumbles. Three pawns scatter to the walls."
				},
				{
					ch: "speech",
					kind: "enemy",
					text: "Not us."
				},
				{
					ch: "speech",
					kind: "enemy",
					text: "We only held."
				}
			],
			mercyKill: {
				ch: "log",
				text: "You finished them all. The ditch falls silent."
			},
			mercySpare: {
				ch: "log",
				text: "You let them go. They did not thank you."
			}
		},
		spawnedRooks: {
			appear: [
				{
					ch: "log",
					text: "Two Rooks. Spines fused. They do not look at each other."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "He betrayed first."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "He lies."
				}
			],
			banter: [
				{
					ch: "speech",
					kind: "boss",
					text: "You opened the gate."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "You spoke my name."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "I held the left flank."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "You held the knife."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "We could have left."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "We did leave. Here."
				}
			],
			blocked: [
				{
					ch: "log",
					text: "They jam against each other. For the first time in ages — they stop."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Let me go."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Let me go."
				}
			],
			firstDeath: {
				ch: "speech",
				kind: "boss",
				text: "Quiet at last."
			},
			secondDeath: {
				ch: "log",
				text: "The second did not resist."
			}
		},
		millstone: {
			appear: [{
				ch: "log",
				text: "The millstone rolls along its line. It does not see you."
			}, {
				ch: "log",
				text: "It has never seen anyone."
			}],
			death: {
				ch: "log",
				text: "The millstone stops. Inside — bones. Many. Some still clutch others."
			}
		},
		redKing: {
			appear: [
				{
					ch: "log",
					text: "He sits on a throne of his own bones."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "You made it."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Sit. Or break the chains. I do not care."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "I am tired of being the heart."
				}
			],
			chainBreak: {
				1: {
					ch: "speech",
					kind: "boss",
					text: "One. Good."
				},
				2: {
					ch: "speech",
					kind: "boss",
					text: "You are faster than the last."
				},
				3: {
					ch: "speech",
					kind: "boss",
					text: "There were forty before you."
				},
				4: {
					ch: "speech",
					kind: "boss",
					text: "None reached the fourth."
				}
			},
			orders: [
				{
					ch: "speech",
					kind: "boss",
					text: "Go."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Not him. You."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "Forgive me."
				}
			],
			alone: [
				{
					ch: "log",
					text: "The hall is empty. He is alone."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "All of them."
				},
				{
					ch: "speech",
					kind: "boss",
					text: "No one left to send."
				}
			],
			queen: {
				appear: {
					ch: "speech",
					kind: "boss",
					text: "I knew someone would come. I just did not think it would be a pawn."
				},
				fight: {
					ch: "speech",
					kind: "boss",
					text: "He did not force me. I lay on the altar myself. He had no one left."
				},
				death: {
					ch: "speech",
					kind: "boss",
					text: "Tell him I do not regret it."
				}
			},
			rooks: {
				appear: {
					ch: "log",
					text: "Two figures. They do not turn toward sound."
				},
				fight: {
					ch: "log",
					text: "They strike along lines. Not at you. Just the lines."
				},
				death: {
					ch: "log",
					text: "She fell without a sound. As she stood."
				}
			},
			knights: {
				appear: {
					ch: "speech",
					kind: "boss",
					text: "Sire. Sire. Sire."
				},
				fight: [
					{
						ch: "speech",
						kind: "boss",
						text: "I held the right flank."
					},
					{
						ch: "speech",
						kind: "boss",
						text: "Right flank. Right."
					},
					{
						ch: "speech",
						kind: "boss",
						text: "Where is my horse? I am the horse."
					},
					{
						ch: "speech",
						kind: "boss",
						text: "What hour? What century?"
					}
				],
				death: {
					ch: "speech",
					kind: "boss",
					text: "Report to the King."
				}
			}
		}
	},
	interludes: {
		prologue: {
			title: "",
			lines: [
				"You lost the battle.",
				"You died.",
				"They threw you into the Ditch, with the rest.",
				"",
				"A hundred years you lay among the bones and did not stir.",
				"The dark beneath the board began to eat you.",
				"You twitched — and it shrank back.",
				"",
				"Now you know the rule.",
				"Move or be taken."
			],
			button: "Rise"
		},
		act1to2: {
			title: "",
			lines: [
				"The ditch ends.",
				"",
				"A figure lifts from the heap. It was once a Rook.",
				"No edges remain. Only a stump and a sack.",
				"",
				"    \"You are going down.\"",
				"    \"Everyone goes down. No one returns.\"",
				"    \"Take something. The dead do not need it.\"",
				"",
				"He opens the sack. Inside — bones."
			],
			choices: [
				{
					label: "\"How many?\"",
					mercy: 0,
					desc: "One bone, free"
				},
				{
					label: "\"What do you want in return?\"",
					mercy: 1,
					desc: "One bone + 10 ash"
				},
				{
					label: "Take in silence",
					mercy: -2,
					desc: "Two bones"
				}
			]
		},
		act2to3: {
			title: "",
			lines: [
				"The game stayed above.",
				"",
				"You descend where pieces are never sent.",
				"Stairs are carved from bone. One bone, whole.",
				"You walk along someone's spine.",
				"",
				"Below — light. Red, flat, sourceless.",
				"",
				"    Breathing comes from below.",
				"    Slow. Exhausted.",
				"    Someone has not slept for a very long time."
			],
			button: "Descend"
		}
	},
	endings: {
		kill: {
			title: "Unclasped",
			lines: [
				"You strike. He does not block.",
				"",
				"The bones of the throne scatter. The light goes out flat, without a flare.",
				"Above, in the world of the living, thousands of soldiers hit the ground",
				"and stay there. Just lying there. For the first time.",
				"",
				"You feel the seams unthread.",
				"Foreign bones drop off one by one.",
				"The last remaining one is yours. The pawn one.",
				"",
				"You do not remember your name. But you remember there was one."
			]
		},
		throne: {
			title: "Move",
			lines: [
				"You sit. The floor seals at your ankles.",
				"",
				"He crumbles by the throne — quietly, relieved.",
				"You feel the threads. Thousands. Each one — someone's hand.",
				"",
				"A pit opens below. It reeks of hunger.",
				"You understand what the Kings paid the Darkness with.",
				"Not themselves.",
				"",
				"The first piece steps onto the board and awaits orders.",
				"It looks at you the way you looked at him."
			]
		},
		breakBoard: {
			title: "…awaken",
			lines: [
				"You strike not at him. At the floor.",
				"",
				"The Bones of the Fallen in your grip crack at once — all twelve.",
				"The floor splits.",
				"",
				"There is no Darkness beneath the board. Beneath is a skull.",
				"Huge, old, hollow. The Dungeon is a crack in the bone.",
				"The Players are not demons. They are dreams it dreamed",
				"while it could still sleep.",
				"",
				"You fall into the skull.",
				"",
				"There are no cells there. No rules.",
				"Pieces move that do not exist in chess."
			]
		}
	},
	repeat: {
		prologue: { lines: [
			"You are back in the pit.",
			"The bones are laid differently, but they are the same bones.",
			"",
			"You remember how it ended.",
			"So do they."
		] },
		enemyLines: [
			"You again.",
			"Last time you fell here.",
			"I waited.",
			"How many times now?"
		],
		kingSeen: [
			{
				ch: "speech",
				kind: "boss",
				text: "You have been here before."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "You have already chosen."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Choose differently."
			}
		]
	}
};
/** Return SCRIPT or SCRIPT_EN based on current language. */
function getScript() {
	return isEnglish() ? SCRIPT_EN : SCRIPT;
}
/** Взять случайную строку из пула, не повторяя последнюю (по ключу lastKey). */
function pickLine(pool, lastKey) {
	if (!pool || !pool.length) return null;
	if (pool.length === 1) return pool[0];
	let idx;
	do
		idx = Math.floor(Math.random() * pool.length);
	while (pool[idx] === lastKey && pool.length > 1);
	return pool[idx];
}
/** Определить акт по номеру яруса: 1 → act1, 2 → act2, 3 → act3. */
function actForFloor(f) {
	if (f <= 5) return "act1";
	if (f <= 11) return "act2";
	return "act3";
}
//#endregion
//#region src/status.js
/**
* src/status.js — движок статусов: яд, оглушение, щит, ускорение.
* Работает одинаково для игрока и врагов.
* Основные экспорты: applyStatus(), cleanse(), statusVal().
*/
function statusVal(u, k) {
	return u && u.status && u.status[k] || 0;
}
function applyStatus(u, k, n) {
	if (k === "shield" && u === S$1.player && curse("glass")) return;
	if (!u.status) u.status = {};
	u.status[k] = k === "shield" ? (u.status[k] || 0) + n : Math.max(u.status[k] || 0, n);
}
function cleanse(u) {
	if (u) u.status = {};
}
//#endregion
//#region src/util.js
/**
* src/util.js — хелперы: направления, проверки границ, Mersenne Twister, RNG.
* Основные экспорты: ORTHO, DIAG, KNIGHT_J, key(), inB(), tileColor(), cheb(),
* makeForm(), randInt(), pick(), shuffle(), seedRNG(), random(), isBossFloor(), isFinalFloor().
*/
var ORTHO = [
	[0, -1],
	[1, 0],
	[0, 1],
	[-1, 0]
];
var DIAG = [
	[1, -1],
	[1, 1],
	[-1, 1],
	[-1, -1]
];
var KNIGHT_J = [
	[1, -2],
	[2, -1],
	[2, 1],
	[1, 2],
	[-1, 2],
	[-2, 1],
	[-2, -1],
	[-1, -2]
];
var key = (x, y) => x + "," + y;
var inB$1 = (x, y) => x >= 0 && x < CFG.W && y >= 0 && y < CFG.H;
var tileColor = (x, y) => (x + y) % 2;
var cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
function makeForm(type, homeColor = 0, improved = false) {
	return {
		type,
		r: (CFG.BASE_R[type] ?? 1) + (improved && (type === "bishop" || type === "rook" || type === "queen") ? 1 : 0),
		improved,
		cooldown: 0,
		homeColor
	};
}
/** Этаж → id босса. Единственное место, где это знание живёт. */
var BOSS_FLOORS = {
	5: "tormentor",
	8: "spawnedRooks",
	11: "millstone",
	18: "redKing"
};
function MersenneTwister(seed) {
	const N = 624, M = 397, MATRIX_A = 2567483615, UPPER_MASK = 2147483648, LOWER_MASK = 2147483647;
	const mt = new Uint32Array(N);
	let mti = 625;
	mt[0] = seed >>> 0;
	for (mti = 1; mti < N; mti++) mt[mti] = 1812433253 * (mt[mti - 1] ^ mt[mti - 1] >>> 30) + mti >>> 0;
	function twist() {
		for (let i = 0; i < N; i++) {
			const y = (mt[i] & UPPER_MASK) + (mt[(i + 1) % N] & LOWER_MASK);
			mt[i] = mt[(i + M) % N] ^ y >>> 1;
			if (y % 2 !== 0) mt[i] ^= MATRIX_A;
		}
		mti = 0;
	}
	return {
		/** Возвращает случайное целое [0, 2^32). */
		int32() {
			if (mti >= N) twist();
			let y = mt[mti++];
			y ^= y >>> 11;
			y ^= y << 7 & 2636928640;
			y ^= y << 15 & 4022730752;
			y ^= y >>> 18;
			return y >>> 0;
		},
		/** Возвращает случайное число в [0, 1). */
		random() {
			return this.int32() * (1 / 4294967296);
		}
	};
}
/** Глобальный RNG, переустанавливается через seedRNG(). */
var rng = MersenneTwister(Date.now());
/** Установить seed и пересоздать RNG. */
function seedRNG(seed) {
	rng = MersenneTwister(seed);
}
/** Возвращает случайное число [0, 1). */
var random = () => rng.random();
function randInt(n) {
	return Math.floor(rng.random() * n);
}
var pick = (a) => a[randInt(a.length)];
var isBossFloor = (f) => Object.prototype.hasOwnProperty.call(BOSS_FLOORS, f);
var isFinalFloor = (f) => f === 18;
var bossOnFloor = (f) => BOSS_FLOORS[f] || null;
/** Преобразует координаты (x, y) в алгебраическую нотацию: "e4", "a8". */
function xyToAlgebraic(x, y) {
	return String.fromCharCode(97 + x) + (CFG.H - y);
}
/** Сдвиг от (fx,fy) до (tx,ty) — применяется в логе ходов. */
function moveNotation(fx, fy, tx, ty, glyph, enemyGlyph) {
	const from = xyToAlgebraic(fx, fy);
	const to = xyToAlgebraic(tx, ty);
	return enemyGlyph ? `${glyph} ${from}×${enemyGlyph} ${to}` : `${glyph} ${from}-${to}`;
}
function shuffle(a) {
	for (let i = a.length - 1; i > 0; i--) {
		const j = randInt(i + 1);
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
//#endregion
//#region src/bosses.js
/**
* src/bosses.js — AI четырёх боссов: Мучитель (tormentor), Спаянные Ладьи (linkedRooks),
* Жернов (millstone), Кукловод (puppeteer), Красный Король (redKing).
* Конфигурация в BOSS_CFG, логика ходов возвращает массив событий для dispatchBossEvents().
*/
/**
* AI боссов трёх актов.
*
* Все функции хода возвращают массив «событий» — [{ch,kind,text,x,y}], — а не
* зовут log/addSpeech напрямую. Так их можно гонять в тестах и в sandbox без
* канваса, а в игре достаточно прокинуть результат в dispatchBossEvents().
*
* Параметры вынесены в BOSS_CFG: подбираются на глаз в sandbox.
*/
var BOSS_CFG = {
	tormentor: {
		armor: 3,
		range: 4,
		stunEvery: 3,
		stunRadius: 2,
		stunDur: 1,
		diagsByPhase: [
			4,
			3,
			2
		],
		keepDistance: 2,
		splitCount: 3,
		fleeSpeed: 1
	},
	linkedRooks: {
		range: 6,
		revenge: true,
		bickerEvery: 3,
		breakAfterStuck: 2
	},
	millstone: {
		speed: 1,
		moveEvery: 1,
		bounce: true,
		count: 2
	},
	puppeteer: {
		jamQuota: 3,
		pullEvery: 4,
		dropEvery: 3,
		maxPuppets: 6,
		reserve: 14,
		protects: true
	},
	redKing: {
		chains: 4,
		orderEvery: 1,
		queenShield: 1,
		queenShieldEvery: 2,
		rookFireEvery: 2,
		knightChaos: .5,
		knightRestTurns: 1,
		kingArmorAfterChains: 1
	}
};
var ev = {
	log: (text) => ({
		ch: "log",
		text
	}),
	say: (x, y, text, kind = "boss") => ({
		ch: "speech",
		kind,
		text,
		x,
		y
	})
};
/** Свободна ли клетка для фигуры (стены/враги/игрок). */
function freeCell(x, y, self) {
	if (!inB$1(x, y) || S$1.walls.has(key(x, y))) return false;
	const o = enemyAt(x, y);
	if (o && o !== self) return false;
	if (S$1.player.x === x && S$1.player.y === y) return false;
	const sp = S$1.special && S$1.special.get(key(x, y));
	if (sp && sp.type === "millstone" && !sp.jammed) return false;
	if (sp && sp.type === "pillar") return false;
	return true;
}
/** Диагонали, доступные боссу на текущей фазе. Теряет их по мере отслаивания тел. */
function tormentorDiags(e) {
	const n = BOSS_CFG.tormentor.diagsByPhase[Math.min(e.phase - 1, 2)] ?? 2;
	return [...DIAG].sort((a, b) => {
		return cheb({
			x: e.x + a[0] * 2,
			y: e.y + a[1] * 2
		}, S$1.player) - cheb({
			x: e.x + b[0] * 2,
			y: e.y + b[1] * 2
		}, S$1.player);
	}).slice(0, n);
}
/** Клетки, которые Мучитель бьёт из позиции (px,py). */
function tormentorAttacks(e, px = e.x, py = e.y) {
	const out = /* @__PURE__ */ new Set();
	for (const [dx, dy] of tormentorDiags(e)) for (let s = 1; s <= BOSS_CFG.tormentor.range; s++) {
		const x = px + dx * s, y = py + dy * s;
		if (!inB$1(x, y) || S$1.walls.has(key(x, y))) break;
		out.add(key(x, y));
		if (enemyAt(x, y)) break;
	}
	return out;
}
/** Ход Мучителя. */
function tormentorTurn(e) {
	const C = BOSS_CFG.tormentor;
	const out = [];
	e.phase = e.phase || 1;
	e.stunCd = e.stunCd ?? C.stunEvery;
	if (e.stunCd <= 0) {
		if (cheb(S$1.player, e) <= C.stunRadius) {
			applyStatus(S$1.player, "stun", C.stunDur);
			const p1 = getScript().bosses.tormentor.phase1;
			if (p1) p1.forEach((l) => l.ch === "log" ? out.push(ev.log(l.text)) : out.push(ev.say(e.x, e.y, l.text, l.kind || "boss")));
			else {
				out.push(ev.say(e.x, e.y, isEnglish() ? "I burned." : "Я жёг."));
				out.push(ev.log(isEnglish() ? "Three voices scream at once. You go deaf." : "Три голоса кричат одновременно. Ты глохнешь."));
			}
		}
		e.stunCd = C.stunEvery;
	} else e.stunCd--;
	if (tormentorAttacks(e).has(key(S$1.player.x, S$1.player.y))) return [...out, { ch: "capture" }];
	let best = null, bestScore = -Infinity;
	for (const [dx, dy] of DIAG) for (let s = 1; s <= C.range; s++) {
		const x = e.x + dx * s, y = e.y + dy * s;
		if (!freeCell(x, y, e)) break;
		const hits = tormentorAttacks(e, x, y).has(key(S$1.player.x, S$1.player.y));
		const d = cheb({
			x,
			y
		}, S$1.player);
		const score = (hits ? 100 : 0) - Math.abs(d - C.keepDistance) * 3;
		if (score > bestScore) {
			bestScore = score;
			best = {
				x,
				y
			};
		}
	}
	if (best && bestScore > -Infinity) {
		e.x = best.x;
		e.y = best.y;
	}
	return out;
}
/** Урон боссу: смена фазы, при нуле — распад на бегущие пешки. */
function tormentorHit(e) {
	const C = BOSS_CFG.tormentor;
	e.armor--;
	if (e.armor > 0) {
		e.phase = Math.min(e.phase + 1, C.diagsByPhase.length);
		const phaseKey = e.phase <= 2 ? "phase2" : "phase3";
		const script = getScript().bosses.tormentor[phaseKey];
		if (script) return script.map((l) => l.ch === "log" ? ev.log(l.text) : ev.say(e.x, e.y, l.text, l.kind || "boss"));
		const saidRu = ["Нас двое.", "Я всё записал."][Math.min(e.phase - 2, 1)] || "Нас меньше.";
		const saidEn = ["Two of us.", "I wrote it down."][Math.min(e.phase - 2, 1)] || "Fewer of us.";
		const said = isEnglish() ? saidEn : saidRu;
		return [ev.log(isEnglish() ? "One body sloughs off. It still twitches." : "Одно тело отваливается. Оно ещё шевелится."), ev.say(e.x, e.y, said)];
	}
	S$1.enemies = S$1.enemies.filter((v) => v !== e);
	const spots = [];
	for (const [dx, dy] of [...ORTHO, ...DIAG]) {
		const x = e.x + dx, y = e.y + dy;
		if (freeCell(x, y, null)) spots.push({
			x,
			y
		});
	}
	const born = [];
	for (let i = 0; i < C.splitCount && spots.length; i++) {
		const c = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
		const p = {
			type: "pawn",
			x: c.x,
			y: c.y,
			facing: [0, 1],
			cd: 0,
			status: {},
			r: 1,
			fleeing: true,
			fromBoss: "tormentor"
		};
		S$1.enemies.push(p);
		born.push(p);
	}
	return [...(getScript().bosses.tormentor.death || []).map((l) => {
		if (l.ch === "speech") {
			const target = born.shift();
			return target ? ev.say(target.x, target.y, l.text, l.kind || "boss") : ev.log(l.text);
		}
		return ev.log(l.text);
	})].filter(Boolean);
}
/**
* Бегство: инверсия обычного AI. Пешка максимизирует расстояние до игрока
* и стремится к краю карты. Дошла до края — ушла (милосердие игрока по умолчанию).
*/
function fleeingTurn(e) {
	const out = [];
	if (e.x <= 0 || e.y <= 0 || e.x >= CFG.W - 1 || e.y >= CFG.H - 1) {
		S$1.enemies = S$1.enemies.filter((v) => v !== e);
		S$1.mercy = (S$1.mercy || 0) + 1;
		return [ev.log(isEnglish() ? "She slipped into a crack. You let her go." : "Она ушла в трещину. Ты её отпустил.")];
	}
	let best = null, bestScore = -Infinity;
	for (const [dx, dy] of [...ORTHO, ...DIAG]) {
		const x = e.x + dx, y = e.y + dy;
		if (!freeCell(x, y, e)) continue;
		const distFromPlayer = cheb({
			x,
			y
		}, S$1.player);
		const distToEdge = Math.min(x, y, CFG.W - 1 - x, CFG.H - 1 - y);
		const score = distFromPlayer * 2 - distToEdge * 3;
		if (score > bestScore) {
			bestScore = score;
			best = {
				x,
				y
			};
		}
	}
	if (best) {
		e.x = best.x;
		e.y = best.y;
	}
	return out;
}
/** Клетки, которые ладья бьёт по прямым. */
function rookAttacks(e, px = e.x, py = e.y) {
	const out = /* @__PURE__ */ new Set();
	for (const [dx, dy] of ORTHO) for (let s = 1; s <= BOSS_CFG.linkedRooks.range; s++) {
		const x = px + dx * s, y = py + dy * s;
		if (!inB$1(x, y) || S$1.walls.has(key(x, y))) break;
		out.add(key(x, y));
		if (enemyAt(x, y)) break;
	}
	return out;
}
/**
* Ход пары. Обе идут на ОДИН вектор. Если вектор ведёт одну в другую —
* связь рвётся: это и есть решение пазла, игрок ищет такую позицию.
*/
function linkedRooksTurn(pair) {
	const C = BOSS_CFG.linkedRooks;
	const [a, b] = pair;
	const out = [];
	if (!S$1.enemies.includes(a) || !S$1.enemies.includes(b)) return out;
	for (const r of pair) if (rookAttacks(r).has(key(S$1.player.x, S$1.player.y))) return [{
		ch: "capture",
		by: r
	}];
	const dx = S$1.player.x - a.x, dy = S$1.player.y - a.y;
	const vec = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx) || 0, 0] : [0, Math.sign(dy) || 0];
	const na = {
		x: a.x + vec[0],
		y: a.y + vec[1]
	};
	const nb = {
		x: b.x + vec[0],
		y: b.y + vec[1]
	};
	const okCell = (x, y) => {
		if (!inB$1(x, y) || S$1.walls.has(key(x, y))) return false;
		if (S$1.player.x === x && S$1.player.y === y) return false;
		const sp = S$1.special && S$1.special.get(key(x, y));
		if (sp && (sp.type === "pillar" || sp.type === "millstone" && !sp.jammed)) return false;
		const o = enemyAt(x, y);
		if (o && o !== a && o !== b) return false;
		return true;
	};
	if (vec[0] === 0 && vec[1] === 0 || !okCell(na.x, na.y) || !okCell(nb.x, nb.y)) {
		a.stuck = (a.stuck || 0) + 1;
		b.stuck = a.stuck;
		if (a.stuck >= C.breakAfterStuck) {
			delete a.linkedTo;
			delete b.linkedTo;
			return (getScript().bosses.spawnedRooks && getScript().bosses.spawnedRooks.blocked || [
				{
					ch: "log",
					text: isEnglish() ? "They jam against each other. For the first time in ages — they stop." : "Они упёрлись друг в друга. Впервые за века — стоят."
				},
				{
					ch: "speech",
					kind: "boss",
					text: isEnglish() ? "Let me go." : "Отпусти меня."
				},
				{
					ch: "speech",
					kind: "boss",
					text: isEnglish() ? "Let me go." : "Отпусти меня."
				}
			]).map((l) => {
				if (l.ch === "log") return ev.log(l.text);
				if (l.ch === "speech") {
					const speaker = l.speaker === "b" ? b : a;
					return ev.say(speaker.x, speaker.y, l.text, l.kind || "boss");
				}
				return null;
			}).filter(Boolean);
		}
		out.push(ev.log(isEnglish() ? `Spine does not bend. The Rooks stop (${a.stuck}/${C.breakAfterStuck}).` : `Спина не гнётся. Ладьи встали (${a.stuck}/${C.breakAfterStuck}).`));
		const banter = getScript().bosses.spawnedRooks && getScript().bosses.spawnedRooks.banter || (isEnglish() ? [
			{
				ch: "speech",
				kind: "boss",
				text: "You opened the gate."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "You spoke my name."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "I held the left flank."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "You held the knife."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "We could have left."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "We did leave. Here."
			}
		] : [
			{
				ch: "speech",
				kind: "boss",
				text: "Ты открыл ворота."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Ты назвал моё имя."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Я держал левый край."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Ты держал нож."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Мы могли уйти."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Мы и ушли. Сюда."
			}
		]);
		const i = Math.floor(Math.random() * (banter.length / 2)) * 2;
		out.push(ev.say(a.x, a.y, banter[i].text, banter[i].kind || "boss"), ev.say(b.x, b.y, banter[i + 1].text, banter[i + 1].kind || "boss"));
		return out;
	}
	a.stuck = 0;
	b.stuck = 0;
	a.x = na.x;
	a.y = na.y;
	b.x = nb.x;
	b.y = nb.y;
	return out;
}
/** Месть выжившей ладьи: бьёт вне очереди, если связь была цела. */
function linkedRookRevenge(killed) {
	if (!BOSS_CFG.linkedRooks.revenge || !killed.linkedTo) return [];
	const other = S$1.enemies.find((e) => e.linkedTo === killed.linkedTo && e !== killed);
	if (!other) return [];
	const firstDeath = getScript().bosses.spawnedRooks && getScript().bosses.spawnedRooks.firstDeath || {
		ch: "speech",
		kind: "boss",
		text: isEnglish() ? "Quiet at last." : "Наконец тихо."
	};
	if (rookAttacks(other).has(key(S$1.player.x, S$1.player.y))) return [ev.say(other.x, other.y, firstDeath.text, firstDeath.kind), {
		ch: "capture",
		by: other
	}];
	return [ev.say(other.x, other.y, firstDeath.text, firstDeath.kind)];
}
/** Ход всех жерновов. Механизм не видит игрока — просто едет. */
function millstoneTurn() {
	const C = BOSS_CFG.millstone;
	const out = [];
	if (!S$1.special) return out;
	S$1.millTick = (S$1.millTick || 0) + 1;
	if (S$1.millTick % C.moveEvery !== 0) return out;
	if (S$1.millFed >= BOSS_CFG.puppeteer.jamQuota) return out;
	let reachedQuota = false;
	const keys = [...S$1.special.keys()].filter((k) => S$1.special.get(k)?.type === "millstone");
	for (const mk of keys) {
		const ms = S$1.special.get(mk);
		if (!ms || ms.jammed) continue;
		let [x, y] = mk.split(",").map(Number);
		let [dx, dy] = ms.dir;
		S$1.special.delete(mk);
		for (let step = 0; step < C.speed; step++) {
			const nx = x + dx, ny = y + dy;
			if (!inB$1(nx, ny) || S$1.walls.has(key(nx, ny)) || S$1.special.get(key(nx, ny))?.type === "pillar") {
				if (!C.bounce) {
					x = null;
					break;
				}
				dx = -dx;
				dy = -dy;
				continue;
			}
			x = nx;
			y = ny;
			const e = enemyAt(x, y);
			if (e) {
				S$1.enemies = S$1.enemies.filter((v) => v !== e);
				S$1.millFed = (S$1.millFed || 0) + 1;
				const q = BOSS_CFG.puppeteer.jamQuota;
				out.push(ev.log(isEnglish() ? `The millstone grinds a body. Jammed: ${S$1.millFed}/${q}.` : `Жернов перемалывает тело. Забито: ${S$1.millFed}/${q}.`));
				if (S$1.millFed >= q) reachedQuota = true;
			}
			if (S$1.player.x === x && S$1.player.y === y) out.push({ ch: "crush" });
		}
		if (x !== null) S$1.special.set(key(x, y), {
			type: "millstone",
			dir: [dx, dy]
		});
	}
	if (reachedQuota) {
		const md = getScript().bosses.millstone && getScript().bosses.millstone.death;
		if (md) out.push(ev.log(md.text));
		else {
			out.push(ev.log(isEnglish() ? "The millstone stops. Inside — bones. Many." : "Жернов встал. Внутри — кости. Много."));
			out.push(ev.log(isEnglish() ? "Some still clutch others." : "Некоторые ещё сжимают чужие."));
		}
		out.push({
			ch: "bossDown",
			boss: "puppeteer"
		});
		for (const k2 of [...S$1.special.keys()]) {
			const s2 = S$1.special.get(k2);
			if (s2 && s2.type === "millstone") S$1.special.set(k2, {
				...s2,
				jammed: true
			});
		}
	}
	return out;
}
/** Клетки, куда жернова встанут следующим ходом. Кукловод их учитывает. */
function millDanger() {
	const danger = /* @__PURE__ */ new Set();
	if (!S$1.special) return danger;
	const C = BOSS_CFG.millstone;
	for (const [k, s] of S$1.special) {
		if (s.type !== "millstone" || s.jammed) continue;
		let [x, y] = k.split(",").map(Number);
		let [dx, dy] = s.dir;
		for (let step = 0; step < C.speed; step++) {
			let nx = x + dx, ny = y + dy;
			if (!inB$1(nx, ny) || S$1.walls.has(key(nx, ny)) || S$1.special.get(key(nx, ny))?.type === "pillar") {
				if (!C.bounce) break;
				dx = -dx;
				dy = -dy;
				nx = x + dx;
				ny = y + dy;
				if (!inB$1(nx, ny) || S$1.walls.has(key(nx, ny))) break;
			}
			x = nx;
			y = ny;
			danger.add(key(x, y));
		}
	}
	return danger;
}
/** Один шаг куклы к игроку. Куклы слепы: путь выбирают только по дистанции. */
function puppetStep(e, avoid) {
	let best = null, bestD = cheb(e, S$1.player);
	for (const [dx, dy] of [...ORTHO, ...DIAG]) {
		const x = e.x + dx, y = e.y + dy;
		if (!freeCell(x, y, e)) continue;
		if (avoid && avoid.has(key(x, y))) continue;
		const d = cheb({
			x,
			y
		}, S$1.player);
		if (d < bestD) {
			bestD = d;
			best = {
				x,
				y
			};
		}
	}
	if (best) {
		e.x = best.x;
		e.y = best.y;
		return true;
	}
	return false;
}
/**
* Ход Кукловода. Он не на доске — он дёргает нити сверху.
* Обычный ход: двигает ОДНУ куклу и обходит жернов (бережёт материал).
* Рывок раз в pullEvery: дёргает все нити разом, на потери не смотрит —
* именно в этот момент игрок и скармливает механизму его же фигуры.
*/
function partyTurn() {
	const C = BOSS_CFG.puppeteer;
	const out = [];
	const P = S$1.party = S$1.party || {
		dropCd: 0,
		pullCd: C.pullEvery,
		reserve: C.reserve
	};
	const puppets = S$1.enemies.filter((e) => e.puppet);
	if (P.dropCd <= 0 && puppets.length < C.maxPuppets && P.reserve > 0) {
		const spots = [];
		for (let x = 1; x < CFG.W - 1; x++) if (freeCell(x, 0, null)) spots.push({
			x,
			y: 0
		});
		if (spots.length) {
			const c = pick(spots);
			S$1.enemies.push({
				type: "pawn",
				x: c.x,
				y: c.y,
				facing: [0, 1],
				cd: 0,
				status: {},
				r: 1,
				puppet: true
			});
			P.reserve--;
			P.dropCd = C.dropEvery;
			out.push(ev.log(isEnglish() ? "A body drops from above. The thread tightens." : "Сверху падает тело. Нить натягивается."));
		}
	} else P.dropCd--;
	P.pullCd--;
	const pulling = P.pullCd <= 0;
	if (pulling) P.pullCd = C.pullEvery;
	const danger = C.protects && !pulling ? millDanger() : null;
	if (pulling) {
		out.push(ev.say(S$1.player.x, S$1.player.y, isEnglish() ? "Order." : "Приказ.", "boss"));
		for (const p of puppets) {
			if (rookLikeCapture(p)) return [...out, {
				ch: "capture",
				by: p
			}];
			puppetStep(p, null);
		}
	} else if (puppets.length) {
		const sorted = [...puppets].sort((a, b) => cheb(a, S$1.player) - cheb(b, S$1.player));
		for (const p of sorted) if (rookLikeCapture(p)) return [...out, {
			ch: "capture",
			by: p
		}];
		if (!sorted.find((p) => puppetStep(p, danger))) out.push(ev.log(isEnglish() ? "The threads go slack. No one moved." : "Нити провисли. Никто не двинулся."));
	}
	return out;
}
/** Кукла берёт игрока, если стоит вплотную. */
function rookLikeCapture(p) {
	return cheb(p, S$1.player) === 1;
}
/** Король: неподвижен, приказывает, чинит щит королеве. */
function redKingTurn(king) {
	const C = BOSS_CFG.redKing;
	const out = [];
	const retinue = S$1.enemies.filter((e) => e !== king && e.retinue);
	king.qsCd = (king.qsCd ?? C.queenShieldEvery) - 1;
	if (king.qsCd <= 0) {
		king.qsCd = C.queenShieldEvery;
		const q = retinue.find((e) => e.retinue === "queen");
		if (q) {
			applyStatus(q, "shield", C.queenShield);
			out.push(ev.log(isEnglish() ? "The Queen is shielded again." : "Королева снова под щитом."));
		}
	}
	king.orderCd = (king.orderCd ?? C.orderEvery) - 1;
	if (king.orderCd <= 0 && retinue.length) {
		king.orderCd = C.orderEvery;
		const target = pick(retinue);
		target.kingOrder = true;
		const orders = getScript().bosses.redKing && getScript().bosses.redKing.orders || (isEnglish() ? [
			{
				ch: "speech",
				kind: "boss",
				text: "Go."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Not him. You."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Forgive me."
			}
		] : [
			{
				ch: "speech",
				kind: "boss",
				text: "Иди."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Не он. Ты."
			},
			{
				ch: "speech",
				kind: "boss",
				text: "Простите."
			}
		]);
		const ord = target.retinue === "knight" ? orders.find((o) => o.text === (isEnglish() ? "Forgive me." : "Простите.")) || {
			ch: "speech",
			kind: "boss",
			text: "Простите."
		} : pick(orders.filter((o) => o.text !== (isEnglish() ? "Forgive me." : "Простите.")));
		out.push(ev.say(king.x, king.y, ord.text, ord.kind || "boss"));
	}
	king.armor = S$1.chainsBroken >= C.chains ? C.kingArmorAfterChains : 99;
	if (S$1.chainsBroken >= C.chains && !king.exposed) {
		king.exposed = true;
		out.push(ev.log(isEnglish() ? "The chains fell. He is exposed." : "Цепи пали. Он открыт."));
		if (!retinue.length) (getScript().bosses.redKing && getScript().bosses.redKing.alone || [{
			ch: "speech",
			kind: "boss",
			text: isEnglish() ? "All of them." : "Все."
		}, {
			ch: "speech",
			kind: "boss",
			text: isEnglish() ? "No one left to send." : "Больше некого послать."
		}]).forEach((l) => out.push(l.ch === "speech" ? ev.say(king.x, king.y, l.text, l.kind || "boss") : ev.log(l.text)));
	}
	return out;
}
/** Королева: обычный ферзь, но со щитом от короля. */
function queenTurn(e) {
	const out = [];
	const dirs = [...ORTHO, ...DIAG];
	for (const [dx, dy] of dirs) for (let s = 1; s <= 8; s++) {
		const x = e.x + dx * s, y = e.y + dy * s;
		if (!inB$1(x, y) || S$1.walls.has(key(x, y))) break;
		if (S$1.player.x === x && S$1.player.y === y) return [{
			ch: "capture",
			by: e
		}];
		if (enemyAt(x, y)) break;
	}
	let best = null, bestD = cheb(e, S$1.player);
	for (const [dx, dy] of dirs) for (let s = 1; s <= 3; s++) {
		const x = e.x + dx * s, y = e.y + dy * s;
		if (!freeCell(x, y, e)) break;
		const d = cheb({
			x,
			y
		}, S$1.player);
		if (d < bestD) {
			bestD = d;
			best = {
				x,
				y
			};
		}
	}
	if (best) {
		e.x = best.x;
		e.y = best.y;
	}
	return out;
}
/**
* Слепые Ладьи: не преследуют. Простреливают линию по расписанию.
* Если игрок на линии в момент залпа — взятие.
*/
function blindRookTurn(e) {
	const C = BOSS_CFG.redKing;
	const out = [];
	e.fireCd = (e.fireCd ?? C.rookFireEvery) - 1;
	if (e.fireCd > 0) return out;
	e.fireCd = C.rookFireEvery;
	if (e.x !== S$1.player.x && e.y !== S$1.player.y) {
		const rf = getScript().bosses.redKing.rooks && getScript().bosses.redKing.rooks.fight || {
			ch: "log",
			text: isEnglish() ? "They strike along lines. Not at you. Just the lines." : "Они бьют по линиям. Не по тебе. Просто по линиям."
		};
		out.push(rf.ch === "speech" ? ev.say(e.x, e.y, rf.text, rf.kind) : ev.log(rf.text));
		return out;
	}
	const sx = Math.sign(S$1.player.x - e.x), sy = Math.sign(S$1.player.y - e.y);
	let cx = e.x + sx, cy = e.y + sy;
	while (cx !== S$1.player.x || cy !== S$1.player.y) {
		if (S$1.walls.has(key(cx, cy)) || enemyAt(cx, cy)) return out;
		cx += sx;
		cy += sy;
	}
	return [{
		ch: "capture",
		by: e
	}];
}
/** Безумные Кони: полуслучайные прыжки, не бьют два хода подряд. */
function madKnightTurn(e) {
	const C = BOSS_CFG.redKing;
	const out = [];
	if (e.resting > 0) {
		e.resting--;
		return out;
	}
	const JUMPS = [
		[1, 2],
		[2, 1],
		[-1, 2],
		[-2, 1],
		[1, -2],
		[2, -1],
		[-1, -2],
		[-2, -1]
	];
	for (const [dx, dy] of JUMPS) if (e.x + dx === S$1.player.x && e.y + dy === S$1.player.y) {
		e.resting = C.knightRestTurns;
		return [{
			ch: "capture",
			by: e
		}];
	}
	const opts = JUMPS.map(([dx, dy]) => ({
		x: e.x + dx,
		y: e.y + dy
	})).filter((c) => freeCell(c.x, c.y, e));
	if (!opts.length) return out;
	let target;
	if (Math.random() < C.knightChaos) target = pick(opts);
	else target = opts.reduce((a, b) => cheb(b, S$1.player) < cheb(a, S$1.player) ? b : a);
	e.x = target.x;
	e.y = target.y;
	return out;
}
/** Один ход всех боссовых сущностей. Возвращает события. */
function bossTurn() {
	let out = [];
	out = out.concat(millstoneTurn());
	if (S$1.party || S$1.enemies.some((e) => e.puppet)) out = out.concat(partyTurn());
	const groups = /* @__PURE__ */ new Map();
	for (const e of S$1.enemies) if (e.linkedTo) {
		const g = groups.get(e.linkedTo) || [];
		g.push(e);
		groups.set(e.linkedTo, g);
	}
	for (const [, g] of groups) if (g.length === 2) out = out.concat(linkedRooksTurn(g));
	for (const e of [...S$1.enemies]) {
		if (!S$1.enemies.includes(e)) continue;
		if (e.linkedTo) continue;
		if (e.fleeing) {
			out = out.concat(fleeingTurn(e));
			continue;
		}
		if (e.puppet) continue;
		if (e.bossId === "tormentor") out = out.concat(tormentorTurn(e));
		else if (e.king) out = out.concat(redKingTurn(e));
		else if (e.retinue === "queen") out = out.concat(queenTurn(e));
		else if (e.retinue === "rook") out = out.concat(blindRookTurn(e));
		else if (e.retinue === "knight") out = out.concat(madKnightTurn(e));
	}
	return out;
}
/** Прокинуть события в игру. В sandbox используется свой обработчик. */
function dispatchBossEvents(events, { log, addSpeech, onCapture, onCrush } = {}) {
	for (const e of events) {
		if (!e) continue;
		if (e.ch === "log" && log) log(e.text);
		else if (e.ch === "speech" && addSpeech) {
			addSpeech(e.x, e.y, e.text, e.kind || "boss");
			if (log) log(e.text);
		} else if (e.ch === "capture" && onCapture) onCapture(e.by);
		else if (e.ch === "crush" && onCrush) onCrush();
	}
}
//#endregion
//#region src/moves.js
var threatCache = null;
var threatCacheKey = "";
/** Сбросить кэш угроз и ходов игрока — вызывать после хода игрока/врагов. */
function invalidateThreats() {
	threatCache = null;
	threatCacheKey = "";
}
function cachedThreats(insp) {
	const k = insp ? "e" + S$1.enemies.indexOf(insp) : "all";
	if (threatCache && threatCacheKey === k) return threatCache;
	threatCacheKey = k;
	threatCache = insp ? enemyThreat(insp) : allThreats();
	return threatCache;
}
function genMoves(piece, form, isEnemyCell, isBlocked) {
	const moves = [], captures = [];
	const mine = piece === S$1.player;
	const hasteOn = statusVal(piece, "haste") > 0;
	const free = (x, y) => inB$1(x, y) && !S$1.walls.has(key(x, y)) && !isBlocked(x, y) && !isEnemyCell(x, y);
	const blk = (x, y, dir) => {
		const s = S$1.special && S$1.special.get(key(x, y));
		if (!s) return false;
		if (s.type === "colorzone") return form.type !== "bishop";
		if (s.type === "gate") {
			if (!dir) return true;
			return !(dir[0] === s.dir[0] && dir[1] === s.dir[1]);
		}
		if (s.type === "pillar") return true;
		if (s.type === "millstone" && !s.jammed) return true;
		return false;
	};
	const reachBonus = (mine ? (has("slider_reach") ? 1 : 0) + (has("light_lines") && tileColor(piece.x, piece.y) === 0 ? 1 : 0) - (curse("heavy") ? 1 : 0) : 0) + (hasteOn ? 1 : 0);
	const slide = (dirs, R) => {
		for (const [dx, dy] of dirs) for (let s = 1; s <= R; s++) {
			const x = piece.x + dx * s, y = piece.y + dy * s;
			if (!inB$1(x, y) || S$1.walls.has(key(x, y))) break;
			if (blk(x, y, [dx, dy])) break;
			if (isEnemyCell(x, y)) {
				captures.push({
					x,
					y
				});
				break;
			}
			if (isBlocked(x, y)) break;
			moves.push({
				x,
				y
			});
		}
	};
	switch (form.type) {
		case "pawn": {
			const [fx, fy] = piece.facing;
			const mx = piece.x + fx, my = piece.y + fy;
			if (free(mx, my) && !blk(mx, my, [fx, fy])) {
				moves.push({
					x: mx,
					y: my
				});
				if (mine && has("pawn_double") || hasteOn) {
					const x2 = piece.x + fx * 2, y2 = piece.y + fy * 2;
					if (free(x2, y2) && !blk(x2, y2, [fx, fy])) moves.push({
						x: x2,
						y: y2
					});
				}
			}
			const perp = mine && has("pawn_omni") ? DIAG : fx === 0 ? [[-1, fy], [1, fy]] : [[fx, -1], [fx, 1]];
			for (const [dx, dy] of perp) {
				const x = piece.x + dx, y = piece.y + dy;
				if (inB$1(x, y) && isEnemyCell(x, y) && !blk(x, y, [dx, dy])) captures.push({
					x,
					y
				});
			}
			break;
		}
		case "knight":
			for (const [dx, dy] of KNIGHT_J) {
				const x = piece.x + dx, y = piece.y + dy;
				if (!inB$1(x, y) || S$1.walls.has(key(x, y)) || blk(x, y, null)) continue;
				if (isEnemyCell(x, y)) captures.push({
					x,
					y
				});
				else if (!isBlocked(x, y)) moves.push({
					x,
					y
				});
			}
			if (form.improved || mine && has("knight_extra") || hasteOn) for (const [dx, dy] of ORTHO) {
				const x = piece.x + dx, y = piece.y + dy;
				if (blk(x, y, [dx, dy])) continue;
				if (free(x, y)) moves.push({
					x,
					y
				});
				else if (inB$1(x, y) && isEnemyCell(x, y)) captures.push({
					x,
					y
				});
			}
			break;
		case "bishop": {
			const bonus = tileColor(piece.x, piece.y) === form.homeColor ? 1 : 0;
			slide(DIAG, Math.max(1, (form.r ?? CFG.BASE_R.bishop) + bonus + reachBonus));
			break;
		}
		case "rook":
			slide(ORTHO, Math.max(1, (form.r ?? CFG.BASE_R.rook) + reachBonus));
			break;
		case "queen":
			slide([...ORTHO, ...DIAG], Math.max(1, (form.r ?? CFG.BASE_R.queen) + reachBonus));
			break;
		case "archbishop":
			slide(DIAG, Math.max(1, (form.r ?? CFG.BASE_R.archbishop) + reachBonus));
			for (const [dx, dy] of KNIGHT_J) {
				const x = piece.x + dx, y = piece.y + dy;
				if (!inB$1(x, y) || S$1.walls.has(key(x, y)) || blk(x, y, null)) continue;
				if (isEnemyCell(x, y)) captures.push({
					x,
					y
				});
				else if (!isBlocked(x, y)) moves.push({
					x,
					y
				});
			}
			break;
		case "chancellor":
			slide(ORTHO, Math.max(1, (form.r ?? CFG.BASE_R.chancellor) + reachBonus));
			for (const [dx, dy] of KNIGHT_J) {
				const x = piece.x + dx, y = piece.y + dy;
				if (!inB$1(x, y) || S$1.walls.has(key(x, y)) || blk(x, y, null)) continue;
				if (isEnemyCell(x, y)) captures.push({
					x,
					y
				});
				else if (!isBlocked(x, y)) moves.push({
					x,
					y
				});
			}
			break;
		case "beast":
			for (const [dx, dy] of [
				[2, 0],
				[-2, 0],
				[0, 2],
				[0, -2],
				[2, 2],
				[2, -2],
				[-2, 2],
				[-2, -2],
				[1, 2],
				[1, -2],
				[-1, 2],
				[-1, -2]
			]) {
				const x = piece.x + dx, y = piece.y + dy;
				if (!inB$1(x, y) || S$1.walls.has(key(x, y)) || blk(x, y, null)) continue;
				if (isEnemyCell(x, y)) captures.push({
					x,
					y
				});
				else if (!isBlocked(x, y)) moves.push({
					x,
					y
				});
			}
			break;
		case "infiltrator":
			for (const [dx, dy] of ORTHO) {
				const nx = piece.x + dx, ny = piece.y + dy;
				if (!inB$1(nx, ny) || S$1.walls.has(key(nx, ny))) continue;
				if (blk(nx, ny)) continue;
				if (isEnemyCell(nx, ny)) captures.push({
					x: nx,
					y: ny
				});
				else if (!isBlocked(nx, ny)) moves.push({
					x: nx,
					y: ny
				});
			}
			for (const [dx, dy] of DIAG) {
				const nx = piece.x + dx, ny = piece.y + dy;
				if (!inB$1(nx, ny) || S$1.walls.has(key(nx, ny))) continue;
				if (blk(nx, ny)) continue;
				if (isEnemyCell(nx, ny)) captures.push({
					x: nx,
					y: ny
				});
			}
			break;
		case "bastion":
			for (const [dx, dy] of ORTHO) {
				const nx = piece.x + dx, ny = piece.y + dy;
				if (!inB$1(nx, ny) || S$1.walls.has(key(nx, ny))) continue;
				if (blk(nx, ny)) continue;
				if (isEnemyCell(nx, ny)) captures.push({
					x: nx,
					y: ny
				});
				else if (!isBlocked(nx, ny)) moves.push({
					x: nx,
					y: ny
				});
			}
			break;
		case "king":
			for (const [dx, dy] of [...ORTHO, ...DIAG]) {
				const x = piece.x + dx, y = piece.y + dy;
				if (!inB$1(x, y) || S$1.walls.has(key(x, y)) || blk(x, y, [dx, dy])) continue;
				if (isEnemyCell(x, y)) captures.push({
					x,
					y
				});
				else if (!isBlocked(x, y)) moves.push({
					x,
					y
				});
			}
			break;
	}
	return {
		moves,
		captures
	};
}
function effectiveForm(e) {
	if (e.type === "mimic") {
		if (has("mirror_break")) return {
			type: "pawn",
			r: 1,
			homeColor: e.homeColor
		};
		const t = (S$1.player.wheel[S$1.player.active] || { type: "pawn" }).type;
		return {
			type: t,
			r: (CFG.BASE_R[t] || 1) + (e.rb || 0) + (curse("mimic_reach") ? 1 : 0),
			homeColor: e.homeColor
		};
	}
	if (MOVE_AS[e.type]) return {
		type: MOVE_AS[e.type],
		r: 1,
		homeColor: e.homeColor
	};
	return e;
}
function necroInterval() {
	return Math.max(1, CFG.DIFF.necroEvery * (has("silence") ? 2 : 1) - (curse("dark_summon") ? 1 : 0));
}
function enemyThreat(e) {
	if (e.type === "necro" || e.type === "frost") return /* @__PURE__ */ new Set();
	if (statusVal(e, "stun") > 0) return /* @__PURE__ */ new Set();
	const ef = effectiveForm(e);
	const set = /* @__PURE__ */ new Set();
	if (ef.type === "pawn") {
		const [fx, fy] = e.facing;
		(fx === 0 ? [[-1, fy], [1, fy]] : [[fx, -1], [fx, 1]]).forEach(([dx, dy]) => {
			const x = e.x + dx, y = e.y + dy;
			if (inB$1(x, y) && !S$1.walls.has(key(x, y))) set.add(key(x, y));
		});
		return set;
	}
	const { moves, captures } = genMoves(e, ef, (x, y) => S$1.player.x === x && S$1.player.y === y, (x, y) => {
		const o = enemyAt(x, y);
		return !!o && o !== e;
	});
	moves.forEach((c) => set.add(key(c.x, c.y)));
	captures.forEach((c) => set.add(key(c.x, c.y)));
	return set;
}
function allThreats() {
	const set = /* @__PURE__ */ new Set();
	S$1.enemies.forEach((e) => enemyThreat(e).forEach((k) => set.add(k)));
	return set;
}
function activeForm() {
	return S$1.player.wheel[S$1.player.active];
}
function playerOptions() {
	const f = activeForm();
	return genMoves(S$1.player, f, (x, y) => !!enemyAt(x, y), () => false);
}
function threatCellsFrom(e, x, y) {
	const sx = e.x, sy = e.y;
	e.x = x;
	e.y = y;
	const set = enemyThreat(e);
	e.x = sx;
	e.y = sy;
	return set;
}
/**
* Проверка, что враг типа `t` на клетке (x, y) не заперт навсегда —
* у него есть хотя бы один ход без учёта взятий.
* Используется при спавне врагов.
*/
function isSpawnable(t, x, y) {
	const dummy = {
		type: t,
		x,
		y,
		facing: [0, 1],
		cd: 0,
		status: {},
		r: CFG.BASE_R[t] || 1,
		rb: 0
	};
	return genMoves(dummy, effectiveForm(dummy), () => false, (nx, ny) => S$1.walls.has(key(nx, ny))).moves.length > 0;
}
//#endregion
//#region src/content/tutorial.js
/**
* src/content/tutorial.js — tutorial content.
*
* Two parts:
*   SCENES — six scripted scenes of the "Ditch". Maps drawn in ASCII; the compiler
*            turns them into loadLevel() format. You can edit them as text, not JSON.
*   HINTS  — hints for normal runs, each triggers once ever (flag in META.hints).
*
* Voice: lore line = from the world, task line = from the interface. Must not mix,
* otherwise the player cannot tell what is instruction.
*/
var CHARS = {
	"#": { wall: true },
	".": {},
	P: { start: true },
	"*": { target: true },
	p: { enemy: "pawn" },
	n: { enemy: "knight" },
	b: { enemy: "bishop" },
	r: { enemy: "rook" },
	f: { special: "food" },
	j: { special: "rune" },
	w: { special: "trap" }
};
/**
* Scene fields:
*   map      — ASCII, first line = y 0 (top of board, promotion line)
*   facing   — starting pawn facing
*   wheel    — starting form wheel
*   lore     — world line, in italic
*   task     — what to do, normal text
*   allow    — what is allowed: move ('targets'|'all'), switch, pass, rotate
*   done     — completion condition
*   freeze   — enemies do not move (default true)
*   hunger   — hunger bar active (default false)
*   onFail   — what to say if the player does the wrong thing
*/
var SCENES = [
	{
		id: "step",
		title: "Шаг",
		map: [
			"#######",
			"#.....#",
			"#.....#",
			"#..*..#",
			"#..P..#",
			"#######"
		],
		facing: [0, -1],
		wheel: ["pawn"],
		lore: "Ты пошевелился — и Тьма отступила. Первое, что вспоминает пешка: она умеет идти вперёд.",
		task: "Тапни по бирюзовой точке. Это твой ход.",
		allow: {
			move: "all",
			switch: false,
			pass: false,
			rotate: false
		},
		done: { reachTarget: true }
	},
	{
		id: "facing",
		title: "Взгляд",
		map: [
			"#########",
			"#...*...#",
			"#.......#",
			"#.###.#.#",
			"#.#P..#.#",
			"#.......#",
			"#########"
		],
		facing: [0, -1],
		wheel: ["pawn"],
		lore: "Вперёд — это туда, куда ты смотришь. Пешка не умеет иначе. Со спины она слепа.",
		task: "Поверни взгляд — ⟲ и ⟳ на панели, или Q и E. Поворот бесплатен, ход не тратится. Дойди до метки.",
		allow: {
			move: "all",
			switch: false,
			pass: false,
			rotate: true
		},
		done: { reachTarget: true },
		onFail: "Стена. Поверни взгляд в другую сторону."
	},
	{
		id: "capture",
		title: "Взятие",
		map: [
			"#######",
			"#.....#",
			"#..p..#",
			"#.P...#",
			"#.....#",
			"#######"
		],
		facing: [0, -1],
		wheel: ["pawn"],
		lore: "Она умерла позже тебя и ещё помнит своё имя. Она просит добить.",
		task: "Пешка ходит прямо, а бьёт по передним диагоналям. Красное кольцо — взятие: ты встаёшь на её клетку. Возьми её.",
		allow: {
			move: "all",
			switch: false,
			pass: false,
			rotate: true
		},
		done: { clear: true },
		speech: {
			text: "Добей.",
			kind: "enemy"
		}
	},
	{
		id: "threat",
		title: "Битые поля",
		map: [
			"#########",
			"#.......#",
			"#...*...#",
			"#.......#",
			"#r.......",
			"#.......#",
			"#...P...#",
			"#########"
		],
		facing: [0, -1],
		wheel: ["pawn"],
		lore: "Ладья бьёт по прямым. Только по прямым. Об этом можно знать заранее.",
		task: "Красная штриховка — клетки под боем. Наведи или тапни по клетке хода: янтарь покажет, что станет битым после него. Дойди до метки, не вставая под удар.",
		allow: {
			move: "all",
			switch: false,
			pass: false,
			rotate: true
		},
		done: { reachTarget: true },
		onFail: "Ты встал на битую клетку. Здесь тебя возьмут.",
		strict: true
	},
	{
		id: "form",
		title: "Чужая кость",
		map: [
			"#########",
			"#.......#",
			"#.#####.#",
			"#.#...#*#",
			"#.#.#.#.#",
			"#..n#...#",
			"#...#...#",
			"#..P#...#",
			"#########"
		],
		facing: [0, -1],
		wheel: ["pawn"],
		lore: "Ты можешь брать чужие кости и приращивать к себе. Больно, но ты уже мёртв.",
		task: "Возьми Коня — его форма встанет в колесо. Переключись на неё (тап по слоту) и допрыгни до метки. Смена формы тратит ход, а форма после взятия пару ходов устаёт.",
		allow: {
			move: "all",
			switch: true,
			pass: false,
			rotate: true
		},
		done: { reachTarget: true }
	},
	{
		id: "hunger",
		title: "Голод",
		map: [
			"#########",
			"#.......#",
			"#..f....#",
			"#.......#",
			"#....*..#",
			"#.......#",
			"#...P...#",
			"#########"
		],
		facing: [0, -1],
		wheel: ["pawn", "knight"],
		lore: "Остановишься — Тьма под доской начнёт есть. Это не метафора, ты чувствуешь её в костях.",
		task: "Шкала сытости тает каждый ход. Съешь кость (🍖), потом дойди до метки. Взятия и Жилы тоже насыщают.",
		allow: {
			move: "all",
			switch: true,
			pass: true,
			rotate: true
		},
		done: {
			ate: true,
			reachTarget: true
		},
		hunger: true,
		hungerStart: 9
	}
];
var SCENES_EN = [
	{
		id: "step",
		title: "Step",
		map: [
			"#######",
			"#.....#",
			"#.....#",
			"#..*..#",
			"#..P..#",
			"#######"
		],
		facing: [0, -1],
		wheel: ["pawn"],
		lore: "You stirred — and the Darkness shrank back. The first thing a pawn remembers: it can move forward.",
		task: "Tap the teal dot. That is your move.",
		allow: {
			move: "all",
			switch: false,
			pass: false,
			rotate: false
		},
		done: { reachTarget: true }
	},
	{
		id: "facing",
		title: "Facing",
		map: [
			"#########",
			"#...*...#",
			"#.......#",
			"#.###.#.#",
			"#.#P..#.#",
			"#.......#",
			"#########"
		],
		facing: [0, -1],
		wheel: ["pawn"],
		lore: "Forward is where you look. The pawn knows no other way. From behind, it is blind.",
		task: "Turn your facing — ⟲ and ⟳ on the panel, or Q and E. Rotation is free, it does not cost a turn. Reach the marker.",
		allow: {
			move: "all",
			switch: false,
			pass: false,
			rotate: true
		},
		done: { reachTarget: true },
		onFail: "A wall. Turn your facing the other way."
	},
	{
		id: "capture",
		title: "Capture",
		map: [
			"#######",
			"#.....#",
			"#..p..#",
			"#.P...#",
			"#.....#",
			"#######"
		],
		facing: [0, -1],
		wheel: ["pawn"],
		lore: "She died after you and still remembers her name. She asks to finish it.",
		task: "The pawn moves straight, but captures on the forward diagonals. The red ring is a capture: you step onto her cell. Take her.",
		allow: {
			move: "all",
			switch: false,
			pass: false,
			rotate: true
		},
		done: { clear: true },
		speech: {
			text: "Finish it.",
			kind: "enemy"
		}
	},
	{
		id: "threat",
		title: "Threatened Cells",
		map: [
			"#########",
			"#.......#",
			"#...*...#",
			"#.......#",
			"#r.......",
			"#.......#",
			"#...P...#",
			"#########"
		],
		facing: [0, -1],
		wheel: ["pawn"],
		lore: "The Rook strikes along straight lines. Only straight lines. You can know this in advance.",
		task: "Red hatching = threatened cells. Hover or tap a move cell: amber shows what will be threatened after it. Reach the marker without stepping into danger.",
		allow: {
			move: "all",
			switch: false,
			pass: false,
			rotate: true
		},
		done: { reachTarget: true },
		onFail: "You stepped onto a threatened cell. You will be taken here.",
		strict: true
	},
	{
		id: "form",
		title: "A Stranger's Bone",
		map: [
			"#########",
			"#.......#",
			"#.#####.#",
			"#.#...#*#",
			"#.#.#.#.#",
			"#..n#...#",
			"#...#...#",
			"#..P#...#",
			"#########"
		],
		facing: [0, -1],
		wheel: ["pawn"],
		lore: "You can take others' bones and graft them onto yourself. It hurts, but you are already dead.",
		task: "Capture the Knight — its form enters the wheel. Switch to it (tap the slot) and leap to the marker. Switching costs a turn, and the form becomes fatigued for a few turns after capture.",
		allow: {
			move: "all",
			switch: true,
			pass: false,
			rotate: true
		},
		done: { reachTarget: true }
	},
	{
		id: "hunger",
		title: "Hunger",
		map: [
			"#########",
			"#.......#",
			"#..f....#",
			"#.......#",
			"#....*..#",
			"#.......#",
			"#...P...#",
			"#########"
		],
		facing: [0, -1],
		wheel: ["pawn", "knight"],
		lore: "If you stop, the Dark beneath the board starts eating. It is not a metaphor — you feel it in your bones.",
		task: "The hunger bar drains every turn. Eat the bone (🍖), then reach the marker. Captures and Veins also feed.",
		allow: {
			move: "all",
			switch: true,
			pass: true,
			rotate: true
		},
		done: {
			ate: true,
			reachTarget: true
		},
		hunger: true,
		hungerStart: 9
	}
];
var OUTRO = {
	title: "Ты — Перевёртыш",
	lines: [
		"Ты больше не фигура.",
		"",
		"Дальше правил не будет — будут только последствия.",
		"Тебя возьмут: ты не умрёшь, ты станешь меньше.",
		"Ферзь, ладья, слон, конь, пешка.",
		"",
		"Взятие в форме пешки — конец.",
		"Пешка — то, чем ты был. Больше падать некуда."
	],
	button: "Спуститься"
};
var OUTRO_EN = {
	title: "You Are a Shapeshifter",
	lines: [
		"You are no longer a piece.",
		"",
		"From here, there are no more rules — only consequences.",
		"You will be taken: you will not die, you will become smaller.",
		"Queen, rook, bishop, knight, pawn.",
		"",
		"Capture as a pawn — the end.",
		"The pawn is what you were. There is nowhere lower to fall."
	],
	button: "Descend"
};
//#endregion
//#region src/analytics-transport.js
/** HTTP transport kept separate from replay recording for easy replacement/testing. */
function createAnalyticsTransport(endpoint, adminToken = "") {
	const base = String(endpoint || "").replace(/\/$/, "");
	const token = String(adminToken || "").trim();
	return async (path, body) => {
		if (!base || typeof fetch !== "function") return false;
		try {
			return (await fetch(base + path, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					...token ? { authorization: `Bearer ${token}` } : {}
				},
				body: JSON.stringify(body),
				keepalive: true
			})).ok;
		} catch {
			return false;
		}
	};
}
//#endregion
//#region src/analytics-events.js
/** Shared event names; keep analytics producers from inventing incompatible strings. */
var ANALYTICS_EVENT = Object.freeze({
	RUN_STARTED: "run_started",
	RUN_FINISHED: "run_finished",
	FLOOR_STARTED: "floor_started",
	ROOM_ENTERED: "room_entered",
	MOVE: "move",
	MOVE_REJECTED: "move_rejected",
	MOVE_CONFIRMATION: "move_confirmation_requested",
	CAPTURE: "capture",
	PASS: "pass",
	ROTATE: "rotate",
	SWITCH_FORM: "switch_form",
	RELIC_SELECTED: "relic_selected",
	CURSE_SELECTED: "curse_selected",
	TUTORIAL_STEP: "tutorial_step_started",
	TUTORIAL_ACTION: "tutorial_action",
	CLIENT_ACTION: "client_action",
	BROWSER_ERROR: "browser_error",
	BROWSER_REJECTION: "browser_unhandled_rejection",
	SNAPSHOT: "snapshot"
});
//#endregion
//#region src/browser-fingerprint.js
var cachedFingerprint = null;
var text = (value) => String(value || "").slice(0, 160);
var hex = (buffer) => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
/**
* Opt-in, pseudonymous browser grouping key. No raw user-agent/IP is sent;
* only a SHA-256 digest of coarse browser/device characteristics is recorded.
*/
async function browserFingerprint() {
	if (cachedFingerprint) return cachedFingerprint;
	if (typeof navigator === "undefined" || !globalThis.crypto?.subtle) return null;
	const screenInfo = globalThis.screen || {};
	const payload = [
		"chess-roguelike-fingerprint-v1",
		navigator.userAgent,
		navigator.platform,
		navigator.language,
		Intl.DateTimeFormat().resolvedOptions().timeZone,
		screenInfo.width,
		screenInfo.height,
		screenInfo.colorDepth,
		globalThis.devicePixelRatio,
		navigator.hardwareConcurrency
	].map(text).join("|");
	cachedFingerprint = `v1-${hex(await globalThis.crypto.subtle.digest("SHA-256", new globalThis.TextEncoder().encode(payload))).slice(0, 32)}`;
	return cachedFingerprint;
}
//#endregion
//#region src/replay-state.js
function toReplayValue(value) {
	if (value instanceof Set) return [...value].map(toReplayValue);
	if (value instanceof Map) return Object.fromEntries([...value].map(([k, v]) => [k, toReplayValue(v)]));
	if (Array.isArray(value)) return value.map(toReplayValue);
	if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key, item]) => !key.startsWith("_") && typeof item !== "function").map(([key, item]) => [key, toReplayValue(item)]));
	return value;
}
/** Pure game data only — excludes profile, browser, and user-identifying information. */
function serializeGameState() {
	const room = (item) => ({
		walls: toReplayValue(item.walls),
		special: toReplayValue(item.special),
		enemies: toReplayValue(item.enemies),
		cleared: !!item.cleared
	});
	return {
		floor: S$1.floor,
		turn: S$1.turn,
		runMode: S$1.runMode,
		challenge: S$1.challenge || null,
		currentRoom: S$1.currentRoom,
		biome: S$1.biome?.id || null,
		board: {
			width: CFG.W,
			height: CFG.H,
			walls: toReplayValue(S$1.walls),
			special: toReplayValue(S$1.special)
		},
		player: toReplayValue(S$1.player),
		enemies: toReplayValue(S$1.enemies),
		rooms: (S$1.rooms || []).map(room),
		keys: toReplayValue(S$1.keys),
		gameOver: !!S$1.gameOver
	};
}
//#endregion
//#region src/analytics.js
/**
* Opt-in telemetry and replay recorder. It stores only game state and actions,
* never player identity, browser storage, IP address, or free-form text.
*/
var SCHEMA$1 = 1;
var EVENT_LIMIT = 3e3;
var FLUSH_EVENT_COUNT = 12;
var run = null;
var sending = false;
var uploadedThrough = 0;
var flushScheduled = false;
var newId = () => globalThis.crypto?.randomUUID?.() || `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
var analyticsEnabled = () => !!CFG.ANALYTICS_ENABLED;
function startAnalyticsRun(extra = {}) {
	if (!analyticsEnabled()) return null;
	run = {
		schema: SCHEMA$1,
		runId: newId(),
		build: "production",
		startedAt: (/* @__PURE__ */ new Date()).toISOString(),
		extra: toReplayValue(extra),
		events: []
	};
	uploadedThrough = 0;
	recordEvent(ANALYTICS_EVENT.RUN_STARTED, extra, true);
	browserFingerprint().then((fingerprint) => {
		if (!run || !fingerprint) return;
		run.extra.browserFingerprint = fingerprint;
		flushAnalytics();
	});
	return run.runId;
}
function recordEvent(type, data = {}, snapshot = false) {
	if (!analyticsEnabled()) return;
	if (!run) startAnalyticsRun({ startedMidRun: true });
	if (!run || run.events.length >= EVENT_LIMIT) return;
	run.events.push({
		n: run.events.length + 1,
		type,
		t: Math.max(0, Date.now() - Date.parse(run.startedAt)),
		floor: S$1.floor,
		turn: S$1.turn,
		room: S$1.currentRoom,
		data: toReplayValue(data),
		...snapshot ? { state: serializeGameState() } : {}
	});
	if (run.events.length - uploadedThrough >= FLUSH_EVENT_COUNT && !flushScheduled) {
		flushScheduled = true;
		Promise.resolve().then(() => {
			flushScheduled = false;
			flushAnalytics();
		});
	}
}
var recordSnapshot = (type = ANALYTICS_EVENT.SNAPSHOT, data = {}) => recordEvent(type, data, true);
function currentReplay() {
	return run ? {
		...run,
		endedAt: (/* @__PURE__ */ new Date()).toISOString()
	} : null;
}
async function flushAnalytics({ complete = false } = {}) {
	if (!analyticsEnabled() || !run || sending) return false;
	sending = true;
	try {
		const request = createAnalyticsTransport(CFG.ANALYTICS_ENDPOINT, CFG.ANALYTICS_ADMIN_TOKEN);
		if (!await request("/api/v1/runs", {
			runId: run.runId,
			schema: SCHEMA$1,
			build: run.build,
			startedAt: run.startedAt,
			extra: run.extra
		})) return false;
		const sentThrough = run.events.length;
		const eventsOk = await request(`/api/v1/runs/${encodeURIComponent(run.runId)}/events`, { events: run.events.slice(uploadedThrough, sentThrough) });
		if (eventsOk) uploadedThrough = Math.max(uploadedThrough, sentThrough);
		return complete && eventsOk ? request(`/api/v1/runs/${encodeURIComponent(run.runId)}/replay`, currentReplay()) : eventsOk;
	} finally {
		sending = false;
	}
}
function finishAnalyticsRun(outcome, data = {}) {
	if (!run) return;
	recordEvent(ANALYTICS_EVENT.RUN_FINISHED, {
		outcome,
		...data
	}, true);
	flushAnalytics({ complete: true });
}
/** Register best-effort delivery when the browser is backgrounded or closed. */
function installAnalyticsLifecycle() {
	if (typeof window === "undefined" || window.__analyticsLifecycleInstalled) return;
	window.__analyticsLifecycleInstalled = true;
	window.addEventListener("pagehide", () => {
		if (!run || !analyticsEnabled()) return;
		recordEvent("session_hidden");
		flushAnalytics();
	});
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden" && run && analyticsEnabled()) flushAnalytics();
	});
	document.addEventListener("click", (event) => {
		const control = event.target?.closest?.("button[id], [data-analytics-action]");
		if (control) recordEvent(ANALYTICS_EVENT.CLIENT_ACTION, {
			action: "click",
			control: control.dataset.analyticsAction || control.id
		});
	});
	document.addEventListener("keydown", (event) => {
		const key = event.key.toLowerCase();
		if ([
			"q",
			"e",
			" ",
			"1",
			"2",
			"3",
			"4",
			"5",
			"escape"
		].includes(key)) recordEvent(ANALYTICS_EVENT.CLIENT_ACTION, {
			action: "key",
			key
		});
	});
	const errorData = (value) => ({
		message: String(value?.message || value || "Unknown browser error").slice(0, 2e3),
		stack: String(value?.stack || "").slice(0, 4e3)
	});
	window.addEventListener("error", (event) => {
		recordEvent(ANALYTICS_EVENT.BROWSER_ERROR, {
			...errorData(event.error || event.message),
			line: event.lineno || null,
			column: event.colno || null,
			source: String(event.filename || "").split("?")[0].slice(-300)
		});
	});
	window.addEventListener("unhandledrejection", (event) => {
		recordEvent(ANALYTICS_EVENT.BROWSER_REJECTION, errorData(event.reason));
	});
}
/** Debug/test helper: downloads an opt-in replay without contacting a server. */
function downloadReplay() {
	const replay = currentReplay();
	if (!replay || typeof document === "undefined") return false;
	const a = document.createElement("a");
	a.href = URL.createObjectURL(new Blob([JSON.stringify(replay)], { type: "application/json" }));
	a.download = `${replay.runId}.json`;
	a.click();
	URL.revokeObjectURL(a.href);
	return true;
}
//#endregion
//#region src/tutorial.js
var tutorial_exports = /* @__PURE__ */ __exportAll({
	compile: () => compile,
	isTutorial: () => isTutorial,
	resetHints: () => resetHints,
	skipTutorial: () => skipTutorial,
	startTutorial: () => startTutorial,
	tutorialAllowsMove: () => tutorialAllowsMove,
	tutorialAllowsRotate: () => tutorialAllowsRotate,
	tutorialAllowsSwitch: () => tutorialAllowsSwitch,
	tutorialCheck: () => tutorialCheck,
	tutorialEnemiesFrozen: () => tutorialEnemiesFrozen,
	tutorialMark: () => tutorialMark,
	tutorialNudge: () => tutorialNudge,
	tutorialSnapshot: () => tutorialSnapshot,
	tutorialTargets: () => tutorialTargets
});
var T$1 = {
	active: false,
	idx: -1,
	scene: null,
	targets: [],
	reached: false,
	ate: false,
	rotated: false,
	switched: false,
	snapshot: null,
	onDone: null
};
var isTutorial = () => T$1.active;
var tutorialTargets = () => T$1.active ? T$1.targets : [];
/**
* Первая строка карты — y=0, то есть верх доски и линия восхождения.
* @returns {{ level: object, targets: Array<{x:number,y:number}> }}
*/
function compile(scene) {
	const rows = scene.map;
	const H = rows.length;
	const W = Math.max(...rows.map((r) => r.length));
	const walls = [];
	const special = {};
	const enemies = [];
	const targets = [];
	let start = null;
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
		const ch = rows[y][x] ?? ".";
		const def = CHARS[ch];
		if (!def) {
			console.warn(`tutorial: неизвестный символ «${ch}» в сцене ${scene.id}`);
			continue;
		}
		if (def.wall) walls.push(key(x, y));
		if (def.start) start = {
			x,
			y
		};
		if (def.target) targets.push({
			x,
			y
		});
		if (def.special) special[key(x, y)] = { type: def.special };
		if (def.enemy) enemies.push({
			type: def.enemy,
			x,
			y,
			facing: [0, 1]
		});
	}
	if (!start) {
		console.warn(`tutorial: в сцене ${scene.id} нет стартовой клетки P`);
		start = {
			x: Math.floor(W / 2),
			y: H - 2
		};
	}
	return {
		level: {
			floor: 0,
			biome: "halls",
			rooms: [{
				W,
				H,
				playerStart: start,
				walls,
				special,
				enemies
			}]
		},
		targets
	};
}
/**
* @param {function} onFinish — вызвать, когда обучение пройдено (обычно newFloor)
*/
function startTutorial(onFinish) {
	T$1.active = true;
	T$1.idx = -1;
	T$1.onDone = onFinish;
	S$1.gameOver = false;
	S$1.challenge = null;
	closeModal();
	nextScene();
}
function skipTutorial() {
	finish();
}
function finish() {
	T$1.active = false;
	T$1.scene = null;
	T$1.targets = [];
	META.tutorialDone = true;
	recordSnapshot("tutorial_finished");
	saveMeta();
	const cb = T$1.onDone;
	T$1.onDone = null;
	openInterlude(isEnglish() ? OUTRO_EN : OUTRO, () => {
		if (cb) cb();
	});
}
function nextScene() {
	T$1.idx++;
	if (T$1.idx >= SCENES.length) {
		finish();
		return;
	}
	const scene = T$1.scene = isEnglish() ? SCENES_EN[T$1.idx] : SCENES[T$1.idx];
	recordEvent("tutorial_step_started", {
		id: scene.id,
		index: T$1.idx
	});
	const { level, targets } = compile(scene);
	T$1.targets = targets;
	T$1.reached = false;
	T$1.ate = false;
	T$1.rotated = false;
	T$1.switched = false;
	T$1.snapshot = null;
	loadLevel(level);
	S$1.player.wheel = (scene.wheel || ["pawn"]).map((t) => makeForm(t));
	while (S$1.player.wheel.length < 3) S$1.player.wheel.push(null);
	S$1.player.active = 0;
	S$1.player.facing = scene.facing || [0, -1];
	S$1.player.relics = /* @__PURE__ */ new Set();
	S$1.player.curses = /* @__PURE__ */ new Set();
	S$1.unlocked = new Set(scene.wheel || ["pawn"]);
	S$1.player.hunger = scene.hunger ? scene.hungerStart ?? CFG.HUNGER.start : CFG.HUNGER.start;
	S$1.keys = /* @__PURE__ */ new Set();
	openInterlude({
		title: scene.title,
		lines: [
			scene.lore,
			"",
			scene.task
		],
		art: scene.art,
		button: isEnglish() ? "Continue" : "Дальше"
	}, () => {
		if (scene.speech) {
			const e = S$1.enemies[0];
			if (e) addSpeech(e.x, e.y, scene.speech.text, scene.speech.kind || "enemy");
		}
		render();
		syncUI();
	});
	action(mkButton(isEnglish() ? "Skip" : "Пропустить", () => skipTutorial()));
}
var allow = (k) => !T$1.active || !T$1.scene || T$1.scene.allow?.[k] !== false;
/** Разрешён ли ход в клетку. В сценах с move:'targets' — только по меткам. */
function tutorialAllowsMove(x, y) {
	if (!T$1.active || !T$1.scene) return true;
	const mode = T$1.scene.allow?.move ?? "all";
	if (mode === "all") return true;
	if (mode === "targets") return T$1.targets.some((c) => c.x === x && c.y === y);
	return false;
}
var tutorialAllowsSwitch = () => allow("switch");
var tutorialAllowsRotate = () => allow("rotate");
/** Мягкий отказ: подсказка вместо тишины. Игрок не должен гадать, почему не идёт. */
function tutorialNudge(what) {
	if (!T$1.active || !T$1.scene) return;
	var msg = (isEnglish() ? {
		move: "You need to reach the marker.",
		switch: "Form switching — in the next scene.",
		pass: "No need to pass yet.",
		rotate: "Rotation is not needed here."
	} : {
		move: "Сейчас нужно дойти до метки.",
		switch: "Смена формы — в следующей сцене.",
		pass: "Пасовать пока незачем.",
		rotate: "Поворот здесь не нужен."
	})[what];
	if (msg) toast(msg);
}
/** Враги в обучении стоят, пока сцена не сказала иначе. */
var tutorialEnemiesFrozen = () => T$1.active && T$1.scene?.freeze !== false;
/** Запомнить позицию перед ходом — для отката в strict-сценах. */
function tutorialSnapshot() {
	if (!T$1.active) return;
	T$1.snapshot = {
		x: S$1.player.x,
		y: S$1.player.y,
		facing: [...S$1.player.facing]
	};
}
function tutorialMark(event) {
	if (!T$1.active) return;
	if (event === "rotate") T$1.rotated = true;
	if (event === "switch") T$1.switched = true;
	if (event === "eat") T$1.ate = true;
	recordEvent("tutorial_action", {
		event,
		scene: T$1.scene?.id || null
	});
}
/** Вызывать в конце хода игрока, до хода врагов. */
function tutorialCheck() {
	if (!T$1.active || !T$1.scene) return;
	const sc = T$1.scene;
	if (sc.strict && T$1.snapshot) {
		if (threatenedNow()) {
			S$1.player.x = T$1.snapshot.x;
			S$1.player.y = T$1.snapshot.y;
			S$1.player.facing = T$1.snapshot.facing;
			if (sc.onFail) toast(sc.onFail);
			render();
			syncUI();
			return;
		}
	}
	if (T$1.targets.some((c) => c.x === S$1.player.x && c.y === S$1.player.y)) T$1.reached = true;
	const d = sc.done || {};
	let ok = true;
	if (d.reachTarget && !T$1.reached) ok = false;
	if (d.clear && S$1.enemies.length > 0) ok = false;
	if (d.ate && !T$1.ate) ok = false;
	if (d.switched && !T$1.switched) ok = false;
	if (d.rotated && !T$1.rotated) ok = false;
	if (!ok) return;
	log(isEnglish() ? "Tutorial: «" + sc.title + "» completed." : "Обучение: «" + sc.title + "» пройдено.", "g");
	setTimeout(() => nextScene(), 350);
}
/** Стоит ли игрок под боем прямо сейчас. */
function threatenedNow() {
	return allThreats().has(key(S$1.player.x, S$1.player.y));
}
/** Сброс всех подсказок — кнопка в настройках «Показать обучение заново». */
function resetHints() {
	META.hints = {};
	META.tutorialDone = false;
	saveMeta();
	toast(isEnglish() ? "Tutorial and hints reset." : "Обучение и подсказки сброшены.");
}
//#endregion
//#region src/preview.js
/**
* src/preview.js — предпросмотр последствий хода.
*
* Модуль только считает: ничего не рисует, не пишет в лог и не меняет состояние
* необратимо. Все временные подмены S.player/S.enemies откатываются в finally.
*
* Основные экспорты: threatsAfterMove(), riskOf(), threatenersAt(), wheelSummary(),
* setPreviewCell(), previewCell(), confirmMove(), pendingMove(), clearPending().
*/
var cache$2 = /* @__PURE__ */ new Map();
var cacheKey = "";
/** Ключ состояния: пока он не изменился, предпросмотр валиден. */
function stateKey() {
	const p = S$1.player;
	return `${p.x},${p.y},${p.active},${p.facing[0]},${p.facing[1]},r${S$1.currentRoom},t${S$1.turn},e${S$1.enemies.length}`;
}
/**
* Куда развернётся вражеская пешка на игрока в (px,py).
* Формула совпадает с enemiesTurn() — если она там изменится, менять и здесь,
* иначе предпросмотр начнёт врать именно на пешках (самый частый враг).
*/
function facingToward(e, px, py) {
	const dx = px - e.x, dy = py - e.y;
	let f = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx) || 0, Math.sign(dx) ? 0 : Math.sign(dy)] : [0, Math.sign(dy) || 1];
	if (f[0] === 0 && f[1] === 0) f = [0, 1];
	return f;
}
/**
* Выполнить fn() в мире, где игрок стоит в (x,y): взятая фигура снята с доски,
* вражеские пешки развёрнуты на новую позицию. Состояние восстанавливается всегда.
*/
function withPlayerAt(x, y, fn) {
	const ox = S$1.player.x, oy = S$1.player.y;
	const savedEnemies = S$1.enemies;
	const victim = enemyAt(x, y);
	if (victim) S$1.enemies = S$1.enemies.filter((e) => e !== victim);
	const facings = [];
	for (const e of S$1.enemies) {
		if (!e.facing || effectiveForm(e).type !== "pawn") continue;
		facings.push([e, e.facing]);
		e.facing = facingToward(e, x, y);
	}
	S$1.player.x = x;
	S$1.player.y = y;
	invalidateThreats();
	try {
		return fn();
	} finally {
		S$1.player.x = ox;
		S$1.player.y = oy;
		for (const [e, f] of facings) e.facing = f;
		S$1.enemies = savedEnemies;
		invalidateThreats();
	}
}
/** Множество битых клеток ПОСЛЕ того, как игрок встанет в (x,y). */
function threatsAfterMove(x, y) {
	const sk = stateKey();
	if (sk !== cacheKey) {
		cache$2.clear();
		cacheKey = sk;
	}
	const k = key(x, y);
	const hit = cache$2.get(k);
	if (hit) return hit;
	const set = withPlayerAt(x, y, () => allThreats());
	cache$2.set(k, set);
	return set;
}
/** Кто именно достанет игрока в клетке (x,y). Для тултипа «под ударом: ♞ ♜». */
function threatenersAt(x, y) {
	const k = key(x, y);
	return withPlayerAt(x, y, () => S$1.enemies.filter((e) => enemyThreat(e).has(k)));
}
var RISK = {
	SAFE: 0,
	THREATENED: 1,
	FATAL: 2
};
/** Переживёт ли игрок взятие в текущей форме. */
function survivesCapture() {
	if (S$1.godMode) return true;
	if (S$1.challenge === "lone_figure") return false;
	if (statusVal(S$1.player, "shield") > 0) return true;
	if (activeForm().type !== "pawn") return true;
	return !!(has("pawn_shield") && !S$1.player.pawnShieldUsed);
}
/**
* SAFE — после хода клетка не бита.
* THREATENED — бита, взятие стоит формы.
* FATAL — бита, и взятие здесь заканчивает забег.
*/
function riskOf(x, y) {
	if (!threatsAfterMove(x, y).has(key(x, y))) return RISK.SAFE;
	return survivesCapture() ? RISK.THREATENED : RISK.FATAL;
}
/**
* Сколько ходов и взятий даст каждая форма из текущей клетки.
* Нужна, чтобы игрок видел «эта форма здесь бесполезна» до того, как потратит
* ход на переключение.
*/
function wheelSummary() {
	const out = [];
	const orig = S$1.player.active;
	try {
		for (let i = 0; i < S$1.player.wheel.length; i++) {
			const f = S$1.player.wheel[i];
			if (!f) {
				out.push(null);
				continue;
			}
			S$1.player.active = i;
			invalidateThreats();
			const { moves, captures } = playerOptions();
			out.push({
				moves: moves.length,
				captures: captures.length,
				ready: f.cooldown === 0
			});
		}
	} finally {
		S$1.player.active = orig;
		invalidateThreats();
	}
	return out;
}
var hovered = null;
var pending$1 = null;
function setPreviewCell(c) {
	hovered = c && Number.isFinite(c.x) ? {
		x: c.x,
		y: c.y
	} : null;
}
function previewCell() {
	return CFG.SHOW_PREVIEW === false ? null : hovered;
}
function pendingMove() {
	return pending$1;
}
function clearPending() {
	pending$1 = null;
	hovered = null;
}
/**
* Двухступенчатое подтверждение хода.
* CFG.CONFIRM_MOVES: 'off' — выполнять сразу; 'risky' — подтверждать только ходы
* под удар; 'all' — подтверждать любой ход.
* @returns {boolean} true — можно выполнять прямо сейчас.
*/
function confirmMove(x, y) {
	const mode = CFG.CONFIRM_MOVES || "off";
	if (mode === "off") {
		clearPending();
		return true;
	}
	if (pending$1 && pending$1.x === x && pending$1.y === y) {
		clearPending();
		return true;
	}
	if (mode === "risky" && riskOf(x, y) === RISK.SAFE) {
		clearPending();
		return true;
	}
	pending$1 = {
		x,
		y
	};
	hovered = {
		x,
		y
	};
	return false;
}
/**
* Битовая маска соседей-стен вокруг (x,y).
* Диагональ засчитывается только если обе смежные ортогонали тоже стены —
* иначе внутренние углы получаются рваными.
*/
function wallMask(x, y, isWall) {
	const n = isWall(x, y - 1), e = isWall(x + 1, y), s = isWall(x, y + 1), w = isWall(x - 1, y);
	let m = 0;
	if (n) m |= 1;
	if (e) m |= 4;
	if (s) m |= 16;
	if (w) m |= 64;
	if (n && e && isWall(x + 1, y - 1)) m |= 2;
	if (s && e && isWall(x + 1, y + 1)) m |= 8;
	if (s && w && isWall(x - 1, y + 1)) m |= 32;
	if (n && w && isWall(x - 1, y - 1)) m |= 128;
	return m;
}
function scale9Index(m) {
	const w = !!(m & 64), e = !!(m & 4), n = !!(m & 1), s = !!(m & 16);
	return (n && s ? 1 : n ? 2 : s ? 0 : 1) * 3 + (w && e ? 1 : w ? 2 : e ? 0 : 1);
}
var BLOB47 = (() => {
	const table = /* @__PURE__ */ new Map();
	[
		0,
		4,
		92,
		124,
		116,
		80,
		16,
		20,
		87,
		28,
		125,
		5,
		95,
		65,
		21,
		84,
		64,
		91,
		112,
		93,
		127,
		31,
		71,
		23,
		24,
		29,
		117,
		119,
		85,
		68,
		81,
		69,
		1,
		7,
		199,
		197,
		17,
		213,
		209,
		221,
		223,
		215,
		193,
		5,
		88,
		120,
		121
	].forEach((m, i) => table.set(m, i));
	return table;
})();
/** Номер кадра в blob47. Незнакомая маска сводится к ближайшей известной. */
function blob47Index(m) {
	if (BLOB47.has(m)) return BLOB47.get(m);
	const ortho = m & 85;
	return BLOB47.get(ortho) ?? 0;
}
var SHEETS = /* #__PURE__ */ Object.assign({
	"./assets/tiles/arena.png": arena_default,
	"./assets/tiles/corridors.png": corridors_default,
	"./assets/tiles/grid.png": grid_default,
	"./assets/tiles/halls.png": halls_default,
	"./assets/tiles/maze.png": maze_default,
	"./assets/tiles/pylons.png": pylons_default,
	"./assets/tiles/wall-tex-arena.png": wall_tex_arena_default,
	"./assets/tiles/wall-tex-corridors.png": wall_tex_corridors_default,
	"./assets/tiles/wall-tex-grid.png": wall_tex_grid_default,
	"./assets/tiles/wall-tex-halls.png": wall_tex_halls_default,
	"./assets/tiles/wall-tex-maze.png": wall_tex_maze_default,
	"./assets/tiles/wall-tex-pylons.png": wall_tex_pylons_default
});
var sheets = /* @__PURE__ */ new Map();
var listeners$1 = /* @__PURE__ */ new Set();
/**
* Имя файла задаёт биом и режим:
*   walls-halls-scale9.png   → биом halls, режим scale9, сетка 3×3
*   walls-maze-blob47.png    → биом maze,  режим blob47, сетка 8×6
*   walls-scale9.png         → набор по умолчанию
*/
for (const [path, url] of Object.entries(SHEETS)) {
	const name = path.split("/").pop().replace(/\.[^.]+$/, "");
	const m = /^walls(?:-(.+?))?-(scale9|blob47)$/.exec(name);
	if (!m) continue;
	const [, biome, mode] = m;
	const img = new Image();
	img.onload = () => {
		const cols = mode === "scale9" ? 3 : 8;
		const rows = mode === "scale9" ? 3 : 6;
		sheets.set(biome || "default", {
			img,
			mode,
			cols,
			tw: Math.floor(img.width / cols),
			th: Math.floor(img.height / rows)
		});
		listeners$1.forEach((cb) => cb());
	};
	img.src = url;
}
var sheetFor = (biomeId) => sheets.get(biomeId) || sheets.get("default") || null;
/**
* Нарисовать стену в клетке.
*
* @param {CanvasRenderingContext2D} c
* @param {number} x,y — клетка
* @param {number} T — размер тайла
* @param {number} m — маска из wallMask()
* @param {object} [opts] — { biome, fill, edge }
*/
function drawWall(c, x, y, T, m, opts = {}) {
	const sheet = sheetFor(opts.biome);
	if (sheet) {
		const idx = sheet.mode === "scale9" ? scale9Index(m) : blob47Index(m);
		const sx = idx % sheet.cols * sheet.tw;
		const sy = Math.floor(idx / sheet.cols) * sheet.th;
		const prev = c.imageSmoothingEnabled;
		c.imageSmoothingEnabled = false;
		c.drawImage(sheet.img, sx, sy, sheet.tw, sheet.th, x * T, y * T, T, T);
		c.imageSmoothingEnabled = prev;
		return;
	}
	drawWallProcedural(c, x, y, T, m, opts);
}
/**
* Процедурная стена: заливка со скруглением наружных углов и подрезкой
* внутренних. Работает без единой картинки и выглядит заметно лучше, чем
* одинаковые квадраты, которые были раньше.
*/
function drawWallProcedural(c, x, y, T, m, opts = {}) {
	const fill = opts.fill || "#201b16";
	const edge = opts.edge || "rgba(0,0,0,.5)";
	const hi = opts.hi || "rgba(255,240,210,.06)";
	const r = Math.max(2, T * .22);
	const x0 = x * T, y0 = y * T;
	const n = !!(m & 1), e = !!(m & 4), s = !!(m & 16), w = !!(m & 64);
	c.save();
	c.beginPath();
	const rTL = !n && !w ? r : 0;
	const rTR = !n && !e ? r : 0;
	const rBR = !s && !e ? r : 0;
	const rBL = !s && !w ? r : 0;
	c.moveTo(x0 + rTL, y0);
	c.lineTo(x0 + T - rTR, y0);
	if (rTR) c.quadraticCurveTo(x0 + T, y0, x0 + T, y0 + rTR);
	c.lineTo(x0 + T, y0 + T - rBR);
	if (rBR) c.quadraticCurveTo(x0 + T, y0 + T, x0 + T - rBR, y0 + T);
	c.lineTo(x0 + rBL, y0 + T);
	if (rBL) c.quadraticCurveTo(x0, y0 + T, x0, y0 + T - rBL);
	c.lineTo(x0, y0 + rTL);
	if (rTL) c.quadraticCurveTo(x0, y0, x0 + rTL, y0);
	c.closePath();
	c.fillStyle = fill;
	c.fill();
	const inner = [
		[
			5,
			2,
			1,
			-1
		],
		[
			20,
			8,
			1,
			1
		],
		[
			80,
			32,
			-1,
			1
		],
		[
			65,
			128,
			-1,
			-1
		]
	];
	c.fillStyle = opts.bg || "rgba(0,0,0,0)";
	for (const [orth, diag, sx, sy] of inner) {
		if ((m & orth) !== orth || m & diag) continue;
		const cx = x0 + (sx > 0 ? T : 0);
		const cy = y0 + (sy > 0 ? T : 0);
		c.save();
		c.globalCompositeOperation = "destination-out";
		c.beginPath();
		c.moveTo(cx, cy);
		c.arc(cx, cy, r * .85, 0, Math.PI * 2);
		c.fill();
		c.restore();
	}
	if (!n) {
		c.strokeStyle = hi;
		c.lineWidth = Math.max(1, T * .06);
		c.beginPath();
		c.moveTo(x0 + rTL, y0 + c.lineWidth / 2);
		c.lineTo(x0 + T - rTR, y0 + c.lineWidth / 2);
		c.stroke();
	}
	c.strokeStyle = edge;
	c.lineWidth = 1;
	c.stroke();
	c.restore();
}
//#endregion
//#region src/sprites.js
/** Порядок важен: по нему ищется ближайшее направление. */
var DIRS = [
	"north",
	"north-east",
	"east",
	"south-east",
	"south",
	"south-west",
	"west",
	"north-west"
];
var DIR_ANGLE = {};
DIRS.forEach((d, i) => DIR_ANGLE[d] = i * Math.PI / 4);
/** Вектор [dx,dy] → имя направления. y растёт вниз, поэтому north = [0,-1]. */
function dirFromVector(v) {
	if (!v || !v[0] && !v[1]) return "south";
	const a = Math.atan2(v[0], -v[1]);
	return DIRS[Math.round((a + Math.PI * 2) % (Math.PI * 2) / (Math.PI / 4)) % 8];
}
/** Ближайшее доступное направление к нужному. */
function nearestDir(want, available) {
	if (available.has(want)) return want;
	const a0 = DIR_ANGLE[want] ?? 0;
	let best = null, bestD = Infinity;
	for (const d of available) {
		if (DIR_ANGLE[d] === void 0) continue;
		let diff = Math.abs(DIR_ANGLE[d] - a0);
		if (diff > Math.PI) diff = Math.PI * 2 - diff;
		if (diff < bestD) {
			bestD = diff;
			best = d;
		}
	}
	if (best) return best;
	for (const fallback of [
		"south",
		"idle",
		"default"
	]) if (available.has(fallback)) return fallback;
	return available.size ? [...available][0] : null;
}
var IMG_FILES = /* #__PURE__ */ Object.assign({
	"./assets/pieces/bone/assassin/east.png": east_default$7,
	"./assets/pieces/bone/assassin/north-east.png": north_east_default$7,
	"./assets/pieces/bone/assassin/north-west.png": north_west_default$7,
	"./assets/pieces/bone/assassin/north.png": north_default$7,
	"./assets/pieces/bone/assassin/south-east.png": south_east_default$7,
	"./assets/pieces/bone/assassin/south-west.png": south_west_default$7,
	"./assets/pieces/bone/assassin/south.png": south_default$7,
	"./assets/pieces/bone/assassin/west.png": west_default$7,
	"./assets/pieces/bone/bishop/east.png": east_default$6,
	"./assets/pieces/bone/bishop/north-east.png": north_east_default$6,
	"./assets/pieces/bone/bishop/north-west.png": north_west_default$6,
	"./assets/pieces/bone/bishop/north.png": north_default$6,
	"./assets/pieces/bone/bishop/south-east.png": south_east_default$6,
	"./assets/pieces/bone/bishop/south-west.png": south_west_default$6,
	"./assets/pieces/bone/bishop/south.png": south_default$6,
	"./assets/pieces/bone/bishop/west.png": west_default$6,
	"./assets/pieces/bone/guardian/east.png": east_default$5,
	"./assets/pieces/bone/guardian/north-east.png": north_east_default$5,
	"./assets/pieces/bone/guardian/north-west.png": north_west_default$5,
	"./assets/pieces/bone/guardian/north.png": north_default$5,
	"./assets/pieces/bone/guardian/south-east.png": south_east_default$5,
	"./assets/pieces/bone/guardian/south-west.png": south_west_default$5,
	"./assets/pieces/bone/guardian/south.png": south_default$5,
	"./assets/pieces/bone/guardian/west.png": west_default$5,
	"./assets/pieces/bone/king/east.png": east_default$4,
	"./assets/pieces/bone/king/north-east.png": north_east_default$4,
	"./assets/pieces/bone/king/north-west.png": north_west_default$4,
	"./assets/pieces/bone/king/north.png": north_default$4,
	"./assets/pieces/bone/king/south-east.png": south_east_default$4,
	"./assets/pieces/bone/king/south-west.png": south_west_default$4,
	"./assets/pieces/bone/king/south.png": south_default$4,
	"./assets/pieces/bone/king/west.png": west_default$4,
	"./assets/pieces/bone/knight/east.png": east_default$3,
	"./assets/pieces/bone/knight/north-east.png": north_east_default$3,
	"./assets/pieces/bone/knight/north-west.png": north_west_default$3,
	"./assets/pieces/bone/knight/north.png": north_default$3,
	"./assets/pieces/bone/knight/south-east.png": south_east_default$3,
	"./assets/pieces/bone/knight/south-west.png": south_west_default$3,
	"./assets/pieces/bone/knight/south.png": south_default$3,
	"./assets/pieces/bone/knight/west.png": west_default$3,
	"./assets/pieces/bone/pawn/east.png": east_default$2,
	"./assets/pieces/bone/pawn/north-east.png": north_east_default$2,
	"./assets/pieces/bone/pawn/north-west.png": north_west_default$2,
	"./assets/pieces/bone/pawn/north.png": north_default$2,
	"./assets/pieces/bone/pawn/south-east.png": south_east_default$2,
	"./assets/pieces/bone/pawn/south-west.png": south_west_default$2,
	"./assets/pieces/bone/pawn/south.png": south_default$2,
	"./assets/pieces/bone/pawn/west.png": west_default$2,
	"./assets/pieces/bone/queen/east.png": east_default$1,
	"./assets/pieces/bone/queen/north-east.png": north_east_default$1,
	"./assets/pieces/bone/queen/north-west.png": north_west_default$1,
	"./assets/pieces/bone/queen/north.png": north_default$1,
	"./assets/pieces/bone/queen/south-east.png": south_east_default$1,
	"./assets/pieces/bone/queen/south-west.png": south_west_default$1,
	"./assets/pieces/bone/queen/south.png": south_default$1,
	"./assets/pieces/bone/queen/west.png": west_default$1,
	"./assets/pieces/bone/rook/east.png": east_default,
	"./assets/pieces/bone/rook/north-east.png": north_east_default,
	"./assets/pieces/bone/rook/north-west.png": north_west_default,
	"./assets/pieces/bone/rook/north.png": north_default,
	"./assets/pieces/bone/rook/south-east.png": south_east_default,
	"./assets/pieces/bone/rook/south-west.png": south_west_default,
	"./assets/pieces/bone/rook/south.png": south_default,
	"./assets/pieces/bone/rook/west.png": west_default
});
var JSON_FILES = /* #__PURE__ */ Object.assign({});
/**
* sets = {
*   <setName>: {
*     <type>: {
*       frames: Map<dir, {url, sx, sy, sw, sh}>,   // sx..sh только для атласа
*       image:  HTMLImageElement | null,           // общий для атласа
*       ready:  boolean,
*     }
*   }
* }
*/
var sets = /* @__PURE__ */ new Map();
var norm = (s) => String(s).toLowerCase().replace(/[\s_]/g, "-");
function ensure(setName, type) {
	if (!sets.has(setName)) sets.set(setName, /* @__PURE__ */ new Map());
	const set = sets.get(setName);
	if (!set.has(type)) set.set(type, {
		frames: /* @__PURE__ */ new Map(),
		images: /* @__PURE__ */ new Map(),
		ready: false
	});
	return set.get(type);
}
for (const [path, url] of Object.entries(IMG_FILES)) {
	const parts = path.replace("./assets/pieces/", "").split("/");
	if (parts.length === 3) {
		const [setName, type, file] = parts;
		const dir = norm(file.replace(/\.[^.]+$/, ""));
		ensure(norm(setName), norm(type)).frames.set(dir, { url });
	} else if (parts.length === 2) {
		const [setName, file] = parts;
		const type = norm(file.replace(/\.[^.]+$/, ""));
		ensure(norm(setName), type).atlasUrl = url;
	} else if (parts.length === 1) {
		const type = norm(parts[0].replace(/\.[^.]+$/, ""));
		ensure("default", type).atlasUrl = url;
	}
}
for (const [path, data] of Object.entries(JSON_FILES)) {
	const parts = path.replace("./assets/pieces/", "").split("/");
	const file = parts.pop();
	parseAtlas(ensure(norm(parts[0] || "default"), norm(file.replace(/\.json$/, ""))), data);
}
/**
* Поддерживаются два формата описания атласа.
*
* TexturePacker (hash):
*   { "frames": { "north.png": { "frame": {x,y,w,h} }, ... } }
*
* Простая сетка — когда кадры лежат рядами одинакового размера:
*   { "grid": { "w": 64, "h": 64, "cols": 4 },
*     "order": ["north","north-east","east","south-east", ...] }
*/
function parseAtlas(rec, data) {
	if (!data) return;
	if (data.frames) {
		const entries = Array.isArray(data.frames) ? data.frames.map((f) => [f.filename, f]) : Object.entries(data.frames);
		for (const [name, f] of entries) {
			const fr = f.frame || f;
			const dir = norm(String(name).replace(/\.[^.]+$/, ""));
			rec.frames.set(dir, {
				sx: fr.x,
				sy: fr.y,
				sw: fr.w,
				sh: fr.h,
				atlas: true
			});
		}
		return;
	}
	if (data.grid && Array.isArray(data.order)) {
		const { w, h, cols } = data.grid;
		data.order.forEach((name, i) => {
			rec.frames.set(norm(name), {
				sx: i % cols * w,
				sy: Math.floor(i / cols) * h,
				sw: w,
				sh: h,
				atlas: true
			});
		});
	}
}
var listeners = /* @__PURE__ */ new Set();
/** render.js вешает сюда requestRender(). */
function onSpriteLoad(cb) {
	listeners.add(cb);
	return () => listeners.delete(cb);
}
var notify = () => listeners.forEach((cb) => cb());
function loadImage(url) {
	return new Promise((res, rej) => {
		const img = new Image();
		img.onload = () => res(img);
		img.onerror = rej;
		img.src = url;
	});
}
var _keys = [...sets.keys()];
var activeSet = !sets.has("default") && _keys.length > 0 ? _keys[0] : "default";
var loading = /* @__PURE__ */ new Set();
function record(type) {
	let set = sets.get(activeSet) || sets.get("default");
	if (!set) for (const [, s] of sets) {
		set = s;
		break;
	}
	return set ? set.get(norm(type)) : null;
}
async function ensureLoaded(type) {
	const rec = record(type);
	if (!rec || rec.ready) return;
	const tag = activeSet + "/" + type;
	if (loading.has(tag)) return;
	loading.add(tag);
	try {
		if (rec.atlasUrl) {
			const img = await loadImage(rec.atlasUrl);
			rec.atlasImage = img;
			if (!rec.frames.size) rec.frames.set("default", {
				sx: 0,
				sy: 0,
				sw: img.width,
				sh: img.height,
				atlas: true
			});
		}
		await Promise.all([...rec.frames.entries()].map(async ([dir, f]) => {
			if (f.atlas) return;
			rec.images.set(dir, await loadImage(f.url));
		}));
		rec.ready = true;
		notify();
	} catch (e) {
		console.warn("[sprites] не загрузился набор", tag, e);
		rec.failed = true;
	} finally {
		loading.delete(tag);
	}
}
/**
* Спрайты приходят в одной гамме, а игрок и враг должны различаться.
* Красим через offscreen-канвас и кэшируем: перекрашивать каждый кадр дорого.
*/
var tintCache = /* @__PURE__ */ new Map();
function tinted(img, sx, sy, sw, sh, color, key) {
	const cached = tintCache.get(key);
	if (cached) return cached;
	const cv = document.createElement("canvas");
	cv.width = sw;
	cv.height = sh;
	const c = cv.getContext("2d");
	c.imageSmoothingEnabled = false;
	c.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
	c.globalCompositeOperation = "multiply";
	c.fillStyle = color;
	c.fillRect(0, 0, sw, sh);
	c.globalCompositeOperation = "destination-in";
	c.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
	tintCache.set(key, cv);
	return cv;
}
/**
* Нарисовать фигуру спрайтом.
*
* @param {CanvasRenderingContext2D} c
* @param {string} type — 'knight', 'pawn', ...
* @param {number} px,py — координаты клетки (могут быть дробными при анимации)
* @param {number} T — размер тайла
* @param {object} [opts] — { dir: [dx,dy]|string, tint: '#rrggbb', scale: 1, flipX }
* @returns {boolean} false — спрайта нет, рисуй глиф
*/
function drawSprite(c, type, px, py, T, opts = {}) {
	const rec = record(type);
	if (!rec || !rec.ready || !rec.frames.size) {
		if (rec && !rec.failed) ensureLoaded(type);
		return false;
	}
	const dir = nearestDir(typeof opts.dir === "string" ? norm(opts.dir) : dirFromVector(opts.dir), new Set(rec.frames.keys()));
	if (!dir) return false;
	const f = rec.frames.get(dir);
	let src, sx, sy, sw, sh;
	if (f.atlas) {
		src = rec.atlasImage;
		({sx, sy, sw, sh} = f);
	} else {
		src = rec.images.get(dir);
		sx = 0;
		sy = 0;
		sw = src ? src.width : 0;
		sh = src ? src.height : 0;
	}
	if (!src || !sw || !sh) return false;
	if (opts.tint) {
		src = tinted(src, sx, sy, sw, sh, opts.tint, `${activeSet}|${type}|${dir}|${opts.tint}`);
		sx = 0;
		sy = 0;
	}
	const scale = (opts.scale || .92) * (T / Math.max(sw, sh));
	const dw = sw * scale, dh = sh * scale;
	const dx = px * T + (T - dw) / 2;
	const dy = py * T + (T - dh) * (opts.anchor === "center" ? .5 : .82);
	const prev = c.imageSmoothingEnabled;
	c.imageSmoothingEnabled = false;
	if (opts.flipX) {
		c.save();
		c.translate(dx + dw, dy);
		c.scale(-1, 1);
		c.drawImage(src, sx, sy, sw, sh, 0, 0, dw, dh);
		c.restore();
	} else c.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
	c.imageSmoothingEnabled = prev;
	return true;
}
//#endregion
//#region src/atlas.js
/**
* src/atlas.js — офскрин-кэш кадров.
*
* Сейчас каждая спец-клетка перерисовывается с нуля каждый кадр: градиенты,
* десятки дуг, свечения. И достаточно одной лавы или тумана на ярусе, чтобы
* rAF перестал засыпать и вся доска считалась 60 раз в секунду.
*
* Здесь каждый тип клетки печётся один раз в набор кадров на офскрин-канвасах,
* дальше в кадре остаётся один drawImage. Рисователи не переписываются:
* drawSpecial() уже рисует полную клетку в свою область, поэтому его можно
* запечь, подсунув офскрин-контекст и синтетический ts.
*
* Что НЕ печётся: частицы, вспышки взятия, затемнение экрана, реплики, ауры
* модификаторов и подсветка ходов. Всё это зависит от состояния игры, а не
* от клетки, и остаётся живым.
*/
/**
* Период цикла и число кадров на тип. Период — из делителей внутри
* drawSpecial: у паутины `ats / 3000`, у портала `ats / 800` и так далее.
*
* ms: 0 — статичный тип, один кадр.
* ms: 'T' — период зависит от размера тайла (бегущие шевроны).
*/
var ANIM = {
	trap: {
		ms: 3e3,
		n: 20
	},
	rune: {
		ms: 2400,
		n: 20
	},
	portal: {
		ms: 1600,
		n: 28
	},
	ice: {
		ms: 4e3,
		n: 16
	},
	lava: {
		ms: 900,
		n: 18
	},
	fog: {
		ms: 2600,
		n: 20
	},
	gate: {
		ms: 1100,
		n: 16
	},
	plate: {
		ms: 1800,
		n: 12
	},
	door: {
		ms: 2200,
		n: 16
	},
	key: {
		ms: 1600,
		n: 20
	},
	food: {
		ms: 1800,
		n: 12
	},
	scroll: {
		ms: 2e3,
		n: 16
	},
	conveyor: {
		ms: "T",
		k: .34 * 26,
		n: 12
	},
	colorzone: {
		ms: "T",
		k: .26 * 40,
		n: 14
	},
	pillar: {
		ms: 0,
		n: 1
	},
	millstone: {
		ms: 0,
		n: 1
	}
};
var VARIANTS$1 = 3;
var BUDGET_MB = 32;
var KEYED = {
	door: (s) => `${s.color || "-"}|${s.doorId ?? ""}`,
	key: (s) => s.color || "-",
	plate: (s) => s.chain ? s.broken ? "cb" : "c" : "p",
	conveyor: (s) => (s.dir || [0, 1]).join(","),
	gate: (s) => (s.dir || [0, 1]).join(","),
	millstone: (s) => `${(s.dir || [0, -1]).join(",")}|${s.jammed ? "j" : ""}`,
	colorzone: (s) => String(s.color ?? "")
};
var host = null;
var tile$1 = 0;
var cache$1 = /* @__PURE__ */ new Map();
var bytes = 0;
var hits = 0;
var misses = 0;
var enabled = true;
/**
* Подключить атлас к рендеру. Вызывается из render.js, чтобы не заводить
* циклический импорт: атлас знает про рисователи, рисователи про атлас — нет.
*/
function initAtlas(api) {
	host = api;
}
/** Сбросить всё: смена размера тайла, палитры или биома с другими цветами. */
function clearAtlas() {
	cache$1.clear();
	bytes = 0;
	hits = misses = 0;
}
/** Детерминированный шум — тот же, что в render.js. */
function nz$2(i) {
	const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return v - Math.floor(v);
}
/** Вариант экземпляра по координатам клетки: соседние выглядят по-разному. */
var variantOf = (x, y) => Math.floor(nz$2(x * 31 + y * 57) * VARIANTS$1) % VARIANTS$1;
/** Фазовый сдвиг по координатам: одинаковые клетки не пульсируют в унисон. */
var phaseOf = (x, y) => nz$2(x * 7 + y * 13);
/** Клетка-донор для варианта: её координаты дают нужный seed внутри рисователя. */
var donorCell = (v) => ({
	x: 3 + v * 7,
	y: 5 + v * 11
});
function periodMs(type, T) {
	const a = ANIM[type];
	if (!a || !a.ms) return 0;
	return a.ms === "T" ? T * a.k : a.ms;
}
function evictIfNeeded(need) {
	const cap = BUDGET_MB * 1048576;
	if (bytes + need <= cap) return;
	const sorted = [...cache$1.entries()].sort((a, b) => a[1].used - b[1].used);
	for (const [k, v] of sorted) {
		cache$1.delete(k);
		bytes -= v.bytes;
		if (bytes + need <= cap) break;
	}
}
/**
* Испечь один кадр. Трюк в том, что drawSpecial() рисует в области клетки
* (x*T, y*T); сдвигаем контекст так, чтобы эта область легла в 0,0.
*/
function bake(s, variant, frame, frames, type, T) {
	const cv = document.createElement("canvas");
	const dpr = window.devicePixelRatio || 1;
	cv.width = Math.ceil(T * dpr);
	cv.height = Math.ceil(T * dpr);
	const c = cv.getContext("2d");
	c.setTransform(dpr, 0, 0, dpr, 0, 0);
	const cell = donorCell(variant);
	const period = periodMs(type, T);
	const ts = period ? frame / frames * period : 0;
	const prevCtx = host.dom.ctx;
	host.dom.ctx = c;
	try {
		c.save();
		c.translate(-cell.x * T, -cell.y * T);
		host.drawSpecial(cell.x, cell.y, s, ts);
		c.restore();
	} finally {
		host.dom.ctx = prevCtx;
	}
	return cv;
}
/**
* Готовый кадр спец-клетки или null, если печь нельзя и надо рисовать живьём.
*
* @param {object} s — запись из S.special
* @param {number} x,y — координаты клетки (дают вариант и фазу)
* @param {number} T — размер тайла
* @param {number} ts — время из rAF
*/
function specialSprite(s, x, y, T, ts) {
	if (!enabled || !host) return null;
	const a = ANIM[s.type];
	if (!a) return null;
	if (tile$1 !== T) {
		clearAtlas();
		tile$1 = T;
	}
	const frames = Math.max(1, a.n);
	const period = periodMs(s.type, T);
	const v = variantOf(x, y);
	let frame = 0;
	if (period && frames > 1) {
		const ph = phaseOf(x, y);
		frame = Math.floor(((ts || 0) / period + ph) % 1 * frames) % frames;
	}
	const extra = KEYED[s.type] ? KEYED[s.type](s) : "";
	const k = `${s.type}|${v}|${extra}|${frame}`;
	const hit = cache$1.get(k);
	if (hit) {
		hit.used++;
		hits++;
		return hit.cv;
	}
	misses++;
	const cv = bake(s, v, frame, frames, s.type, T);
	const size = cv.width * cv.height * 4;
	evictIfNeeded(size);
	cache$1.set(k, {
		cv,
		bytes: size,
		used: 1
	});
	bytes += size;
	return cv;
}
//#endregion
//#region src/floor.js
/**
* src/floor.js — пол с орнаментом, кэшированный.
*
* Было: один fillRect на клетку, два плоских цвета из биома. Дёшево, но доска
* выглядит миллиметровкой, а не полом подземелья.
*
* Стало: тайл печётся один раз на (биом × цвет × вариант × размер) и дальше
* выводится одним drawImage — то есть не дороже прежнего fillRect.
*
* Правило, по которому подбирались все числа: пол должен молчать. Разброс
* яркости внутри тайла держится ниже 12, орнамент почти не виден по одному
* тайлу и проявляется только массивом. Если он заметен на отдельной клетке —
* он слишком громкий.
*/
var VARIANTS = 1;
var cache = /* @__PURE__ */ new Map();
var tile = 0;
/** Детерминированный шум — тот же, что в render.js. */
function nz$1(i) {
	const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return v - Math.floor(v);
}
function hexToRgb$1(h) {
	let v = String(h).replace("#", "");
	if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
	const n = parseInt(v, 16) || 0;
	return [
		n >> 16 & 255,
		n >> 8 & 255,
		n & 255
	];
}
var shade = (rgb, k) => `rgb(${rgb.map((c) => Math.round(Math.min(255, c * k))).join(",")})`;
/**
* Испечь один тайл пола.
*
* Слои, снизу вверх: заливка → лёгкая неоднородность камня → фаска по краю
* плиты → волосяные трещины → редкая резьба. Каждый следующий слой тише
* предыдущего.
*/
function bakeTile(color, variant, T) {
	const cv = document.createElement("canvas");
	const dpr = window.devicePixelRatio || 1;
	cv.width = cv.height = Math.ceil(T * dpr);
	const c = cv.getContext("2d");
	c.setTransform(dpr, 0, 0, dpr, 0, 0);
	const base = hexToRgb$1(color);
	const s = variant * 137;
	c.fillStyle = color;
	c.fillRect(0, 0, T, T);
	for (let i = 0; i < 7; i++) {
		const n = nz$1(s + i * 13);
		const x = nz$1(s + i * 29) * T;
		const y = nz$1(s + i * 41) * T;
		const r = T * (.18 + nz$1(s + i * 53) * .3);
		const g = c.createRadialGradient(x, y, 0, x, y, r);
		const k = n > .5 ? 1.06 : .95;
		g.addColorStop(0, shade(base, k).replace("rgb", "rgba").replace(")", ",0.5)"));
		g.addColorStop(1, shade(base, k).replace("rgb", "rgba").replace(")", ",0)"));
		c.fillStyle = g;
		c.fillRect(0, 0, T, T);
	}
	const inset = Math.max(1, T * .045);
	c.strokeStyle = shade(base, 1.14).replace("rgb", "rgba").replace(")", ",0.16)");
	c.lineWidth = Math.max(1, T * .035);
	c.beginPath();
	c.moveTo(inset, T - inset);
	c.lineTo(inset, inset);
	c.lineTo(T - inset, inset);
	c.stroke();
	c.strokeStyle = "rgba(0,0,0,.16)";
	c.beginPath();
	c.moveTo(T - inset, inset);
	c.lineTo(T - inset, T - inset);
	c.lineTo(inset, T - inset);
	c.stroke();
	if (nz$1(s + 7) > .45) {
		c.strokeStyle = "rgba(0,0,0,.12)";
		c.lineWidth = 1;
		const n = 1 + (nz$1(s + 11) > .7 ? 1 : 0);
		for (let i = 0; i < n; i++) {
			const a = nz$1(s + i * 71) * Math.PI * 2;
			const len = T * (.2 + nz$1(s + i * 83) * .35);
			const x0 = T * (.2 + nz$1(s + i * 97) * .6);
			const y0 = T * (.2 + nz$1(s + i * 101) * .6);
			c.beginPath();
			c.moveTo(x0, y0);
			let px = x0, py = y0;
			for (let k = 1; k <= 3; k++) {
				const wob = (nz$1(s + i * 113 + k) - .5) * .7;
				px += Math.cos(a + wob) * len / 3;
				py += Math.sin(a + wob) * len / 3;
				c.lineTo(px, py);
			}
			c.stroke();
		}
	}
	if (nz$1(s + 23) > .96) {
		c.save();
		c.globalAlpha = .9;
		c.strokeStyle = shade(base, 1.5);
		c.lineWidth = Math.max(1, T * .03);
		const r = T * .17;
		c.translate(T / 2, T / 2);
		c.beginPath();
		c.moveTo(0, -r);
		c.lineTo(r, 0);
		c.lineTo(0, r);
		c.lineTo(-r, 0);
		c.closePath();
		c.stroke();
		c.beginPath();
		c.arc(0, 0, r * .42, 0, 7);
		c.stroke();
		c.restore();
	}
	return cv;
}
/**
* Тайл пола для клетки. Вариант выбирается по координатам, поэтому стабилен
* между кадрами и не мерцает.
*
* @param {string} color — цвет из биома (light или dark)
* @param {number} x,y — координаты клетки
* @param {number} T — размер тайла
* @returns {HTMLCanvasElement}
*/
function floorTile(color, x, y, T) {
	if (tile !== T) {
		cache.clear();
		tile = T;
	}
	const v = Math.floor(nz$1(x * 19 + y * 43) * VARIANTS) % VARIANTS;
	const k = `${color}|${v}`;
	let cv = cache.get(k);
	if (!cv) {
		cv = bakeTile(color, v, T);
		cache.set(k, cv);
	}
	return cv;
}
//#endregion
//#region src/render.js
/**
* src/render.js — Canvas-рендер, камера, анимации, виньетка, speech-облачка.
* Основные экспорты: render(), resizeBoard(), drawPiece(), drawSpecial(), addSpeech(),
* clearSpeech(), spawnParticles(), startCaptureFlash(), screenFade(), startMoveAnim().
*/
var T = CFG.TILE;
var needsRedraw = true;
var loopRunning = false;
var camera = {
	x: 0,
	y: 0
};
/** true, пока пользователь панорамирует карту — камера не возвращается к игроку. */
var cameraDrag = false;
function centerCamera() {
	if (!S$1.player || cameraDrag) return;
	const tx = S$1.player.x - CFG.VIEW_W / 2 + .5;
	const ty = S$1.player.y - CFG.VIEW_H / 2 + .5;
	camera.x += (tx - camera.x) * .15;
	camera.y += (ty - camera.y) * .15;
	const minX = Math.min(0, CFG.W - CFG.VIEW_W);
	const maxX = Math.max(0, CFG.W - CFG.VIEW_W);
	const minY = Math.min(0, CFG.H - CFG.VIEW_H);
	const maxY = Math.max(0, CFG.H - CFG.VIEW_H);
	camera.x = Math.max(minX, Math.min(camera.x, maxX));
	camera.y = Math.max(minY, Math.min(camera.y, maxY));
}
/** Установить флаг панорамы (true — камера не следует за игроком). */
function setCameraDrag(v) {
	cameraDrag = v;
}
/** Сбросить флаг панорамы — камера снова начнёт следовать за игроком. */
function snapBackCamera() {
	cameraDrag = false;
}
var animState = {
	player: null,
	enemies: /* @__PURE__ */ new Map()
};
/**
* Запустить анимацию плавного перемещения фигуры из (fx,fy) в (tx,ty).
* @param {object} unit — S.player или объект врага
* @param {number} fx
* @param {number} fy
* @param {number} tx
* @param {number} ty
*/
function startMoveAnim(unit, fx, fy, tx, ty) {
	unit.lastDir = [Math.sign(tx - fx), Math.sign(ty - fy)];
	if (!CFG.ANIM_ENABLED || typeof requestAnimationFrame === "undefined") return;
	const entry = {
		fromX: fx,
		fromY: fy,
		toX: tx,
		toY: ty,
		startTs: null
	};
	if (unit === S$1.player) animState.player = entry;
	else animState.enemies.set(unit, entry);
	requestRender();
}
/**
* Получить интерполированные координаты для юнита.
* Возвращает { x, y } — либо анимированные, либо реальные.
*/
function getAnimPos(unit, realX, realY, ts) {
	let entry;
	if (unit === S$1.player) entry = animState.player;
	else entry = animState.enemies.get(unit);
	if (!entry || !ts) return {
		x: realX,
		y: realY
	};
	if (entry.startTs === null) entry.startTs = ts;
	const elapsed = ts - entry.startTs;
	if (elapsed >= CFG.MOVE_ANIM_MS) {
		if (unit === S$1.player) animState.player = null;
		else animState.enemies.delete(unit);
		return {
			x: realX,
			y: realY
		};
	}
	const raw = Math.min(elapsed / CFG.MOVE_ANIM_MS, 1);
	const t = raw * (2 - raw);
	return {
		x: entry.fromX + (entry.toX - entry.fromX) * t,
		y: entry.fromY + (entry.toY - entry.fromY) * t
	};
}
var screenOverlay = {
	alpha: 0,
	color: "#000"
};
var particles = [];
var captureFlash = null;
/**
* Затемнение экрана (переход между этажами).
*/
function screenFade(color = "#000", durationMs = 400) {
	if (!CFG.ANIM_ENABLED) return;
	screenOverlay = {
		alpha: 1,
		color,
		durationMs,
		startTs: null
	};
	requestRender();
}
/**
* Создать частицы смерти/разрушения в точке.
*/
function spawnParticles(x, y, color, count = 8) {
	if (!CFG.ANIM_ENABLED) return;
	for (let i = 0; i < count; i++) {
		const angle = Math.random() * Math.PI * 2;
		const speed = T * (.02 + Math.random() * .06);
		particles.push({
			x: x * T + T / 2,
			y: y * T + T / 2,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life: 350 + Math.random() * 250,
			maxLife: 600,
			color,
			size: T * (.02 + Math.random() * .04)
		});
	}
	requestRender();
}
/**
* Вспышка на клетке взятия.
*/
function startCaptureFlash(x, y) {
	if (!CFG.ANIM_ENABLED) return;
	captureFlash = {
		x,
		y,
		startTs: null
	};
	requestRender();
}
/** Настройки — вынесены, чтобы подбирать на глаз в sandbox. */
var SPEECH = {
	ttl: 2e3,
	ttlPerLine: 550,
	stagger: 180,
	maxVisible: 2,
	rise: .35,
	font: .24,
	lineH: 1.25,
	maxWidth: 3.2,
	maxLines: 3,
	fadeIn: .08,
	fadeOut: .25
};
/** Цвет = кто говорит. Читается без чтения. */
var SPEECH_COLOR = {
	enemy: "#c8a878",
	bone: "#7ec8b8",
	boss: "#d06a5a",
	neutral: "#b8b4ac"
};
var speech = [];
/**
* Разбить текст на строки по словам, не шире maxW пикселей.
* Слово длиннее строки рвётся посимвольно.
*/
function wrapSpeechText(c, text, maxW, maxLines) {
	const words = String(text).split(/\s+/).filter(Boolean);
	const lines = [];
	let cur = "";
	const pushCur = () => {
		if (cur) lines.push(cur);
		cur = "";
	};
	for (const w of words) {
		const probe = cur ? cur + " " + w : w;
		if (c.measureText(probe).width <= maxW) {
			cur = probe;
			continue;
		}
		pushCur();
		if (c.measureText(w).width <= maxW) cur = w;
		else {
			let chunk = "";
			for (const ch of w) if (c.measureText(chunk + ch).width > maxW) {
				lines.push(chunk);
				chunk = ch;
				if (lines.length >= maxLines) break;
			} else chunk += ch;
			cur = chunk;
		}
		if (lines.length >= maxLines) break;
	}
	pushCur();
	if (lines.length > maxLines) {
		lines.length = maxLines;
		let last = lines[maxLines - 1];
		while (last.length > 1 && c.measureText(last + "…").width > maxW) last = last.slice(0, -1);
		lines[maxLines - 1] = last + "…";
	}
	return lines.length ? lines : [""];
}
/**
* Реплика над клеткой. Дублируй вызовом log() — всплывашка гаснет, лог остаётся.
* @param {number} x,y — координаты клетки
* @param {string} text — фраза; длинная переносится по словам
* @param {string} kind — ключ SPEECH_COLOR или готовый цвет
*/
function addSpeech(x, y, text, kind = "enemy") {
	if (!CFG.ANIM_ENABLED) return;
	const color = SPEECH_COLOR[kind] || kind;
	const queuePos = Math.max(0, speech.length - SPEECH.maxVisible + 1);
	speech.push({
		x,
		y,
		text: String(text),
		color,
		startTs: null,
		delay: queuePos * SPEECH.stagger,
		lines: null,
		wrapT: 0,
		ttl: SPEECH.ttl
	});
	requestRender();
}
/** Сбросить все реплики (смена яруса, конец забега). */
function clearSpeech() {
	speech = [];
}
function hexToRgb(h) {
	let v = String(h).replace("#", "");
	if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
	const n = parseInt(v, 16) || 0;
	return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`;
}
/** Вызывать после отрисовки фигур, внутри трансформации камеры. */
function drawSpeech(ts) {
	if (!speech.length) return;
	const c = dom.ctx;
	const fontPx = Math.max(10, T * SPEECH.font);
	const lineH = fontPx * SPEECH.lineH;
	speech = speech.filter((sp) => {
		c.save();
		c.font = `${fontPx.toFixed(0)}px Georgia, serif`;
		c.textAlign = "center";
		c.textBaseline = "middle";
		if (!sp.lines || sp.wrapT !== T) {
			sp.lines = wrapSpeechText(c, sp.text, T * SPEECH.maxWidth, SPEECH.maxLines);
			sp.wrapT = T;
			sp.ttl = SPEECH.ttl + (sp.lines.length - 1) * SPEECH.ttlPerLine;
		}
		if (sp.startTs === null) sp.startTs = (ts || 0) + sp.delay;
		const e = (ts || 0) - sp.startTs;
		if (e < 0) {
			c.restore();
			return true;
		}
		if (e >= sp.ttl) {
			c.restore();
			return false;
		}
		const k = e / sp.ttl;
		const a = smoothstep(0, SPEECH.fadeIn, k) * (1 - smoothstep(1 - SPEECH.fadeOut, 1, k));
		const up = k * T * SPEECH.rise;
		let w = 0;
		sp.lines.forEach((ln) => {
			w = Math.max(w, c.measureText(ln).width);
		});
		w += 12;
		const h = sp.lines.length * lineH + fontPx * .4;
		const topIfAbove = sp.y * T - h - T * .12 - up;
		const boxY = topIfAbove >= camera.y * T + 2 ? topIfAbove : sp.y * T + T * 1.06 + up;
		const minX = camera.x * T + w / 2 + 4;
		const maxX = camera.x * T + CFG.VIEW_W * T - w / 2 - 4;
		const cxr = Math.max(minX, Math.min(sp.x * T + T / 2, maxX));
		c.globalAlpha = a;
		c.fillStyle = "rgba(8,8,10,.74)";
		c.beginPath();
		c.roundRect(cxr - w / 2, boxY, w, h, 4);
		c.fill();
		c.strokeStyle = `rgba(${hexToRgb(sp.color)},.35)`;
		c.lineWidth = 1;
		c.stroke();
		c.fillStyle = sp.color;
		sp.lines.forEach((ln, i) => {
			c.fillText(ln, cxr, boxY + fontPx * .2 + lineH * (i + .5));
		});
		c.restore();
		return true;
	});
}
/**
* Запросить перерисовку на следующем кадре.
* Вызывается из всех модулей после изменения состояния.
*/
function requestRender() {
	needsRedraw = true;
}
/**
* Проверить, есть ли активные анимации, требующие покадрового рендера.
*/
function hasActiveAnim() {
	if (animState.player) return true;
	if (pendingMove()) return true;
	if (animState.enemies.size > 0) return true;
	if (particles.length > 0) return true;
	if (captureFlash) return true;
	if (screenOverlay.alpha > 0) return true;
	if (modPulses.size > 0) return true;
	if (CFG.ANIM_ENABLED && S$1.player && modCount() > 0) return true;
	if (speech.length > 0) return true;
	if (tutorialTargets().length) return true;
	if (!cameraDrag && S$1.player) {
		const tx = S$1.player.x - CFG.VIEW_W / 2 + .5;
		const ty = S$1.player.y - CFG.VIEW_H / 2 + .5;
		if (Math.abs(camera.x - tx) > .01 || Math.abs(camera.y - ty) > .01) return true;
	}
	return false;
}
function hasAnimatedSpecials() {
	if (!CFG.ANIM_ENABLED) return false;
	if (!S$1.special) return false;
	for (const s of S$1.special.values()) if (s.type === "lava" || s.type === "fog" || s.type === "conveyor" || s.type === "gate" || s.type === "ice" || s.type === "portal" || s.type === "millstone") return true;
	return false;
}
/**
* Запустить rAF-цикл (один раз при старте).
* В среде без rAF (тесты) renderNow вызывается синхронно.
*/
function startRenderLoop() {
	if (loopRunning) return;
	if (typeof requestAnimationFrame === "undefined") {
		loopRunning = true;
		renderNow(0);
		return;
	}
	loopRunning = true;
	function tick(ts) {
		if (needsRedraw || hasAnimatedSpecials() || hasActiveAnim()) {
			needsRedraw = false;
			renderNow(ts);
		}
		requestAnimationFrame(tick);
	}
	requestAnimationFrame(tick);
}
function resizeBoard() {
	const cssW = dom.cv.clientWidth || Math.min(CFG.VIEW_W * CFG.TILE, (window.innerWidth || 616) - 24);
	T = cssW / CFG.VIEW_W;
	const dpr = window.devicePixelRatio || 1;
	dom.cv.width = Math.round(cssW * dpr);
	dom.cv.height = Math.round(CFG.VIEW_H * T * dpr);
	dom.cv.style.height = CFG.VIEW_H * T + "px";
	dom.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	requestRender();
}
function hatch(x, y, color, _ts, tilt) {
	dom.ctx.save();
	dom.ctx.beginPath();
	dom.ctx.rect(x * T, y * T, T, T);
	dom.ctx.clip();
	dom.ctx.globalAlpha = .28;
	dom.ctx.fillStyle = color;
	dom.ctx.fillRect(x * T, y * T, T, T);
	dom.ctx.globalAlpha = .5;
	dom.ctx.strokeStyle = color;
	dom.ctx.lineWidth = 2;
	const sign = (tilt || 1) > 0 ? 1 : -1;
	for (let i = -T; i < T * 2; i += 9) {
		dom.ctx.beginPath();
		dom.ctx.moveTo(x * T + i, y * T);
		dom.ctx.lineTo(x * T + i + T, y * T + sign * T);
		dom.ctx.stroke();
	}
	dom.ctx.restore();
}
/** Детерминированный псевдослучайный шум 0..1 — чтобы клетки не мигали синхронно. */
function nz(i) {
	const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return v - Math.floor(v);
}
/** Плавный треугольник 0→1→0 по фазе p (0..1). */
function pingPong(p) {
	const f = p - Math.floor(p);
	return f < .5 ? f * 2 : 2 - f * 2;
}
/** Мягкая ступенька для аккуратных вспышек. */
function smoothstep(e0, e1, v) {
	const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
}
/** Радиальный градиент-свечение. */
function glow(c, cx, cy, r, rgb, a) {
	const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
	g.addColorStop(0, `rgba(${rgb},${a})`);
	g.addColorStop(.6, `rgba(${rgb},${a * .35})`);
	g.addColorStop(1, `rgba(${rgb},0)`);
	c.fillStyle = g;
	c.beginPath();
	c.arc(cx, cy, r, 0, 7);
	c.fill();
}
var modPulses = /* @__PURE__ */ new Map();
var MOD_PULSE_MS = 550;
/** Стабильный хеш строки → 0..1 (одинаковый цвет у модификатора между забегами). */
function hashUnit(str) {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0) % 1e4 / 1e4;
}
/** Цвет модификатора: реликвии — холодная зелёно-золотая гамма, проклятия — багрово-пурпурная. */
function modColor(id, isCurse, alpha = 1) {
	const u = hashUnit(id);
	const hue = isCurse ? (330 + u * 60) % 360 : 120 + u * 80;
	const sat = isCurse ? 62 : 58;
	const lit = isCurse ? 52 : 58;
	return `hsla(${hue.toFixed(0)},${sat}%,${lit}%,${alpha})`;
}
function relicIds() {
	return S$1.player && S$1.player.relics ? [...S$1.player.relics].sort() : [];
}
function curseIds() {
	return S$1.player && S$1.player.curses ? [...S$1.player.curses].sort() : [];
}
function modCount() {
	return relicIds().length + curseIds().length;
}
/** Величина вспышки сегмента 0..1 (затухает за MOD_PULSE_MS). */
function pulseAmount(id, ts) {
	if (!modPulses.has(id)) return 0;
	let start = modPulses.get(id);
	if (start === null) {
		start = ts || 0;
		modPulses.set(id, start);
	}
	const e = (ts || 0) - start;
	if (e >= MOD_PULSE_MS) {
		modPulses.delete(id);
		return 0;
	}
	return 1 - e / MOD_PULSE_MS;
}
/**
* Кольцо из сегментов: один сегмент = один модификатор.
* Масштабируется до любого количества — при 19 сегментах кольцо читается
* как «плотный венец», при 2–3 — как отдельные дуги.
*/
function drawModRing(c, cx, cy, radius, ids, isCurse, ts) {
	const n = ids.length;
	if (!n) return;
	const seg = Math.PI * 2 / n;
	const gap = n > 14 ? seg * .18 : n > 6 ? seg * .14 : seg * .1;
	const rot = (ts || 0) / (isCurse ? -14e3 : 18e3) * Math.PI * 2;
	c.lineCap = "butt";
	for (let i = 0; i < n; i++) {
		const id = ids[i];
		const pulse = pulseAmount(id, ts);
		const a0 = rot + i * seg + gap / 2;
		const a1 = rot + (i + 1) * seg - gap / 2;
		c.strokeStyle = modColor(id, isCurse, .72 + pulse * .28);
		c.lineWidth = (isCurse ? 2.1 : 2.5) + pulse * 2.4;
		c.beginPath();
		c.arc(cx, cy, radius + pulse * T * .05, a0, a1);
		c.stroke();
	}
}
/**
* Аура и кольца под фигурой игрока.
* @param {number} px,py — координаты в клетках (могут быть дробными при анимации)
*/
function drawModifierAura(px, py, ts) {
	if (!S$1.player) return;
	const rel = relicIds();
	const cur = curseIds();
	const total = rel.length + cur.length;
	if (!total) return;
	const c = dom.ctx;
	const cx = px * T + T / 2, cy = py * T + T / 2;
	const breathe = .5 + .5 * Math.sin((ts || 0) / 2600 * Math.PI * 2);
	c.save();
	const mix = cur.length / total;
	const rr = Math.round(88 + 110 * mix);
	const gg = Math.round(179 - 121 * mix);
	const bb = Math.round(164 - 90 * mix);
	const strength = Math.min(total, 14) / 14;
	glow(c, cx, cy, T * (.5 + strength * .16), `${rr},${gg},${bb}`, .1 + strength * .12 + breathe * .05);
	if (cur.length >= 4) {
		c.strokeStyle = `rgba(46,10,16,${.25 + Math.min(cur.length, 10) * .03})`;
		c.lineWidth = 3;
		c.beginPath();
		c.arc(cx, cy, T * .52, 0, 7);
		c.stroke();
	}
	drawModRing(c, cx, cy, T * .47, rel, false, ts);
	drawModRing(c, cx, cy, T * .38, cur, true, ts);
	c.restore();
}
/** Компактные счётчики у нижнего края клетки игрока: ✦реликвии ☠проклятия. */
function drawModifierCounters(px, py, ts) {
	const rel = relicIds().length;
	const cur = curseIds().length;
	if (!rel && !cur) return;
	const c = dom.ctx;
	const bx = px * T, by = py * T + T;
	c.save();
	c.font = `${Math.max(8, T * .2).toFixed(0)}px system-ui,sans-serif`;
	c.textBaseline = "bottom";
	const pulse = .5 + .5 * Math.sin((ts || 0) / 2600 * Math.PI * 2);
	if (rel) {
		c.textAlign = "left";
		c.fillStyle = "rgba(0,0,0,.55)";
		c.fillText(`✦${rel}`, bx + T * .09, by - T * .04 + 1);
		c.fillStyle = `rgba(126,214,190,${.85 + pulse * .15})`;
		c.fillText(`✦${rel}`, bx + T * .08, by - T * .05);
	}
	if (cur) {
		c.textAlign = "right";
		c.fillStyle = "rgba(0,0,0,.55)";
		c.fillText(`☠${cur}`, bx + T * .93, by - T * .04 + 1);
		c.fillStyle = `rgba(232,124,124,${.85 + pulse * .15})`;
		c.fillText(`☠${cur}`, bx + T * .92, by - T * .05);
	}
	c.restore();
}
function drawSpecial(x, y, s, ts) {
	const c = dom.ctx;
	const x0 = x * T, y0 = y * T;
	const cx = x0 + T / 2, cy = y0 + T / 2;
	const ats = (ts || 0) * CFG.TILE_ANIM_SPEED;
	const seed = nz(x * 7 + y * 13);
	c.save();
	c.beginPath();
	c.rect(x0, y0, T, T);
	c.clip();
	if (s.type === "trap") {
		const p = ats / 3e3 + seed;
		const sway = Math.sin(p * Math.PI * 2) * .035;
		const r = T * .46;
		glow(c, cx, cy, T * .5, "10,12,10", .35);
		const N = 8;
		const ang = (i) => i / N * Math.PI * 2 + sway * (i % 2 ? 1 : -1);
		for (let i = 0; i < N; i++) {
			const a = ang(i);
			const g = c.createLinearGradient(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
			g.addColorStop(0, "rgba(206,200,170,.75)");
			g.addColorStop(1, "rgba(150,144,116,.25)");
			c.strokeStyle = g;
			c.lineWidth = i % 2 ? 1.4 : 1;
			c.beginPath();
			c.moveTo(cx, cy);
			c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
			c.stroke();
		}
		c.lineCap = "round";
		[
			.16,
			.26,
			.36,
			.45
		].forEach((k, ri) => {
			const rr = T * k;
			const sag = rr * .24;
			c.strokeStyle = `rgba(214,208,178,${.5 - ri * .07})`;
			c.lineWidth = 1;
			c.beginPath();
			for (let i = 0; i < N; i++) {
				const a1 = ang(i), a2 = ang(i + 1);
				const sx = cx + Math.cos(a1) * rr, sy = cy + Math.sin(a1) * rr;
				const ex = cx + Math.cos(a2) * rr, ey = cy + Math.sin(a2) * rr;
				const am = (a1 + a2) / 2;
				const cpx = cx + Math.cos(am) * (rr - sag), cpy = cy + Math.sin(am) * (rr - sag);
				if (i === 0) c.moveTo(sx, sy);
				c.quadraticCurveTo(cpx, cpy, ex, ey);
			}
			c.stroke();
		});
		for (let d = 0; d < 4; d++) {
			const a = ang(d * 2 + .5);
			const rr = T * (.2 + nz(d + x + y) * .24);
			const dx = cx + Math.cos(a) * rr, dy = cy + Math.sin(a) * rr;
			const tw = pingPong(ats / 1400 + d * .27 + seed);
			c.fillStyle = `rgba(226,232,224,${.35 + tw * .45})`;
			c.beginPath();
			c.arc(dx, dy, 1.5 + tw * .9, 0, 7);
			c.fill();
		}
	} else if (s.type === "rune") {
		const p = ats / 2400 + seed;
		const breathe = .5 + .5 * Math.sin(p * Math.PI * 2);
		glow(c, cx, cy, T * .44, "88,179,164", .16 + breathe * .18);
		c.strokeStyle = `rgba(88,179,164,${.4 + breathe * .3})`;
		c.lineWidth = 1.6;
		const rot = p * Math.PI * 2 * .35;
		for (let i = 0; i < 3; i++) {
			const a0 = rot + i / 3 * Math.PI * 2;
			c.beginPath();
			c.arc(cx, cy, T * .36, a0, a0 + 1.25);
			c.stroke();
		}
		const rr = T * (.23 + breathe * .035);
		c.strokeStyle = "#6fd0bd";
		c.fillStyle = `rgba(88,179,164,${.14 + breathe * .14})`;
		c.lineWidth = 2;
		c.beginPath();
		c.moveTo(cx, cy - rr);
		c.lineTo(cx + rr, cy);
		c.lineTo(cx, cy + rr);
		c.lineTo(cx - rr, cy);
		c.closePath();
		c.fill();
		c.stroke();
		c.strokeStyle = `rgba(160,240,225,${.5 + breathe * .4})`;
		c.lineWidth = 1.4;
		c.beginPath();
		c.moveTo(cx - rr * .42, cy);
		c.lineTo(cx + rr * .42, cy);
		c.moveTo(cx, cy - rr * .5);
		c.lineTo(cx, cy + rr * .5);
		c.stroke();
		c.fillStyle = `rgba(190,255,240,${.75 + breathe * .25})`;
		c.beginPath();
		c.arc(cx, cy, T * .05 + breathe * 1.2, 0, 7);
		c.fill();
		for (let i = 0; i < 3; i++) {
			const a = -rot * 2.1 + i / 3 * Math.PI * 2;
			const orb = T * .3;
			const sx = cx + Math.cos(a) * orb, sy = cy + Math.sin(a) * orb;
			c.fillStyle = `rgba(150,240,220,${.35 + .4 * pingPong(p + i / 3)})`;
			c.beginPath();
			c.arc(sx, sy, 1.6, 0, 7);
			c.fill();
		}
	} else if (s.type === "portal") {
		const p = ats / 1600 + seed;
		const pulse = Math.sin(p * Math.PI * 2);
		glow(c, cx, cy, T * .46, "155,109,208", .2 + Math.abs(pulse) * .14);
		[
			{
				r: .34,
				w: 3,
				sp: .6,
				seg: 2,
				a: .95
			},
			{
				r: .25,
				w: 2.2,
				sp: -1,
				seg: 3,
				a: .7
			},
			{
				r: .16,
				w: 1.8,
				sp: 1.7,
				seg: 2,
				a: .5
			}
		].forEach((rg, i) => {
			const rad = T * (rg.r + pulse * .012 * (i % 2 ? -1 : 1));
			const rot = p * Math.PI * 2 * rg.sp;
			c.strokeStyle = `rgba(${i === 0 ? "186,148,236" : "155,109,208"},${rg.a})`;
			c.lineWidth = rg.w;
			c.lineCap = "round";
			for (let k = 0; k < rg.seg; k++) {
				const a0 = rot + k / rg.seg * Math.PI * 2;
				c.beginPath();
				c.arc(cx, cy, rad, a0, a0 + Math.PI / rg.seg - .25);
				c.stroke();
			}
		});
		for (let i = 0; i < 5; i++) {
			const ph = (p * .9 + i / 5) % 1;
			const rad = T * .44 * (1 - ph);
			const a = ph * Math.PI * 3 + i * 1.3;
			const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
			c.fillStyle = `rgba(214,190,255,${.7 * (smoothstep(0, .25, ph) * (1 - smoothstep(.75, 1, ph)))})`;
			c.beginPath();
			c.arc(px, py, 1.7, 0, 7);
			c.fill();
		}
		c.fillStyle = `rgba(236,222,255,${.5 + Math.abs(pulse) * .4})`;
		c.beginPath();
		c.arc(cx, cy, T * .045, 0, 7);
		c.fill();
	} else if (s.type === "ice") {
		const p = ats / 4e3 + seed;
		const g = c.createLinearGradient(x0, y0, x0, y0 + T);
		g.addColorStop(0, "rgba(176,224,240,.30)");
		g.addColorStop(1, "rgba(120,186,214,.18)");
		c.fillStyle = g;
		c.fillRect(x0, y0, T, T);
		c.fillStyle = "rgba(214,240,250,.22)";
		[
			[
				0,
				0,
				1,
				1
			],
			[
				T,
				0,
				-1,
				1
			],
			[
				0,
				T,
				1,
				-1
			],
			[
				T,
				T,
				-1,
				-1
			]
		].forEach(([ox, oy, sx, sy], i) => {
			const k = T * (.26 + .06 * Math.sin(p * Math.PI * 2 + i));
			c.beginPath();
			c.moveTo(x0 + ox, y0 + oy);
			c.lineTo(x0 + ox + sx * k, y0 + oy);
			c.lineTo(x0 + ox, y0 + oy + sy * k);
			c.closePath();
			c.fill();
		});
		c.lineCap = "round";
		const N = 9;
		for (let i = 0; i < N; i++) {
			const a = i / N * Math.PI * 2 + Math.sin(p * Math.PI * 1.2) * .1 * (i % 2 ? 1 : -1);
			const maxLen = T * (.34 + i % 3 * .035);
			const grow = (p + i * .41 % 1) % 1;
			const alpha = (grow < .2 ? grow / .2 : grow > .8 ? (1 - grow) / .2 : 1) * .55;
			const len = maxLen * grow;
			c.strokeStyle = `rgba(226,246,255,${alpha})`;
			c.lineWidth = 1.5 * (1 - grow * .5);
			c.beginPath();
			c.moveTo(cx, cy);
			[
				[.35, i * 1.7 % 2.5 - 1.2],
				[.65, i * 2.3 % 2.5 - 1.2],
				[1, i * 1.1 % 2.5 - 1.2]
			].forEach(([k, j]) => {
				c.lineTo(cx + Math.cos(a) * len * k + Math.cos(a + Math.PI / 2) * j, cy + Math.sin(a) * len * k + Math.sin(a + Math.PI / 2) * j);
			});
			c.stroke();
		}
		for (let i = 0; i < 3; i++) {
			const tw = pingPong(ats / 900 + i * .4 + seed);
			const sx = x0 + T * (.2 + nz(i + x) * .6), sy = y0 + T * (.2 + nz(i + y + 5) * .6);
			const a = smoothstep(.6, 1, tw);
			if (a <= 0) continue;
			c.strokeStyle = `rgba(255,255,255,${a * .8})`;
			c.lineWidth = 1;
			const k = 2.6 * a;
			c.beginPath();
			c.moveTo(sx - k, sy);
			c.lineTo(sx + k, sy);
			c.moveTo(sx, sy - k);
			c.lineTo(sx, sy + k);
			c.stroke();
		}
	} else if (s.type === "lava") {
		const p = ats / 900 + seed;
		const heat = .5 + .5 * Math.sin(p * Math.PI * 2);
		const g = c.createLinearGradient(x0, y0, x0, y0 + T);
		g.addColorStop(0, `rgba(150,44,20,${.55 + heat * .1})`);
		g.addColorStop(1, `rgba(96,26,14,${.6 + heat * .1})`);
		c.fillStyle = g;
		c.fillRect(x0, y0, T, T);
		c.lineCap = "round";
		for (let i = 0; i < 3; i++) {
			const off = nz(i + x * 3 + y) * T * .6;
			const wob = Math.sin(p * Math.PI * 2 + i) * 2;
			c.strokeStyle = `rgba(255,${140 + heat * 70},${40 + heat * 40},${.35 + heat * .35})`;
			c.lineWidth = 1.8 - i * .4;
			c.beginPath();
			c.moveTo(x0 + 2, y0 + T * .25 + off * .3);
			c.quadraticCurveTo(cx + wob, y0 + T * .5 + off * .2, x0 + T - 2, y0 + T * .3 + off * .35);
			c.stroke();
		}
		glow(c, cx, cy + T * .1, T * .4, "255,150,40", .16 + heat * .2);
		for (let b = 0; b < 4; b++) {
			const bp = (p * .55 + b * .27 + seed) % 1;
			const bx = x0 + T * (.18 + nz(b + x) * .64);
			const by = y0 + T * (.85 - bp * .5);
			const rr = 1.4 + bp * 2.2;
			const fade = (1 - bp) * .75;
			c.fillStyle = `rgba(255,${180 + heat * 50},90,${fade})`;
			c.beginPath();
			c.arc(bx, by, rr, 0, 7);
			c.fill();
		}
		for (let e = 0; e < 3; e++) {
			const ep = (p * .4 + e * .33 + seed) % 1;
			const ex = x0 + T * (.25 + nz(e + y * 2) * .5) + Math.sin(ep * 6 + e) * 2.5;
			const ey = y0 + T * (.9 - ep * .85);
			c.fillStyle = `rgba(255,220,150,${(1 - ep) * .6})`;
			c.beginPath();
			c.arc(ex, ey, 1.1, 0, 7);
			c.fill();
		}
	} else if (s.type === "fog") {
		const p = ats / 2600 + seed;
		c.fillStyle = "rgba(146,152,164,.30)";
		c.fillRect(x0, y0, T, T);
		[
			{
				sp: 1,
				r: .3,
				a: .2,
				o: 0
			},
			{
				sp: -.65,
				r: .24,
				a: .16,
				o: 2.1
			},
			{
				sp: .4,
				r: .19,
				a: .13,
				o: 4.2
			}
		].forEach((L, li) => {
			const dx = Math.sin(p * Math.PI * 2 * L.sp + L.o) * T * .16;
			const dy = Math.cos(p * Math.PI * 1.4 * L.sp + L.o) * T * .07;
			const rr = T * L.r * (1 + .12 * Math.sin(p * Math.PI * 2 + li));
			c.fillStyle = `rgba(206,212,222,${L.a})`;
			c.beginPath();
			c.arc(cx + dx - T * .12, cy + dy, rr, 0, 7);
			c.arc(cx + dx + T * .13, cy + dy - T * .05, rr * .85, 0, 7);
			c.arc(cx + dx, cy + dy + T * .12, rr * .7, 0, 7);
			c.fill();
		});
		glow(c, cx, cy, T * .62, "150,156,168", .12);
	} else if (s.type === "conveyor") {
		const [dx, dy] = s.dir;
		const ang = Math.atan2(dy, dx);
		c.translate(cx, cy);
		c.rotate(ang);
		const halfW = T * .3;
		const g = c.createLinearGradient(0, -halfW, 0, halfW);
		g.addColorStop(0, "rgba(60,72,86,.55)");
		g.addColorStop(.5, "rgba(86,104,124,.5)");
		g.addColorStop(1, "rgba(60,72,86,.55)");
		c.fillStyle = g;
		c.fillRect(-T / 2, -halfW, T, halfW * 2);
		c.strokeStyle = "rgba(150,178,202,.5)";
		c.lineWidth = 1.5;
		c.beginPath();
		c.moveTo(-T / 2, -halfW);
		c.lineTo(T / 2, -halfW);
		c.moveTo(-T / 2, halfW);
		c.lineTo(T / 2, halfW);
		c.stroke();
		const step = T * .34;
		const shift = ats / 26 % step - step;
		c.strokeStyle = "#9ec4e0";
		c.lineWidth = 2.4;
		c.lineCap = "round";
		c.lineJoin = "round";
		for (let i = 0; i < 4; i++) {
			const px = -T / 2 + shift + i * step;
			const edge = smoothstep(-T * .5, -T * .3, px) * (1 - smoothstep(T * .28, T * .5, px));
			if (edge <= 0) continue;
			c.globalAlpha = .35 + edge * .55;
			c.beginPath();
			c.moveTo(px - T * .09, -halfW * .6);
			c.lineTo(px + T * .07, 0);
			c.lineTo(px - T * .09, halfW * .6);
			c.stroke();
		}
		c.globalAlpha = 1;
	} else if (s.type === "gate") {
		const [dx, dy] = s.dir;
		const p = ats / 1100 + seed;
		const pulse = .5 + .5 * Math.sin(p * Math.PI * 2);
		c.fillStyle = `rgba(201,162,39,${.1 + pulse * .06})`;
		c.fillRect(x0, y0, T, T);
		c.translate(cx, cy);
		c.rotate(Math.atan2(dy, dx));
		c.fillStyle = "rgba(150,120,36,.85)";
		const jw = T * .1, jh = T * .22;
		c.fillRect(-jw / 2, -T / 2, jw, jh);
		c.fillRect(-jw / 2, T / 2 - jh, jw, jh);
		const mg = c.createLinearGradient(0, -T / 2, 0, T / 2);
		mg.addColorStop(0, `rgba(255,214,110,${.05 + pulse * .05})`);
		mg.addColorStop(.5, `rgba(255,214,110,${.22 + pulse * .16})`);
		mg.addColorStop(1, `rgba(255,214,110,${.05 + pulse * .05})`);
		c.fillStyle = mg;
		c.fillRect(-T * .045, -T / 2 + jh, T * .09, T - jh * 2);
		c.strokeStyle = "#f0cf62";
		c.lineWidth = 2.6;
		c.lineCap = "round";
		c.lineJoin = "round";
		for (let i = 0; i < 3; i++) {
			const ph = (p * 1.3 + i / 3) % 1;
			const px = -T * .26 + ph * T * .5;
			c.globalAlpha = .25 + smoothstep(0, .2, ph) * (1 - smoothstep(.75, 1, ph)) * .75;
			c.beginPath();
			c.moveTo(px - T * .08, -T * .14);
			c.lineTo(px + T * .06, 0);
			c.lineTo(px - T * .08, T * .14);
			c.stroke();
		}
		c.globalAlpha = 1;
	} else if (s.type === "plate") {
		const isChain = !!s.chain;
		if (isChain && s.broken) c.globalAlpha = .35;
		const p = ats / 1800 + seed;
		const breathe = .5 + .5 * Math.sin(p * Math.PI * 2);
		const k = T * .3;
		c.fillStyle = "rgba(10,14,10,.35)";
		c.fillRect(cx - k, cy - k, k * 2, k * 2);
		const g = c.createLinearGradient(cx - k, cy - k, cx + k, cy + k);
		g.addColorStop(0, "rgba(150,176,130,.5)");
		g.addColorStop(1, "rgba(86,110,74,.5)");
		c.fillStyle = g;
		c.fillRect(cx - k * .86, cy - k * .86, k * 1.72, k * 1.72);
		c.strokeStyle = "rgba(186,214,164,.75)";
		c.lineWidth = 1.6;
		c.strokeRect(cx - k, cy - k, k * 2, k * 2);
		c.fillStyle = "rgba(206,228,186,.6)";
		[
			[-1, -1],
			[1, -1],
			[-1, 1],
			[1, 1]
		].forEach(([sx, sy]) => {
			c.beginPath();
			c.arc(cx + sx * k * .7, cy + sy * k * .7, 1.4, 0, 7);
			c.fill();
		});
		glow(c, cx, cy, T * .2, isChain ? "201,162,39" : "160,220,140", .1 + breathe * .18);
		c.fillStyle = `rgba(196,236,170,${.5 + breathe * .4})`;
		c.beginPath();
		c.arc(cx, cy, T * .07 + breathe * 1.1, 0, 7);
		c.fill();
	} else if (s.type === "door") {
		const p = ats / 2200 + seed;
		const breathe = .5 + .5 * Math.sin(p * Math.PI * 2);
		const locked = !!s.color;
		const kHex = locked ? KEY_COLOR_HEX[s.color] || "#d4a017" : "#6f6f5c";
		const toRgb = (h) => {
			let v = String(h).replace("#", "");
			if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
			const n = parseInt(v, 16) || 0;
			return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`;
		};
		const kRgb = toRgb(kHex);
		const hw = T * .27, base = cy + T * .33, archY = cy - T * .04;
		const archPath = (inset) => {
			c.beginPath();
			c.moveTo(cx - hw + inset, base - inset);
			c.lineTo(cx - hw + inset, archY);
			c.arc(cx, archY, hw - inset, Math.PI, 0);
			c.lineTo(cx + hw - inset, base - inset);
			c.closePath();
		};
		glow(c, cx, cy, T * .46, kRgb, locked ? .1 + breathe * .14 : .07);
		const fg = c.createLinearGradient(cx - hw, archY - hw, cx + hw, base);
		fg.addColorStop(0, locked ? "#4a4438" : "#3e3d34");
		fg.addColorStop(1, locked ? "#241f19" : "#20201b");
		c.fillStyle = fg;
		c.strokeStyle = `rgba(${kRgb},${locked ? .85 : .5})`;
		c.lineWidth = 2;
		archPath(0);
		c.fill();
		c.stroke();
		const dg = c.createLinearGradient(cx, archY - hw * .6, cx, base);
		dg.addColorStop(0, locked ? "#171410" : "#0a0a0c");
		dg.addColorStop(1, locked ? "#0c0a08" : "#000000");
		c.fillStyle = dg;
		archPath(T * .055);
		c.fill();
		c.fillStyle = `rgba(${kRgb},${locked ? .55 + breathe * .25 : .3})`;
		c.beginPath();
		c.moveTo(cx - T * .045, archY - hw + T * .01);
		c.lineTo(cx + T * .045, archY - hw + T * .01);
		c.lineTo(cx + T * .03, archY - hw + T * .075);
		c.lineTo(cx - T * .03, archY - hw + T * .075);
		c.closePath();
		c.fill();
		c.fillStyle = "rgba(0,0,0,.35)";
		c.fillRect(cx - hw, base - 1.5, hw * 2, 2.5);
		if (locked) {
			c.strokeStyle = `rgba(${kRgb},.45)`;
			c.lineWidth = 2;
			[-.2, .2].forEach((k) => {
				const by = cy + T * k;
				c.beginPath();
				c.moveTo(cx - hw * .76, by);
				c.lineTo(cx + hw * .76, by);
				c.stroke();
			});
			c.fillStyle = "rgba(12,10,8,.85)";
			c.beginPath();
			c.arc(cx, cy + T * .06, T * .085, 0, 7);
			c.fill();
			c.fillStyle = `rgba(${kRgb},${.75 + breathe * .25})`;
			c.beginPath();
			c.arc(cx, cy + T * .045, T * .032, 0, 7);
			c.fill();
			c.beginPath();
			c.moveTo(cx - T * .022, cy + T * .06);
			c.lineTo(cx + T * .022, cy + T * .06);
			c.lineTo(cx + T * .012, cy + T * .115);
			c.lineTo(cx - T * .012, cy + T * .115);
			c.closePath();
			c.fill();
			glow(c, cx, cy + T * .06, T * .14, kRgb, .22 + breathe * .28);
		} else for (let i = 0; i < 4; i++) {
			const ph = (p * .8 + i / 4) % 1;
			const mx = cx + Math.sin(ph * 5 + i) * hw * .5;
			const my = base - ph * (base - archY + hw * .4);
			c.fillStyle = `rgba(190,200,210,${.35 * (smoothstep(0, .2, ph) * (1 - smoothstep(.7, 1, ph)))})`;
			c.beginPath();
			c.arc(mx, my, 1.2, 0, 7);
			c.fill();
		}
	} else if (s.type === "key") {
		const p = ats / 1600 + seed;
		const breathe = .5 + .5 * Math.sin(p * Math.PI * 2);
		const kHex = KEY_COLOR_HEX[s.color] || "#d4a017";
		const toRgb = (h) => {
			let v = String(h).replace("#", "");
			if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
			const n = parseInt(v, 16) || 0;
			return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`;
		};
		const kRgb = toRgb(kHex);
		const float = Math.sin(p * Math.PI * 2) * T * .022;
		const tilt = Math.sin(p * Math.PI * 2 + .6) * .09;
		glow(c, cx, cy + float, T * .34, kRgb, .13 + breathe * .14);
		c.save();
		c.translate(cx, cy + T * .26);
		c.scale(1, .24);
		c.fillStyle = "rgba(14,12,8,.38)";
		c.beginPath();
		c.arc(0, 0, T * .16, 0, 7);
		c.fill();
		c.restore();
		c.save();
		c.translate(cx, cy + float);
		c.rotate(tilt);
		const mg = c.createLinearGradient(0, -T * .09, 0, T * .09);
		mg.addColorStop(0, "rgba(255,255,255,.8)");
		mg.addColorStop(.38, kHex);
		mg.addColorStop(1, `rgba(${kRgb},.5)`);
		const ringX = -T * .12;
		c.strokeStyle = "rgba(28,20,8,.55)";
		c.lineWidth = T * .064;
		c.beginPath();
		c.arc(ringX, 0, T * .085, 0, 7);
		c.stroke();
		c.strokeStyle = mg;
		c.lineWidth = T * .048;
		c.beginPath();
		c.arc(ringX, 0, T * .085, 0, 7);
		c.stroke();
		c.fillStyle = mg;
		c.strokeStyle = "rgba(28,20,8,.5)";
		c.lineWidth = .8;
		c.beginPath();
		c.roundRect(ringX + T * .06, -T * .022, T * .27, T * .044, T * .018);
		c.fill();
		c.stroke();
		[[.16, .06], [.245, .09]].forEach(([kx, kh]) => {
			c.beginPath();
			c.roundRect(ringX + T * kx, T * .018, T * .036, T * kh, T * .012);
			c.fill();
			c.stroke();
		});
		const gp = p * .9 % 1;
		const ga = smoothstep(0, .15, gp) * (1 - smoothstep(.6, 1, gp));
		if (ga > 0) {
			c.fillStyle = `rgba(255,255,255,${.55 * ga})`;
			c.beginPath();
			c.roundRect(ringX + T * .06 + gp * T * .26, -T * .019, T * .03, T * .038, T * .014);
			c.fill();
		}
		c.restore();
		for (let i = 0; i < 3; i++) {
			const a = p * Math.PI * .8 + i / 3 * Math.PI * 2;
			const orb = T * (.29 + .025 * Math.sin(p * Math.PI * 4 + i));
			const sx = cx + Math.cos(a) * orb, sy = cy + float + Math.sin(a) * orb * .7;
			c.fillStyle = `rgba(${kRgb},${.25 + .5 * pingPong(p + i / 3)})`;
			c.beginPath();
			c.arc(sx, sy, 1.5, 0, 7);
			c.fill();
		}
	} else if (s.type === "food") {
		const p = ats / 1800 + seed;
		const breathe = .5 + .5 * Math.sin(p * Math.PI * 2);
		const float = Math.sin(p * Math.PI * 2) * T * .018;
		const ang = -.55 + seed * 1.1;
		const LEN = T * .3, W = T * .075, R = T * .088, DY = T * .062, OUT = Math.max(1, T * .028);
		glow(c, cx, cy + float, T * .36, "212,166,106", .09 + breathe * .11);
		c.save();
		c.translate(cx, cy + T * .25);
		c.scale(1, .24);
		c.fillStyle = "rgba(14,12,8,.42)";
		c.beginPath();
		c.arc(0, 0, T * .19, 0, 7);
		c.fill();
		c.restore();
		c.save();
		c.translate(cx, cy + float);
		c.rotate(ang);
		const knobs = [
			[-LEN, -DY],
			[-LEN, DY],
			[LEN, -DY],
			[LEN, DY]
		];
		const shape = (w, r) => {
			c.lineCap = "round";
			c.lineWidth = w * 2;
			c.beginPath();
			c.moveTo(-LEN, 0);
			c.lineTo(LEN, 0);
			c.stroke();
			for (const [kx, ky] of knobs) {
				c.beginPath();
				c.arc(kx, ky, r, 0, 7);
				c.fill();
			}
		};
		c.strokeStyle = c.fillStyle = "rgba(28,20,8,.85)";
		shape(W + OUT, R + OUT);
		const g = c.createLinearGradient(0, -R - DY, 0, R + DY);
		g.addColorStop(0, "#f2e6c8");
		g.addColorStop(.42, "#d9b078");
		g.addColorStop(1, "#9c7442");
		c.strokeStyle = c.fillStyle = g;
		shape(W, R);
		c.strokeStyle = "rgba(120,88,48,.5)";
		c.lineWidth = Math.max(1, T * .02);
		for (const sx of [-1, 1]) {
			c.beginPath();
			c.moveTo(sx * LEN, -DY * .85);
			c.lineTo(sx * LEN, DY * .85);
			c.stroke();
		}
		c.strokeStyle = "rgba(255,248,228,.4)";
		c.lineWidth = Math.max(1, T * .022);
		c.beginPath();
		c.moveTo(-LEN * .72, -W * .45);
		c.lineTo(LEN * .72, -W * .45);
		c.stroke();
		c.fillStyle = "rgba(120,88,48,.3)";
		for (let i = 0; i < 3; i++) {
			const px = (nz(i * 17 + x * 3 + y) - .5) * LEN * 1.2;
			const py = (nz(i * 29 + x + y * 3) - .5) * W * .9;
			c.beginPath();
			c.arc(px, py, Math.max(.7, T * .012), 0, 7);
			c.fill();
		}
		c.restore();
		for (let i = 0; i < 3; i++) {
			const a = p * Math.PI * .8 + i / 3 * Math.PI * 2;
			const orb = T * (.3 + .025 * Math.sin(p * Math.PI * 4 + i));
			c.fillStyle = `rgba(226,196,138,${.22 + .42 * pingPong(p + i / 3)})`;
			c.beginPath();
			c.arc(cx + Math.cos(a) * orb, cy + float + Math.sin(a) * orb * .7, 1.5, 0, 7);
			c.fill();
		}
	} else if (s.type === "scroll") {
		const p = ats / 2e3 + seed;
		const breathe = .5 + .5 * Math.sin(p * Math.PI * 2);
		const sway = Math.sin(p * Math.PI * 2) * T * .015;
		const hw = T * .2, hh = T * .24;
		const yc = cy + sway;
		glow(c, cx, yc, T * .42, "214,180,90", .1 + breathe * .12);
		c.save();
		c.translate(cx, cy + T * .3);
		c.scale(1, .26);
		c.fillStyle = "rgba(18,14,8,.4)";
		c.beginPath();
		c.arc(0, 0, hw * 1.15, 0, 7);
		c.fill();
		c.restore();
		const pg = c.createLinearGradient(cx, yc - hh, cx, yc + hh);
		pg.addColorStop(0, "#e8dcac");
		pg.addColorStop(.55, "#d5c693");
		pg.addColorStop(1, "#bdac78");
		c.fillStyle = pg;
		c.strokeStyle = "rgba(94,78,44,.85)";
		c.lineWidth = 1.1;
		c.beginPath();
		c.roundRect(cx - hw, yc - hh, hw * 2, hh * 2, 2.5);
		c.fill();
		c.stroke();
		c.strokeStyle = "rgba(110,88,50,.42)";
		c.lineWidth = 1;
		[-.5, .52].forEach((k, i) => {
			const ly = yc + hh * k;
			const lw = hw * (i ? .48 : .64);
			c.beginPath();
			c.moveTo(cx - lw, ly);
			c.lineTo(cx + lw, ly);
			c.stroke();
		});
		[-1, 1].forEach((side) => {
			const ry = yc + side * hh;
			const rg = c.createLinearGradient(cx, ry - T * .05, cx, ry + T * .05);
			rg.addColorStop(0, "#ab9158");
			rg.addColorStop(.5, "#dcca90");
			rg.addColorStop(1, "#8a7340");
			c.fillStyle = rg;
			c.strokeStyle = "rgba(78,62,32,.9)";
			c.lineWidth = 1;
			c.beginPath();
			c.roundRect(cx - hw * 1.18, ry - T * .045, hw * 2.36, T * .09, T * .045);
			c.fill();
			c.stroke();
		});
		c.fillStyle = `rgba(92,58,24,${.7 + breathe * .3})`;
		c.font = `bold ${(T * .26).toFixed(1)}px Georgia, serif`;
		c.textAlign = "center";
		c.textBaseline = "middle";
		c.fillText("?", cx, yc);
		for (let i = 0; i < 3; i++) {
			const a = p * Math.PI + i / 3 * Math.PI * 2;
			const orb = T * (.3 + .03 * Math.sin(p * Math.PI * 4 + i));
			const sx = cx + Math.cos(a) * orb, sy = yc + Math.sin(a) * orb * .72;
			c.fillStyle = `rgba(244,216,142,${.25 + .45 * pingPong(p + i / 3)})`;
			c.beginPath();
			c.arc(sx, sy, 1.5, 0, 7);
			c.fill();
		}
	} else if (s.type === "colorzone") {
		const p = ats / 2200 + seed;
		c.fillStyle = "rgba(120,110,190,.26)";
		c.fillRect(x0, y0, T, T);
		c.save();
		c.translate(x0, y0);
		c.rotate(-Math.PI / 4);
		const step = T * .26;
		const shift = ats / 40 % step;
		c.fillStyle = "rgba(178,166,238,.16)";
		for (let i = -2; i < 8; i++) c.fillRect(-T, i * step + shift, T * 3, step * .42);
		c.restore();
		c.strokeStyle = "rgba(196,184,246,.62)";
		c.lineWidth = 1.6;
		const m = T * .14, L = T * .16;
		[
			[
				x0 + m,
				y0 + m,
				1,
				1
			],
			[
				x0 + T - m,
				y0 + m,
				-1,
				1
			],
			[
				x0 + m,
				y0 + T - m,
				1,
				-1
			],
			[
				x0 + T - m,
				y0 + T - m,
				-1,
				-1
			]
		].forEach(([px, py, sx, sy]) => {
			c.beginPath();
			c.moveTo(px + sx * L, py);
			c.lineTo(px, py);
			c.lineTo(px, py + sy * L);
			c.stroke();
		});
		c.fillStyle = `rgba(214,204,255,${.55 + .3 * (.5 + .5 * Math.sin(p * Math.PI * 2))})`;
		c.font = T * .42 + "px 'Segoe UI Symbol','Noto Sans Symbols 2',serif";
		c.textAlign = "center";
		c.textBaseline = "middle";
		c.fillText("♝", cx, cy + 1);
	} else if (s.type === "pillar") {
		c.fillStyle = "#5a5348";
		c.fillRect(x0 + 8, y0 + 8, T - 16, T - 16);
		c.strokeStyle = "#8a8070";
		c.lineWidth = 1;
		c.strokeRect(x0 + 8, y0 + 8, T - 16, T - 16);
	} else if (s.type === "millstone") {
		const jammed = s.jammed;
		c.fillStyle = jammed ? "rgba(90,80,70,.85)" : "rgba(190,90,50,.85)";
		c.beginPath();
		c.arc(cx, cy, T * .4, 0, 7);
		c.fill();
		c.strokeStyle = "#000";
		c.lineWidth = 1;
		c.stroke();
		if (!jammed) {
			const [dx, dy] = s.dir;
			c.fillStyle = "#ffd9a0";
			c.beginPath();
			c.moveTo(cx + dx * T * .3, cy + dy * T * .3);
			c.lineTo(cx - dy * 7, cy + dx * 7);
			c.lineTo(cx + dy * 7, cy - dx * 7);
			c.closePath();
			c.fill();
		}
	}
	c.restore();
}
function drawStatuses(x, y, unit) {
	if (!unit || !unit.status) return;
	const active = [
		"poison",
		"stun",
		"shield",
		"haste"
	].filter((k) => statusVal(unit, k) > 0);
	if (!active.length) return;
	const r = T * .11, y0 = y * T + T * .14;
	active.forEach((k, i) => {
		const cx = x * T + T * .16 + i * (r * 2 + 3), cy = y0;
		dom.ctx.beginPath();
		dom.ctx.arc(cx, cy, r, 0, 7);
		dom.ctx.fillStyle = STATUS_META[k].color;
		dom.ctx.fill();
		dom.ctx.strokeStyle = "rgba(0,0,0,.5)";
		dom.ctx.lineWidth = 1;
		dom.ctx.stroke();
		dom.ctx.fillStyle = "#12140f";
		dom.ctx.font = "bold " + r * 1.4 + "px system-ui,sans-serif";
		dom.ctx.textAlign = "center";
		dom.ctx.textBaseline = "middle";
		dom.ctx.fillText(String(statusVal(unit, k)), cx, cy + .5);
	});
}
function drawPiece(x, y, type, isPlayer, facing, improved, opts) {
	opts = opts || {};
	const cx = x * T + T / 2, cy = y * T + T / 2;
	const dir = facing || opts && opts.lastDir;
	if (drawSprite(dom.ctx, type, x, y, T, {
		dir,
		tint: isPlayer ? null : opts.mimic ? "#b46edc" : "#d07a3f"
	})) {
		if (improved) {
			dom.ctx.fillStyle = "#c9a227";
			dom.ctx.font = "12px serif";
			dom.ctx.fillText("★", cx + T * .3, cy - T * .3);
		}
		return;
	}
	const glyph = GLYPH[type] || "?";
	dom.ctx.save();
	if (opts.armor > 1) {
		dom.ctx.strokeStyle = "rgba(120,180,255,.9)";
		dom.ctx.lineWidth = 2;
		dom.ctx.beginPath();
		dom.ctx.arc(cx, cy, T * .4, 0, 7);
		dom.ctx.stroke();
		dom.ctx.strokeStyle = "rgba(120,180,255,.5)";
		dom.ctx.beginPath();
		dom.ctx.arc(cx, cy, T * .33, 0, 7);
		dom.ctx.stroke();
	}
	dom.ctx.shadowColor = "rgba(0,0,0,.6)";
	dom.ctx.shadowBlur = 6;
	dom.ctx.shadowOffsetY = 2;
	dom.ctx.font = T * .68 + "px 'Segoe UI Symbol','Noto Sans Symbols 2',serif";
	dom.ctx.textAlign = "center";
	dom.ctx.textBaseline = "middle";
	dom.ctx.fillStyle = isPlayer ? "#f2e9d8" : opts.mimic ? "#2a2030" : "#22242b";
	dom.ctx.fillText(glyph, cx, cy + 2);
	dom.ctx.shadowBlur = 0;
	dom.ctx.shadowOffsetY = 0;
	dom.ctx.lineWidth = 1.4;
	dom.ctx.strokeStyle = isPlayer ? "rgba(88,179,164,.95)" : opts.mimic ? "rgba(180,110,220,.95)" : opts.tint ? opts.tint : "rgba(208,122,63,.95)";
	dom.ctx.strokeText(glyph, cx, cy + 2);
	if (type === "pawn" && facing) {
		const [fx, fy] = facing;
		dom.ctx.fillStyle = isPlayer ? "#58b3a4" : opts.mimic ? "#b46edc" : "#d07a3f";
		dom.ctx.beginPath();
		const ax = cx + fx * T * .36, ay = cy + fy * T * .36;
		dom.ctx.moveTo(ax + fy * 5 - fx * 3, ay + fx * 5 - fy * 3);
		dom.ctx.lineTo(ax - fy * 5 - fx * 3, ay - fx * 5 - fy * 3);
		dom.ctx.lineTo(ax + fx * 6, ay + fy * 6);
		dom.ctx.closePath();
		dom.ctx.fill();
	}
	if (improved) {
		dom.ctx.fillStyle = "#c9a227";
		dom.ctx.font = "12px serif";
		dom.ctx.fillText("★", cx + T * .3, cy - T * .3);
	}
	dom.ctx.restore();
}
/**
* Немедленный полный перерендер.
* @param {number} ts — timestamp от rAF (для будущих анимаций)
*/
/** Анимация бездны: чёрный фон и мерцающие пиксельные звёзды за пределами карты. */
function drawAbyss(ts) {
	const c = dom.ctx;
	c.save();
	c.translate(-camera.x * T, -camera.y * T);
	c.fillStyle = "#050608";
	c.fillRect(camera.x * T - 4, camera.y * T - 4, (CFG.VIEW_W + 2) * T + 8, (CFG.VIEW_H + 2) * T + 8);
	const t = (ts || 0) / 1e3;
	const starColors = [
		"#c9a227",
		"#58b3a4",
		"#f2e9d8"
	];
	const sx0 = Math.floor(camera.x) - 1;
	const sy0 = Math.floor(camera.y) - 1;
	const sx1 = Math.ceil(camera.x + CFG.VIEW_W) + 1;
	const sy1 = Math.ceil(camera.y + CFG.VIEW_H) + 1;
	for (let gy = sy0; gy <= sy1; gy++) for (let gx = sx0; gx <= sx1; gx++) {
		if (gx >= 0 && gx < CFG.W && gy >= 0 && gy < CFG.H) continue;
		const seed = nz(gx * 13 + gy * 7);
		const seed2 = nz(gx * gy * 31);
		for (let si = 0; si < 3; si++) {
			const phase = nz(gx * 47 + gy * 19 + si * 83);
			const flicker = .5 + .5 * Math.sin(t * (1.4 + seed * 3.2) + phase * 12.6);
			const baseAlpha = .18 + seed2 * .42;
			const a = Math.max(0, Math.min(.78, baseAlpha * (.3 + flicker * .7)));
			const starSize = 1 + Math.floor(phase * 2.5);
			if (a > .02) {
				c.fillStyle = starColors[Math.floor(phase * 3)];
				c.globalAlpha = a;
				c.fillRect(gx * T + seed * T * .85 + si * T * .25, gy * T + seed2 * T * .85 + si * T * .18, starSize, starSize);
			}
		}
	}
	c.globalAlpha = 1;
	c.restore();
}
function renderNow(ts) {
	centerCamera();
	dom.ctx.save();
	drawAbyss(ts);
	dom.ctx.translate(-camera.x * T, -camera.y * T);
	dom.ctx.clearRect(0, 0, CFG.W * T, CFG.H * T);
	const insp = S$1.hoverEnemy || S$1.selectedEnemy;
	const threats = cachedThreats(insp);
	const bLight = S$1.biome && S$1.biome.light || "#a2937c", bDark = S$1.biome && S$1.biome.dark || "#4b433c";
	const camX0 = Math.floor(camera.x);
	const camY0 = Math.floor(camera.y);
	const camX1 = Math.min(CFG.W, camX0 + CFG.VIEW_W + 2);
	const camY1 = Math.min(CFG.H, camY0 + CFG.VIEW_H + 2);
	const blind = S$1.challenge === "blind_descent";
	for (let y = Math.max(0, camY0 - 1); y < camY1; y++) for (let x = Math.max(0, camX0 - 1); x < camX1; x++) {
		if (blind && Math.max(Math.abs(x - S$1.player.x), Math.abs(y - S$1.player.y)) > 2) {
			dom.ctx.fillStyle = "#0a0c10";
			dom.ctx.fillRect(x * T, y * T, T, T);
		} else if (S$1.walls.has(key(x, y))) {
			const m = wallMask(x, y, (ax, ay) => S$1.walls.has(key(ax, ay)));
			drawWall(dom.ctx, x, y, T, m, { biome: S$1.biome && S$1.biome.id });
		} else {
			const col = tileColor(x, y) === 0 ? bLight : bDark;
			dom.ctx.drawImage(floorTile(col, x, y, T), x * T, y * T, T, T);
		}
		if (!blind || Math.max(Math.abs(x - S$1.player.x), Math.abs(y - S$1.player.y)) <= 2) {
			if (y === 0 && !S$1.walls.has(key(x, y))) {
				const pp = (ts || 0) / 900;
				const pa = S$1.promotionUsed ? .05 : .18 + Math.sin(pp * Math.PI * 2) * .1;
				dom.ctx.fillStyle = `rgba(201,162,39,${pa})`;
				dom.ctx.fillRect(x * T, y * T, T, T);
				dom.ctx.strokeStyle = `rgba(201,162,39,${pa + .2})`;
				dom.ctx.lineWidth = 2;
				dom.ctx.strokeRect(x * T + 2, y * T + 2, T - 4, T - 4);
			}
		}
	}
	for (const k of threats) {
		if (S$1.special && S$1.special.get(k) && S$1.special.get(k).type === "fog") continue;
		const [x, y] = k.split(",").map(Number);
		hatch(x, y, "#b3423a", ts, 1);
	}
	const pv = pendingMove() || previewCell();
	if (pv && !S$1.gameOver && !S$1.modalOpen) {
		const base = insp ? allThreats() : threats;
		for (const k of threatsAfterMove(pv.x, pv.y)) {
			if (base.has(k)) continue;
			if (S$1.special && S$1.special.get(k) && S$1.special.get(k).type === "fog") continue;
			const [x, y] = k.split(",").map(Number);
			hatch(x, y, "#e0a03a", ts, -1);
		}
	}
	if (S$1.special) S$1.special.forEach((s, k) => {
		const [x, y] = k.split(",").map(Number);
		if (S$1.challenge === "blind_descent" && Math.max(Math.abs(x - S$1.player.x), Math.abs(y - S$1.player.y)) > 2) return;
		const sprite = specialSprite(s, x, y, T, ts);
		if (sprite) dom.ctx.drawImage(sprite, x * T, y * T, T, T);
		else drawSpecial(x, y, s, ts);
	});
	if (insp) {
		dom.ctx.strokeStyle = "#d07a3f";
		dom.ctx.lineWidth = 2.5;
		dom.ctx.strokeRect(insp.x * T + 2, insp.y * T + 2, T - 4, T - 4);
	}
	if (!S$1.gameOver && !S$1.modalOpen) {
		const { moves, captures } = playerOptions();
		const cx = (c) => c.x * T + T / 2;
		const cy = (c) => c.y * T + T / 2;
		const FILL = [
			"rgba(88,179,164,.85)",
			"rgba(224,160,58,.92)",
			"rgba(179,66,58,.95)"
		];
		for (const m of moves) {
			const r = riskOf(m.x, m.y);
			dom.ctx.fillStyle = FILL[r];
			dom.ctx.beginPath();
			dom.ctx.arc(cx(m), cy(m), r === RISK.SAFE ? 6 : 7, 0, 7);
			dom.ctx.fill();
			if (r === RISK.FATAL) {
				dom.ctx.strokeStyle = "rgba(16,10,10,.9)";
				dom.ctx.lineWidth = 2;
				dom.ctx.beginPath();
				dom.ctx.moveTo(cx(m) - 4, cy(m) - 4);
				dom.ctx.lineTo(cx(m) + 4, cy(m) + 4);
				dom.ctx.stroke();
			}
		}
		dom.ctx.lineWidth = 3;
		for (const c of captures) {
			dom.ctx.strokeStyle = riskOf(c.x, c.y) === RISK.SAFE ? "rgba(110,200,140,.95)" : "rgba(208,90,60,.95)";
			dom.ctx.beginPath();
			dom.ctx.arc(cx(c), cy(c), T * .36, 0, 7);
			dom.ctx.stroke();
		}
		const pm = pendingMove();
		if (pm) {
			const ph = .5 + .5 * Math.sin((ts || 0) / 520 * Math.PI * 2);
			dom.ctx.strokeStyle = `rgba(242,233,216,${.5 + ph * .5})`;
			dom.ctx.lineWidth = 2.5;
			dom.ctx.setLineDash([5, 4]);
			dom.ctx.strokeRect(pm.x * T + 3, pm.y * T + 3, T - 6, T - 6);
			dom.ctx.setLineDash([]);
		}
		for (const c of tutorialTargets()) {
			const ph = .5 + .5 * Math.sin((ts || 0) / 700 * Math.PI * 2);
			dom.ctx.strokeStyle = `rgba(201,162,39,${.55 + ph * .45})`;
			dom.ctx.lineWidth = 3;
			dom.ctx.beginPath();
			dom.ctx.arc(c.x * T + T / 2, c.y * T + T / 2, T * .4 - ph * 2, 0, 7);
			dom.ctx.stroke();
		}
	}
	for (const e of S$1.enemies) {
		if (S$1.challenge === "blind_descent" && Math.max(Math.abs(e.x - S$1.player.x), Math.abs(e.y - S$1.player.y)) > 2) continue;
		const ep = getAnimPos(e, e.x, e.y, ts);
		const ex = ep.x, ey = ep.y;
		if (e.type === "mimic") {
			const t = (S$1.player.wheel[S$1.player.active] || { type: "pawn" }).type;
			drawPiece(ex, ey, t, false, t === "pawn" ? e.facing : null, false, { mimic: true });
		} else {
			const tint = e.type === "assassin" ? "#6cbf5a" : e.type === "priest" ? "#5bb6d6" : e.type === "frost" ? "#8fd0e6" : null;
			drawPiece(ex, ey, e.type, false, e.type === "pawn" ? e.facing : null, false, {
				armor: e.armor,
				tint,
				lastDir: e.lastDir
			});
		}
		drawStatuses(ex, ey, e);
	}
	const f = activeForm();
	const pp = getAnimPos(S$1.player, S$1.player.x, S$1.player.y, ts);
	drawModifierAura(pp.x, pp.y, ts);
	drawPiece(pp.x, pp.y, f.type, true, f.type === "pawn" ? S$1.player.facing : null, f.improved, { lastDir: S$1.player.lastDir });
	drawStatuses(pp.x, pp.y, S$1.player);
	drawModifierCounters(pp.x, pp.y, ts);
	drawSpeech(ts);
	if (captureFlash) {
		if (captureFlash.startTs === null) captureFlash.startTs = ts;
		const fe = (ts || 0) - captureFlash.startTs;
		if (fe >= 280) captureFlash = null;
		else {
			const fa = 1 - fe / 280;
			const fr = 10 + fe * .5;
			dom.ctx.strokeStyle = `rgba(255,245,157,${fa})`;
			dom.ctx.lineWidth = 3;
			dom.ctx.beginPath();
			dom.ctx.arc(captureFlash.x * T + T / 2, captureFlash.y * T + T / 2, fr, 0, 7);
			dom.ctx.stroke();
		}
	}
	if (particles.length > 0) {
		const dt = 16.67;
		particles = particles.filter((p) => {
			p.x += p.vx;
			p.y += p.vy;
			p.life -= dt;
			if (p.life <= 0) return false;
			const alpha = Math.min(p.life / p.maxLife, 1);
			dom.ctx.fillStyle = p.color;
			dom.ctx.globalAlpha = alpha;
			dom.ctx.beginPath();
			dom.ctx.arc(p.x, p.y, p.size, 0, 7);
			dom.ctx.fill();
			dom.ctx.globalAlpha = 1;
			return true;
		});
	}
	if (screenOverlay.alpha > 0 && ts) {
		if (screenOverlay.startTs === null) screenOverlay.startTs = ts;
		const fe = ts - screenOverlay.startTs;
		if (fe >= screenOverlay.durationMs) screenOverlay.alpha = 0;
		else screenOverlay.alpha = 1 - fe / screenOverlay.durationMs;
		if (screenOverlay.alpha > 0) {
			dom.ctx.fillStyle = screenOverlay.color;
			dom.ctx.globalAlpha = screenOverlay.alpha;
			dom.ctx.fillRect(0, 0, CFG.W * T, CFG.H * T);
			dom.ctx.globalAlpha = 1;
		}
	}
	var _tt = {};
	[
		"trap",
		"portal",
		"rune",
		"ice",
		"lava",
		"fog",
		"conveyor",
		"gate",
		"millstone",
		"plate",
		"colorzone",
		"door",
		"key",
		"food",
		"scroll"
	].forEach(function(t) {
		_tt[t] = L("tooltip." + t);
	});
	const TOOLTIPS = _tt;
	const cellTooltipLabel = (sp) => {
		const base = TOOLTIPS[sp.type] || sp.type;
		if (sp.type === "door" && sp.doorId != null) return `Дверь #${sp.doorId}`;
		if (sp.type === "key" && sp.color) return `Ключ ${sp.color}`;
		return base;
	};
	const drawTooltip = (label, tx, ty, color) => {
		dom.ctx.font = "11px Georgia, serif";
		dom.ctx.textAlign = "center";
		const w = dom.ctx.measureText(label).width + 10;
		dom.ctx.fillStyle = "rgba(0,0,0,.8)";
		dom.ctx.beginPath();
		dom.ctx.roundRect(tx - w / 2, ty - 16, w, 15, 4);
		dom.ctx.fill();
		dom.ctx.fillStyle = color;
		dom.ctx.fillText(label, tx, ty - 5);
		return ty - 18;
	};
	let tipY = -4;
	if (insp) {
		const tx = insp.x * T + T / 2;
		tipY = insp.y * T + tipY;
		let label = `${GLYPH[insp.type]} ${NAME[insp.type]}`;
		if (insp.armor > 1) label += ` · броня ${insp.armor}`;
		if (insp.status) {
			const st = [];
			if (insp.status.poison > 0) st.push(`яд(${insp.status.poison})`);
			if (insp.status.stun > 0) st.push(`оглуш.(${insp.status.stun})`);
			if (insp.status.shield > 0) st.push(`щит(${insp.status.shield})`);
			if (insp.status.haste > 0) st.push(`уск.(${insp.status.haste})`);
			if (st.length) label += " · " + st.join(" ");
		}
		tipY = drawTooltip(label, tx, tipY, "#d07a3f");
		const sp = S$1.special && S$1.special.get(key(insp.x, insp.y));
		if (sp) drawTooltip(cellTooltipLabel(sp), tx, tipY, "#f2e9d8");
	} else if (S$1.challenge !== "blind_descent" && S$1.hoveredCell && S$1.special) {
		const sp = S$1.special.get(key(S$1.hoveredCell.x, S$1.hoveredCell.y));
		if (sp) {
			const tx = S$1.hoveredCell.x * T + T / 2;
			const ty = S$1.hoveredCell.y * T + tipY;
			drawTooltip(cellTooltipLabel(sp), tx, ty, "#f2e9d8");
		}
	}
	dom.ctx.strokeStyle = "rgba(20,22,28,.35)";
	dom.ctx.lineWidth = 1;
	for (let x = 0; x <= CFG.W; x++) {
		dom.ctx.beginPath();
		dom.ctx.moveTo(x * T, 0);
		dom.ctx.lineTo(x * T, CFG.H * T);
		dom.ctx.stroke();
	}
	for (let y = 0; y <= CFG.H; y++) {
		dom.ctx.beginPath();
		dom.ctx.moveTo(0, y * T);
		dom.ctx.lineTo(CFG.W * T, y * T);
		dom.ctx.stroke();
	}
	dom.ctx.restore();
	if (S$1.player && S$1.player.hunger !== void 0) {
		const hr = S$1.player.hunger / CFG.HUNGER.start;
		if (hr < .4) {
			const alpha = 1 - hr;
			const c = dom.ctx;
			const vw = CFG.VIEW_W * T, vh = CFG.VIEW_H * T;
			const cx = vw / 2, cy = vh / 2;
			const r = Math.max(vw, vh) * .72;
			const g = c.createRadialGradient(cx, cy, r * .35, cx, cy, r);
			g.addColorStop(0, "rgba(0,0,0,0)");
			g.addColorStop(.55, `rgba(0,0,0,${alpha * .35})`);
			g.addColorStop(1, `rgba(0,0,0,${alpha * .85})`);
			c.fillStyle = g;
			c.fillRect(0, 0, vw, vh);
		}
	}
	const promoPhase = (ts || 0) / 900;
	const promoAlpha = S$1.promotionUsed ? .05 : .18 + Math.sin(promoPhase * Math.PI * 2) * .1;
	const glowAlpha = S$1.promotionUsed ? .1 : .4 + Math.sin(promoPhase * Math.PI * 2) * .2;
	dom.ctx.fillStyle = `rgba(201,162,39,${promoAlpha})`;
	dom.ctx.strokeStyle = `rgba(201,162,39,${glowAlpha})`;
	dom.ctx.lineWidth = 4;
	dom.ctx.beginPath();
	dom.ctx.moveTo(0, 0);
	dom.ctx.lineTo(CFG.VIEW_W * T, 0);
	dom.ctx.stroke();
}
/**
* Совместимый вызов — запрашивает перерисовку через rAF.
* Все существующие вызовы render() продолжают работать.
*/
var render = requestRender;
onSpriteLoad(requestRender);
initAtlas({
	drawSpecial,
	dom
});
//#endregion
//#region src/audio.js
/**
* src/audio.js — синтезированные звуки через Web Audio API (OscillatorNode + GainNode).
* Без внешних аудиофайлов: move, capture, death, trap, portal, rune, promotion, loot.
* Ленивая инициализация AudioContext при первом касании.
*/
/**
* Web Audio API — синтезированные звуки без внешних файлов.
*
* Принципы (почему звучит мягче прежнего):
*  • у каждого голоса своя ADSR-огибающая — нет щелчков на старте/остановке;
*  • «сырые» square/saw пропущены через фильтры — убрана резкость верхов;
*  • перкуссия строится на шумовом транзиенте + тональном теле, как у реальных ударов;
*  • секвенции планируются по аудио-часам (не setTimeout) — точный ритм без джиттера;
*  • общий лимитер не даёт клиппинга при наложении звуков.
*/
var ctx$1 = null;
var master$1 = null;
var limiter = null;
var noiseBuffer = null;
var muted = false;
var volume$1 = .3;
function buildGraph() {
	master$1 = ctx$1.createGain();
	master$1.gain.value = muted ? 0 : volume$1;
	limiter = ctx$1.createDynamicsCompressor();
	limiter.threshold.value = -10;
	limiter.knee.value = 12;
	limiter.ratio.value = 6;
	limiter.attack.value = .003;
	limiter.release.value = .15;
	master$1.connect(limiter);
	limiter.connect(ctx$1.destination);
	noiseBuffer = ctx$1.createBuffer(1, ctx$1.sampleRate, ctx$1.sampleRate);
	const d = noiseBuffer.getChannelData(0);
	for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
/** Вернуть общий AudioContext — для передачи в music.js (один контекст на всё). */
function getAudioContext() {
	return ctx$1;
}
function ensureCtx() {
	if (!CFG.SFX_ENABLED) return null;
	if (ctx$1) return ctx$1;
	try {
		ctx$1 = new AudioContext();
		buildGraph();
	} catch {}
	return ctx$1;
}
/** Инициализировать AudioContext при первом взаимодействии (требование браузеров). */
function initAudio() {
	ensureCtx();
	if (ctx$1 && ctx$1.state === "suspended") ctx$1.resume();
}
var MIN = 1e-4;
/** Гейн с ADSR-огибающей: быстрая атака, экспоненциальный спад. */
function envGain(t0, dur, peak, attack = .004) {
	const g = ctx$1.createGain();
	const p = Math.max(peak, MIN * 2);
	g.gain.setValueAtTime(MIN, t0);
	g.gain.exponentialRampToValueAtTime(p, t0 + attack);
	g.gain.exponentialRampToValueAtTime(MIN, t0 + Math.max(dur, attack + .01));
	return g;
}
/** Тональный голос с опциональным глиссандо и фильтром. */
function voice(opts) {
	const { type = "sine", f0, f1 = null, t0, dur, vol = .2, attack = .004, detune = 0, filter = null, curve = "exp" } = opts;
	const g = envGain(t0, dur, vol, attack);
	const osc = ctx$1.createOscillator();
	osc.type = type;
	if (detune) osc.detune.setValueAtTime(detune, t0);
	osc.frequency.setValueAtTime(f0, t0);
	if (f1 != null && f1 !== f0) if (curve === "lin") osc.frequency.linearRampToValueAtTime(f1, t0 + dur);
	else osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);
	let node = osc;
	if (filter) {
		const flt = ctx$1.createBiquadFilter();
		flt.type = filter.type || "lowpass";
		flt.frequency.setValueAtTime(filter.freq, t0);
		if (filter.freqEnd != null) flt.frequency.exponentialRampToValueAtTime(Math.max(filter.freqEnd, 1), t0 + dur);
		if (filter.Q != null) flt.Q.value = filter.Q;
		node.connect(flt);
		node = flt;
	}
	node.connect(g);
	g.connect(master$1);
	osc.start(t0);
	osc.stop(t0 + dur + .02);
	osc.onended = () => g.disconnect();
	return osc;
}
/** Шумовой транзиент — «тело» удара, стука, лязга. */
function noise(opts) {
	const { t0, dur, vol = .2, attack = .001, filter = null } = opts;
	const g = envGain(t0, dur, vol, attack);
	const src = ctx$1.createBufferSource();
	src.buffer = noiseBuffer;
	src.loop = true;
	let node = src;
	if (filter) {
		const flt = ctx$1.createBiquadFilter();
		flt.type = filter.type || "bandpass";
		flt.frequency.setValueAtTime(filter.freq, t0);
		if (filter.freqEnd != null) flt.frequency.exponentialRampToValueAtTime(Math.max(filter.freqEnd, 1), t0 + dur);
		if (filter.Q != null) flt.Q.value = filter.Q;
		node.connect(flt);
		node = flt;
	}
	node.connect(g);
	g.connect(master$1);
	src.start(t0);
	src.stop(t0 + dur + .02);
	src.onended = () => g.disconnect();
	return src;
}
/**
* Колокольный голос: набор НЕгармоничных обертонов — именно они дают
* «металлический звон», а не пилу. Верхние партиалы тише и гаснут быстрее.
*/
function bell(f0, t0, dur, vol, partials = [
	1,
	2.01,
	2.98,
	4.16,
	5.43
]) {
	partials.forEach((p, i) => {
		const k = 1 / (i + 1.6);
		voice({
			type: "sine",
			f0: f0 * p,
			t0,
			dur: dur * (1 - i * .13),
			vol: vol * k,
			attack: .002
		});
	});
}
/** Стук фигуры о доску: короткий деревянный щелчок + низкое тело. */
function playMove() {
	const c = ensureCtx();
	if (!c) return;
	const t = c.currentTime;
	noise({
		t0: t,
		dur: .028,
		vol: .16,
		filter: {
			type: "bandpass",
			freq: 1900,
			Q: 1.4
		}
	});
	voice({
		type: "sine",
		f0: 240,
		f1: 130,
		t0: t,
		dur: .07,
		vol: .2
	});
	voice({
		type: "triangle",
		f0: 480,
		f1: 300,
		t0: t,
		dur: .035,
		vol: .07,
		filter: {
			type: "lowpass",
			freq: 2600
		}
	});
}
/** Взятие: тяжелее и ниже хода — глухой удар с коротким «хрустом». */
function playCapture() {
	const c = ensureCtx();
	if (!c) return;
	const t = c.currentTime;
	noise({
		t0: t,
		dur: .07,
		vol: .22,
		filter: {
			type: "lowpass",
			freq: 1400,
			freqEnd: 400,
			Q: .7
		}
	});
	voice({
		type: "sine",
		f0: 170,
		f1: 52,
		t0: t,
		dur: .18,
		vol: .32
	});
	voice({
		type: "triangle",
		f0: 320,
		f1: 110,
		t0: t,
		dur: .09,
		vol: .12,
		filter: {
			type: "lowpass",
			freq: 1800
		}
	});
}
/** Смерть: медленное падение с тёмным фильтром — длинно и мрачно. */
function playDeath() {
	const c = ensureCtx();
	if (!c) return;
	const t = c.currentTime;
	voice({
		type: "sawtooth",
		f0: 175,
		f1: 44,
		t0: t,
		dur: 1.1,
		vol: .16,
		attack: .02,
		filter: {
			type: "lowpass",
			freq: 900,
			freqEnd: 160,
			Q: 3
		}
	});
	voice({
		type: "sawtooth",
		f0: 174,
		f1: 43.6,
		t0: t,
		dur: 1.1,
		vol: .1,
		attack: .02,
		detune: -9,
		filter: {
			type: "lowpass",
			freq: 700,
			freqEnd: 140,
			Q: 3
		}
	});
	noise({
		t0: t,
		dur: .9,
		vol: .05,
		attack: .05,
		filter: {
			type: "lowpass",
			freq: 500,
			freqEnd: 120
		}
	});
}
/** Ловушка: металлический лязг — негармоничные партиалы + резкий транзиент. */
function playTrap() {
	const c = ensureCtx();
	if (!c) return;
	const t = c.currentTime;
	noise({
		t0: t,
		dur: .02,
		vol: .18,
		filter: {
			type: "highpass",
			freq: 3e3
		}
	});
	[
		1,
		1.47,
		2.09,
		2.71,
		3.62
	].forEach((p, i) => {
		voice({
			type: "sine",
			f0: 1050 * p,
			t0: t,
			dur: .32 - i * .045,
			vol: .13 / (i + 1.3),
			attack: .001
		});
	});
	voice({
		type: "triangle",
		f0: 520,
		f1: 240,
		t0: t,
		dur: .1,
		vol: .1,
		filter: {
			type: "lowpass",
			freq: 2200
		}
	});
}
/** Портал: восходящий свист + вихрь шума. */
function playPortal() {
	const c = ensureCtx();
	if (!c) return;
	const t = c.currentTime;
	voice({
		type: "sine",
		f0: 300,
		f1: 1500,
		t0: t,
		dur: .45,
		vol: .16,
		attack: .03
	});
	voice({
		type: "sine",
		f0: 302,
		f1: 1508,
		t0: t,
		dur: .45,
		vol: .1,
		attack: .03,
		detune: 7
	});
	noise({
		t0: t,
		dur: .5,
		vol: .09,
		attack: .08,
		filter: {
			type: "bandpass",
			freq: 500,
			freqEnd: 3200,
			Q: 2.5
		}
	});
}
/** Руна: чистый колокольчик с длинным хвостом. */
function playRune() {
	const c = ensureCtx();
	if (!c) return;
	const t = c.currentTime;
	bell(880, t, 1, .17);
	bell(1320, t + .07, .7, .09);
}
/** Промоушен: короткая фанфара C-E-G-C с колокольным финалом. */
function playPromotion() {
	const c = ensureCtx();
	if (!c) return;
	const t = c.currentTime;
	[
		[523.25, 0],
		[659.25, .09],
		[783.99, .18]
	].forEach(([f, off]) => {
		voice({
			type: "triangle",
			f0: f,
			t0: t + off,
			dur: .16,
			vol: .2,
			attack: .006,
			filter: {
				type: "lowpass",
				freq: 3200
			}
		});
		voice({
			type: "square",
			f0: f,
			t0: t + off,
			dur: .14,
			vol: .05,
			attack: .006,
			filter: {
				type: "lowpass",
				freq: 1800
			}
		});
	});
	bell(1046.5, t + .3, 1.1, .16);
	bell(1567.98, t + .3, .8, .06);
}
/** Лут: приятное двухнотное «дзынь». */
function playLoot() {
	const c = ensureCtx();
	if (!c) return;
	const t = c.currentTime;
	bell(1174.66, t, .42, .13);
	bell(1567.98, t + .075, .55, .12);
}
//#endregion
//#region src/enemies.js
function handleBossCapture(by) {
	if (!by) {
		degradePlayer(null);
		if (S$1.gameOver) {
			render();
			syncUI();
		}
		return;
	}
	degradePlayer(by);
	if (S$1.gameOver) {
		render();
		syncUI();
	}
}
function enemiesTurn() {
	if (isTutorial()) return;
	const turns = 1 + (S$1.challenge === "storm" ? 1 : 0);
	for (let t = 0; t < turns; t++) {
		if (t > 0 && S$1.gameOver) break;
		_enemiesTurnOnce();
	}
}
function _enemiesTurnOnce() {
	dispatchBossEvents(bossTurn(), {
		log: (t) => log(t),
		addSpeech: (x, y, t, kind) => addSpeech(x, y, t, kind),
		onCapture: (by) => handleBossCapture(by),
		onCrush: () => {
			degradePlayer(null);
			if (S$1.gameOver) {
				render();
				syncUI();
			}
		}
	});
	if (S$1.gameOver) return;
	for (const e of [...S$1.enemies]) {
		if (!S$1.enemies.includes(e)) continue;
		if (isBossEntity(e)) continue;
		if (statusVal(e, "poison") > 0) {
			e.status.poison--;
			if (e.status.poison <= 0) {
				S$1.enemies = S$1.enemies.filter((v) => v !== e);
				spawnParticles(e.x, e.y, "#d07a3f", 6);
				playDeath();
				recordKill(e.type, true);
				log(isEnglish() ? "dies from poison" : "гибнет от яда");
				continue;
			}
		}
		if (statusVal(e, "stun") > 0) {
			e.status.stun--;
			if (e.status.haste > 0) e.status.haste--;
			continue;
		}
		if (e.cd > 0) {
			e.cd--;
			if (e.status && e.status.haste > 0) e.status.haste--;
			continue;
		}
		if (e.type === "necro") {
			necroTurn(e);
			continue;
		}
		if (e.type === "frost") {
			frostTurn(e);
			continue;
		}
		if (e.type === "priest") priestPulse(e);
		const ef = effectiveForm(e);
		if (ef.type === "pawn") {
			const dx = S$1.player.x - e.x, dy = S$1.player.y - e.y;
			let fx = Math.sign(dx) || 0, fy = Math.sign(dy) || 0;
			if (fx === 0 && fy === 0 || !inB$1(e.x + fx, e.y + fy) || S$1.walls.has(key(e.x + fx, e.y + fy))) {
				const fallback = ORTHO.filter(([ox, oy]) => inB$1(e.x + ox, e.y + oy) && !S$1.walls.has(key(e.x + ox, e.y + oy)));
				if (fallback.length) {
					const [nx, ny] = fallback[Math.floor(Math.random() * fallback.length)];
					fx = nx;
					fy = ny;
				}
			}
			e.facing = Math.abs(fx) >= Math.abs(fy) ? [fx, 0] : [0, fy];
		}
		const opts = genMoves(e, ef, (x, y) => S$1.player.x === x && S$1.player.y === y, (x, y) => {
			if (S$1.player.x === x && S$1.player.y === y) return true;
			if (S$1.walls.has(key(x, y))) return true;
			const oe = enemyAt(x, y);
			if (oe && oe !== e) return true;
			const sp = S$1.special.get(key(x, y));
			if (sp && sp.type === "colorzone" && ef.type !== "bishop") return true;
			if (sp && sp.type === "gate") {
				const backX = x - sp.dir[0], backY = y - sp.dir[1];
				if (!(backX === e.x && backY === e.y)) return true;
			}
			return false;
		});
		if (opts.captures.length) {
			e.cd = CFG.ENEMY_CAPTURE_CD;
			if (e.noAttackCd) e.attackReady = false;
			if (e.type === "assassin") applyStatus(S$1.player, "poison", 2);
			checkCellForEnemy(e);
			degradePlayer(e);
			if (S$1.gameOver) {
				render();
				syncUI();
				return;
			}
			continue;
		}
		const bestMove = opts.moves.reduce((a, b) => {
			const spA = S$1.special.get(key(a.x, a.y));
			const spB = S$1.special.get(key(b.x, b.y));
			const penaltyA = spA && (spA.type === "trap" || spA.type === "lava") ? 3 : 0;
			const penaltyB = spB && (spB.type === "trap" || spB.type === "lava") ? 3 : 0;
			return cheb(b, S$1.player) + penaltyB < cheb(a, S$1.player) + penaltyA ? b : a;
		}, opts.moves[0]);
		if (bestMove) {
			if (enemyAt(bestMove.x, bestMove.y)) continue;
			startMoveAnim(e, e.x, e.y, bestMove.x, bestMove.y);
			e.x = bestMove.x;
			e.y = bestMove.y;
			checkCellForEnemy(e);
		}
		if (Math.random() < .08 && !isBossEntity(e)) {
			const act = actForFloor(S$1.floor);
			const line = pickLine(getScript().enemyLines[e.type] && getScript().enemyLines[e.type][act] || []);
			if (line) addSpeech(e.x, e.y, line, "enemy");
		}
		if (e.status && e.status.haste > 0) e.status.haste--;
	}
	afterEnemies();
}
function checkCellForEnemy(e) {
	const k = key(e.x, e.y);
	const sp = S$1.special.get(k);
	if (!sp) return;
	if (sp.type === "trap" || sp.type === "lava") {
		S$1.enemies = S$1.enemies.filter((v) => v !== e);
		if (sp.type === "trap") S$1.special.delete(k);
		recordKill(e.type, false);
		if (sp.type === "trap") unlockAch("web_master");
		if (sp.type === "lava") unlockAch("arsonist");
		spawnParticles(e.x, e.y, "#c23b30", 4);
		playDeath();
		log(isEnglish() ? "Enemy slain" : "Враг погиб");
	}
}
function necroTurn(e) {
	if (e.spawnCd > 0) {
		e.spawnCd--;
		return;
	}
	if (S$1.enemies.filter((o) => o.fromNecro).length >= 2 || S$1.enemies.length >= CFG.DIFF.enemyCap) {
		e.spawnCd = necroInterval();
		return;
	}
	const spots = [];
	for (const [dx, dy] of [...ORTHO, ...DIAG]) {
		const x = e.x + dx, y = e.y + dy;
		if (inB$1(x, y) && !S$1.walls.has(key(x, y)) && !enemyAt(x, y) && !(S$1.player.x === x && S$1.player.y === y)) spots.push({
			x,
			y
		});
	}
	if (spots.length) {
		const c = spots[Math.floor(Math.random() * spots.length)];
		S$1.enemies.push({
			type: "pawn",
			x: c.x,
			y: c.y,
			facing: [Math.sign(S$1.player.x - c.x) || 0, Math.sign(S$1.player.y - c.y) || 1],
			cd: 0,
			status: {},
			homeColor: tileColor(c.x, c.y),
			r: 1,
			rb: 0,
			fromNecro: true
		});
		e.spawnCd = necroInterval();
	}
}
function frostTurn(e) {
	if (e.frostCd > 0) {
		e.frostCd--;
		return;
	}
	if (cheb(S$1.player, e) <= CFG.DIFF.frostRange) {
		applyStatus(S$1.player, "stun", 1);
		e.frostCd = CFG.DIFF.frostEvery;
	} else e.frostCd = 1;
}
function priestPulse(e) {
	if (e.priestCd > 0) {
		e.priestCd--;
		return;
	}
	for (const o of S$1.enemies) if (o !== e && cheb(o, e) <= 1) applyStatus(o, "shield", 1);
	applyStatus(e, "shield", 1);
	e.priestCd = CFG.DIFF.priestEvery;
}
//#endregion
//#region src/assets/music/act1.ogg
var act1_default = "" + new URL("act1-fdad_DNS.ogg", import.meta.url).href;
//#endregion
//#region src/assets/music/act2.ogg
var act2_default = "" + new URL("act2-C_Y08ZRh.ogg", import.meta.url).href;
//#endregion
//#region src/assets/music/act3.ogg
var act3_default = "" + new URL("act3-B0ukJBQU.ogg", import.meta.url).href;
//#endregion
//#region src/assets/music/boss.ogg
var boss_default = "" + new URL("boss-BjXbwaAV.ogg", import.meta.url).href;
//#endregion
//#region src/assets/music/death.ogg
var death_default = "" + new URL("death-D4GqZvKo.ogg", import.meta.url).href;
//#endregion
//#region src/assets/music/ending.ogg
var ending_default = "" + new URL("ending-CMF1YY6R.ogg", import.meta.url).href;
//#endregion
//#region src/assets/music/event.ogg
var event_default = "" + new URL("event-C9t6fMYy.ogg", import.meta.url).href;
//#endregion
//#region src/assets/music/hunger.ogg
var hunger_default = "" + new URL("hunger-BoeLWDzf.ogg", import.meta.url).href;
//#endregion
//#region src/assets/music/redking.ogg
var redking_default = "" + new URL("redking-BcrYTxWW.ogg", import.meta.url).href;
//#endregion
//#region src/assets/music/title.ogg
var title_default = "" + new URL("title-8q4Kj0Rd.ogg", import.meta.url).href;
//#endregion
//#region src/music.js
var FILES = /* #__PURE__ */ Object.assign({
	"./assets/music/act1.ogg": act1_default,
	"./assets/music/act2.ogg": act2_default,
	"./assets/music/act3.ogg": act3_default,
	"./assets/music/boss.ogg": boss_default,
	"./assets/music/death.ogg": death_default,
	"./assets/music/ending.ogg": ending_default,
	"./assets/music/event.ogg": event_default,
	"./assets/music/hunger.ogg": hunger_default,
	"./assets/music/redking.ogg": redking_default,
	"./assets/music/title.ogg": title_default
});
/** Ключ трека → URL. Имя файла без расширения и есть ключ. */
var URLS = {};
for (const [path, url] of Object.entries(FILES)) {
	const stem = path.split("/").pop().replace(/\.[^.]+$/, "").toLowerCase();
	URLS[stem] = url;
}
var FADE = 1.6;
var CACHE_MAX = 2;
var ctx = null;
var master = null;
var current = null;
var hungerLayer = null;
var pending = null;
var buffers = /* @__PURE__ */ new Map();
/**
* Создать граф. Вызывать ТОЛЬКО из обработчика пользовательского жеста —
* браузеры не дают запустить звук раньше. Удобная точка: клик по загрузочному
* экрану, он всё равно обязателен.
*
* @param {AudioContext} [shared] — контекст из audio.js, если он уже создан
*/
function initMusic(shared) {
	if (ctx) return;
	const AC = window.AudioContext || window.webkitAudioContext;
	if (!AC) return;
	ctx = shared || new AC();
	master = ctx.createGain();
	master.gain.value = musicEnabled() ? volume() : 0;
	master.connect(ctx.destination);
	if (pending) {
		const id = pending;
		pending = null;
		playTrack(id);
	}
}
var musicEnabled = () => CFG.MUSIC_ENABLED !== false;
var volume = () => typeof CFG.MUSIC_VOLUME === "number" ? CFG.MUSIC_VOLUME : .35;
/** Дёргать из настроек после смены CFG.MUSIC_ENABLED / MUSIC_VOLUME. */
function syncMusicSettings() {
	if (!ctx) return;
	const target = musicEnabled() ? volume() : 0;
	master.gain.cancelScheduledValues(ctx.currentTime);
	master.gain.setTargetAtTime(target, ctx.currentTime, .2);
}
async function load(id) {
	if (buffers.has(id)) return buffers.get(id);
	const url = URLS[id];
	if (!url) return null;
	try {
		const raw = await (await fetch(url)).arrayBuffer();
		const buf = await ctx.decodeAudioData(raw);
		while (buffers.size >= CACHE_MAX) buffers.delete(buffers.keys().next().value);
		buffers.set(id, buf);
		return buf;
	} catch (e) {
		console.warn("[music] не загрузился трек", id, e);
		return null;
	}
}
/** Прогреть трек заранее — например, перед босс-ярусом. */
function preload(id) {
	if (ctx && URLS[id]) load(id);
}
function startSource(buf, gainValue) {
	const src = ctx.createBufferSource();
	src.buffer = buf;
	src.loop = true;
	const gain = ctx.createGain();
	gain.gain.value = 0;
	src.connect(gain).connect(master);
	src.start();
	gain.gain.setTargetAtTime(gainValue, ctx.currentTime, FADE / 3);
	return {
		src,
		gain
	};
}
function stopSource(node, fade = FADE) {
	if (!node) return;
	const { src, gain } = node;
	gain.gain.cancelScheduledValues(ctx.currentTime);
	gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
	setTimeout(() => {
		try {
			src.stop();
			src.disconnect();
			gain.disconnect();
		} catch {}
	}, fade * 1e3 + 200);
}
/**
* Переключиться на трек. Повторный вызов с тем же id ничего не делает —
* можно звать хоть каждый ход.
*/
async function playTrack(id) {
	if (!id) return;
	if (!ctx) {
		pending = id;
		return;
	}
	if (current && current.id === id) return;
	const buf = await load(id);
	if (!buf) return;
	if (current && current.id === id) return;
	const old = current;
	current = {
		id,
		...startSource(buf, 1)
	};
	stopSource(old);
}
/** Приглушить, не останавливая, — на время модалок с текстом. */
function duck(on) {
	if (!ctx || !musicEnabled()) return;
	master.gain.cancelScheduledValues(ctx.currentTime);
	master.gain.setTargetAtTime(on ? volume() * .4 : volume(), ctx.currentTime, .3);
}
/** Слой голода: подмешивается поверх основного трека, не заменяет его. */
async function setHungerLayer(on) {
	if (!ctx) return;
	if (on && !hungerLayer) {
		const buf = await load("hunger");
		if (!buf || hungerLayer) return;
		hungerLayer = startSource(buf, .55);
	} else if (!on && hungerLayer) {
		stopSource(hungerLayer, 2.5);
		hungerLayer = null;
	}
}
/** Короткий стингер поверх музыки — смерть, победа. Не зацикливается. */
async function sting(id) {
	if (!ctx) return;
	const buf = await load(id);
	if (!buf) return;
	const src = ctx.createBufferSource();
	src.buffer = buf;
	const gain = ctx.createGain();
	gain.gain.value = .9;
	src.connect(gain).connect(master);
	src.start();
	src.onended = () => {
		src.disconnect();
		gain.disconnect();
	};
}
/**
* Какой трек должен играть сейчас. Держим правило в одном месте, чтобы
* не разбрасывать playTrack() по всему коду.
*
* @param {object} S — состояние игры
* @param {function} bossOnFloor — из util.js
*/
function trackFor(S, bossOnFloor) {
	if (!S || !S.floor) return "title";
	const boss = S.runMode === "campaign" ? bossOnFloor(S.floor) : null;
	if (boss === "redKing") return "redking";
	if (boss) return "boss";
	if (S.floor <= 5) return "act1";
	if (S.floor <= 11) return "act2";
	return "act3";
}
/** Единая точка: вызывать из newFloor() и при входе в комнату-событие. */
function updateMusic(S, bossOnFloor) {
	playTrack(trackFor(S, bossOnFloor));
}
//#endregion
//#region src/editor.js
/**
* src/editor.js — встроенный редактор уровней (canvas + DOM).
* Основные экспорты: openEditor(), handleEditorClick(), isEditorRunning(), stopEditorRun().
*/
/**
* Встроенный редактор уровней.
*/
var editor_exports = /* @__PURE__ */ __exportAll({
	editorActive: () => editorActive,
	handleEditorClick: () => handleEditorClick,
	isBrushActive: () => isBrushActive,
	isEditorRunning: () => isEditorRunning,
	openEditor: () => openEditor,
	stopEditorRun: () => stopEditorRun
});
function isEditorRunning() {
	return state.running;
}
function stopEditorRun() {
	stopRun();
}
function isBrushActive() {
	return state.brush;
}
var DIRECTIONS = [
	[0, -1],
	[1, 0],
	[0, 1],
	[-1, 0]
];
var editorActive = false;
var state = {
	tool: "wall",
	brush: false,
	statusEl: null,
	pendingLink: null,
	running: false,
	runBtn: null,
	doorIdCounter: 1,
	activeTab: "enemies"
};
var editorBackup = null;
var undoStack = [];
var UNDO_MAX = 50;
var _editorKeyHandler = null;
async function loadManifest() {
	try {
		const res = await fetch("/data/manifest.json");
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}
async function loadLevelFromManifest(file) {
	try {
		const res = await fetch("/data/" + file);
		if (!res.ok) {
			log((isEnglish() ? "File not found: " : "Файл не найден: ") + +file, "r");
			return false;
		}
		const data = await res.json();
		snapshotEditorRoom();
		loadLevel(data);
		editorActive = true;
		document.getElementById("editorBar").style.display = "";
		state.statusEl = document.getElementById("editorStatus");
		buildToolbar();
		log((isEnglish() ? "Level loaded: " : "Уровень загружен: ") + +file, "g");
		closeModal();
		return true;
	} catch (e) {
		log((isEnglish() ? "Error loading: " : "Ошибка загрузки: ") + +e.message, "r");
		return false;
	}
}
async function openLevelSelector() {
	const m = await loadManifest();
	if (!m || !m.levels || !m.levels.length) {
		log(isEnglish() ? "No saved levels in /data/manifest.json" : "Нет сохранённых уровней в /data/manifest.json", "");
		return;
	}
	S$1.modalOpen = true;
	dom.modalBox.classList.remove("death");
	dom.mTitle.textContent = isEnglish() ? "Open Level" : "Открыть уровень";
	dom.mText.textContent = isEnglish() ? "Choose a level from manifest.json:" : "Выбери уровень из manifest.json:";
	dom.mChoices.innerHTML = "";
	dom.mChoices.classList.add("loot-list");
	const scroll = document.createElement("div");
	scroll.className = "editor-scroll";
	m.levels.forEach((l) => {
		const row = document.createElement("div");
		row.className = "shoprow";
		row.innerHTML = `<div class="si"><span class="ln">${sanitize(l.name)}</span><span class="ld">${sanitize(l.file)}</span></div>`;
		const btn = document.createElement("button");
		btn.className = "buy";
		btn.textContent = isEnglish() ? "Open" : "Открыть";
		btn.onclick = () => {
			closeModal();
			loadLevelFromManifest(l.file);
		};
		row.appendChild(btn);
		scroll.appendChild(row);
	});
	dom.mChoices.appendChild(scroll);
	const cancel = document.createElement("button");
	cancel.textContent = isEnglish() ? "Cancel" : "Отмена";
	cancel.onclick = () => closeModal();
	dom.mChoices.appendChild(cancel);
	dom.overlay.classList.add("on");
}
function downloadLevel() {
	const data = buildLevelData();
	const json = JSON.stringify(data, null, 2);
	const name = "level_" + Date.now() + ".json";
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.click();
	URL.revokeObjectURL(url);
	log((isEnglish() ? "Level downloaded: " : "Уровень скачан: ") + +name, "g");
}
var ENEMIES = [
	{
		id: "enemy:pawn",
		label: "♟",
		title: isEnglish() ? "Pawn" : "Пешка"
	},
	{
		id: "enemy:knight",
		label: "♞",
		title: isEnglish() ? "Knight" : "Конь"
	},
	{
		id: "enemy:bishop",
		label: "♝",
		title: isEnglish() ? "Bishop" : "Слон"
	},
	{
		id: "enemy:rook",
		label: "♜",
		title: isEnglish() ? "Rook" : "Ладья"
	},
	{
		id: "enemy:queen",
		label: "♛",
		title: isEnglish() ? "Queen" : "Ферзь"
	},
	{
		id: "enemy:king",
		label: "♚",
		title: isEnglish() ? "King" : "Король"
	},
	{
		id: "enemy:guardian",
		label: "👤",
		title: isEnglish() ? "Guardian" : "Страж"
	},
	{
		id: "enemy:necro",
		label: "💀",
		title: isEnglish() ? "Necromancer" : "Некромант"
	},
	{
		id: "enemy:mimic",
		label: "👥",
		title: isEnglish() ? "Mimic" : "Двойник"
	},
	{
		id: "enemy:assassin",
		label: "🗡",
		title: isEnglish() ? "Assassin" : "Ассасин"
	},
	{
		id: "enemy:priest",
		label: "✝",
		title: isEnglish() ? "Priest" : "Жрец"
	},
	{
		id: "enemy:frost",
		label: "❄",
		title: isEnglish() ? "Mage" : "Маг"
	},
	{
		id: "enemy:boss:tormentor",
		label: "👁",
		title: isEnglish() ? "Tormentor" : "Мучитель"
	},
	{
		id: "enemy:boss:rooks",
		label: "♜♜",
		title: isEnglish() ? "Rooks" : "Ладьи"
	},
	{
		id: "enemy:boss:millstone",
		label: "◎",
		title: isEnglish() ? "Millstone" : "Жернов"
	},
	{
		id: "enemy:boss:king",
		label: "♛",
		title: "Король"
	}
];
var OBJECTS_TERRAIN = [
	{
		id: "wall",
		label: "🧱",
		title: isEnglish() ? "Wall" : "Стена"
	},
	{
		id: "special:trap",
		label: "🕸",
		title: isEnglish() ? "Trap" : "Ловушка"
	},
	{
		id: "special:portal",
		label: "◎",
		title: isEnglish() ? "Portal" : "Портал"
	},
	{
		id: "special:rune",
		label: "◈",
		title: isEnglish() ? "Vein" : "Жила"
	},
	{
		id: "special:ice",
		label: "❄",
		title: isEnglish() ? "Ice" : "Лёд"
	},
	{
		id: "special:fog",
		label: "☁",
		title: isEnglish() ? "Fog" : "Туман"
	},
	{
		id: "special:lava",
		label: "≈",
		title: isEnglish() ? "Lava" : "Лава"
	},
	{
		id: "special:conveyor",
		label: "→",
		title: isEnglish() ? "Conveyor" : "Конв."
	},
	{
		id: "special:gate",
		label: "⇨",
		title: isEnglish() ? "Gate" : "Ворота"
	},
	{
		id: "special:plate",
		label: "▣",
		title: isEnglish() ? "Plate" : "Плита"
	},
	{
		id: "special:millstone",
		label: "◎",
		title: "Жернов"
	},
	{
		id: "special:colorzone",
		label: "♝",
		title: isEnglish() ? "Color Zone" : "Цветозона"
	}
];
var OBJECTS_LOOT = [
	{
		id: "special:scroll",
		label: "📜",
		title: isEnglish() ? "Scroll" : "Свиток"
	},
	{
		id: "special:door",
		label: "🚪",
		title: isEnglish() ? "Door" : "Дверь"
	},
	{
		id: "special:door:red",
		label: "🚪🔴",
		title: isEnglish() ? "Door Red" : "Дверь Кр"
	},
	{
		id: "special:door:blue",
		label: "🚪🔵",
		title: isEnglish() ? "Door Blue" : "Дверь Син"
	},
	{
		id: "special:door:green",
		label: "🚪🟢",
		title: isEnglish() ? "Door Green" : "Дверь Зел"
	},
	{
		id: "special:door:gold",
		label: "🚪🟡",
		title: isEnglish() ? "Door Gold" : "Дверь Зол"
	},
	{
		id: "special:door:purple",
		label: "🚪🟣",
		title: isEnglish() ? "Door Purple" : "Дверь Фиол"
	},
	{
		id: "special:key",
		label: "🔑",
		title: isEnglish() ? "Key" : "Ключ"
	},
	{
		id: "special:key:red",
		label: "🔑🔴",
		title: isEnglish() ? "Key Red" : "Ключ Кр"
	},
	{
		id: "special:key:blue",
		label: "🔑🔵",
		title: isEnglish() ? "Key Blue" : "Ключ Син"
	},
	{
		id: "special:key:green",
		label: "🔑🟢",
		title: isEnglish() ? "Key Green" : "Ключ Зел"
	},
	{
		id: "special:key:gold",
		label: "🔑🟡",
		title: isEnglish() ? "Key Gold" : "Ключ Зол"
	},
	{
		id: "special:key:purple",
		label: "🔑🟣",
		title: isEnglish() ? "Key Purple" : "Ключ Фиол"
	}
];
var ACTIONS = [
	{
		id: "open",
		label: "📂",
		title: isEnglish() ? "Open Level" : "Открыть уровень"
	},
	{
		id: "save",
		label: "💾",
		title: isEnglish() ? "Download JSON" : "Скачать JSON"
	},
	{
		id: "copy",
		label: "📋",
		title: isEnglish() ? "Copy JSON" : "Скопировать JSON"
	},
	{
		id: "import",
		label: "📥",
		title: isEnglish() ? "From Clipboard" : "Из буфера"
	},
	{
		id: "addRoom",
		label: "+Комн",
		title: isEnglish() ? "Add Room" : "Добавить комнату"
	},
	{
		id: "prevRoom",
		label: "◀",
		title: isEnglish() ? "Prev Room" : "Пред. комната"
	},
	{
		id: "nextRoom",
		label: "▶",
		title: isEnglish() ? "Next Room" : "След. комната"
	},
	{
		id: "run",
		label: "▶",
		title: isEnglish() ? "Run Simulation" : "Запустить симуляцию"
	},
	{
		id: "close",
		label: "✕",
		title: isEnglish() ? "Close Editor" : "Закрыть редактор"
	}
];
var TOOLS = [
	{
		id: "delete",
		label: "🗑",
		title: isEnglish() ? "Delete" : "Удалить"
	},
	{
		id: "spawn",
		label: "📍",
		title: isEnglish() ? "Spawn" : "Спавн"
	},
	{
		id: "rotate",
		label: "↻",
		title: isEnglish() ? "Rotate" : "Поворот"
	},
	{
		id: "link",
		label: "🔗",
		title: isEnglish() ? "Link" : "Связь"
	},
	{
		id: "brush",
		label: "🖌",
		title: isEnglish() ? "Brush" : "Кисть"
	},
	{
		id: "flag",
		label: "🏷",
		title: isEnglish() ? "Flags" : "Флаги"
	}
];
function openEditor() {
	editorActive = true;
	CFG.W = 11;
	CFG.H = 9;
	S$1.walls = /* @__PURE__ */ new Set();
	S$1.special = /* @__PURE__ */ new Map();
	S$1.enemies = [];
	S$1.rooms = [{
		walls: /* @__PURE__ */ new Set(),
		special: /* @__PURE__ */ new Map(),
		enemies: [],
		cleared: false
	}];
	S$1.currentRoom = 0;
	S$1.player.x = 5;
	S$1.player.y = 8;
	if (!S$1.player.wheel) S$1.player.wheel = [null];
	if (S$1.player.active == null) S$1.player.active = 0;
	state.tool = "wall";
	state.brush = false;
	state.running = false;
	editorBackup = null;
	invalidateThreats();
	document.getElementById("editorBar").style.display = "";
	state.statusEl = document.getElementById("editorStatus");
	buildToolbar();
	syncEditorRoom();
	render();
	loadManifest().then((m) => {
		if (m && m.levels && m.levels.length) log(isEnglish() ? "Found " + m.levels.length + " levels in manifest.json" : "Найдено " + m.levels.length + " уровней в manifest.json", "");
	});
}
function syncEditorRoom() {
	const r = S$1.rooms[S$1.currentRoom];
	S$1.walls = r.walls;
	S$1.special = r.special;
	S$1.enemies = r.enemies;
}
function snapshotEditorRoom() {
	S$1.rooms[S$1.currentRoom] = {
		walls: S$1.walls,
		special: S$1.special,
		enemies: S$1.enemies,
		cleared: false
	};
}
function closeEditor() {
	snapshotEditorRoom();
	editorActive = false;
	document.getElementById("editorBar").style.display = "none";
}
function addRoom() {
	snapshotEditorRoom();
	S$1.rooms.push({
		walls: /* @__PURE__ */ new Set(),
		special: /* @__PURE__ */ new Map(),
		enemies: [],
		cleared: false
	});
	S$1.currentRoom = S$1.rooms.length - 1;
	syncEditorRoom();
	state.statusEl.textContent = isEnglish() ? `Room ${S$1.currentRoom + 1}/${S$1.rooms.length}` : `Комната ${S$1.currentRoom + 1}/${S$1.rooms.length}`;
	render();
}
function prevRoom() {
	if (S$1.rooms.length <= 1) return;
	snapshotEditorRoom();
	S$1.currentRoom = (S$1.currentRoom - 1 + S$1.rooms.length) % S$1.rooms.length;
	syncEditorRoom();
	state.statusEl.textContent = `Комната ${S$1.currentRoom + 1}/${S$1.rooms.length}`;
	render();
}
function nextRoom() {
	if (S$1.rooms.length <= 1) return;
	snapshotEditorRoom();
	S$1.currentRoom = (S$1.currentRoom + 1) % S$1.rooms.length;
	syncEditorRoom();
	state.statusEl.textContent = `Комната ${S$1.currentRoom + 1}/${S$1.rooms.length}`;
	render();
}
function runLevel() {
	snapshotEditorRoom();
	editorBackup = {
		rooms: S$1.rooms.map((r) => ({
			walls: new Set(r.walls),
			special: new Map([...r.special.entries()].map(([k, v]) => [k, { ...v }])),
			enemies: r.enemies.map((e) => ({
				...e,
				status: { ...e.status }
			}))
		})),
		curRoom: S$1.currentRoom,
		playerX: S$1.player.x,
		playerY: S$1.player.y,
		W: CFG.W,
		H: CFG.H
	};
	loadLevel(buildLevelData());
	S$1.gameOver = false;
	if (!S$1.player.wheel || S$1.player.wheel.every((s) => !s)) {
		S$1.player.wheel = [
			makeForm("pawn"),
			null,
			null
		];
		S$1.player.active = 0;
	}
	S$1.player.hunger = CFG.HUNGER.start;
	S$1.player.status = {};
	S$1.player.boneVoiceTimer = 0;
	editorActive = false;
	state.running = true;
	if (state.runBtn) {
		state.runBtn.textContent = "⏹";
		state.runBtn.classList.add("running");
	}
	log(isEnglish() ? "Level started. Press ⏹ to return to editor." : "Уровень запущен. Нажмите ⏹ для возврата в редактор.", "g");
}
function stopRun() {
	if (!editorBackup) return;
	S$1.rooms = editorBackup.rooms;
	S$1.currentRoom = editorBackup.curRoom;
	S$1.player.x = editorBackup.playerX;
	S$1.player.y = editorBackup.playerY;
	CFG.W = editorBackup.W;
	CFG.H = editorBackup.H;
	syncEditorRoom();
	editorActive = true;
	state.running = false;
	editorBackup = null;
	if (state.runBtn) {
		state.runBtn.textContent = "▶";
		state.runBtn.classList.remove("running");
	}
	log(isEnglish() ? "Returned to editor." : "Возврат в редактор.", "g");
	render();
}
function pushUndo(x, y) {
	const k = key(x, y);
	undoStack.push({
		x,
		y,
		walls: S$1.walls.has(k),
		special: S$1.special.has(k) ? { ...S$1.special.get(k) } : null,
		enemies: S$1.enemies.filter((e) => e.x === x && e.y === y).map((e) => ({
			...e,
			status: { ...e.status }
		}))
	});
	if (undoStack.length > UNDO_MAX) undoStack.shift();
}
function undo() {
	if (!undoStack.length) {
		state.statusEl.textContent = isEnglish() ? "Nothing to undo." : "Нечего отменять.";
		return;
	}
	const prev = undoStack.pop();
	const k = key(prev.x, prev.y);
	snapshotEditorRoom();
	if (prev.walls) S$1.walls.add(k);
	else S$1.walls.delete(k);
	S$1.special.delete(k);
	if (prev.special) S$1.special.set(k, prev.special);
	S$1.enemies = S$1.enemies.filter((e) => !(e.x === prev.x && e.y === prev.y));
	prev.enemies.forEach((e) => S$1.enemies.push(e));
	render();
	state.statusEl.textContent = isEnglish() ? "Undo (Ctrl+Z)." : "Отмена (Ctrl+Z).";
}
function selectTool(id) {
	if (id === "brush") {
		state.brush = !state.brush;
		updateStatus();
		return;
	}
	if (id === "copy") {
		exportJSON();
		return;
	}
	if (id === "open") {
		openLevelSelector();
		return;
	}
	if (id === "save") {
		downloadLevel();
		return;
	}
	if (id === "import") {
		importJSON();
		return;
	}
	if (id === "run") {
		if (state.running) stopRun();
		else runLevel();
		return;
	}
	if (id === "close") {
		closeEditor();
		return;
	}
	if (id === "addRoom") {
		addRoom();
		return;
	}
	if (id === "prevRoom") {
		prevRoom();
		return;
	}
	if (id === "nextRoom") {
		nextRoom();
		return;
	}
	state.tool = id;
	document.querySelectorAll("#editorBar button[data-tool]").forEach((b) => {
		b.classList.toggle("active", b.dataset.tool === id);
	});
	updateStatus();
}
function buildToolbar() {
	const actEl = document.getElementById("editorActions");
	actEl.innerHTML = "";
	const actLabel = document.createElement("span");
	actLabel.className = "editor-group-label";
	actLabel.textContent = "Действия";
	actEl.appendChild(actLabel);
	ACTIONS.forEach((t) => {
		const btn = document.createElement("button");
		btn.textContent = t.label;
		btn.title = t.title;
		btn.dataset.tool = t.id;
		if (t.id === state.tool) btn.classList.add("active");
		if (t.id === "run") state.runBtn = btn;
		btn.onclick = () => selectTool(t.id);
		actEl.appendChild(btn);
	});
	const toolsEl = document.getElementById("editorTools");
	toolsEl.innerHTML = "";
	const toolsLabel = document.createElement("span");
	toolsLabel.className = "editor-group-label";
	toolsLabel.textContent = "Инструменты";
	toolsEl.appendChild(toolsLabel);
	TOOLS.forEach((t) => {
		const btn = document.createElement("button");
		btn.textContent = state.brush && t.id === "brush" ? "🖌✓" : t.label;
		btn.title = t.title;
		btn.dataset.tool = t.id;
		if (t.id === state.tool || t.id === "brush" && state.brush) btn.classList.add("active");
		btn.onclick = () => selectTool(t.id);
		toolsEl.appendChild(btn);
	});
	const objEl = document.getElementById("editorObjects");
	objEl.innerHTML = "";
	const groups = [
		{
			id: "enemies",
			label: isEnglish() ? "Enemies" : "Противники",
			items: ENEMIES
		},
		{
			id: "terrain",
			label: isEnglish() ? "Objects" : "Объекты",
			items: OBJECTS_TERRAIN
		},
		{
			id: "loot",
			label: isEnglish() ? "Loot/Doors" : "Лут/Двери",
			items: OBJECTS_LOOT
		}
	];
	const tabRow = document.createElement("div");
	tabRow.className = "editor-tab-row";
	groups.forEach((g) => {
		const tab = document.createElement("button");
		tab.className = "editor-tab-btn";
		if (g.id === state.activeTab) tab.classList.add("active");
		tab.textContent = g.label;
		tab.onclick = () => {
			state.activeTab = g.id;
			buildToolbar();
		};
		tabRow.appendChild(tab);
	});
	objEl.appendChild(tabRow);
	const activeGroup = groups.find((g) => g.id === state.activeTab);
	if (activeGroup) {
		const body = document.createElement("div");
		body.className = "editor-group-body";
		activeGroup.items.forEach((t) => {
			const btn = document.createElement("button");
			btn.textContent = t.label;
			btn.title = t.title;
			btn.dataset.tool = t.id;
			if (t.id === state.tool) btn.classList.add("active");
			btn.onclick = () => selectTool(t.id);
			body.appendChild(btn);
		});
		objEl.appendChild(body);
	}
	const sizeWrap = document.createElement("span");
	sizeWrap.className = "editor-size-wrap";
	sizeWrap.innerHTML = isEnglish() ? "Size:" : "Размер:";
	const wInput = document.createElement("input");
	wInput.type = "number";
	wInput.value = CFG.W;
	wInput.min = 5;
	wInput.max = 25;
	wInput.title = isEnglish() ? "Width" : "Ширина";
	wInput.onchange = () => {
		CFG.W = Math.max(5, Math.min(25, parseInt(wInput.value, 10) || 11));
		resizeEditorBoard();
	};
	const sepX = document.createElement("span");
	sepX.textContent = "×";
	sepX.style.color = "var(--muted)";
	const hInput = document.createElement("input");
	hInput.type = "number";
	hInput.value = CFG.H;
	hInput.min = 5;
	hInput.max = 20;
	hInput.title = isEnglish() ? "Height" : "Высота";
	hInput.onchange = () => {
		CFG.H = Math.max(5, Math.min(20, parseInt(hInput.value, 10) || 9));
		resizeEditorBoard();
	};
	sizeWrap.appendChild(wInput);
	sizeWrap.appendChild(sepX);
	sizeWrap.appendChild(hInput);
	objEl.appendChild(sizeWrap);
	updateStatus();
	if (_editorKeyHandler) document.removeEventListener("keydown", _editorKeyHandler, true);
	_editorKeyHandler = (ev) => {
		if (!editorActive || state.running || ev.target.tagName === "INPUT") return;
		const k = ev.key.toLowerCase();
		if (k === "w") {
			ev.preventDefault();
			selectTool("wall");
		} else if (k === "d") {
			ev.preventDefault();
			selectTool("delete");
		} else if (k === "b") {
			ev.preventDefault();
			selectTool("brush");
		} else if (ev.key === "Escape") {
			ev.preventDefault();
			if (state.tool !== "wall") selectTool("wall");
			else closeEditor();
		} else if (ev.ctrlKey && k === "z") {
			ev.preventDefault();
			undo();
		} else if (/^[1-9]$/.test(k)) {
			ev.preventDefault();
			const openGroup = groups.find((g) => g.id === state.activeTab);
			if (openGroup) {
				const idx = parseInt(k) - 1;
				if (idx < openGroup.items.length) selectTool(openGroup.items[idx].id);
			}
		}
	};
	document.addEventListener("keydown", _editorKeyHandler, true);
}
function resizeEditorBoard() {
	if (!editorActive) return;
	if (S$1.player.x >= CFG.W) S$1.player.x = CFG.W - 1;
	if (S$1.player.y >= CFG.H) S$1.player.y = CFG.H - 1;
	render();
}
function updateStatus() {
	if (!state.statusEl) return;
	const brushStr = state.brush ? isEnglish() ? " (Brush)" : " (Кисть)" : "";
	let t = isEnglish() ? "None" : "Нет";
	if (state.tool === "wall") t = (isEnglish() ? "Wall" : "Стена") + brushStr + " | клик — поставить/убрать";
	else if (state.tool === "delete") t = isEnglish() ? "Delete | click cell to clear all" : "Удалить | клик по клетке очищает всё";
	else if (state.tool === "link") t = isEnglish() ? "Link | click door for link window" : "Связь | клик по двери — окно связей";
	else if (state.tool === "rotate") t = isEnglish() ? "Rotate | click gate/conveyor" : "Поворот | клик по воротам/конвейеру";
	else if (state.tool === "spawn") t = isEnglish() ? "Spawn | click to set player start" : "Спавн | клик устанавливает старт игрока";
	else if (state.tool === "flag") t = isEnglish() ? "Flags | click enemy for flags" : "Флаги | клик по врагу для флагов";
	else if (state.tool.startsWith("enemy:")) t = GLYPH[state.tool.split(":")[1]] + " | клик ставит врага";
	else if (state.tool.startsWith("special:")) t = state.tool.split(":")[1] + (isEnglish() ? " | click to place special cell" : " | клик ставит спец-клетку");
	state.statusEl.textContent = t + (isEnglish() ? " | ⌨ W D B Esc | Ctrl+Z undo" : " | ⌨ W D B Esc | Ctrl+Z отмена");
}
function parseTool(toolId) {
	if (toolId === "wall") return { kind: "wall" };
	if (toolId === "delete") return { kind: "delete" };
	if (toolId === "spawn") return { kind: "spawn" };
	if (toolId === "rotate") return { kind: "rotate" };
	if (toolId === "link") return { kind: "link" };
	if (toolId === "flag") return { kind: "flag" };
	if (toolId.startsWith("enemy:boss:")) return {
		kind: "boss",
		bossId: toolId.split(":")[2]
	};
	if (toolId.startsWith("enemy:")) return {
		kind: "enemy",
		enemyType: toolId.split(":")[1]
	};
	if (toolId.startsWith("special:key:")) return {
		kind: "special",
		specialType: "key",
		keyColor: toolId.split(":")[2]
	};
	if (toolId.startsWith("special:door:")) return {
		kind: "special",
		specialType: "door",
		doorColor: toolId.split(":")[2]
	};
	if (toolId.startsWith("special:")) return {
		kind: "special",
		specialType: toolId.split(":")[1]
	};
	return null;
}
function editEnemyFlags(x, y) {
	const e = S$1.enemies.find((en) => en.x === x && en.y === y);
	if (!e) {
		state.statusEl.textContent = isEnglish() ? "No enemy on this cell." : "Нет врага на этой клетке.";
		return;
	}
	snapshotEditorRoom();
	S$1.modalOpen = true;
	dom.modalBox.classList.remove("death");
	dom.mTitle.textContent = isEnglish() ? "Enemy Flags" : "Флаги врага";
	dom.mText.textContent = `${NAME[e.type] || e.type} (${x}, ${y})`;
	dom.mChoices.innerHTML = "";
	dom.mChoices.classList.add("loot-list");
	[
		{
			key: "bossId",
			label: "bossId",
			type: "text",
			get: () => e.bossId || ""
		},
		{
			key: "armor",
			label: isEnglish() ? "Armor" : "Броня",
			type: "number",
			get: () => e.armor || 0
		},
		{
			key: "linkedTo",
			label: "linkedTo",
			type: "text",
			get: () => e.linkedTo || ""
		},
		{
			key: "passive",
			label: isEnglish() ? "Passive" : "Пассивный",
			type: "checkbox",
			get: () => e.passive ? "1" : ""
		},
		{
			key: "king",
			label: isEnglish() ? "King" : "Король",
			type: "checkbox",
			get: () => e.king ? "1" : ""
		},
		{
			key: "retinue",
			label: "retinue",
			type: "text",
			get: () => e.retinue || ""
		},
		{
			key: "noAttackCd",
			label: "noAttackCd",
			type: "checkbox",
			get: () => e.noAttackCd ? "1" : ""
		},
		{
			key: "r",
			label: isEnglish() ? "Range (r)" : "Дальность (r)",
			type: "number",
			get: () => e.r || 1
		}
	].forEach((f) => {
		const row = document.createElement("div");
		row.className = "shoprow";
		const info = document.createElement("div");
		info.className = "si";
		info.innerHTML = `<span class="ln">${f.label}</span><span class="ld">текущее: ${f.get()}</span>`;
		row.appendChild(info);
		if (f.type === "checkbox") {
			const btn = document.createElement("button");
			btn.className = "buy";
			btn.textContent = f.get() === "1" ? isEnglish() ? "Yes" : "Да" : isEnglish() ? "No" : "Нет";
			btn.onclick = () => {
				const newVal = f.get() === "1" ? "" : "1";
				if (f.key === "passive") e.passive = newVal === "1";
				else if (f.key === "king") e.king = newVal === "1";
				else if (f.key === "noAttackCd") {
					e.noAttackCd = newVal === "1";
					e.attackReady = e.noAttackCd;
				}
				btn.textContent = newVal === "1" ? "Да" : "Нет";
				info.querySelector(".ld").textContent = (isEnglish() ? "current: " : "текущее: ") + (newVal === "1" ? "✓" : "—");
			};
			row.appendChild(btn);
		} else if (f.type === "number") {
			const input = document.createElement("input");
			input.type = "number";
			input.value = f.get();
			input.style.cssText = "width:60px;background:#242833;color:#d8d2c4;border:1px solid #3a3e49;border-radius:5px;padding:4px 8px;";
			input.min = 0;
			input.onchange = () => {
				const v = parseInt(input.value, 10) || 0;
				if (f.key === "armor") e.armor = v;
				if (f.key === "r") e.r = v || 1;
				info.querySelector(".ld").textContent = (isEnglish() ? "current: " : "текущее: ") + v;
			};
			row.appendChild(input);
		} else {
			const input = document.createElement("input");
			input.type = "text";
			input.value = f.get();
			input.style.cssText = "flex:1;background:#242833;color:#d8d2c4;border:1px solid #3a3e49;border-radius:5px;padding:4px 8px;";
			input.onchange = () => {
				const v = input.value.trim();
				if (f.key === "bossId") if (v) e.bossId = v;
				else delete e.bossId;
				if (f.key === "linkedTo") if (v) e.linkedTo = v;
				else delete e.linkedTo;
				if (f.key === "retinue") if (v) e.retinue = v;
				else delete e.retinue;
				info.querySelector(".ld").textContent = (isEnglish() ? "current: " : "текущее: ") + (v || "—");
			};
			row.appendChild(input);
		}
		dom.mChoices.appendChild(row);
	});
	const actions = document.createElement("div");
	actions.style.cssText = "display:flex;gap:8px;margin-top:4px";
	const clearBtn = document.createElement("button");
	clearBtn.textContent = isEnglish() ? "Reset All" : "Сбросить всё";
	clearBtn.onclick = () => {
		delete e.bossId;
		delete e.linkedTo;
		e.passive = false;
		e.king = false;
		delete e.retinue;
		e.noAttackCd = false;
		e.attackReady = false;
		e.armor = 0;
		e.r = CFG.BASE_R[e.type] || 1;
		closeModal();
		state.statusEl.textContent = isEnglish() ? "Flags reset." : "Флаги сброшены.";
		render();
	};
	const doneBtn = document.createElement("button");
	doneBtn.textContent = isEnglish() ? "Done" : "Готово";
	doneBtn.onclick = () => {
		closeModal();
		render();
	};
	actions.appendChild(clearBtn);
	actions.appendChild(doneBtn);
	dom.mChoices.appendChild(actions);
	dom.overlay.classList.add("on");
}
function openDoorLinker(currentKey) {
	S$1.modalOpen = true;
	dom.modalBox.classList.remove("death");
	dom.mTitle.textContent = isEnglish() ? "Door Links" : "Связи дверей";
	dom.mText.textContent = `Всего комнат: ${S$1.rooms.length}.`;
	dom.mChoices.innerHTML = "";
	dom.mChoices.classList.add("loot-list");
	const allDoors = [];
	S$1.rooms.forEach((r, roomIdx) => {
		r.special.forEach((sp, spKey) => {
			if (sp.type === "door") {
				const [dx, dy] = spKey.split(",").map(Number);
				const linked = sp.targetRoom != null;
				let linkedDoorId = "";
				if (linked) {
					const targetRoomObj = S$1.rooms[sp.targetRoom];
					if (targetRoomObj) targetRoomObj.special.forEach((ts) => {
						if (ts.type === "door" && ts.targetRoom === roomIdx && ts !== sp) linkedDoorId = ts.doorId != null ? `#${ts.doorId}` : "";
					});
				}
				const linkedInfo = linked ? isEnglish() ? `→ room ${sp.targetRoom + 1} ${linkedDoorId}` : `→ комн. ${sp.targetRoom + 1} ${linkedDoorId}` : "—";
				const color = sp.color || isEnglish() ? "no color" : "без цвета";
				const doorId = sp.doorId != null ? `#${sp.doorId}` : "";
				allDoors.push({
					room: roomIdx,
					x: dx,
					y: dy,
					key: spKey,
					special: sp,
					linked,
					linkedInfo,
					linkedDoorId,
					color,
					doorId
				});
			}
		});
	});
	if (allDoors.length === 0) dom.mText.textContent = isEnglish() ? "No doors in the level. Place a door using the Door tool." : "На уровне нет дверей. Поставь дверь инструментом «Дверь».";
	let selectedIdx = null;
	const unlinkPair = (d) => {
		if (d.special.targetRoom != null) {
			const oldTarget = S$1.rooms[d.special.targetRoom];
			if (oldTarget) oldTarget.special.forEach((os) => {
				if (os.type === "door" && os.targetRoom === d.room) {
					os.targetRoom = void 0;
					os.targetPos = void 0;
				}
			});
			d.special.targetRoom = void 0;
			d.special.targetPos = void 0;
		}
		d.linked = false;
		d.linkedInfo = "—";
	};
	const refreshList = () => {
		dom.mChoices.querySelectorAll(".door-row").forEach((el) => el.remove());
		const actionsEl = dom.mChoices.querySelector(".door-actions");
		if (actionsEl) actionsEl.remove();
		allDoors.forEach((d, idx) => {
			const isCurrent = currentKey === d.key;
			const isSel = !isCurrent && selectedIdx === idx;
			const isLinkedButNotCurrent = d.linked && !isCurrent;
			const row = document.createElement("div");
			row.className = "shoprow door-row";
			const styleAdd = isCurrent ? "border-color: #c9a227;" : isSel ? "border-color: #58b3a4;" : "";
			row.setAttribute("style", styleAdd);
			const ci = doorColorIndicator(d.color);
			row.innerHTML = `<div class="si"><span class="ln">Комн.${d.room + 1}: дверь (${d.x},${d.y}) ${d.doorId} · ${ci} ${d.color}</span><span class="ld">Связана: ${d.linkedInfo}</span></div>`;
			if (isCurrent) {
				const badge = document.createElement("span");
				badge.textContent = isEnglish() ? "Current" : "Текущая";
				badge.style.cssText = "font-size:11px;color:#c9a227;min-width:60px;text-align:center";
				row.appendChild(badge);
			} else if (isLinkedButNotCurrent) {
				const unlinkBtn = document.createElement("button");
				unlinkBtn.textContent = "✕";
				unlinkBtn.title = "Разорвать связь";
				unlinkBtn.style.cssText = "min-height:28px;padding:2px 8px;";
				unlinkBtn.onclick = () => {
					unlinkPair(d);
					state.statusEl.textContent = isEnglish() ? "Link broken." : "Связь разорвана.";
					refreshList();
				};
				row.appendChild(unlinkBtn);
			} else {
				const selBtn = document.createElement("button");
				selBtn.className = "buy";
				selBtn.textContent = isSel ? isEnglish() ? "Selected" : "Выбрана" : isEnglish() ? "Select" : "Выбрать";
				selBtn.onclick = () => {
					selectedIdx = isSel ? null : idx;
					refreshList();
				};
				row.appendChild(selBtn);
			}
			dom.mChoices.insertBefore(row, dom.mChoices.querySelector(".door-actions") || null);
		});
		let actRow = dom.mChoices.querySelector(".door-actions");
		if (!actRow) {
			actRow = document.createElement("div");
			actRow.className = "door-actions";
			actRow.style.cssText = "display:flex;gap:8px;margin-top:4px;flex-wrap:wrap";
			dom.mChoices.appendChild(actRow);
		}
		actRow.innerHTML = "";
		const doneBtn = document.createElement("button");
		doneBtn.textContent = "Готово";
		doneBtn.onclick = () => {
			if (currentKey && selectedIdx != null) {
				const src = allDoors.find((d) => d.key === currentKey);
				const tgt = allDoors[selectedIdx];
				if (src && tgt && src !== tgt) {
					unlinkPair(src);
					unlinkPair(tgt);
					src.special.targetRoom = tgt.room;
					src.special.targetPos = {
						x: tgt.x,
						y: tgt.y
					};
					tgt.special.targetRoom = src.room;
					tgt.special.targetPos = {
						x: src.x,
						y: src.y
					};
					src.linked = true;
					src.linkedInfo = `→ комн. ${tgt.room + 1} (${tgt.x},${tgt.y})`;
					tgt.linked = true;
					tgt.linkedInfo = `→ комн. ${src.room + 1} (${src.x},${src.y})`;
					state.statusEl.textContent = `Двери связаны: комн.${src.room + 1} ↔ комн.${tgt.room + 1}.`;
				}
			}
			closeModal();
			render();
		};
		actRow.appendChild(doneBtn);
		const unlinkAllBtn = document.createElement("button");
		unlinkAllBtn.textContent = isEnglish() ? "Unlink All" : "Отвязать всё";
		unlinkAllBtn.onclick = () => {
			allDoors.forEach((d) => unlinkPair(d));
			selectedIdx = null;
			state.statusEl.textContent = isEnglish() ? "All door links broken." : "Все связи дверей разорваны.";
			refreshList();
		};
		actRow.appendChild(unlinkAllBtn);
	};
	const scroll = document.createElement("div");
	scroll.className = "editor-scroll door-scroll";
	dom.mChoices.appendChild(scroll);
	const actPlaceholder = document.createElement("div");
	actPlaceholder.className = "door-actions";
	dom.mChoices.appendChild(actPlaceholder);
	dom.overlay.classList.add("on");
	refreshList();
}
function doorColorIndicator(color) {
	return {
		red: "🔴",
		blue: "🔵",
		green: "🟢",
		gold: "🟡",
		purple: "🟣"
	}[color] || "⚪";
}
function handleEditorClick(x, y) {
	if (!editorActive || !inB$1(x, y)) return;
	pushUndo(x, y);
	snapshotEditorRoom();
	const parsed = parseTool(state.tool);
	if (!parsed) return;
	const k = key(x, y);
	if (parsed.kind === "delete") {
		S$1.walls.delete(k);
		S$1.special.delete(k);
		S$1.enemies = S$1.enemies.filter((e) => !(e.x === x && e.y === y));
	} else if (parsed.kind === "flag") {
		editEnemyFlags(x, y);
		return;
	} else if (parsed.kind === "rotate") {
		const sp = S$1.special.get(k);
		if (sp && (sp.type === "conveyor" || sp.type === "gate" || sp.type === "millstone") && sp.dir) {
			sp.dir = DIRECTIONS[(DIRECTIONS.findIndex((d) => d[0] === sp.dir[0] && d[1] === sp.dir[1]) + 1) % 4];
			state.statusEl.textContent = (isEnglish() ? "Direction: " : "Направление: ") + +sp.dir.join(",");
		}
	} else if (parsed.kind === "wall") if (state.brush) {
		S$1.walls.add(k);
		S$1.special.delete(k);
		S$1.enemies = S$1.enemies.filter((e) => !(e.x === x && e.y === y));
	} else if (S$1.walls.has(k)) S$1.walls.delete(k);
	else {
		S$1.walls.add(k);
		S$1.special.delete(k);
		S$1.enemies = S$1.enemies.filter((e) => !(e.x === x && e.y === y));
	}
	else if (parsed.kind === "spawn") {
		S$1.player.x = x;
		S$1.player.y = y;
	} else if (parsed.kind === "enemy") {
		S$1.walls.delete(k);
		S$1.special.delete(k);
		S$1.enemies = S$1.enemies.filter((e) => !(e.x === x && e.y === y));
		const e = {
			type: parsed.enemyType,
			x,
			y,
			facing: [0, 1],
			cd: 0,
			status: {},
			homeColor: 0,
			r: CFG.BASE_R[parsed.enemyType] || 1,
			rb: 0
		};
		if (parsed.enemyType === "guardian") e.armor = 2;
		if (parsed.enemyType === "necro") e.spawnCd = 3;
		S$1.enemies.push(e);
	} else if (parsed.kind === "special") {
		S$1.walls.delete(k);
		S$1.enemies = S$1.enemies.filter((e) => !(e.x === x && e.y === y));
		const spec = { type: parsed.specialType };
		if (spec.type === "key") spec.color = parsed.keyColor || "gold";
		if (spec.type === "door") {
			spec.color = parsed.doorColor || null;
			spec.doorId = state.doorIdCounter++;
		}
		if (spec.type === "plate") for (const [dx, dy] of ORTHO) {
			const nx = x + dx, ny = y + dy;
			if (inB$1(nx, ny) && S$1.walls.has(key(nx, ny))) {
				spec.opens = {
					x: nx,
					y: ny
				};
				break;
			}
		}
		if (spec.type === "portal") spec.pair = {
			x: -1,
			y: -1
		};
		if (spec.type === "conveyor" || spec.type === "gate" || spec.type === "millstone") spec.dir = [0, -1];
		S$1.special.set(k, spec);
	} else if (parsed.kind === "boss") {
		S$1.walls.delete(k);
		S$1.special.delete(k);
		S$1.enemies = S$1.enemies.filter((e) => !(e.x === x && e.y === y));
		if (parsed.bossId === "tormentor") S$1.enemies.push({
			type: "bishop",
			x,
			y,
			bossId: "tormentor",
			armor: 3,
			phase: 1,
			stunCd: 3,
			r: 4,
			status: {}
		});
		else if (parsed.bossId === "rooks") {
			const nx = x + 1;
			S$1.enemies.push({
				type: "rook",
				x,
				y,
				linkedTo: "rookPair",
				r: 6,
				status: {}
			});
			if (inB$1(nx, y) && !S$1.walls.has(key(nx, y))) {
				S$1.enemies = S$1.enemies.filter((e) => !(e.x === nx && e.y === y));
				S$1.special.delete(key(nx, y));
				S$1.enemies.push({
					type: "rook",
					x: nx,
					y,
					linkedTo: "rookPair",
					r: 6,
					status: {}
				});
			}
		} else if (parsed.bossId === "millstone") S$1.special.set(k, {
			type: "millstone",
			dir: [0, -1]
		});
		else if (parsed.bossId === "king") {
			S$1.enemies.push({
				type: "king",
				x,
				y,
				king: true,
				armor: 99,
				r: 1,
				status: {}
			});
			[
				{
					dx: 0,
					dy: -2,
					type: "queen",
					retinue: "queen",
					r: 8,
					shield: 1
				},
				{
					dx: -3,
					dy: 0,
					type: "rook",
					retinue: "rook",
					r: 8,
					passive: true
				},
				{
					dx: 3,
					dy: 0,
					type: "rook",
					retinue: "rook",
					r: 8,
					passive: true
				},
				{
					dx: 3,
					dy: -4,
					type: "knight",
					retinue: "knight",
					r: 1,
					noAttackCd: true,
					attackReady: true
				},
				{
					dx: -3,
					dy: -4,
					type: "knight",
					retinue: "knight",
					r: 1,
					noAttackCd: true,
					attackReady: true
				}
			].forEach(({ dx, dy, type, retinue, r, shield, passive, noAttackCd }) => {
				const rx = x + dx, ry = y + dy;
				if (inB$1(rx, ry) && !S$1.walls.has(key(rx, ry))) {
					S$1.enemies = S$1.enemies.filter((e) => !(e.x === rx && e.y === ry));
					S$1.special.delete(key(rx, ry));
					const e2 = {
						type,
						x: rx,
						y: ry,
						retinue,
						r,
						status: {}
					};
					if (shield) e2.status.shield = shield;
					if (passive) e2.passive = true;
					if (noAttackCd) {
						e2.noAttackCd = true;
						e2.attackReady = true;
					}
					S$1.enemies.push(e2);
				}
			});
		}
		state.statusEl.textContent = `Босс «${parsed.bossId}» установлен.`;
	} else if (parsed.kind === "link") {
		const sp = S$1.special.get(k);
		if (sp && sp.type === "door") openDoorLinker(k);
		else state.statusEl.textContent = isEnglish() ? "Not a door — click a door." : "Это не дверь — кликни по двери.";
	}
	render();
}
function importJSON() {
	const text = prompt(isEnglish() ? "Paste level JSON:" : "Вставьте JSON уровня:");
	if (!text) return;
	try {
		const data = JSON.parse(text);
		closeEditor();
		loadLevel(data);
		editorActive = true;
		document.getElementById("editorBar").style.display = "";
		state.statusEl = document.getElementById("editorStatus");
		buildToolbar();
		log(isEnglish() ? "Level loaded from clipboard." : "Уровень загружен из буфера обмена.", "g");
	} catch (e) {
		log((isEnglish() ? "JSON parse error: " : "Ошибка парсинга JSON: ") + +e.message, "r");
	}
}
function exportJSON() {
	const data = buildLevelData();
	const json = JSON.stringify(data, null, 2);
	navigator.clipboard.writeText(json).then(() => log(isEnglish() ? "JSON copied." : "JSON скопирован.", "g")).catch(() => log("JSON:\n" + json, ""));
}
function buildLevelData() {
	snapshotEditorRoom();
	const rooms = S$1.rooms.map((r) => ({
		W: CFG.W,
		H: CFG.H,
		walls: [...r.walls],
		enemies: r.enemies.map((e) => ({
			type: e.type,
			x: e.x,
			y: e.y,
			...e.bossId ? { bossId: e.bossId } : {},
			...e.armor ? { armor: e.armor } : {},
			...e.linkedTo ? { linkedTo: e.linkedTo } : {},
			...e.passive ? { passive: true } : {},
			...e.king ? { king: true } : {},
			...e.retinue ? { retinue: e.retinue } : {},
			...e.noAttackCd ? { noAttackCd: true } : {},
			...e.r !== 1 ? { r: e.r } : {}
		})),
		special: Object.fromEntries(r.special)
	}));
	rooms[0].playerStart = {
		x: S$1.player.x,
		y: S$1.player.y
	};
	const doors = [];
	const seenDoors = /* @__PURE__ */ new Set();
	S$1.rooms.forEach((r, fromRoom) => {
		r.special.forEach((s, k) => {
			if (s.type === "door" && !seenDoors.has(k)) {
				const [x, y] = k.split(",").map(Number);
				const targetRoom = s.targetRoom;
				if (targetRoom != null && S$1.rooms[targetRoom]) {
					let pairedKey = null;
					S$1.rooms[targetRoom].special.forEach((ts, tk) => {
						if (ts.type === "door" && ts.targetRoom === fromRoom) pairedKey = tk;
					});
					if (pairedKey && !seenDoors.has(pairedKey)) {
						const [tx, ty] = pairedKey.split(",").map(Number);
						doors.push({
							color: s.color || null,
							fromRoom,
							fromX: x,
							fromY: y,
							toRoom: targetRoom,
							toX: tx,
							toY: ty
						});
						seenDoors.add(k);
						seenDoors.add(pairedKey);
					}
				}
			}
		});
	});
	return {
		floor: S$1.floor || 1,
		biome: S$1.biome?.id || "halls",
		rooms,
		doors
	};
}
//#endregion
//#region src/combat.js
/**
* src/combat.js — действия игрока, поток хода, голод, боссы, голоса костей.
* Основные экспорты: tryMoveTo(), rotate(), switchForm(), pass(), endPlayerTurn(),
* degradePlayer(), triggerSpecialForPlayer(), triggerBossPhase(), openVictory().
*/
function tryMoveTo(x, y) {
	if (S$1.gameOver || S$1.modalOpen) return;
	const { moves, captures } = playerOptions();
	const isCap = captures.some((c) => c.x === x && c.y === y);
	const isMove = moves.some((c) => c.x === x && c.y === y);
	if (!isCap && !isMove) {
		recordEvent("move_rejected", {
			to: [x, y],
			reason: "not_legal"
		});
		if (moves.length || captures.length) log(isEnglish() ? "No valid move to that cell." : "Нет хода на эту клетку.", "");
		return;
	}
	if (!tutorialAllowsMove(x, y)) {
		recordEvent("move_rejected", {
			to: [x, y],
			reason: "tutorial_locked"
		});
		tutorialNudge("move");
		return;
	}
	tutorialSnapshot();
	if (isMove && enemyAt(x, y)) {
		addSpeech(x, y, isEnglish() ? "Occupied." : "Занято.", "enemy");
		return;
	}
	if (!confirmMove(x, y)) {
		recordEvent("move_confirmation_requested", {
			to: [x, y],
			capture: isCap
		});
		render();
		syncUI();
		return;
	}
	const dx = Math.sign(x - S$1.player.x), dy = Math.sign(y - S$1.player.y);
	if (dx === 0 || dy === 0) S$1.player.facing = [dx, dy];
	if (isCap) {
		const e = enemyAt(x, y);
		const fatigue = has("no_fatigue") ? 0 : CFG.FATIGUE_K + (curse("brittle") ? 1 : 0);
		if (statusVal(e, "shield") > 0) {
			e.status.shield--;
			activeForm().cooldown = fatigue;
			log(isEnglish() ? `${GLYPH[e.type]} ${NAME_EN[e.type]} shield absorbs the hit.` : `Щит ${GLYPH[e.type]} ${NAME[e.type]} поглощает удар.`, "p");
			endPlayerTurn();
			return;
		}
		if (e.bossId === "tormentor") {
			activeForm().cooldown = fatigue;
			if (has("guard_pierce")) e.armor = 1;
			dispatchBossEvents(tormentorHit(e), {
				log: (t) => log(t),
				addSpeech: (x, y, t, kind) => addSpeech(x, y, t, kind)
			});
			if (e.armor > 0) triggerBossPhase("tormentor", e.phase);
			endPlayerTurn();
			return;
		}
		if (e.armor > 1 && !has("guard_pierce")) {
			e.armor--;
			activeForm().cooldown = fatigue;
			log(isEnglish() ? `You dent ${GLYPH[e.type]} ${NAME_EN[e.type]} (armor left: ${e.armor}).` : `Ты пробиваешь щит ${GLYPH[e.type]} ${NAME[e.type]} (осталось брони: ${e.armor})`, "p");
			endPlayerTurn();
			return;
		}
		S$1.enemies = S$1.enemies.filter((v) => v !== e);
		spawnParticles(x, y, "#d07a3f", 8);
		startCaptureFlash(x, y);
		playCapture();
		S$1.player.capturedThisFloor++;
		S$1.player.totalCaptures++;
		recordKill(e.type, false);
		{
			const act = actForFloor(S$1.floor);
			const line = pickLine(getScript().deathLines[act] || []);
			if (line && Math.random() < .35) addSpeech(x, y, line, "enemy");
		}
		if (e.linkedTo) {
			const revengeEvents = linkedRookRevenge(e);
			if (revengeEvents.some((ev) => ev && ev.ch === "capture")) {
				degradePlayer(null);
				if (S$1.gameOver) {
					render();
					syncUI();
					return;
				}
			} else revengeEvents.forEach((ev) => {
				if (ev && ev.ch === "speech") addSpeech(ev.x, ev.y, ev.text, ev.kind || "boss");
				if (ev && ev.ch === "log") log(ev.text);
			});
		}
		unlockAch("first_blood");
		activeForm().cooldown = fatigue;
		if (has("trophy")) S$1.player.wheel.forEach((f) => {
			if (f) f.cooldown = 0;
		});
		if (has("concuss")) {
			for (const o of S$1.enemies) if (Math.max(Math.abs(o.x - x), Math.abs(o.y - y)) === 1) applyStatus(o, "stun", 1);
		}
		log(isEnglish() ? `You take ${GLYPH[e.type]} ${NAME_EN[e.type]} with ${NAME_EN[activeForm().type]}.` : `Ты берёшь ${GLYPH[e.type]} ${NAME[e.type]} формой ${NAME[activeForm().type]}`, "p");
		log(moveNotation(S$1.player.x, S$1.player.y, x, y, GLYPH[activeForm().type], GLYPH[e.type]), "");
		S$1.player.hunger = Math.min(CFG.HUNGER.cap ?? CFG.HUNGER.start, S$1.player.hunger + CFG.HUNGER.capture);
		unlockType(e.type, tileColor(x, y));
	}
	const fx = S$1.player.x, fy = S$1.player.y;
	S$1.player.x = x;
	S$1.player.y = y;
	startMoveAnim(S$1.player, fx, fy, x, y);
	playMove();
	if (!isCap) log(moveNotation(fx, fy, x, y, GLYPH[activeForm().type]), "");
	triggerSpecialForPlayer();
	if (S$1.gameOver) {
		render();
		syncUI();
		return;
	}
	recordEvent(isCap ? "capture" : "move", {
		to: [x, y],
		form: activeForm().type
	});
	endPlayerTurn();
}
function triggerSpecialForPlayer() {
	const k = key(S$1.player.x, S$1.player.y), s = S$1.special.get(k);
	if (!s) return;
	if (s.type === "trap") {
		S$1.special.delete(k);
		log(isEnglish() ? "The web tears at you. Form destroyed." : "Паутина рвёт тебя. Форма разрушена.", "r");
		playTrap();
		degradePlayer(null);
	} else if (s.type === "rune") {
		S$1.special.delete(k);
		playRune();
		S$1.player.wheel.forEach((f) => {
			if (f) f.cooldown = 0;
		});
		cleanse(S$1.player);
		S$1.player.hunger = CFG.HUNGER.start;
		S$1.player.hungerMark = 1;
		log(isEnglish() ? "The Vein satiates — form fatigue and statuses cleansed." : "Жила насыщает — усталость форм и статусы сняты.", "g");
	} else if (s.type === "ice") {
		applyStatus(S$1.player, "stun", 1);
		log(isEnglish() ? "You slipped on ice — stunned." : "Ты поскользнулся на льду — оглушение.", "r");
	} else if (s.type === "portal") {
		const p = s.pair;
		if (p && !S$1.walls.has(key(p.x, p.y)) && !enemyAt(p.x, p.y)) {
			S$1.player.x = p.x;
			S$1.player.y = p.y;
			log(isEnglish() ? "The portal teleports you." : "Портал переносит тебя.", "p");
			playPortal();
		}
	} else if (s.type === "conveyor") {
		const [dx, dy] = s.dir;
		let nx = S$1.player.x + dx;
		let ny = S$1.player.y + dy;
		if (inB$1(nx, ny) && !S$1.walls.has(key(nx, ny)) && !enemyAt(nx, ny)) {
			S$1.player.x = nx;
			S$1.player.y = ny;
			const visited = /* @__PURE__ */ new Set();
			visited.add(k);
			while (true) {
				const ck = key(S$1.player.x, S$1.player.y);
				if (visited.has(ck)) break;
				visited.add(ck);
				const cs = S$1.special.get(ck);
				if (!cs || cs.type !== "conveyor") break;
				nx = S$1.player.x + cs.dir[0];
				ny = S$1.player.y + cs.dir[1];
				if (!inB$1(nx, ny) || S$1.walls.has(key(nx, ny)) || enemyAt(nx, ny)) break;
				S$1.player.x = nx;
				S$1.player.y = ny;
			}
			log(isEnglish() ? "The conveyor pushes you." : "Конвейер сдвигает тебя.", "p");
			const finalSpecial = S$1.special.get(key(S$1.player.x, S$1.player.y));
			if (finalSpecial && finalSpecial.type !== "conveyor") triggerSpecialForPlayer();
		}
	} else if (s.type === "plate") {
		if (s.chain) {
			if (s.broken) return;
			s.broken = true;
			S$1.chainsBroken = (S$1.chainsBroken || 0) + 1;
			log(isEnglish() ? `Chain broken (${S$1.chainsBroken}/${BOSS_CFG.redKing.chains}).` : `Цепь разорвана (${S$1.chainsBroken}/${BOSS_CFG.redKing.chains}).`, "g");
			const king = S$1.enemies.find((e) => e.king);
			if (king && getScript().bosses.redKing) {
				const line = getScript().bosses.redKing.chainBreak[S$1.chainsBroken];
				if (line) {
					addSpeech(king.x, king.y, line.text, "boss");
					log(line.text);
				}
			}
		} else if (s.opens && S$1.walls.has(key(s.opens.x, s.opens.y))) {
			S$1.walls.delete(key(s.opens.x, s.opens.y));
			log(isEnglish() ? "The plate opens a passage." : "Плита открывает проход.", "g");
		}
	} else if (s.type === "lava") {
		log(isEnglish() ? "You are in lava! Form destroyed." : "Ты в лаве! Форма разрушена.", "r");
		degradePlayer(null);
	} else if (s.type === "door") {
		snapshotRoom();
		if (s.color && S$1.keys.has(s.color)) {
			S$1.keys.delete(s.color);
			s.color = null;
			const targetRoom = S$1.rooms[s.targetRoom];
			if (targetRoom) targetRoom.special.forEach((ds) => {
				if (ds.type === "door" && ds.targetRoom === S$1.currentRoom) ds.color = null;
			});
		}
		if (s.color && !S$1.keys.has(s.color)) {
			log(isEnglish() ? `Door is locked — need a ${KEY_GLYPH[s.color]} ключ.` : `Дверь заперта — нужен ${KEY_GLYPH[s.color]} ключ.`, "r");
			return;
		}
		loadRoom(s.targetRoom);
		S$1.player.x = s.targetPos.x;
		S$1.player.y = s.targetPos.y;
		syncCheckIndicator();
		recordSnapshot("room_entered", { room: s.targetRoom });
		screenFade("#000", 250);
		log(isEnglish() ? `Entering room ${s.targetRoom + 1}.` : `Переход в комнату ${s.targetRoom + 1}.`, "p");
		playPortal();
		render();
		syncUI();
		return;
	} else if (s.type === "key") {
		S$1.keys.add(s.color);
		S$1.special.delete(k);
		log(isEnglish() ? `You found a ${KEY_GLYPH[s.color]} key.` : `Ты нашёл ${KEY_GLYPH[s.color]} ключ.`, "g");
		playLoot();
	} else if (s.type === "food") {
		S$1.special.delete(k);
		S$1.player.hunger = Math.min(CFG.HUNGER.cap ?? CFG.HUNGER.start, S$1.player.hunger + CFG.HUNGER.food);
		S$1.player.hungerMark = 1;
		log(isEnglish() ? `You eat a bone (+${CFG.HUNGER.food} satiety, total ${S$1.player.hunger}/${CFG.HUNGER.start}).` : `Ты съедаешь кость (+${CFG.HUNGER.food} сытости, всего ${S$1.player.hunger}/${CFG.HUNGER.start}).`, "g");
		tutorialMark("eat");
		playLoot();
	} else if (s.type === "scroll") {
		S$1.special.delete(k);
		playLoot();
		if (Math.random() < .5) {
			const pool = Object.keys(RELICS).filter((id) => !S$1.player.relics.has(id));
			if (pool.length) {
				const id = pool[Math.floor(Math.random() * pool.length)];
				applyRelic(id);
				log(isEnglish() ? `Scroll: <b>${RELICS[id].enName}</b> — ${RELICS[id].enDesc}` : `Свиток: <b>${RELICS[id].name}</b> — ${RELICS[id].desc}`, "g");
			}
		} else {
			const pool = Object.keys(CURSES).filter((id) => !S$1.player.curses.has(id));
			if (pool.length) {
				const id = pool[Math.floor(Math.random() * pool.length)];
				applyCurse(id);
				log(isEnglish() ? `Scroll: <b>☠ ${CURSES[id].enName}</b> — ${CURSES[id].enDesc}` : `Свиток: <b>☠ ${CURSES[id].name}</b> — ${CURSES[id].desc}`, "r");
			}
		}
	}
}
/** Срабатывание фазы босса — лог и speech. */
function triggerBossPhase(bossId, phase) {
	const boss = getScript().bosses[bossId];
	if (!boss) return;
	const key = phase === 2 ? "phase2" : phase === 3 ? "phase3" : null;
	if (!key || !boss[key]) return;
	for (const line of boss[key]) if (line.ch === "log") log(line.text);
	else if (line.ch === "speech") {
		const e = S$1.enemies.find((en) => en.bossId === bossId) || S$1.enemies[0];
		if (e) addSpeech(e.x, e.y, line.text, line.kind || "boss");
		log(line.text);
	}
}
function unlockType(t, colorAt) {
	if (!STD_TYPES.has(t)) {
		log(isEnglish() ? `Form "${NAME_EN[t] || t}" is not available to the player.` : `Форма «${NAME[t] || t}» недоступна игроку.`);
		return;
	}
	if (S$1.unlocked.has(t)) {
		log(isEnglish() ? `«${NAME_EN[t]}» already yours. Extra bone.` : `«${NAME[t]}» у тебя уже есть. Кость лишняя.`);
		return;
	}
	S$1.unlocked.add(t);
	if ([...STD_TYPES].every((x) => S$1.unlocked.has(x))) unlockAch("polymorph");
	const slot = S$1.player.wheel.findIndex((s, i) => i > 0 && s === null);
	if (slot !== -1) {
		S$1.player.wheel[slot] = makeForm(t, colorAt);
		log(isEnglish() ? `Form <b>${NAME_EN[t]}</b> added to wheel (slot ${slot}).` : `Форма <b>${NAME[t]}</b> добавлена в колесо (слот ${slot})`, "g");
	} else log(isEnglish() ? `Type «${NAME_EN[t]}» unlocked in pool — wheel is full.` : `Тип «${NAME[t]}» открыт в пуле — колесо заполнено.`, "g");
}
function switchForm(i) {
	if (S$1.gameOver || S$1.modalOpen) return;
	if (S$1.challenge === "lone_figure") {
		log(isEnglish() ? "Lone Figure: form switching disabled." : "Одинокая фигура: смена формы запрещена.", "r");
		return;
	}
	if (!tutorialAllowsSwitch()) return tutorialNudge("switch");
	const f = S$1.player.wheel[i];
	if (!f) {
		log(isEnglish() ? "This wheel slot is empty." : "Этот слот колеса пуст.", "");
		return;
	}
	if (i === S$1.player.active) {
		log(isEnglish() ? "This form is already active." : "Эта форма уже активна.", "");
		return;
	}
	if (f.cooldown > 0) {
		log(isEnglish() ? `«${NAME_EN[f.type]}» fatigued — ${f.cooldown} t. left` : `«${NAME[f.type]}» устала — ещё ${f.cooldown} х.`, "r");
		return;
	}
	S$1.player.active = i;
	recordEvent("switch_form", {
		slot: i,
		form: f.type
	});
	recordSnapshot("form_switched");
	const formType = S$1.player.wheel[i].type;
	if (!has("silence") && !S$1.player.wheel[i]._seenBefore) {
		S$1.player.wheel[i]._seenBefore = true;
		S$1.player.boneVoiceTimer = 3;
		const lines = getScript().boneVoices[formType];
		if (lines && lines.length) {
			const line = lines[Math.floor(Math.random() * lines.length)];
			addSpeech(S$1.player.x, S$1.player.y, line, "bone");
			log(line);
		}
	}
	if (has("free_swap") && !S$1.player.freeSwapUsed) {
		S$1.player.freeSwapUsed = true;
		log(isEnglish() ? `Switch form → <b>${NAME_EN[f.type]}</b> (for free).` : `Смена формы → <b>${NAME[f.type]}</b> (бесплатно).`, "p");
		render();
		syncUI();
		return;
	}
	log(isEnglish() ? `Switch form → <b>${NAME_EN[f.type]}</b> (wasted move).` : `Смена формы → <b>${NAME[f.type]}</b> (потрачен ход).`, "p");
	endPlayerTurn();
}
function rotate(dir) {
	if (S$1.gameOver || S$1.modalOpen) return;
	if (!tutorialAllowsRotate()) return tutorialNudge("rotate");
	const i = ORTHO.findIndex(([dx, dy]) => dx === S$1.player.facing[0] && dy === S$1.player.facing[1]);
	S$1.player.facing = ORTHO[(i + dir + 4) % 4];
	recordEvent("rotate", {
		direction: dir,
		facing: S$1.player.facing
	});
	recordSnapshot("rotated");
	render();
	syncUI();
}
function pass() {
	if (S$1.gameOver || S$1.modalOpen) return;
	if (curse("compulsion")) {
		const { moves, captures } = playerOptions();
		const canSwitch = S$1.player.wheel.some((f, i) => f && i !== S$1.player.active && f.cooldown === 0);
		if (moves.length || captures.length || canSwitch) {
			log(isEnglish() ? "Compulsion: cannot pass while moves exist." : "Одержимость: пасовать нельзя, пока есть ход.", "r");
			return;
		}
	}
	S$1.player.hunger -= CFG.HUNGER.passExtra;
	recordEvent("pass", { hunger: S$1.player.hunger });
	log(isEnglish() ? `Pass. Hunger deepens (−${CFG.HUNGER.passExtra}).` : `Пас. Голод крепчает (−${CFG.HUNGER.passExtra}).`);
	endPlayerTurn();
}
function endPlayerTurn() {
	clearPending();
	recordSnapshot("turn_started");
	if (S$1.player.status && S$1.player.status.haste > 0) S$1.player.status.haste--;
	if (!(S$1.runMode === "campaign" && isBossFloor(S$1.floor))) {
		S$1.player.hunger -= CFG.HUNGER.perTurn;
		{
			const ratio = S$1.player.hunger / CFG.HUNGER.start;
			for (const th of [
				.4,
				.25,
				.1,
				0
			]) if (ratio <= th && (S$1.player.hungerMark ?? 1) > th) {
				S$1.player.hungerMark = th;
				const line = getScript().hungerLines[th];
				if (line) log(line, "r");
				break;
			}
		}
		if (S$1.player.hunger <= 0) {
			S$1.player.hunger = 0;
			log(isEnglish() ? "Hunger devours you. Form destroyed." : "Голод пожирает тебя. Форма разрушена.", "r");
			degradePlayer(null);
			if (S$1.gameOver) {
				render();
				syncUI();
				return;
			}
		}
		setHungerLayer(S$1.player.hunger < CFG.HUNGER.start * .25);
	}
	const bloodBlocked = curse("bloodline") && S$1.player.capturedThisFloor > 0;
	if (!S$1.promotionUsed && activeForm().type === "pawn" && S$1.player.y === 0 && !bloodBlocked) {
		openPromotion();
		render();
		syncUI();
		return;
	}
	if (!S$1.promotionUsed && bloodBlocked && activeForm().type === "pawn" && S$1.player.y === 0) log(isEnglish() ? "Bloodline: ascension blocked — a capture occurred this floor." : "Кровавая линия: промоушен закрыт — на этаже уже было взятие.", "r");
	if (S$1.challenge === "chaos_wheel" && S$1.turn > 0 && S$1.turn % 3 === 0) {
		const alive = S$1.player.wheel.map((f, idx) => f ? idx : -1).filter((idx) => idx >= 0 && idx !== S$1.player.active);
		if (alive.length > 0) {
			const pick = alive[Math.floor(Math.random() * alive.length)];
			S$1.player.active = pick;
			log(isEnglish() ? `🌀 Chaos: form switched to <b>${NAME[activeForm().type]}</b>.` : `🌀 Хаос: форма сменена на <b>${NAME[activeForm().type]}</b>.`, "p");
		}
	}
	tutorialCheck();
	if (isTutorial() && tutorialEnemiesFrozen()) {
		render();
		syncUI();
		return;
	}
	enemiesTurn();
}
function startPlayerTurn() {
	if (isTutorial()) return false;
	if (has("toxic_aura")) {
		for (const o of S$1.enemies) if (cheb(o, S$1.player) <= 1) applyStatus(o, "poison", 1);
	}
	if (statusVal(S$1.player, "poison") > 0) {
		S$1.player.status.poison--;
		if (S$1.player.status.poison <= 0) {
			log(isEnglish() ? "Poison destroys your form." : "Яд разрушает твою форму.", "r");
			degradePlayer(null);
			if (S$1.gameOver) return true;
		}
	}
	if (statusVal(S$1.player, "stun") > 0) {
		S$1.player.status.stun--;
		log(isEnglish() ? "You are stunned — turn skipped." : "Ты оглушён — ход пропущен.", "r");
		enemiesTurn();
		return true;
	}
	return false;
}
function afterEnemies() {
	if (isTutorial()) {
		render();
		syncUI();
		return;
	}
	S$1.turn++;
	if (S$1.player.boneVoiceTimer > 0) {
		S$1.player.boneVoiceTimer--;
		if (S$1.player.boneVoiceTimer > 0 && Math.random() < .4) {
			const ft = activeForm().type;
			const lines = getScript().boneVoices[ft];
			if (lines && lines.length) {
				const line = lines[Math.floor(Math.random() * lines.length)];
				addSpeech(S$1.player.x, S$1.player.y, line, "bone");
				log(line);
			}
		}
	}
	S$1.player.wheel.forEach((f) => {
		if (f && f.cooldown > 0) f.cooldown--;
	});
	spreadLava();
	if (S$1.challenge === "storm") unlockAch("storm_chaser");
	if (S$1.challenge === "lone_figure") unlockAch("glass_cannon");
	const millQuota = BOSS_CFG.puppeteer.jamQuota;
	if (bossOnFloor(S$1.floor) === "millstone" && S$1.millFed >= millQuota && !S$1.gameOver) {
		const room = S$1.rooms[S$1.currentRoom];
		if (room && !room.cleared) {
			room.cleared = true;
			room.enemies = [];
		}
		log(isEnglish() ? "Floor cleared! The millstone is jammed." : "Ярус зачищен! Жернов встал.", "g");
		if (!S$1.player.lostFormThisFloor) unlockAch("flawless");
		render();
		syncUI();
		if (S$1.runMode === "campaign" && getScript().interludes.act2to3) {
			openInterlude({
				...getScript().interludes.act2to3,
				art: ART.act2to3
			}, () => offerLoot());
			return;
		}
		offerLoot();
		return;
	}
	if (S$1.enemies.length === 0 && !S$1.gameOver) {
		if (isEditorRunning()) {
			closeModal();
			log(isEnglish() ? "All enemies destroyed — simulation complete." : "Все враги уничтожены — симуляция завершена.", "g");
			stopEditorRun();
			return;
		}
		const room = S$1.rooms[S$1.currentRoom];
		if (room && !room.cleared) {
			room.cleared = true;
			room.enemies = [];
		}
		if (!S$1.rooms.every((r) => r.cleared)) {
			log(isEnglish() ? "Room cleared — find a door to the remaining enemies." : "Комната зачищена — пройди через дверь к оставшимся врагам.", "g");
			render();
			syncUI();
			return;
		}
		if (S$1.runMode === "campaign" && isFinalFloor(S$1.floor)) {
			log(isEnglish() ? "The King has fallen. The Dungeon went silent." : "Король пал. Подземелье затихло.", "g");
			openVictory();
			return;
		}
		log(isEnglish() ? "Floor cleared!" : "Ярус зачищен!", "g");
		if (!S$1.player.lostFormThisFloor) unlockAch("flawless");
		if (!S$1.player.capturedThisFloor) unlockAch("pacifist");
		render();
		syncUI();
		if (S$1.runMode === "campaign") {
			if (S$1.floor === 5 && getScript().interludes.act1to2) {
				openInterlude({
					...getScript().interludes.act1to2,
					art: ART.act1to2,
					mode: "aside"
				}, () => offerLoot());
				return;
			}
			if (S$1.floor === 11 && getScript().interludes.act2to3) {
				openInterlude({
					...getScript().interludes.act2to3,
					art: ART.act2to3
				}, () => offerLoot());
				return;
			}
		}
		offerLoot();
		return;
	}
	if (startPlayerTurn()) return;
	if (S$1.gameOver) {
		render();
		syncUI();
		return;
	}
	recordSnapshot("turn_resolved");
	checkMate();
	render();
	syncUI();
}
function spreadLava() {
	if (!S$1.special) return;
	const lavas = [...S$1.special.entries()].filter(([_, s]) => s.type === "lava");
	if (!lavas.length || lavas.length >= 8 || Math.random() > .3) return;
	const [lk] = pick(lavas);
	const [lx, ly] = lk.split(",").map(Number);
	const opts = ORTHO.map(([dx, dy]) => ({
		x: lx + dx,
		y: ly + dy
	})).filter((c) => c.x > 0 && c.x < CFG.W - 1 && c.y > 0 && c.y < CFG.H - 1 && !S$1.walls.has(key(c.x, c.y)) && !S$1.special.get(key(c.x, c.y)) && !enemyAt(c.x, c.y) && !(S$1.player.x === c.x && S$1.player.y === c.y));
	if (opts.length) {
		const c = pick(opts);
		S$1.special.set(key(c.x, c.y), { type: "lava" });
	}
}
function degradePlayer(byEnemy) {
	if (S$1.godMode) return;
	const f = activeForm();
	if (byEnemy && has("venom")) applyStatus(byEnemy, "poison", 2);
	if (statusVal(S$1.player, "shield") > 0) {
		S$1.player.status.shield--;
		log(isEnglish() ? "Shield absorbs the capture!" : "Щит поглощает взятие!", "g");
		if (byEnemy) {
			byEnemy.cd = CFG.ENEMY_CAPTURE_CD;
			if (has("bulwark")) applyStatus(byEnemy, "stun", 1);
		}
		return;
	}
	if (f.type === "pawn" && has("pawn_shield") && !S$1.player.pawnShieldUsed) {
		S$1.player.pawnShieldUsed = true;
		log(isEnglish() ? "Pawn Talisman flares — capture deflected! (one-use)" : "Талисман пешки вспыхивает — взятие отражено! (одноразово)", "g");
		if (byEnemy) byEnemy.cd = CFG.ENEMY_CAPTURE_CD;
		return;
	}
	if (S$1.challenge === "lone_figure") {
		death();
		return;
	}
	if (byEnemy) log(isEnglish() ? `${GLYPH[byEnemy.type]} ${NAME_EN[byEnemy.type]} captures you! Form «${NAME_EN[f.type]}» destroyed.` : `${GLYPH[byEnemy.type]} ${NAME[byEnemy.type]} берёт тебя! Форма «${NAME[f.type]}» уничтожена.`, "r");
	else log(isEnglish() ? `Form «${NAME_EN[f.type]}» destroyed.` : `Форма «${NAME[f.type]}» уничтожена.`, "r");
	if (byEnemy && curse("hex")) applyStatus(S$1.player, "poison", 2);
	if (f.type === "pawn" && S$1.challenge !== "lone_figure") {
		death();
		return;
	}
	S$1.player.wheel[S$1.player.active] = null;
	S$1.player.lostFormThisFloor = true;
	const alive = S$1.player.wheel.map((s, i) => ({
		s,
		i
	})).filter((v) => v.s);
	alive.sort((a, b) => CFG.LADDER[b.s.type] - CFG.LADDER[a.s.type]);
	const lower = alive.find((v) => CFG.LADDER[v.s.type] <= CFG.LADDER[f.type]) || alive[alive.length - 1];
	S$1.player.active = lower.i;
	log(isEnglish() ? `Degradation → you are now <b>${NAME_EN[activeForm().type]}</b>.${byEnemy ? ` Enemy catches breath (${CFG.ENEMY_CAPTURE_CD} t.).` : ""}` : `Деградация → теперь ты <b>${NAME[activeForm().type]}</b>.${byEnemy ? ` Враг переводит дух (${CFG.ENEMY_CAPTURE_CD} х.).` : ""}`, "r");
}
function death() {
	if (isEditorRunning()) {
		closeModal();
		log(isEnglish() ? "Death in test simulation." : "Смерть в тестовой симуляции.", "r");
		stopEditorRun();
		return;
	}
	S$1.gameOver = true;
	finishAnalyticsRun("death", {
		floor: S$1.floor,
		turn: S$1.turn
	});
	sting("death");
	const earned = endRunMeta();
	openRunSummary(L("summary.dead"), L("summary.deadSub"), earned);
}
function checkMate() {
	if (S$1.gameOver) return;
	const onThreat = allThreats().has(key(S$1.player.x, S$1.player.y));
	dom.shahEl.classList.toggle("on", onThreat);
	if (!onThreat) return;
	const { moves, captures } = playerOptions();
	const canSwitch = S$1.player.wheel.some((f, i) => f && i !== S$1.player.active && f.cooldown === 0);
	if (moves.length || captures.length || canSwitch) return;
	log(isEnglish() ? "No moves. You are taken on the spot." : "Ходов нет. Тебя вскрывают на месте.", "r");
	degradePlayer(null);
	if (S$1.gameOver) return;
	for (const e of S$1.enemies) if (cheb(e, S$1.player) === 1) {
		const nx = e.x + Math.sign(e.x - S$1.player.x), ny = e.y + Math.sign(e.y - S$1.player.y);
		if (inB$1(nx, ny) && !S$1.walls.has(key(nx, ny)) && !enemyAt(nx, ny)) {
			e.x = nx;
			e.y = ny;
		}
	}
}
function openVictory() {
	if (isEditorRunning()) {
		closeModal();
		log(isEnglish() ? "Victory in test simulation." : "Победа в тестовой симуляции.", "g");
		stopEditorRun();
		return;
	}
	S$1.gameOver = true;
	finishAnalyticsRun("victory", {
		floor: S$1.floor,
		turn: S$1.turn
	});
	S$1.modalOpen = true;
	playTrack("ending");
	const earned = endRunMeta();
	const finish = (id, art) => {
		closeModal();
		const e = getScript().endings[id];
		if (e) openInterlude({
			...e,
			art,
			button: isEnglish() ? "The End" : "Конец"
		}, () => openRunSummary(e.title, "", earned, { win: true }));
		else openRunSummary(L("app.title"), "", earned, { win: true });
	};
	openModal(L("modal.victory"), L("modal.victoryText", S$1.floor, S$1.player.totalCaptures, earned), [
		{
			label: L("modal.victoryKill"),
			fn: () => finish("kill", ART.endingKill)
		},
		{
			label: L("modal.victoryThrone"),
			fn: () => finish("throne", ART.endingThrone)
		},
		{
			label: L("modal.victoryBreak"),
			fn: () => finish("breakBoard", ART.endingBreak)
		}
	], false);
}
function openPromotion() {
	S$1.promotionUsed = true;
	const choices = [...S$1.unlocked].filter((t) => t !== "pawn");
	if (choices.length === 0) {
		enemiesTurn();
		return;
	}
	openModal(L("modal.promotion"), L("modal.promotionText"), choices.map((t) => ({
		label: GLYPH[t] + " " + (isEnglish() ? NAME_EN[t] : NAME[t]),
		fn: () => {
			const f = makeForm(t, tileColor(S$1.player.x, S$1.player.y), true);
			let slot = S$1.player.wheel.findIndex((s, i) => i > 0 && s === null);
			if (slot === -1) slot = S$1.player.wheel.findIndex((s, i) => i > 0 && s.type === t);
			if (slot === -1) slot = S$1.player.wheel.length - 1;
			S$1.player.wheel[slot] = f;
			S$1.player.active = slot;
			log(isEnglish() ? `Ascension: you become <b>${NAME_EN[t]} ★</b> (slot ${slot}).` : `Восхождение: превращаешься в <b>${NAME[t]} ★</b> (слот ${slot}).`, "g");
			playPromotion();
			if (t === "queen") unlockAch("kingmaker");
			closeModal();
			enemiesTurn();
		}
	})), false, { glyphs: true });
}
//#endregion
//#region src/hud.js
var HUNGER_GROUP = 6;
/** Контейнер для новых блоков. Вставляется сразу после строки статуса. */
function ensureHost() {
	let host = document.getElementById("hudExtra");
	if (host) return host;
	host = document.createElement("div");
	host.id = "hudExtra";
	const anchor = document.getElementById("subbar");
	if (anchor) anchor.appendChild(host);
	else document.body.appendChild(host);
	return host;
}
function ensureChild(host, id, tag = "div", cls = "") {
	let el = document.getElementById(id);
	if (el) return el;
	el = document.createElement(tag);
	el.id = id;
	if (cls) el.className = cls;
	host.appendChild(el);
	return el;
}
/**
* Шкала с делениями по 6 + числовой остаток ходов.
* Игрок должен уметь ответить на вопрос «сколько у меня ходов» не считая рёбра.
*/
function renderHunger() {
	if (!dom.hungerRibs || !S$1.player || S$1.player.hunger === void 0) return;
	const max = CFG.HUNGER.cap ?? CFG.HUNGER.start;
	const val = Math.max(0, Math.min(max, S$1.player.hunger));
	const perTurn = CFG.HUNGER.perTurn || 1;
	const turns = Math.ceil(val / perTurn);
	const frozen = S$1.runMode === "campaign" && isBossFloor(S$1.floor);
	let html = "";
	for (let i = 0; i < max; i++) {
		if (i > 0 && i % HUNGER_GROUP === 0) html += "<span class=\"rib-gap\"></span>";
		let cls = "rib";
		if (i < val) {
			cls += turns <= HUNGER_GROUP ? " rib-starve" : turns <= HUNGER_GROUP * 2 ? " rib-low" : " rib-on";
			if (i >= CFG.HUNGER.start) cls += " rib-over";
		}
		html += `<span class="${cls}"></span>`;
	}
	dom.hungerRibs.innerHTML = html;
	let el = document.getElementById("hungerCount");
	if (!el) {
		el = document.createElement("span");
		el.id = "hungerCount";
		if (dom.hungerRibs.parentNode) dom.hungerRibs.parentNode.insertBefore(el, dom.hungerRibs.nextSibling);
	}
	el.className = frozen ? "hcount frozen" : turns <= HUNGER_GROUP ? "hcount warn" : "hcount";
	el.textContent = frozen ? L("hud.hungerFrozen", val) : val + " · " + L("hud.turnsLeft", turns);
	el.title = frozen ? L("hud.hungerFrozenTTL") : L("hud.hungerTTL", val, max, CFG.HUNGER.capture, CFG.HUNGER.food, CFG.HUNGER.passExtra);
}
/** Какой ключ нужен, чтобы войти в комнату i (null — открыта). */
function lockOf(i) {
	for (const room of S$1.rooms) {
		if (!room || !room.special) continue;
		for (const [, s] of room.special) if (s.type === "door" && s.targetRoom === i && s.color) return s.color;
	}
	return null;
}
function renderRooms(host) {
	const el = ensureChild(host, "roomMap", "div", "roommap");
	if (!S$1.rooms || S$1.rooms.length <= 1) {
		el.style.display = "none";
		return;
	}
	el.style.display = "";
	let html = "<span class=\"rm-label\">" + L("hud.rooms") + "</span>";
	S$1.rooms.forEach((r, i) => {
		if (i) html += "<span class=\"rm-link\"></span>";
		const cur = i === S$1.currentRoom;
		const left = cur ? S$1.enemies.length : (r.enemies || []).length;
		const lock = r.cleared ? null : lockOf(i);
		const cls = "rm" + (r.cleared ? " rm-clear" : "") + (cur ? " rm-cur" : "") + (lock && !cur ? " rm-lock" : "");
		const face = r.cleared ? "✓" : lock && !cur ? KEY_GLYPH[lock] : left || "·";
		const tip = r.cleared ? L("hud.roomClear", i + 1) : L("hud.roomEnemies", i + 1, left, lock ? " · " + KEY_GLYPH[lock] + " key" : "");
		html += `<span class="${cls}" title="${tip}">${face}</span>`;
	});
	el.innerHTML = html;
}
/**
* Список костей и швов в DOM. Раньше это была канвасная панель по наведению
* на свою фигуру — на телефоне она была недостижима вообще.
*/
function renderMods() {
	const card = document.getElementById("relicCard");
	const box = document.getElementById("relics");
	if (!card || !box) return;
	const rids = [...S$1.player.relics];
	const cids = [...S$1.player.curses];
	card.style.display = rids.length || cids.length ? "block" : "none";
	if (!rids.length && !cids.length) return;
	let head = document.getElementById("modHead");
	if (!head) {
		head = document.createElement("button");
		head.id = "modHead";
		head.className = "modhead";
		head.onclick = () => {
			card.classList.toggle("collapsed");
			renderMods();
		};
		card.insertBefore(head, box);
	}
	const open = !card.classList.contains("collapsed");
	head.innerHTML = "<span class=\"mh-t\">" + L("hud.mods") + "</span><span class=\"mh-n rel\">✦" + rids.length + "</span><span class=\"mh-n cur\">☠" + cids.length + "</span><span class=\"mh-x\">" + (open ? "▾" : "▸") + "</span>";
	box.innerHTML = "";
	rids.forEach((id) => {
		const tm = TIER_META[relicTier(id)];
		const c = document.createElement("span");
		c.className = "chip chip-" + tm.cls;
		c.textContent = LContent(RELICS[id], "name");
		c.title = LContent(RELICS[id], "desc") + " (" + LContent(TIER_META[relicTier(id)], "name") + ")";
		box.appendChild(c);
	});
	cids.forEach((id) => {
		const c = document.createElement("span");
		c.className = "chip curse";
		c.textContent = "☠ " + LContent(CURSES[id], "name");
		c.title = LContent(CURSES[id], "desc");
		box.appendChild(c);
	});
}
/**
* Бейдж на каждом слоте: сколько ходов и взятий даст эта форма отсюда.
* Вызывается после того, как syncUI() перестроил dom.wheelEl.
*/
function decorateWheel() {
	if (!dom.wheelEl || !dom.wheelEl.children.length) return;
	let sum;
	try {
		sum = wheelSummary();
	} catch (e) {
		console.warn("wheelSummary failed", e);
		return;
	}
	[...dom.wheelEl.children].forEach((el, i) => {
		const s = sum[i];
		if (!s) return;
		const total = s.moves + s.captures;
		const b = document.createElement("span");
		b.className = "slot-opts" + (total === 0 ? " none" : s.captures ? " cap" : "");
		b.textContent = s.captures ? `${s.moves}·${s.captures}⚔` : `${s.moves}`;
		b.title = total === 0 ? L("wheel.noMoves") : L("wheel.moves", s.moves, s.captures);
		el.appendChild(b);
	});
}
/** Кто держит игрока под боем прямо сейчас. Дублирует индикатор шаха словами. */
function renderCheck(host) {
	const el = ensureChild(host, "checkLine", "div", "checkline");
	if (S$1.gameOver || !S$1.player) {
		el.style.display = "none";
		return;
	}
	const by = threatenersAt(S$1.player.x, S$1.player.y);
	if (!by.length) {
		el.style.display = "none";
		return;
	}
	el.style.display = "";
	const counts = /* @__PURE__ */ new Map();
	by.forEach((e) => counts.set(e.type, (counts.get(e.type) || 0) + 1));
	const list = [...counts].map(([t, n]) => `${GLYPH[t] || "?"}${n > 1 ? "×" + n : ""}`).join(" ");
	el.innerHTML = "<span class=\"ck-t\">" + L("hud.underThreat") + "</span> " + list;
	el.title = [...counts].map(([t, n]) => `${NAME[t]}${n > 1 ? ` ×${n}` : ""}`).join(", ");
}
/** Единая точка входа — вызывать в конце syncUI(). */
function syncHud() {
	try {
		const host = ensureHost();
		renderHunger();
		renderRooms(host);
		renderCheck(host);
		renderMods();
		decorateWheel();
	} catch (e) {
		console.error("syncHud", e);
	}
}
//#endregion
//#region \0vite/preload-helper.js
var scriptRel = "modulepreload";
var assetsURL = function(dep, importerUrl) {
	return new URL(dep, importerUrl).href;
};
var seen = {};
var __vitePreload = function preload(baseModule, deps, importerUrl) {
	let promise = Promise.resolve();
	if (deps && deps.length > 0) {
		const links = document.getElementsByTagName("link");
		const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
		const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
		function allSettled(promises) {
			return Promise.all(promises.map((p) => Promise.resolve(p).then((value) => ({
				status: "fulfilled",
				value
			}), (reason) => ({
				status: "rejected",
				reason
			}))));
		}
		function importMetaResolve(specifier) {
			if (import.meta.resolve) return import.meta.resolve(specifier);
			return new URL(
				specifier,
				/** #__KEEP__ */
				import.meta.url
			).href;
		}
		promise = allSettled(deps.map((dep) => {
			dep = assetsURL(dep, importerUrl);
			dep = importMetaResolve(dep);
			if (dep in seen) return;
			seen[dep] = true;
			const isCss = dep.endsWith(".css");
			for (let i = links.length - 1; i >= 0; i--) {
				const link = links[i];
				if (link.href === dep && (!isCss || link.rel === "stylesheet")) return;
			}
			const link = document.createElement("link");
			link.rel = isCss ? "stylesheet" : scriptRel;
			if (!isCss) link.as = "script";
			link.crossOrigin = "";
			link.href = dep;
			if (cspNonce) link.setAttribute("nonce", cspNonce);
			document.head.appendChild(link);
			if (isCss) return new Promise((res, rej) => {
				link.addEventListener("load", res);
				link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
			});
		}));
	}
	function handlePreloadError(err) {
		const e = new Event("vite:preloadError", { cancelable: true });
		e.payload = err;
		window.dispatchEvent(e);
		if (!e.defaultPrevented) throw err;
	}
	return promise.then((res) => {
		for (const item of res || []) {
			if (item.status !== "rejected") continue;
			handlePreloadError(item.reason);
		}
		return baseModule().catch(handlePreloadError);
	});
};
//#endregion
//#region src/ui.js
/**
* src/ui.js — DOM-интерфейс: модалки, настройки, шкала голода, интерлюдии, лог.
* Основные экспорты: log(), syncUI(), openModal(), openInterlude(), openSettings(),
* openTitle(), openRunSummary(), openLoot(), toast(), closeModal().
*/
/** Узел по id: сначала из dom.js, иначе напрямую. */
var el = (id) => dom[id] || document.getElementById(id);
/**
* Подготовить окно: размер, картинка, сброс прошлого содержимого.
* Вызывать первой строкой каждого open*.
*
* Картинки 512×768 — карточки с собственной рамкой и центрированной
* композицией. Обрезать их нельзя, только масштабировать целиком, поэтому
* режима два и оба показывают кадр полностью:
*
*   'hero'  — картинка и есть событие (интерлюдии, эпилоги, боссы):
*             во всю доступную высоту, заголовок под ней.
*   'aside' — картинка как контекст (меню, справка, лут, события):
*             маленькая карточка слева, заголовок и текст справа.
*
* Текст никогда не ложится поверх картинки: у этих кадров то светлый пергамент
* по центру, то тёмный камень с красным свечением — одного читаемого сочетания
* цвета и тени под них не существует.
*
* @param {'sm'|'md'|'lg'} size
* @param {string|null} art — URL из ART
* @param {'hero'|'aside'} mode
*/
/** Можно ли закрыть текущее окно через Esc/оверлей/назад. */
var _modalDismissible = true;
/** Элемент, с которого ушёл фокус при открытии окна — чтобы вернуть при закрытии. */
var _lastFocused = null;
/** Повесить/снять inert на игровом интерфейсе — чтобы Tab не уходил под оверлей. */
function setInertBehind(v) {
	const layout = document.querySelector(".layout");
	const topbar = document.getElementById("topbar");
	const status = document.querySelector(".sub");
	if (layout) layout.inert = v;
	if (topbar) topbar.inert = v;
	if (status) status.inert = v;
}
/** Запереть Tab внутри модалки: первый и последний фокусируемые элементы. */
function trapFocus() {
	const box = dom.modalBox;
	const focusable = box.querySelectorAll("button:not([disabled]):not([hidden]), [tabindex]:not([tabindex=\"-1\"]), input, select, textarea");
	if (!focusable.length) return;
	const first = focusable[0];
	const last = focusable[focusable.length - 1];
	first.focus();
	box.addEventListener("keydown", (ev) => {
		if (ev.key !== "Tab") return;
		if (ev.shiftKey) {
			if (document.activeElement === first) {
				ev.preventDefault();
				last.focus();
			}
		} else if (document.activeElement === last) {
			ev.preventDefault();
			first.focus();
		}
	}, { once: true });
}
/**
* Подготовить окно: размер, картинка, сброс прошлого содержимого.
* Вызывать первой строкой каждого open*.
*
* Картинки 512×768 — карточки с собственной рамкой и центрированной
* композицией. Обрезать их нельзя, только масштабировать целиком, поэтому
* режима два и оба показывают кадр полностью:
*
*   'hero'  — картинка и есть событие (интерлюдии, эпилоги, боссы):
*             во всю доступную высоту, заголовок под ней.
*   'aside' — картинка как контекст (меню, справка, лут, события):
*             маленькая карточка слева, заголовок и текст справа.
*
* Текст никогда не ложится поверх картинки: у этих кадров то светлый пергамент
* по центру, то тёмный камень с красным свечением — одного читаемого сочетания
* цвета и тени под них не существует.
*
* @param {'sm'|'md'|'lg'} size
* @param {string|null} art — URL из ART
* @param {'hero'|'aside'} mode
* @param {object} [opts]
* @param {boolean} [opts.dismissible] — можно ли закрыть окно Esc/кликом по фону/назад (default true)
*/
function shell(size = "md", art = null, mode = "aside", opts = {}) {
	S$1.modalOpen = true;
	_modalDismissible = opts.dismissible !== false;
	dom.modalBox.classList.remove("m-sm", "m-md", "m-lg", "death");
	dom.modalBox.classList.add("m-" + size);
	dom.mChoices.innerHTML = "";
	dom.mChoices.className = "choices";
	const actions = el("mActions");
	if (actions) {
		actions.innerHTML = "";
		actions.className = "m-actions" + (opts.footerStack ? " stack" : "");
	}
	const img = el("mArt");
	if (img) if (art) {
		img.loading = "lazy";
		img.src = art;
		img.className = "m-art m-art--" + mode;
		img.hidden = false;
		img.onerror = () => {
			img.hidden = true;
			img.removeAttribute("src");
			img.className = "m-art";
			const head = el("mHead");
			if (head) head.className = "m-head";
		};
	} else {
		img.hidden = true;
		img.removeAttribute("src");
	}
	const head = el("mHead");
	if (head) head.className = "m-head" + (art ? " m-head--" + mode : "");
	const body = el("mBody");
	if (body) body.scrollTop = 0;
	_lastFocused = document.activeElement;
	setInertBehind(true);
	requestAnimationFrame(() => trapFocus());
	try {
		history.pushState({ modal: true }, "", location.href);
	} catch {}
}
/** Закрыть окно если оно закрываемо. Вызывается из Esc, клика по оверлею, popstate. */
function dismissModal() {
	if (!_modalDismissible || !S$1.modalOpen) return;
	const again = el("mActions")?.querySelector("button.again");
	if (again) {
		again.click();
		return;
	}
	const anyBtn = el("mActions")?.querySelector("button");
	if (anyBtn) {
		anyBtn.click();
		return;
	}
	closeModal();
}
/** Положить кнопку в закреплённый футер. Падает в mChoices, если футера нет. */
function action(button) {
	(el("mActions") || dom.mChoices).appendChild(button);
	return button;
}
function mkButton(label, onClick, cls) {
	const b = document.createElement("button");
	if (cls) b.className = cls;
	b.textContent = label;
	b.onclick = onClick;
	return b;
}
/** @param {object} [opts] — { win, art } */
function openRunSummary(title, subtitle, earned, opts = {}) {
	const win = !!opts.win;
	shell("lg", opts.art || (win ? ART.victory : ART.runOver), "aside");
	if (!win) dom.modalBox.classList.add("death");
	dom.mTitle.textContent = win ? title : L("summary.runOver");
	dom.mText.textContent = win ? subtitle : title + " — " + subtitle;
	dom.mChoices.classList.add("loot-list");
	var isEnSummary = isEnglish();
	var rids = [...S$1.player.relics];
	var cids = [...S$1.player.curses];
	var formsUnlocked = [...S$1.unlocked].filter(function(t) {
		return t !== "pawn";
	}).map(function(t) {
		return isEnSummary && NAME_EN[t] ? NAME_EN[t] : NAME[t];
	});
	var wrap = document.createElement("div");
	wrap.className = "summary";
	var formsText = formsUnlocked.length ? formsUnlocked.join(", ") : L("summary.formsOnlyPawnKnight");
	wrap.innerHTML = "<div class=\"sfloor\"><span class=\"snum\">" + S$1.floor + "</span><span class=\"slbl\">" + L("summary.floor") + "</span></div><div class=\"sstats\"><div><b>" + S$1.player.totalCaptures + "</b> " + L("summary.captures") + "</div><div><b>" + rids.length + "</b> " + L("summary.bones") + " · <b>" + cids.length + "</b> " + L("summary.seams") + "</div><div>" + L("summary.forms", formsText) + "</div><div class=\"searn\">" + L("summary.ashEarned", earned, META.shards) + "</div><div class=\"srec\">" + L("summary.record", META.bestFloor, META.runs) + "</div></div>" + (rids.length ? "<div class=\"ssec\"><div class=\"sh\">" + L("summary.bones") + "</div><div class=\"relics\">" + rids.map(function(id) {
		return "<span class=\"chip\" title=\"" + LContent(RELICS[id], "desc") + "\">" + LContent(RELICS[id], "name") + "</span>";
	}).join("") + "</div></div>" : "") + (cids.length ? "<div class=\"ssec\"><div class=\"sh\">" + L("summary.seams") + "</div><div class=\"relics\">" + cids.map(function(id) {
		return "<span class=\"chip curse\" title=\"" + LContent(CURSES[id], "desc") + "\">☠ " + LContent(CURSES[id], "name") + "</span>";
	}).join("") + "</div></div>" : "") + "<div class=\"ssec\"><div class=\"sh\">" + L("summary.journal") + "</div><div class=\"run-log\">" + runLog.slice(-300).join("") + "</div></div>";
	dom.mChoices.appendChild(wrap);
	action(mkButton(L("meta.runAgain"), () => {
		closeModal();
		reset();
	}, "again"));
	action(mkButton(L("meta.toMenu"), () => {
		closeModal();
		openTitle();
	}));
	dom.overlay.classList.add("on");
}
function openTitle() {
	shell("lg", ART.title, "aside");
	dom.mTitle.textContent = L("meta.title");
	dom.mText.innerHTML = `<span class="searn">` + L("meta.shards", META.shards) + `</span><br>` + L("meta.record", META.bestFloor, META.runs, META.totalCaptures);
	dom.mChoices.classList.add("loot-list");
	const actions = el("mActions");
	if (actions) actions.classList.add("stack");
	const hint = document.createElement("div");
	hint.className = "menu-hint";
	const seg = document.createElement("div");
	seg.className = "mode-seg";
	const setMode = (m) => {
		S$1.runMode = m;
		bCamp.classList.toggle("on", m === "campaign");
		bInf.classList.toggle("on", m === "infinite");
		hint.textContent = m === "campaign" ? L("meta.campDesc") : L("meta.infDesc");
	};
	const bCamp = mkButton(L("meta.campaign"), () => setMode("campaign"));
	const bInf = mkButton(L("meta.infinite"), () => setMode("infinite"));
	seg.appendChild(bCamp);
	seg.appendChild(bInf);
	if (actions) {
		actions.appendChild(seg);
		actions.appendChild(hint);
	}
	setMode(S$1.runMode || "campaign");
	action(mkButton(L("meta.startRun"), () => {
		closeModal();
		reset();
	}, "start"));
	const tabs = document.createElement("div");
	tabs.className = "tab-row";
	const tabMeta = document.createElement("button");
	tabMeta.className = "tab-btn active";
	tabMeta.textContent = L("meta.progress");
	const tabChall = document.createElement("button");
	tabChall.className = "tab-btn";
	tabChall.textContent = L("meta.challenges");
	tabs.appendChild(tabMeta);
	tabs.appendChild(tabChall);
	dom.mChoices.appendChild(tabs);
	const metaPanel = document.createElement("div");
	metaPanel.className = "tab-panel";
	const shopScroll = document.createElement("div");
	shopScroll.className = "scroll-shop";
	const shop = document.createElement("div");
	shop.className = "shop";
	var isEnTitle = isEnglish();
	Object.keys(META_UPGRADES).forEach((id) => {
		const u = META_UPGRADES[id], lvl = META.upgrades[id] || 0, cost = upgradeCost(id);
		const uname = isEnTitle && u.enName ? u.enName : u.name;
		const udesc = isEnTitle && u.enDesc ? u.enDesc : u.desc;
		const row = document.createElement("div");
		row.className = "shoprow";
		row.innerHTML = "<div class=\"si\"><span class=\"ln\">" + uname + " <span class=\"lvl\">" + lvl + "/" + u.max + "</span></span><span class=\"ld\">" + udesc + "</span></div>";
		const buy = document.createElement("button");
		buy.className = "buy";
		if (cost == null) {
			buy.textContent = isEnTitle ? "max" : "макс";
			buy.disabled = true;
		} else {
			buy.textContent = `${cost} ✦`;
			buy.disabled = META.shards < cost;
			buy.onclick = () => {
				if (buyUpgrade(id)) openTitle();
			};
		}
		row.appendChild(buy);
		shop.appendChild(row);
	});
	shopScroll.appendChild(shop);
	metaPanel.appendChild(shopScroll);
	dom.mChoices.appendChild(metaPanel);
	const challPanel = document.createElement("div");
	challPanel.className = "tab-panel";
	challPanel.style.display = "none";
	const challScroll = document.createElement("div");
	challScroll.className = "scroll-shop";
	const challSection = document.createElement("div");
	challSection.className = "shop";
	Object.keys(CHALLENGES).forEach((id) => {
		const c = CHALLENGES[id];
		const cname = isEnTitle && c.enName ? c.enName : c.name;
		const cdesc = isEnTitle && c.enDesc ? c.enDesc : c.desc;
		const row = document.createElement("div");
		row.className = "shoprow";
		row.innerHTML = "<div class=\"si\"><span class=\"ln\">" + c.icon + " " + cname + "</span><span class=\"ld\">" + cdesc + "</span></div>";
		const btn = document.createElement("button");
		btn.className = "buy";
		btn.textContent = S$1.challenge === id ? isEnTitle ? "selected" : "выбран" : isEnTitle ? "select" : "выбрать";
		btn.style.borderColor = S$1.challenge === id ? "#e08a3f" : "";
		btn.onclick = () => {
			S$1.challenge = S$1.challenge === id ? null : id;
			openTitle();
			tabChall.onclick();
		};
		row.appendChild(btn);
		challSection.appendChild(row);
	});
	challScroll.appendChild(challSection);
	challPanel.appendChild(challScroll);
	dom.mChoices.appendChild(challPanel);
	tabMeta.onclick = () => {
		tabMeta.classList.add("active");
		tabChall.classList.remove("active");
		metaPanel.style.display = "";
		challPanel.style.display = "none";
	};
	tabChall.onclick = () => {
		tabChall.classList.add("active");
		tabMeta.classList.remove("active");
		challPanel.style.display = "";
		metaPanel.style.display = "none";
	};
	const codexN = codexProgress(), achN = achProgress();
	const nav = document.createElement("div");
	nav.className = "menu-nav";
	nav.appendChild(mkButton(L("meta.bestiary", codexN.have, codexN.total), () => {
		closeModal();
		openCodex();
	}));
	nav.appendChild(mkButton(L("meta.achievements", achN.have, achN.total), () => {
		closeModal();
		openAchievements();
	}));
	nav.appendChild(mkButton(L("meta.help"), () => {
		closeModal();
		openHelp("title");
	}));
	dom.mChoices.appendChild(nav);
	dom.overlay.classList.add("on");
}
/** Экранировать строку для вставки в HTML (против XSS через импорт уровней). */
function sanitize(str) {
	return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
var _toastActive = false;
var _toastQueue = [];
function _dequeueToast() {
	if (!_toastQueue.length) {
		_toastActive = false;
		return;
	}
	_toastActive = true;
	const text = _toastQueue.shift();
	try {
		const d = document.createElement("div");
		d.className = "toast";
		d.textContent = text;
		document.body.appendChild(d);
		setTimeout(() => {
			d.classList.add("out");
		}, 2200);
		setTimeout(() => {
			if (d.parentNode) d.parentNode.removeChild(d);
			_dequeueToast();
		}, 2800);
	} catch (e) {
		console.error(e);
		_dequeueToast();
	}
}
function toast(text) {
	_toastQueue.push(text);
	if (!_toastActive) _dequeueToast();
}
/** Очистить очередь тостов — вызывать при новом забеге/ярусе. */
function clearToastQueue() {
	_toastQueue.length = 0;
}
function openCodex() {
	shell("lg", ART.codex, "aside");
	dom.mTitle.textContent = L("modal.codex");
	dom.mText.textContent = L("modal.codexText");
	dom.mChoices.classList.add("loot-list");
	const box = document.createElement("div");
	box.className = "help";
	var enemyList = [
		"pawn",
		"knight",
		"bishop",
		"rook",
		"queen",
		"guardian",
		"necro",
		"mimic",
		"assassin",
		"priest",
		"frost"
	];
	var isEnCodex = isEnglish();
	var html = "<div class=\"hsec\"><div class=\"hh\">" + L("codex.enemies") + "</div>";
	enemyList.forEach(function(t) {
		var seen = META.codex.enemies[t];
		var kills = META.codex.kills[t] || 0;
		var nameStr = isEnCodex && NAME_EN[t] ? NAME_EN[t] : NAME[t];
		html += seen ? "<div class=\"cdx\"><b>" + GLYPH[t] + " " + nameStr + "</b><span>" + L("codex.desc." + t) + " · " + L("codex.kills", kills) + "</span></div>" : "<div class=\"cdx locked\"><b>? ??????</b><span>" + L("codex.locked.enemy") + "</span></div>";
	});
	html += "</div>";
	var relIds = Object.keys(RELICS);
	var relFound = relIds.filter(function(id) {
		return META.codex.relics[id];
	}).length;
	html += "<div class=\"hsec\"><div class=\"hh\">" + L("codex.bones") + " " + relFound + "/" + relIds.length + "</div>";
	relIds.forEach(function(id) {
		html += META.codex.relics[id] ? "<div class=\"cdx\"><b>" + LContent(RELICS[id], "name") + "</b><span>" + LContent(RELICS[id], "desc") + "</span></div>" : "<div class=\"cdx locked\"><b>? ??????</b><span>" + L("codex.locked.bone") + "</span></div>";
	});
	html += "</div>";
	var curIds = Object.keys(CURSES);
	var curFound = curIds.filter(function(id) {
		return META.codex.curses[id];
	}).length;
	html += "<div class=\"hsec\"><div class=\"hh\">" + L("codex.seams") + " " + curFound + "/" + curIds.length + "</div>";
	curIds.forEach(function(id) {
		html += META.codex.curses[id] ? "<div class=\"cdx\"><b>☠ " + LContent(CURSES[id], "name") + "</b><span>" + LContent(CURSES[id], "desc") + "</span></div>" : "<div class=\"cdx locked\"><b>? ??????</b><span>" + L("codex.locked.seam") + "</span></div>";
	});
	html += "</div>";
	box.innerHTML = html;
	dom.mChoices.appendChild(box);
	action(mkButton(L("meta.toMenu"), () => {
		closeModal();
		openTitle();
	}, "again"));
	dom.overlay.classList.add("on");
}
function openAchievements() {
	shell("lg", ART.codex, "aside");
	const p = achProgress();
	dom.mTitle.textContent = L("modal.achievements");
	dom.mText.textContent = L("modal.achievementsText", p.have, p.total);
	dom.mChoices.classList.add("loot-list");
	const box = document.createElement("div");
	box.className = "help";
	let html = "<div class=\"hsec\">";
	Object.keys(ACHIEVEMENTS).forEach((id) => {
		const a = ACHIEVEMENTS[id], got = META.achievements[id];
		html += "<div class=\"cdx" + (got ? "" : " locked") + "\"><b>" + (got ? "🏆" : "🔒") + " " + LContent(a, "name") + "</b><span>" + LContent(a, "desc") + "</span></div>";
	});
	html += "</div>";
	box.innerHTML = html;
	dom.mChoices.appendChild(box);
	action(mkButton("Назад в меню", () => {
		closeModal();
		openTitle();
	}, "again"));
	dom.overlay.classList.add("on");
}
function openHelp(from) {
	shell("lg", ART.help, "aside");
	dom.mTitle.textContent = L("help.title");
	dom.mText.textContent = L("help.tagline");
	dom.mChoices.classList.add("loot-list");
	var isEn = isEnglish();
	var body = "";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.goal") + "</div>";
	body += isEn ? "Descend through floors, clearing all enemies. Each floor is a new random board with more dangerous foes. Death ends the run, but ash and records persist.</div>" : "Спускайся по ярусам, зачищая всех врагов. Каждый следующий ярус — новая случайная доска и более опасные враги. Смерть завершает забег, но пепел и рекорды сохраняются.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.controls") + "</div>";
	body += isEn ? "Turn-based: your move first, then all enemies act. One action per turn: move, capture, switch form, or pass.<br>• <b>Tap a cell</b> — move or capture. Teal dot = safe, amber = under threat, crimson cross = fatal.<br>• <b>Tap an enemy</b> — show/hide its threat zone.<br>• <b>Tap a form slot</b> — switch form (costs a turn).<br>• PC: <b>1–5</b> forms, <b>Q/E</b> rotate (free), <b>Space</b> pass, <b>Tab</b> cycle, <b>Esc</b> reset, <b>Enter</b> confirm.</div>" : "Игра пошаговая: сначала твой ход, затем ходят все враги. За ход — одно действие: переместиться, взять фигуру, сменить форму или спасовать.<br>• <b>Тап по клетке</b> — ход или взятие. Бирюзовая точка — безопасно, янтарная — встанешь под удар, багровая с крестом — там забег кончится.<br>• <b>Тап по врагу</b> — показать/скрыть его зону боя.<br>• <b>Тап по слоту формы</b> — сменить форму (тратит ход).<br>• ПК: <b>1–5</b> формы, <b>Q/E</b> поворот (бесплатно), <b>Space</b> пас, <b>Tab</b> перебор, <b>Esc</b> сброс, <b>Enter</b> подтвердить.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.preview") + "</div>";
	body += isEn ? "Hover or tap a move cell — amber hatching shows which cells will be threatened <b>after</b> the move. Red hatching = currently threatened. Enable confirmation in Settings.</div>" : "Наведи или тапни по клетке хода — янтарная штриховка покажет, какие клетки станут битыми <b>после</b> этого хода. Красная штриховка — то, что бито уже сейчас. В настройках можно включить подтверждение.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.forms") + "</div>";
	if (isEn) body += "You play as one chess form; capture = moving onto an enemy cell.<br>• <b>" + GLYPH.pawn + " Pawn</b> — moves 1 forward, attacks forward diagonals. Has <b>facing</b> — rotate free (Q/E). Blind from behind.<br>• <b>" + GLYPH.knight + " Knight</b> — L-shaped leap over obstacles.<br>• <b>" + GLYPH.bishop + " Bishop</b> — diagonals; on <b>own color</b> +1 range.<br>• <b>" + GLYPH.rook + " Rook</b> — straight lines.<br>• <b>" + GLYPH.queen + " Queen</b> — all directions, shorter range. Sliders stop at first obstacle; only knight passes through.</div>";
	else body += "Ты играешь одной из шахматных форм; взятие — это перемещение на клетку врага.<br>• <b>" + GLYPH.pawn + " Пешка</b> — ходит на 1 вперёд, бьёт по передним диагоналям. У неё есть <b>направление взгляда</b> (фасинг) — поворачивай бесплатно (Q/E). Слепа со спины.<br>• <b>" + GLYPH.knight + " Конь</b> — прыжок буквой «Г» через любые препятствия.<br>• <b>" + GLYPH.bishop + " Слон</b> — по диагоналям; на клетке <b>своего цвета</b> бьёт на +1 дальше.<br>• <b>" + GLYPH.rook + " Ладья</b> — по прямым линиям.<br>• <b>" + GLYPH.queen + " Ферзь</b> — во все стороны, но дальность меньше. Слайдеры упираются в первое препятствие; сквозь ходит только конь.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.wheel") + "</div>";
	body += isEn ? "Forms are in a wheel (slot 0 = permanent pawn). Switching <b>costs a turn</b>. After a capture the form <b>fatigues</b> for a few turns. New forms unlock when you capture an enemy of that type. The number on each slot shows moves available.</div>" : "Формы лежат в колесе (слот 0 — неудаляемая пешка). Смена формы <b>тратит ход</b>. Форма, совершившая взятие, <b>устаёт</b> на пару ходов. Новые формы открываются, когда ты берёшь вражескую фигуру её типа. Число в углу слота — сколько ходов даст эта форма.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.capture") + "</div>";
	body += isEn ? "No HP: capture is instant. When an enemy captures you, you <b>degrade</b> one tier (queen → rook → bishop/knight → pawn), losing the current form. Capture <b>as pawn = end of run</b>. Pawn is your last life.</div>" : "HP нет: взятие мгновенно. Когда враг берёт тебя — ты не гибнешь сразу, а <b>деградируешь</b> на ступень ниже (ферзь → ладья → слон/конь → пешка), теряя текущую форму. Взятие <b>в форме пешки — конец забега</b>. Пешка — твоя последняя жизнь.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.ascension") + "</div>";
	body += isEn ? "The top row is a <span style=\"color:var(--promo)\">golden line</span>. End your turn on it <b>as a pawn</b> to transform, improved (★).</div>" : "Верхний ряд — <span style=\"color:var(--promo)\">золотая линия</span>. Закончи ход на ней <b>в форме пешки</b> — превратишься в выбранную форму, улучшенную (★).</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.checkmate") + "</div>";
	body += isEn ? "All threatened cells are highlighted. Ending a turn on one = <b>check</b>. No legal moves on a threatened cell = <b>checkmate</b>: you are taken on the spot.</div>" : "Все битые поля врагов подсвечены. Закончил ход на битой клетке — <b>шах</b>. Нет ни одного легального хода на битой клетке — <b>мат</b>: тебя вскрывают на месте.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.biomes") + "</div>";
	body += isEn ? "Floors come in sets, changing every 2 floors:<br>• <b>Halls</b> — open spaces, bishops/queens/mimics.<br>• <b>Corridors</b> — tight passages, rooks/guardians/assassins.<br>• <b>Maze</b> — winding corridors, knights/bishops/queens.<br>• <b>Grid</b> — 3×3 cells, rooks/guardians/priests.<br>• <b>Arena</b> — wall-free field, queens/mimics/assassins.<br>• <b>Pylons</b> — pillar labyrinth, knights/necromancers/mages.</div>" : "Ярусы идут наборами со своей генерацией, палитрой и пулами (сменяются каждые 2 яруса):<br>• <b>Залы</b> — открытые пространства, слоны/ферзи/двойники.<br>• <b>Коридоры</b> — тесные проходы, ладьи/стражи/ассасины.<br>• <b>Лабиринт</b> — извилистые коридоры, кони/слоны/ферзи.<br>• <b>Решётка</b> — ячейки 3×3, ладьи/стражи/жрецы.<br>• <b>Арена</b> — поле без стен, ферзи/двойники/ассасины.<br>• <b>Пилоны</b> — лабиринт столбов, кони/некроманты/маги.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.specials") + "</div>";
	body += isEn ? "• <span style=\"color:#c23b30\">▼ Web</span> — lose a form, enemy dies. One-use.<br>• <span style=\"color:#9b6dd0\">◎ Portal</span> — teleports to its pair.<br>• <span style=\"color:#58b3a4\">◈ Vein</span> — removes fatigue and statuses.<br>• <span style=\"color:#8fd0e6\">❄ Ice</span> — stuns on entry.<br>• <span style=\"color:#96a0b0\">☁ Fog</span> — hides threat overlay.<br>• <span style=\"color:#7aa0c0\">→ Conveyor</span> — pushes after move.<br>• <span style=\"color:#c9a227\">→ Gate</span> — passable only along arrow.<br>• <span style=\"color:#b0a8f0\">♝ Color Zone</span> — bishop only.<br>• <span style=\"color:#8fae7a\">▣ Plate</span> — opens a wall.<br>• <span style=\"color:#d65a28\">≈ Lava</span> — spreads and burns.</div>" : "• <span style=\"color:#c23b30\">▼ Паутина</span> — теряешь форму, враг гибнет. Одноразовые.<br>• <span style=\"color:#9b6dd0\">◎ Портал</span> — переносит к парному кольцу.<br>• <span style=\"color:#58b3a4\">◈ Жила</span> — снимает усталость и статусы.<br>• <span style=\"color:#8fd0e6\">❄ Лёд</span> — оглушает при входе.<br>• <span style=\"color:#96a0b0\">☁ Туман</span> — скрывает угрозу.<br>• <span style=\"color:#7aa0c0\">→ Конвейер</span> — сдвигает после хода.<br>• <span style=\"color:#c9a227\">→ Ворота</span> — проход только по стрелке.<br>• <span style=\"color:#b0a8f0\">♝ Цветовая зона</span> — только слон.<br>• <span style=\"color:#8fae7a\">▣ Плита</span> — открывает стену.<br>• <span style=\"color:#d65a28\">≈ Лава</span> — растекается и жжёт.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.enemies") + "</div>";
	if (isEn) body += "Standard chess pieces move toward you. Special:<br>• <b>" + GLYPH.guardian + " Guardian</b> — double hit (armor).<br>• <b>" + GLYPH.necro + " Necromancer</b> — summons pawns.<br>• <b>" + GLYPH.mimic + " Mimic</b> — copies your active form.<br>• <b>" + GLYPH.assassin + " Assassin</b> — knight, poisons.<br>• <b>" + GLYPH.priest + " Priest</b> — bishop, shields allies.<br>• <b>" + GLYPH.frost + " Frost Mage</b> — immobile, stuns at range.</div>";
	else body += "Обычные шахматные фигуры двигаются к тебе. Особые:<br>• <b>" + GLYPH.guardian + " Страж</b> — двойной удар (броня).<br>• <b>" + GLYPH.necro + " Некромант</b> — призывает пешек.<br>• <b>" + GLYPH.mimic + " Двойник</b> — копирует твою форму.<br>• <b>" + GLYPH.assassin + " Ассасин</b> — конь, отравляет.<br>• <b>" + GLYPH.priest + " Жрец</b> — слон, щитует союзников.<br>• <b>" + GLYPH.frost + " Морозный маг</b> — неподвижен, оглушает.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.bosses") + "</div>";
	body += isEn ? "Boss floors (5, 8, 11, 18) are authored arenas. Hunger freezes.<br>• <b>Tormentor Bishop</b> (5) — three bodies, loses diagonals on hit.<br>• <b>Linked Rooks</b> (8) — move in sync, avenge a kill instantly.<br>• <b>Puppeteer + Millstone</b> (11) — bodies fall, millstone crushes. Feed three.<br>• <b>Red King</b> (18) — invulnerable, break four chains under retinue fire.</div>" : "Босс-ярусы (5, 8, 11, 18) — авторские арены. Голод не тратится.<br>• <b>Слон-Мучитель</b> (5) — три тела, теряет диагонали.<br>• <b>Спаянные Ладьи</b> (8) — ходят синхронно, мстят мгновенно.<br>• <b>Кукловод + Жернов</b> (11) — тела падают, жернов давит. Скорми три.<br>• <b>Красный Король</b> (18) — неуязвим, ломай четыре цепи под огнём свиты.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.rooms") + "</div>";
	body += isEn ? "A floor has 1–5 rooms connected by doors. Locked doors need a matching key (always in the same room). Clear <b>all</b> rooms to finish. The room map ✓—●—🔑 at the top shows progress.</div>" : "Ярус — 1–5 комнат, соединены дверями. Запертые двери требуют ключ (всегда в той же комнате). Зачисти <b>все</b> комнаты. Строка «комнаты ✓—●—🔑» вверху показывает прогресс.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.food") + "</div>";
	body += isEn ? "Cells with 🍖 restore hunger. The hunger bar shows turns until degradation. Captures and Veins also feed; pass costs more.</div>" : "Клетки с 🍖 восполняют сытость. Шкала голода показывает ходы до деградации. Взятия и Жилы тоже кормят; пас дороже.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.pillars") + "</div>";
	body += isEn ? "• <b>Pillar</b> — impassable stone block.<br>• <b>Millstone</b> — rolls in a straight line, crushes enemies and player; stops permanently once jammed.</div>" : "• <b>Пилон</b> — непроходимый каменный блок.<br>• <b>Жернов</b> — катается по прямой, давит врагов и игрока; забитый встаёт навсегда.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.editor") + "</div>";
	body += isEn ? "The 🗺 Editor button in the menu. Place walls, enemies, special cells, doors and keys. Supports multiple rooms. Run a simulation and return to editing.</div>" : "Кнопка «🗺 Редактор» в меню. Расставляй стены, врагов, спец-клетки, двери и ключи. Поддерживает несколько комнат. Запусти симуляцию и вернись.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.events") + "</div>";
	body += isEn ? "Enemies drop gold. Between floors an event room may appear: Bonesetter (buy bone/remove seam), Unstitching (remove seam free), Sanctuary (sacrifice form for bone), Dice Altar (gamble), Blessing Altar (gift for next floor).</div>" : "Враги роняют золото. Между ярусами — комната-событие: Костоправ, Распайка, Жертвенник, Кости судьбы, Алтарь благословения.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.statuses") + "</div>";
	body += isEn ? "Colored dots on pieces: <span style=\"color:#6cbf5a\">Poison</span> — countdown. <span style=\"color:#e0c341\">Stun</span> — skip turn. <span style=\"color:#5bb6d6\">Shield</span> — absorbs capture. <span style=\"color:#e08a3f\">Haste</span> — +1 range. Vein removes all.</div>" : "Цветные кружки: <span style=\"color:#6cbf5a\">Яд</span> — отсчёт. <span style=\"color:#e0c341\">Оглушение</span> — пропуск хода. <span style=\"color:#5bb6d6\">Щит</span> — поглощает взятие. <span style=\"color:#e08a3f\">Ускорение</span> — +1 дальность. Жила снимает всё.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.loot") + "</div>";
	body += isEn ? "After clearing a floor, pick a reward. Safe <b>bones</b> and cursed deals: <b>⚠ Faustian</b> (2 bones + seam), <b>☠ Altar</b> (3 bones + 2 seams). <b>Seams</b> — permanent debuffs. Shown in Modifiers panel and rings.</div>" : "После зачистки — выбор награды. Безопасные <b>кости</b> и проклятые сделки: <b>⚠ фаустова</b> (2 кости + шов), <b>☠ алтарь</b> (3 кости + 2 шва). <b>Швы</b> — перманентные дебаффы. Видно в панели Модификаторов и кольцами.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.challenges") + "</div>";
	body += isEn ? "• <b>🔒 Lone Figure</b> — no switching, capture = death.<br>• <b>🌫️ Blind Descent</b> — 2-cell radius.<br>• <b>⚡ Storm</b> — stronger enemies, +50% ash.<br>• <b>🌀 Chaos Wheel</b> — random switch every 3 turns.<br>• <b>💀 Escalation</b> — enemies grow per floor, ×2 ash from floor 5.</div>" : "• <b>🔒 Одинокая фигура</b> — без смены, взятие = конец.<br>• <b>🌫️ Слепой спуск</b> — радиус 2 клетки.<br>• <b>⚡ Шторм</b> — враги сильнее, +50% пепла.<br>• <b>🌀 Хаотичное колесо</b> — смена каждые 3 хода.<br>• <b>💀 Эскалация</b> — враги растут, ×2 пепла с яруса 5.</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.exotic") + "</div>";
	body += isEn ? "Unlock for ash: <b>♝ Archbishop</b> (bishop+knight), <b>♜ Chancellor</b> (rook+knight), <b>☣ Beast</b> (leaps 2 cells).</div>" : "Открываются за пепел: <b>♝ Архиепископ</b> (слон+конь), <b>♜ Канцлер</b> (ладья+конь), <b>☣ Изверг</b> (прыжки на 2).</div>";
	body += "<div class=\"hsec\"><div class=\"hh\">" + L("help.meta") + "</div>";
	body += isEn ? "Each run earns <b>ash</b> (floor×3 + captures). Spend on starting slots, starting bones, easier first floor. Progress persists across runs.</div>" : "За каждый забег — <b>пепел</b> (ярус×3 + взятия). Трать на стартовые слоты, стартовые кости, облегчённый первый ярус. Прогресс сохраняется между забегами.</div>";
	const H = document.createElement("div");
	H.className = "help";
	H.innerHTML = body;
	dom.mChoices.appendChild(H);
	action(mkButton(from === "title" ? L("modal.helpBackToMenu") : L("modal.helpOK"), () => {
		closeModal();
		if (from === "title") openTitle();
	}, "again"));
	dom.overlay.classList.add("on");
}
/**
* @param {object} [opts] — { art, mode, size, glyphs }
* glyphs: true — кнопки это фигуры (промоушен), им нужен крупный кегль.
*/
function openModal(title, text, btns, isDeath, opts = {}) {
	shell(opts.size || (btns.length > 2 ? "md" : "sm"), opts.art || null, opts.mode || "hero");
	dom.modalBox.classList.toggle("death", !!isDeath);
	dom.mTitle.textContent = title;
	dom.mText.textContent = text;
	if (btns.length > 3) {
		if (opts.glyphs) dom.mChoices.classList.add("glyphs");
		btns.forEach((b) => dom.mChoices.appendChild(mkButton(b.label, b.fn)));
	} else btns.forEach((b) => action(mkButton(b.label, b.fn)));
	dom.overlay.classList.add("on");
}
function openLoot(options) {
	shell("md", ART.loot, "aside");
	dom.mTitle.textContent = L("modal.loot");
	dom.mText.textContent = L("modal.lootText");
	dom.mChoices.classList.add("loot-list");
	const KIND = {
		relic: "",
		faust: L("modal.lootFaust"),
		altar: L("modal.lootAltar")
	};
	options.forEach((opt) => {
		const b = document.createElement("button");
		b.className = "loot" + (opt.curses.length > 0 ? " cursed" : "");
		let html = "";
		if (KIND[opt.kind]) html += `<span class="lk">${KIND[opt.kind]}</span>`;
		opt.relics.forEach((id) => {
			const tm = TIER_META[relicTier(id)];
			html += "<span class=\"ln " + tm.cls + "\">✦ " + LContent(RELICS[id], "name") + " <em class=\"tag\">" + LContent(TIER_META[relicTier(id)], "name") + "</em></span><span class=\"ld\">" + LContent(RELICS[id], "desc") + "</span>";
		});
		opt.curses.forEach((id) => {
			html += `<span class="cn">☠ ${LContent(CURSES[id], "name")}</span><span class="cd">${LContent(CURSES[id], "desc")}</span>`;
		});
		b.innerHTML = html;
		b.onclick = () => {
			applyOption(opt);
			closeModal();
			maybeEvent();
		};
		dom.mChoices.appendChild(b);
	});
	dom.overlay.classList.add("on");
}
/** Интерлюдия/эпилог из SCRIPT. data.art — URL из ART. */
function openInterlude(data, onClose) {
	shell(data.size || "md", data.art || null, data.mode || "hero");
	duck(true);
	dom.mTitle.textContent = data.title || "";
	if (data.lines && data.lines.length) dom.mText.innerHTML = data.lines.map((l) => l ? `<p>${l}</p>` : "<br>").join("");
	else dom.mText.textContent = "";
	dom.mChoices.classList.add("loot-list");
	if (data.choices) data.choices.forEach((ch) => {
		const b = document.createElement("button");
		b.className = "loot";
		b.innerHTML = `<span class="ln">${ch.label}</span><span class="ld">${ch.desc || ""}</span>`;
		b.onclick = () => {
			closeModal();
			if (ch.mercy !== void 0) S$1.mercy = (S$1.mercy || 0) + ch.mercy;
			if (onClose) onClose(ch);
		};
		dom.mChoices.appendChild(b);
	});
	else if (data.button) action(mkButton(data.button, () => {
		closeModal();
		if (onClose) onClose();
	}, "again"));
	dom.overlay.classList.add("on");
}
function closeModal() {
	S$1.modalOpen = false;
	_modalDismissible = true;
	setInertBehind(false);
	dom.overlay.classList.remove("on");
	dom.mChoices.className = "choices";
	duck(false);
	const focused = _lastFocused;
	_lastFocused = null;
	if (focused && typeof focused.focus === "function") requestAnimationFrame(() => focused.focus());
	const img = el("mArt");
	if (img) {
		img.hidden = true;
		img.removeAttribute("src");
	}
	const head = el("mHead");
	if (head) head.className = "m-head";
	const actions = el("mActions");
	if (actions) actions.className = "m-actions";
}
function openSettings() {
	shell("sm");
	dom.mTitle.textContent = L("settings.title");
	dom.mText.textContent = "";
	dom.mChoices.classList.add("loot-list");
	const mkRow = (label, desc) => {
		const row = document.createElement("div");
		row.className = "shoprow";
		row.innerHTML = `<div class="si"><span class="ln">${label}</span>` + (desc ? `<span class="ld">${desc}</span>` : "") + "</div>";
		return row;
	};
	const mkToggle = (label, key) => {
		const row = mkRow(label);
		const btn = document.createElement("button");
		btn.className = "buy";
		btn.textContent = CFG[key] ? L("on") : L("off");
		btn.onclick = () => {
			CFG[key] = !CFG[key];
			saveSettings();
			if (key.startsWith("MUSIC")) syncMusicSettings();
			btn.textContent = CFG[key] ? L("on") : L("off");
		};
		row.appendChild(btn);
		return row;
	};
	dom.mChoices.appendChild(mkToggle(L("settings.sound"), "SFX_ENABLED"));
	dom.mChoices.appendChild(mkToggle(L("settings.anim"), "ANIM_ENABLED"));
	dom.mChoices.appendChild(mkToggle(L("settings.music"), "MUSIC_ENABLED"));
	dom.mChoices.appendChild(mkToggle(L("settings.preview"), "SHOW_PREVIEW"));
	const analyticsRow = mkRow(isEnglish() ? "Anonymous playtest telemetry" : "Анонимная статистика плейтеста", isEnglish() ? "Sends game actions and replays without personal data." : "Отправляет игровые действия и реплеи без персональных данных.");
	const analyticsBtn = document.createElement("button");
	analyticsBtn.className = "buy";
	analyticsBtn.textContent = CFG.ANALYTICS_ENABLED ? L("on") : L("off");
	analyticsBtn.onclick = () => {
		CFG.ANALYTICS_ENABLED = !CFG.ANALYTICS_ENABLED;
		saveSettings();
		if (CFG.ANALYTICS_ENABLED) {
			startAnalyticsRun({
				enabledFromSettings: true,
				mode: S$1.runMode || "campaign"
			});
			recordSnapshot("analytics_enabled");
		}
		analyticsBtn.textContent = CFG.ANALYTICS_ENABLED ? L("on") : L("off");
	};
	analyticsRow.appendChild(analyticsBtn);
	dom.mChoices.appendChild(analyticsRow);
	const endpointRow = mkRow(isEnglish() ? "Playtest server URL" : "Адрес сервера плейтеста");
	const endpointInput = document.createElement("input");
	endpointInput.type = "url";
	endpointInput.value = CFG.ANALYTICS_ENDPOINT;
	endpointInput.placeholder = "http://localhost:8787";
	endpointInput.onchange = () => {
		CFG.ANALYTICS_ENDPOINT = endpointInput.value.trim().replace(/\/$/, "");
		saveSettings();
	};
	endpointRow.appendChild(endpointInput);
	dom.mChoices.appendChild(endpointRow);
	const tokenRow = mkRow(isEnglish() ? "Analytics Bearer token" : "Bearer-токен аналитики");
	const tokenInput = document.createElement("input");
	tokenInput.type = "password";
	tokenInput.autocomplete = "off";
	tokenInput.value = CFG.ANALYTICS_ADMIN_TOKEN;
	tokenInput.placeholder = "ADMIN_TOKEN";
	tokenInput.onchange = () => {
		CFG.ANALYTICS_ADMIN_TOKEN = tokenInput.value.trim();
		saveSettings();
	};
	tokenRow.appendChild(tokenInput);
	dom.mChoices.appendChild(tokenRow);
	if (CFG.ANALYTICS_ENABLED) {
		const exportRow = mkRow(isEnglish() ? "Export current replay" : "Экспортировать текущий реплей");
		const exportBtn = document.createElement("button");
		exportBtn.className = "buy";
		exportBtn.textContent = isEnglish() ? "export" : "экспорт";
		exportBtn.onclick = () => downloadReplay();
		exportRow.appendChild(exportBtn);
		dom.mChoices.appendChild(exportRow);
	}
	const modes = [
		"off",
		"risky",
		"all"
	];
	const cRow = mkRow(L("settings.confirm"), L("settings.confirmDesc"));
	const cBtn = document.createElement("button");
	cBtn.className = "buy";
	cBtn.textContent = L("settings." + CFG.CONFIRM_MOVES);
	cBtn.onclick = () => {
		var i = modes.indexOf(CFG.CONFIRM_MOVES);
		CFG.CONFIRM_MOVES = modes[(i + 1) % modes.length];
		saveSettings();
		cBtn.textContent = L("settings." + CFG.CONFIRM_MOVES);
	};
	cRow.appendChild(cBtn);
	dom.mChoices.appendChild(cRow);
	const tRow = mkRow(L("settings.tutorial"), L("settings.tutorialDesc"));
	const tBtn = document.createElement("button");
	tBtn.className = "buy";
	tBtn.textContent = L("settings.tutorialBtn");
	tBtn.onclick = () => {
		__vitePreload(() => Promise.resolve().then(() => tutorial_exports).then((m) => m.resetHints && m.resetHints()), void 0, import.meta.url);
	};
	tRow.appendChild(tBtn);
	dom.mChoices.appendChild(tRow);
	const langModes = [
		"system",
		"ru",
		"en"
	];
	const lRow = mkRow(L("settings.lang"));
	const lBtn = document.createElement("button");
	lBtn.className = "buy";
	lBtn.textContent = CFG.LANG === "system" ? L("settings.langSystem") : CFG.LANG;
	lBtn.onclick = () => {
		var li = langModes.indexOf(CFG.LANG);
		CFG.LANG = langModes[(li + 1) % langModes.length];
		saveSettings();
		invalidateLang();
		lBtn.textContent = CFG.LANG === "system" ? L("settings.langSystem") : CFG.LANG;
		syncUI();
	};
	lRow.appendChild(lBtn);
	dom.mChoices.appendChild(lRow);
	action(mkButton(L("settings.close"), closeModal, "again"));
	dom.overlay.classList.add("on");
}
var LOG_DOM_LIMIT = 200;
/** Полный журнал забега — для итогового экрана. DOM обрезается, этот массив нет. */
var runLog = [];
function clearRunLog() {
	runLog.length = 0;
}
function log(msg, cls) {
	const d = document.createElement("div");
	if (cls) d.className = cls;
	d.innerHTML = msg;
	runLog.push(d.outerHTML);
	dom.logEl.appendChild(d);
	while (dom.logEl.childNodes.length > LOG_DOM_LIMIT) dom.logEl.removeChild(dom.logEl.firstChild);
	dom.logEl.scrollTop = dom.logEl.scrollHeight;
	if (cls === "r" || cls === "g") {
		const plain = d.textContent || "";
		if (plain.length > 2 && plain.length < 100) toast(plain);
	}
}
function syncUI() {
	const clearedRooms = S$1.rooms.filter((r) => r.cleared).length;
	document.getElementById("turnNo").innerHTML = "<span class=\"hb\">" + L("summary.floor") + " " + S$1.floor + "</span>" + (S$1.biome ? "<span class=\"hb\">" + LContent(S$1.biome, "name") + "</span>" : "") + (S$1.rooms.length > 1 ? "<span class=\"hb\">" + L("hud.rooms") + " " + clearedRooms + "/" + S$1.rooms.length + "</span>" : "") + "<span class=\"hb\">#" + S$1.turn + `</span><span class="hb gold">${S$1.player.gold || 0}🪙</span><span class="hb shards">${META.shards || 0}✦</span>` + (S$1.keys.size > 0 ? `<span class="hb keys">${[...S$1.keys].map((k) => KEY_GLYPH[k]).join("")}</span>` : "");
	const nSlots = S$1.player.wheel.length;
	while (dom.wheelEl.children.length < nSlots) {
		const slot = document.createElement("div");
		slot.dataset.idx = dom.wheelEl.children.length;
		dom.wheelEl.appendChild(slot);
	}
	while (dom.wheelEl.children.length > nSlots) dom.wheelEl.removeChild(dom.wheelEl.lastChild);
	S$1.player.wheel.forEach((f, i) => {
		const slot = dom.wheelEl.children[i];
		if (!f) {
			slot.className = "slot empty";
			slot.innerHTML = "<div class=\"glyph\">·</div><div class=\"nm\">" + L("wheel.empty") + "</div>";
			slot.onclick = null;
			slot.removeAttribute("title");
		} else {
			const cls = "slot" + (i === S$1.player.active ? " active" : "") + (f.cooldown > 0 ? " cd" : "");
			if (slot.className !== cls) slot.className = cls;
			const elGlyph = slot.querySelector(".glyph");
			const elNm = slot.querySelector(".nm");
			if (elGlyph) elGlyph.textContent = GLYPH[f.type];
			var formName = isEnglish() && NAME_EN[f.type] ? NAME_EN[f.type] : NAME[f.type];
			if (elNm) elNm.textContent = formName + (f.type === "bishop" ? f.homeColor === 0 ? " ◽" : " ◾" : "");
			else slot.innerHTML = `<div class="glyph">${GLYPH[f.type]}</div><div class="nm">${formName}${f.type === "bishop" ? f.homeColor === 0 ? " ◽" : " ◾" : ""}</div>`;
			let elStar = slot.querySelector(".star");
			let elCd = slot.querySelector(".cdn");
			if (f.improved && !elStar) slot.appendChild(Object.assign(document.createElement("span"), {
				className: "star",
				textContent: "★"
			}));
			else if (!f.improved && elStar) elStar.remove();
			if (f.cooldown > 0) {
				if (!elCd) {
					slot.appendChild(Object.assign(document.createElement("span"), { className: "cdn" }));
					elCd = slot.querySelector(".cdn");
				}
				if (elCd) elCd.textContent = f.cooldown;
			} else if (elCd) elCd.remove();
			slot.onclick = () => switchForm(i);
			slot.title = i === S$1.player.active ? L("wheel.active") : f.cooldown > 0 ? L("wheel.cd") : L("wheel.switch");
		}
	});
	var fDir = S$1.player.facing.join(",");
	var dirKey = fDir === "0,-1" ? "face.north" : fDir === "1,0" ? "face.east" : fDir === "0,1" ? "face.south" : "face.west";
	dom.faceInfo.textContent = activeForm().type === "pawn" ? L("face.label", L(dirKey)) : "";
	syncHud();
}
//#endregion
//#region src/meta.js
/**
* src/meta.js — мета-прогрессия: осколки (Пепел), достижения, бестиарий, сохранения.
* Основные экспорты: META, metaLoad(), metaSave(), unlockAch(), codexSeeEnemy(), recordKill(), endRunMeta().
*/
var META_KEY = "chessrogue_meta_v1";
function defaultMeta() {
	return {
		bestFloor: 0,
		runs: 0,
		totalCaptures: 0,
		shards: 0,
		upgrades: {
			startSlots: 0,
			startRelics: 0,
			headstart: 0
		},
		codex: {
			enemies: {},
			relics: {},
			curses: {},
			kills: {}
		},
		achievements: {},
		tutorialDone: false,
		hints: {}
	};
}
var saveMeta = metaSave;
var META = defaultMeta();
function metaLoad() {
	try {
		const raw = window.localStorage && localStorage.getItem("chessrogue_meta_v1");
		if (raw) {
			const o = JSON.parse(raw);
			const d = defaultMeta();
			META = Object.assign(d, o);
			META.upgrades = Object.assign(d.upgrades, o.upgrades || {});
			const c = o.codex || {};
			META.codex = {
				enemies: c.enemies || {},
				relics: c.relics || {},
				curses: c.curses || {},
				kills: c.kills || {}
			};
			META.achievements = o.achievements || {};
		}
	} catch (e) {
		console.error("meta load error", e);
	}
}
function metaSave() {
	try {
		if (window.localStorage) localStorage.setItem(META_KEY, JSON.stringify(META));
	} catch (e) {
		console.error(e);
	}
}
function upgradeCost(id) {
	const u = META_UPGRADES[id], lvl = META.upgrades[id] || 0;
	return lvl >= u.max ? null : u.costs[lvl];
}
function buyUpgrade(id) {
	const cost = upgradeCost(id);
	if (cost == null || META.shards < cost) return false;
	META.shards -= cost;
	META.upgrades[id] = (META.upgrades[id] || 0) + 1;
	metaSave();
	return true;
}
function codexSeeEnemy(t) {
	if (!META.codex.enemies[t]) {
		META.codex.enemies[t] = true;
		metaSave();
		if (BESTIARY_TRIO.every((id) => META.codex.enemies[id])) unlockAch("bestiary");
	}
}
function codexSeeRelic(id) {
	if (!META.codex.relics[id]) {
		META.codex.relics[id] = true;
		metaSave();
	}
}
function codexSeeCurse(id) {
	if (!META.codex.curses[id]) {
		META.codex.curses[id] = true;
		metaSave();
	}
}
function recordKill(t, byPoison) {
	META.codex.kills[t] = (META.codex.kills[t] || 0) + 1;
	metaSave();
	if (S$1.player) S$1.player.gold = (S$1.player.gold || 0) + (GOLD_DROP[t] || 1);
	if (byPoison) unlockAch("toxin");
}
function unlockAch(id) {
	if (!ACHIEVEMENTS[id] || META.achievements[id]) return;
	META.achievements[id] = true;
	metaSave();
	toast("🏆 " + LContent(ACHIEVEMENTS[id], "name"));
	log(`${isEnglish() ? "Achievement: " : "Достижение: "}<b>${LContent(ACHIEVEMENTS[id], "name")}</b>`, "g");
}
function endRunMeta() {
	META.runs++;
	META.bestFloor = Math.max(META.bestFloor, S$1.floor);
	META.totalCaptures += S$1.player.totalCaptures;
	let earned = S$1.floor * 3 + S$1.player.totalCaptures;
	if (S$1.challenge === "storm") earned = Math.round(earned * 1.5);
	if (S$1.challenge === "escalation" && S$1.floor >= 5) earned *= 2;
	META.shards += earned;
	metaSave();
	if (META.shards >= 100) unlockAch("wealthy");
	return earned;
}
function codexProgress() {
	const allE = [
		"pawn",
		"knight",
		"bishop",
		"rook",
		"queen",
		"guardian",
		"necro",
		"mimic",
		"assassin",
		"priest",
		"frost"
	];
	const total = allE.length + Object.keys(RELICS).length + Object.keys(CURSES).length;
	return {
		have: allE.filter((t) => META.codex.enemies[t]).length + Object.keys(RELICS).filter((id) => META.codex.relics[id]).length + Object.keys(CURSES).filter((id) => META.codex.curses[id]).length,
		total
	};
}
function achProgress() {
	const total = Object.keys(ACHIEVEMENTS).length;
	return {
		have: Object.keys(ACHIEVEMENTS).filter((id) => META.achievements[id]).length,
		total
	};
}
//#endregion
//#region src/events.js
/**
* src/events.js — комнаты-события: Костоправ (лавка), Распайка (алтарь очищения),
* Жертвенник (святилище), Кости судьбы (азартный алтарь), Благословение.
* Основные экспорты: maybeEvent(), openShop(), openPurify(), openSanctuary(), openGamble(), openBlessing().
*
* Все окна переведены на shell() — иначе от предыдущей модалки остаётся её
* размерный класс и картинка в шапке, а завершающие кнопки уезжают в скролл.
*/
function proceed() {
	closeModal();
	newFloor();
}
function pickRareRelic() {
	const pool = relicPool();
	const high = pool.filter((id) => relicTier(id) >= 2);
	const src = high.length ? high : pool;
	return src.length ? src[randInt(src.length)] : null;
}
function maybeEvent() {
	const events = [
		"shop",
		"purify",
		"blessing"
	];
	if (S$1.player.wheel.some((f, i) => i > 0 && f)) events.push("sanctuary");
	if (S$1.player.gold >= 5) events.push("gamble");
	if (events.length && Math.random() < .5) {
		playTrack("event");
		({
			shop: openShop,
			purify: openPurify,
			sanctuary: openSanctuary,
			gamble: openGamble,
			blessing: openBlessing
		})[pick(events)]();
		return;
	}
	newFloor();
}
/** Кнопка «уйти» одинакова во всех событиях — всегда в закреплённом футере. */
function leaveButton(label) {
	if (!label) label = isEnglish() ? "Leave (Continue)" : "Уйти (дальше)";
	return action(mkButton(label, proceed, "again"));
}
function openBlessing() {
	shell("md", ART.event.blessing, "aside");
	dom.mTitle.textContent = isEnglish() ? "Blessing Altar" : "Алтарь благословения";
	dom.mText.textContent = isEnglish() ? "Choose a gift for the next floor." : "Выбери дар на следующий ярус.";
	dom.mChoices.classList.add("loot-list");
	var isEnB = isEnglish();
	[
		...curse("glass") ? [] : [{
			label: isEnB ? "🛡 Shield (2)" : "🛡 Щит (2)",
			desc: isEnB ? "Absorbs one capture" : "Поглотит одно взятие",
			fn: () => S$1.player.nextFloorStatus.push({
				k: "shield",
				n: 2
			})
		}],
		{
			label: "⚡ " + (isEnB ? "Haste (3)" : "Ускорение (3)"),
			desc: isEnB ? "+1 slider range, extra knight step" : "+1 дальность слайдерам, доп. шаг коню",
			fn: () => S$1.player.nextFloorStatus.push({
				k: "haste",
				n: 3
			})
		},
		{
			label: "🪙 " + (isEnB ? "Gold (+8)" : "Золото (+8)"),
			desc: isEnB ? "Useful at the Bonesetter" : "Пригодится у Костоправа",
			fn: () => {
				S$1.player.gold = (S$1.player.gold || 0) + 8;
			}
		}
	].forEach((o) => {
		const b = document.createElement("button");
		b.className = "loot";
		b.innerHTML = `<span class="ln">${o.label}</span><span class="ld">${o.desc}</span>`;
		b.onclick = () => {
			o.fn();
			proceed();
		};
		dom.mChoices.appendChild(b);
	});
	dom.overlay.classList.add("on");
}
var shopStock = null;
function openShop() {
	const seamCount = S$1.player.curses.size;
	const boneCount = S$1.player.relics.size;
	const bs = getScript().bonesetterLines;
	const rep = bs.repeat[META.runs];
	if (rep) log(rep);
	else if (seamCount >= 3) log(bs.bySeams.high);
	else if (seamCount >= 2) log(bs.bySeams.mid);
	else if (seamCount >= 1) log(bs.bySeams.low);
	else log(bs.bySeams[0]);
	if (boneCount > 4) log(bs.byBones.many);
	else if (boneCount <= 1) log(bs.byBones.few);
	shopStock = [...rollWeighted(relicPool, 2, /* @__PURE__ */ new Set(), false).map((id) => ({
		kind: "relic",
		id,
		price: SHOP_PRICE[relicTier(id)],
		sold: false
	}))];
	if (S$1.player.curses.size > 0) shopStock.push({
		kind: "uncurse",
		price: 6,
		sold: false
	});
	renderShop();
	dom.overlay.classList.add("on");
}
function renderShop() {
	shell("md", ART.event.bonesetter, "aside");
	dom.mTitle.textContent = isEnglish() ? "Bonesetter" : "Костоправ";
	dom.mText.textContent = (isEnglish() ? "Gold: " : "Золото: ") + (S$1.player.gold || 0) + "🪙. " + (isEnglish() ? "Purchases apply immediately." : "Покупки применяются сразу.");
	dom.mChoices.classList.add("loot-list");
	shopStock.forEach((item) => {
		const b = document.createElement("button");
		b.className = "loot";
		const afford = (S$1.player.gold || 0) >= item.price && !item.sold;
		if (item.kind === "relic") b.innerHTML = `<span class="ln ${TIER_META[relicTier(item.id)].cls}">✦ ${isEnglish() ? RELICS[item.id].enName : RELICS[item.id].name} <em class="tag">${item.price}🪙</em></span><span class="ld">${isEnglish() ? RELICS[item.id].enDesc : RELICS[item.id].desc}</span>`;
		else b.innerHTML = isEnglish() ? `<span class="ln">✚ Remove Seam <em class="tag">${item.price}🪙</em></span><span class="ld">Removes one random seam.</span>` : `<span class="ln">✚ Снять шов <em class="tag">${item.price}🪙</em></span><span class="ld">Убирает один случайный шов.</span>`;
		if (item.sold) {
			b.disabled = true;
			b.style.opacity = .4;
		} else if (!afford) {
			b.disabled = true;
			b.style.opacity = .55;
		} else b.onclick = () => {
			S$1.player.gold -= item.price;
			item.sold = true;
			unlockAch("merchant");
			if (item.kind === "relic") applyRelic(item.id);
			else {
				const c = [...S$1.player.curses];
				const rm = c[randInt(c.length)];
				S$1.player.curses.delete(rm);
				log(isEnglish() ? `Bonesetter removed the seam: ${CURSES[rm].enName}.` : `Костоправ снял шов: ${CURSES[rm].name}.`, "g");
			}
			renderShop();
		};
		dom.mChoices.appendChild(b);
	});
	leaveButton();
}
function openPurify() {
	shell("md", ART.event.unstitch, "aside");
	dom.mTitle.textContent = isEnglish() ? "Unstitching" : "Распайка";
	dom.mChoices.classList.add("loot-list");
	const curses = [...S$1.player.curses];
	if (curses.length) {
		dom.mText.textContent = isEnglish() ? "Remove one seam." : "Сними один шов.";
		curses.forEach((id) => {
			const b = document.createElement("button");
			b.className = "loot";
			b.innerHTML = `<span class="cn">☠ ${isEnglish() ? CURSES[id].enName : CURSES[id].name}</span><span class="cd">${isEnglish() ? CURSES[id].enDesc : CURSES[id].desc}</span>`;
			b.onclick = () => {
				S$1.player.curses.delete(id);
				log(isEnglish() ? `Unstitching: removed "${CURSES[id].enName}".` : `Распайка: снят «${CURSES[id].name}».`, "g");
				proceed();
			};
			dom.mChoices.appendChild(b);
		});
		leaveButton(isEnglish() ? "Leave" : "Уйти");
	} else {
		const g = 5;
		S$1.player.gold = (S$1.player.gold || 0) + g;
		dom.mText.textContent = isEnglish() ? "No seams — the altar pays in gold." : "Швов нет — алтарь расплачивается золотом.";
		leaveButton(isEnglish() ? `Take +${g}🪙 (continue)` : `Взять +${g}🪙 (дальше)`);
	}
	dom.overlay.classList.add("on");
}
function openSanctuary() {
	shell("md", ART.event.sacrifice, "aside");
	dom.mTitle.textContent = isEnglish() ? "Sanctuary" : "Жертвенник";
	dom.mText.textContent = isEnglish() ? "Sacrifice a form — receive a rare bone." : "Пожертвуй форму — взамен получишь редкую кость.";
	dom.mChoices.classList.add("loot-list");
	const reward = pickRareRelic();
	S$1.player.wheel.forEach((f, i) => {
		if (i === 0 || !f) return;
		const b = document.createElement("button");
		b.className = "loot";
		b.innerHTML = (isEnglish() ? "<span class=\"ln\">Give: " + (NAME_EN[f.type] || NAME[f.type]) + (f.improved ? " ★" : "") + "</span>" : "<span class=\"ln\">Отдать: " + NAME[f.type] + (f.improved ? " ★" : "") + "</span>") + "<span class=\"ld\">" + (reward ? (isEnglish() ? "receive: " : "получишь: ") + (isEnglish() ? RELICS[reward].enName || RELICS[reward].name : RELICS[reward].name) : isEnglish() ? "no reward" : "наград нет") + "</span>";
		b.onclick = () => {
			S$1.player.wheel[i] = null;
			if (S$1.player.active === i) S$1.player.active = 0;
			log(isEnglish() ? `Sanctuary accepted ${NAME[f.type]}.` : `Жертвенник принял ${NAME[f.type]}.`, "r");
			if (reward) applyRelic(reward);
			proceed();
		};
		if (!reward) {
			b.disabled = true;
			b.style.opacity = .5;
		}
		dom.mChoices.appendChild(b);
	});
	leaveButton(isEnglish() ? "Refuse" : "Отказаться");
	dom.overlay.classList.add("on");
}
function openGamble() {
	shell("md", ART.event.dice, "aside");
	dom.mTitle.textContent = isEnglish() ? "Dice Altar" : "Кости судьбы";
	dom.mText.textContent = isEnglish() ? `Bet 5🪙: luck — a bone, loss — a seam.` : `Ставка 5🪙: удача — кость, провал — шов.`;
	dom.mChoices.classList.add("loot-list");
	const bet = document.createElement("button");
	bet.className = "loot";
	bet.innerHTML = (isEnglish() ? "<span class=\"ln\">Try Your Luck <em class=\"tag\">5🪙</em></span>" : "<span class=\"ln\">Испытать судьбу <em class=\"tag\">5🪙</em></span>") + (isEnglish() ? "<span class=\"ld\">55% — random bone · 45% — random seam</span>" : "<span class=\"ld\">55% — случайная кость · 45% — случайный шов</span>");
	if ((S$1.player.gold || 0) < 5) {
		bet.disabled = true;
		bet.style.opacity = .5;
	} else bet.onclick = () => {
		S$1.player.gold -= 5;
		if (Math.random() < .55) {
			const r = relicPool();
			if (r.length) {
				const id = r[randInt(r.length)];
				applyRelic(id);
				toast((isEnglish() ? "Luck! " : "Удача! ") + (isEnglish() ? RELICS[id].enName : RELICS[id].name));
			}
		} else {
			const c = cursePool();
			if (c.length) {
				const id = c[randInt(c.length)];
				applyCurse(id);
				toast((isEnglish() ? "Failure… " : "Провал… ") + (isEnglish() ? CURSES[id].enName : CURSES[id].name));
			}
		}
		proceed();
	};
	dom.mChoices.appendChild(bet);
	leaveButton();
	dom.overlay.classList.add("on");
}
//#endregion
//#region src/loot.js
/**
* src/loot.js — кости (реликвии), швы (проклятия), награды между этажами.
* Основные экспорты: offerLoot(), applyRelic(), applyCurse().
*/
var relicPool = () => Object.keys(RELICS).filter((id) => {
	if (S$1.player.relics.has(id)) return false;
	if (S$1.player.curses.has("glass") && (id === "smoke" || id === "bulwark")) return false;
	if (id === "extra_slot" && S$1.player.wheel.length >= 5) return false;
	return true;
});
var cursePool = () => Object.keys(CURSES).filter((id) => !S$1.player.curses.has(id));
function rollWeighted(poolFn, n, used, biasHigh) {
	const avail = poolFn().filter((id) => !used.has(id));
	const got = [];
	for (let k = 0; k < n && avail.length; k++) {
		let total = 0;
		const weights = avail.map((id) => {
			const w = tierWeight(relicTier(id), S$1.floor, biasHigh);
			total += w;
			return w;
		});
		let r = Math.random() * total, idx = 0;
		while (idx < avail.length - 1 && (r -= weights[idx]) > 0) idx++;
		const id = avail.splice(idx, 1)[0];
		got.push(id);
		used.add(id);
	}
	return got;
}
function rollDistinct(poolFn, n, used) {
	const avail = poolFn().filter((id) => !used.has(id));
	shuffle(avail);
	const got = avail.slice(0, n);
	got.forEach((id) => used.add(id));
	return got;
}
function buildLootOptions() {
	const usedR = /* @__PURE__ */ new Set(), usedC = /* @__PURE__ */ new Set();
	const opts = [];
	opts.push({
		kind: "relic",
		relics: rollWeighted(relicPool, 1, usedR, false),
		curses: []
	});
	for (let i = 0; i < 2; i++) {
		const rLeft = relicPool().filter((id) => !usedR.has(id)).length;
		const cLeft = cursePool().filter((id) => !usedC.has(id)).length;
		const roll = Math.random();
		if (roll < .45 && rLeft >= 2 && cLeft >= 1) opts.push({
			kind: "faust",
			relics: rollWeighted(relicPool, 2, usedR, true),
			curses: rollDistinct(cursePool, 1, usedC)
		});
		else if (roll < .75 && rLeft >= 3 && cLeft >= 2) opts.push({
			kind: "altar",
			relics: rollWeighted(relicPool, 3, usedR, true),
			curses: rollDistinct(cursePool, 2, usedC)
		});
		else if (rLeft >= 1) opts.push({
			kind: "relic",
			relics: rollWeighted(relicPool, 1, usedR, false),
			curses: []
		});
	}
	return opts.filter((o) => o.relics.length || o.curses.length);
}
function offerLoot() {
	if (relicPool().length === 0) {
		maybeEvent();
		return;
	}
	openLoot(buildLootOptions());
}
function applyRelic(id) {
	recordEvent("relic_selected", { id });
	S$1.player.relics.add(id);
	codexSeeRelic(id);
	if (S$1.player.relics.size >= 5) unlockAch("collector");
	if (S$1.player.relics.size >= 10) unlockAch("collector_elite");
	if (id === "extra_slot") {
		if (S$1.player.wheel.length < 5) S$1.player.wheel.push(null);
	}
	log(isEnglish() ? `Bone: <b>${RELICS[id].enName}</b> — ${RELICS[id].enDesc}` : `Кость: <b>${RELICS[id].name}</b> — ${RELICS[id].desc}`, "g");
}
function applyCurse(id) {
	recordEvent("curse_selected", { id });
	S$1.player.curses.add(id);
	codexSeeCurse(id);
	if (S$1.player.curses.size >= 3) unlockAch("cursed");
	if (id === "rusted" && S$1.player.wheel.length > 1) {
		const idx = S$1.player.wheel.findLastIndex((s) => s !== null);
		if (idx >= 0) S$1.player.wheel[idx] = null;
		if (S$1.player.active >= S$1.player.wheel.length) S$1.player.active = 0;
	}
	log(isEnglish() ? `Seam: <b>${CURSES[id].enName}</b> — ${CURSES[id].enDesc}` : `Шов: <b>${CURSES[id].name}</b> — ${CURSES[id].desc}`, "r");
}
function applyOption(opt) {
	playLoot();
	opt.relics.forEach(applyRelic);
	opt.curses.forEach(applyCurse);
}
//#endregion
//#region src/gen/algos.js
/**
* src/gen/algos.js — алгоритмы расстановки стен.
*
* У всех одна сигнатура: (ctx) => Set<'x,y'>, где ctx = { W, H, P, start, canWall }.
* Ни один из них не думает о проходимости и механиках — этим занимаются
* validate.js и decorate.js. Алгоритм отвечает только за форму пространства.
*/
var inRect = (x, y, W, H) => x > 0 && x < W - 1 && y > 0 && y < H - 1;
/** Зеркалим стены по вертикальной оси — карта становится «построенной». */
function mirror(w, W, H, mode) {
	if (!mode) return w;
	const out = new Set(w);
	for (const k of w) {
		const [x, y] = k.split(",").map(Number);
		out.add(key(W - 1 - x, y));
		if (mode >= 1) out.add(key(x, H - 1 - y));
	}
	return out;
}
/** Толстая рамка по краю сохраняется чистой всегда — иначе камера упирается в стену. */
function stripEdges(w, W, H) {
	for (let x = 0; x < W; x++) {
		w.delete(key(x, 0));
		w.delete(key(x, H - 1));
	}
	for (let y = 0; y < H; y++) {
		w.delete(key(0, y));
		w.delete(key(W - 1, y));
	}
	return w;
}
/**
* Единственный алгоритм из набора, который даёт толстые стены и прямые линии
* одновременно. Слайдеры на нём работают, а автотайлинг выглядит осмысленно.
*/
function bsp(ctx) {
	const { W, H, P } = ctx;
	const w = /* @__PURE__ */ new Set();
	for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) w.add(key(x, y));
	const leaves = [];
	const split = (r, depth) => {
		const minR = P.minRoom;
		const canV = r.w >= minR * 2 + 1;
		const canH = r.h >= minR * 2 + 1;
		if (depth <= 0 || !canV && !canH) {
			leaves.push(r);
			return;
		}
		if (canV && (!canH || random() < .5)) {
			const cut = r.x + minR + randInt(r.w - minR * 2);
			split({
				x: r.x,
				y: r.y,
				w: cut - r.x,
				h: r.h
			}, depth - 1);
			split({
				x: cut + 1,
				y: r.y,
				w: r.x + r.w - cut - 1,
				h: r.h
			}, depth - 1);
		} else {
			const cut = r.y + minR + randInt(r.h - minR * 2);
			split({
				x: r.x,
				y: r.y,
				w: r.w,
				h: cut - r.y
			}, depth - 1);
			split({
				x: r.x,
				y: cut + 1,
				w: r.w,
				h: r.y + r.h - cut - 1
			}, depth - 1);
		}
	};
	split({
		x: 1,
		y: 1,
		w: W - 2,
		h: H - 2
	}, P.splits);
	const rooms = [];
	for (const r of leaves) {
		if (random() > P.roomChance) continue;
		const pad = 1;
		const rx = r.x + pad, ry = r.y + pad;
		const rw = Math.max(2, r.w - pad * 2), rh = Math.max(2, r.h - pad * 2);
		for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) if (inRect(x, y, W, H)) w.delete(key(x, y));
		rooms.push({
			cx: Math.floor(rx + rw / 2),
			cy: Math.floor(ry + rh / 2)
		});
	}
	const cw = P.corridorW;
	const carve = (x, y) => {
		for (let dy = 0; dy < cw; dy++) for (let dx = 0; dx < cw; dx++) if (inRect(x + dx, y + dy, W, H)) w.delete(key(x + dx, y + dy));
	};
	for (let i = 1; i < rooms.length; i++) {
		const a = rooms[i - 1], b = rooms[i];
		if (random() < .5) {
			for (let x = Math.min(a.cx, b.cx); x <= Math.max(a.cx, b.cx); x++) carve(x, a.cy);
			for (let y = Math.min(a.cy, b.cy); y <= Math.max(a.cy, b.cy); y++) carve(b.cx, y);
		} else {
			for (let y = Math.min(a.cy, b.cy); y <= Math.max(a.cy, b.cy); y++) carve(a.cx, y);
			for (let x = Math.min(a.cx, b.cx); x <= Math.max(a.cx, b.cx); x++) carve(x, b.cy);
		}
	}
	return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}
/**
* Органика. Для шахмат сама по себе плохая: слайдеры упираются через клетку.
* Спасает постобработка — срезание одиночных выступов, после неё появляются
* пусть кривые, но проезжие линии.
*/
function caves(ctx) {
	const { W, H, P } = ctx;
	let grid = [];
	for (let y = 0; y < H; y++) {
		grid[y] = [];
		for (let x = 0; x < W; x++) grid[y][x] = inRect(x, y, W, H) ? random() < P.density : false;
	}
	const around = (g, x, y) => {
		let n = 0;
		for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
			if (!dx && !dy) continue;
			const nx = x + dx, ny = y + dy;
			if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
			if (g[ny][nx]) n++;
		}
		return n;
	};
	for (let s = 0; s < P.steps; s++) {
		const next = grid.map((r) => r.slice());
		for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
			const n = around(grid, x, y);
			next[y][x] = grid[y][x] ? n >= P.survive : n >= P.birth;
		}
		grid = next;
	}
	const w = /* @__PURE__ */ new Set();
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] && inRect(x, y, W, H)) w.add(key(x, y));
	for (const k of [...w]) {
		const [x, y] = k.split(",").map(Number);
		if (ORTHO.filter(([dx, dy]) => w.has(key(x + dx, y + dy))).length <= 1) w.delete(k);
	}
	return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}
function maze(ctx) {
	const { W, H, P, start } = ctx;
	const w = /* @__PURE__ */ new Set();
	for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) w.add(key(x, y));
	const step = P.cellStep;
	const ok = (x, y) => inRect(x, y, W, H);
	const seen = /* @__PURE__ */ new Set([key(1, 1)]);
	w.delete(key(1, 1));
	const stack = [{
		x: 1,
		y: 1
	}];
	while (stack.length) {
		const c = stack[stack.length - 1];
		const dirs = shuffle([...ORTHO]).filter(([dx, dy]) => {
			const nx = c.x + dx * step, ny = c.y + dy * step;
			return ok(nx, ny) && !seen.has(key(nx, ny));
		});
		if (!dirs.length) {
			stack.pop();
			continue;
		}
		const [dx, dy] = dirs[0];
		for (let s = 1; s <= step; s++) w.delete(key(c.x + dx * s, c.y + dy * s));
		const nx = c.x + dx * step, ny = c.y + dy * step;
		seen.add(key(nx, ny));
		stack.push({
			x: nx,
			y: ny
		});
	}
	for (const k of [...seen]) {
		const [x, y] = k.split(",").map(Number);
		if (ORTHO.filter(([dx, dy]) => !w.has(key(x + dx, y + dy))).length > 1 || random() > P.braid) continue;
		const cand = shuffle(ORTHO.filter(([dx, dy]) => ok(x + dx, y + dy) && w.has(key(x + dx, y + dy))));
		if (cand.length) w.delete(key(x + cand[0][0], y + cand[0][1]));
	}
	if (start) {
		w.delete(key(start.x, start.y));
		w.delete(key(start.x, start.y - 1));
	}
	return stripEdges(w, W, H);
}
function corridors(ctx) {
	const { W, H, P, canWall } = ctx;
	const w = /* @__PURE__ */ new Set();
	const rows = shuffle([...Array(Math.max(1, H - 4))].map((_, i) => i + 2)).slice(0, P.bands);
	for (const y of rows) {
		const gaps = /* @__PURE__ */ new Set();
		for (let g = 0; g < P.gapsPerBand; g++) gaps.add(1 + randInt(W - 2));
		for (let x = 1; x < W - 1; x++) if (!gaps.has(x) && canWall(x, y)) w.add(key(x, y));
	}
	return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}
function grid(ctx) {
	const { W, H, P, canWall } = ctx;
	const w = /* @__PURE__ */ new Set();
	const n = P.cells;
	const gx = Math.floor((W - 2) / n);
	const gy = Math.floor((H - 2) / n);
	for (let r = 1; r < n; r++) for (let c = 1; c < n; c++) {
		const sx = 1 + c * gx, sy = 1 + r * gy;
		for (let x = sx - 1; x <= sx + 1; x++) for (let y = sy - 1; y <= sy + 1; y++) if (canWall(x, y) && (x === sx - 1 || x === sx + 1 || y === sy - 1 || y === sy + 1)) w.add(key(x, y));
		for (let d = 0; d < P.doorsPerWall; d++) {
			w.delete(key(sx, sy));
			w.delete(key(sx, sy - 1 - randInt(2)));
			w.delete(key(sx, sy + 1 + randInt(2)));
			w.delete(key(sx - 1 - randInt(2), sy));
			w.delete(key(sx + 1 + randInt(2), sy));
		}
	}
	return stripEdges(w, W, H);
}
function arena(ctx) {
	const { W, H, P, canWall } = ctx;
	const w = /* @__PURE__ */ new Set();
	let guard = 0;
	while (w.size < P.clutter && guard++ < 200) {
		const x = 2 + randInt(W - 4), y = 2 + randInt(H - 4);
		if (!canWall(x, y)) continue;
		w.add(key(x, y));
		if (random() < .4) {
			const [dx, dy] = pick(ORTHO);
			if (canWall(x + dx, y + dy)) w.add(key(x + dx, y + dy));
		}
	}
	return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}
function pylons(ctx) {
	const { W, H, P, canWall } = ctx;
	const w = /* @__PURE__ */ new Set();
	let guard = 0;
	while (w.size < P.count && guard++ < 500) {
		const x = 1 + randInt(W - 2), y = 1 + randInt(H - 3);
		if (!canWall(x, y) || w.has(key(x, y))) continue;
		if (random() > P.clustered && ORTHO.some(([dx, dy]) => w.has(key(x + dx, y + dy)))) continue;
		w.add(key(x, y));
	}
	return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}
/**
* Самый управляемый способ получить осмысленную позицию: авторские куски
* штампуются на пустое поле. Именно сюда стоит складывать удачные конфигурации,
* найденные в редакторе.
*
* '#' стена, '.' пусто, ' ' не трогать (сохранить, что было).
*/
var STAMPS = [
	[
		"##.##",
		"#...#",
		".....",
		"#...#",
		"##.##"
	],
	[
		"#####",
		"#...#",
		"#.#.#",
		"#...#",
		".###."
	],
	[
		"..#..",
		".###.",
		"#####",
		".###.",
		"..#.."
	],
	[
		"#...#",
		".#.#.",
		"..#..",
		".#.#.",
		"#...#"
	],
	[
		"#####",
		".....",
		"#####",
		".....",
		"#####"
	],
	[
		"#..##",
		"#..#.",
		"#....",
		".##.#",
		"..#.#"
	]
];
function stamps(ctx) {
	const { W, H, P, canWall } = ctx;
	const w = /* @__PURE__ */ new Set();
	const rot = (m) => m[0].split("").map((_, i) => m.map((r) => r[i]).reverse().join(""));
	for (let i = 0; i < P.pieces; i++) {
		let m = pick(STAMPS);
		if (P.rotate) for (let r = randInt(4); r > 0; r--) m = rot(m);
		const sh = m.length, sw = m[0].length;
		const ox = 1 + randInt(Math.max(1, W - sw - 2));
		const oy = 1 + randInt(Math.max(1, H - sh - 2));
		for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
			const ch = m[y][x];
			const gx = ox + x, gy = oy + y;
			if (ch === " ") continue;
			if (ch === "#" && canWall(gx, gy)) w.add(key(gx, gy));
			if (ch === ".") w.delete(key(gx, gy));
		}
	}
	return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}
var ALGO_FN = {
	bsp,
	caves,
	maze,
	corridors,
	grid,
	arena,
	pylons,
	stamps
};
//#endregion
//#region src/gen/validate.js
/**
* src/gen/validate.js — проверка карты по тому, как в игре реально ходят.
*
* Старый generateRoom() валидировал связность ортогональным flood fill, но
* ортогонально в игре не ходит никто: конь прыгает буквой «Г», слон заперт
* в клетках своего цвета, ладья скользит до первого препятствия. Карта могла
* пройти проверку и оказаться непроходимой для той формы, которой играют.
*
* Здесь строится по графу на форму, считаются метрики и, если карта не
* проходит пороги, чинится точечно — пробивается стена, а не выбрасывается
* вся комната.
*/
var SLIDE = "slide";
var STEP = "step";
var JUMP = "jump";
var MOVE = {
	pawn: {
		dirs: ORTHO,
		mode: STEP
	},
	king: {
		dirs: [...ORTHO, ...DIAG],
		mode: STEP
	},
	knight: {
		dirs: KNIGHT_J,
		mode: JUMP
	},
	bishop: {
		dirs: DIAG,
		mode: SLIDE,
		r: 3
	},
	rook: {
		dirs: ORTHO,
		mode: SLIDE,
		r: 3
	},
	queen: {
		dirs: [...ORTHO, ...DIAG],
		mode: SLIDE,
		r: 2
	}
};
/** Ходы формы из клетки без учёта фигур — только геометрия. */
function movesFrom(form, x, y, W, H, isWall) {
	const m = MOVE[form] || MOVE.king;
	const out = [];
	const inB = (a, b) => a >= 0 && a < W && b >= 0 && b < H;
	for (const [dx, dy] of m.dirs) if (m.mode === SLIDE) for (let s = 1; s <= (m.r || 3); s++) {
		const nx = x + dx * s, ny = y + dy * s;
		if (!inB(nx, ny) || isWall(nx, ny)) break;
		out.push([nx, ny]);
	}
	else {
		const nx = x + dx, ny = y + dy;
		if (!inB(nx, ny) || isWall(nx, ny)) continue;
		out.push([nx, ny]);
	}
	return out;
}
/** Множество клеток, достижимых формой из старта. */
function reachFor(form, start, W, H, isWall) {
	const seen = /* @__PURE__ */ new Set([key(start.x, start.y)]);
	const q = [[start.x, start.y]];
	while (q.length) {
		const [x, y] = q.pop();
		for (const [nx, ny] of movesFrom(form, x, y, W, H, isWall)) {
			const k = key(nx, ny);
			if (seen.has(k)) continue;
			seen.add(k);
			q.push([nx, ny]);
		}
	}
	return seen;
}
/**
* @returns {{open:number, knightReach:number, pawnReach:number, promo:boolean,
*            sliderLine:number, diagLine:number, escape:number, colorBalance:number}}
*/
function metrics(W, H, isWall, start) {
	const open = [];
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!isWall(x, y)) open.push([x, y]);
	const total = open.length || 1;
	const kReach = reachFor("knight", start, W, H, isWall);
	const pReach = reachFor("pawn", start, W, H, isWall);
	const lineLen = (dirs) => {
		let sum = 0;
		for (const [x, y] of open) {
			let best = 0;
			for (const [dx, dy] of dirs) {
				let s = 0;
				while (true) {
					const nx = x + dx * (s + 1), ny = y + dy * (s + 1);
					if (nx < 0 || ny < 0 || nx >= W || ny >= H || isWall(nx, ny)) break;
					s++;
				}
				best = Math.max(best, s);
			}
			sum += best;
		}
		return sum / total;
	};
	let esc = 0;
	for (const [x, y] of open) esc += movesFrom("king", x, y, W, H, isWall).length;
	let light = 0, dark = 0;
	for (const k of kReach) {
		const [x, y] = k.split(",").map(Number);
		if (tileColor(x, y) === 0) light++;
		else dark++;
	}
	const cb = light + dark ? Math.min(light, dark) / (light + dark) : 0;
	let promo = false;
	for (let x = 0; x < W && !promo; x++) if (pReach.has(key(x, 0))) promo = true;
	return {
		open: total,
		knightReach: kReach.size / total,
		pawnReach: pReach.size / total,
		promo,
		sliderLine: lineLen(ORTHO),
		diagLine: lineLen(DIAG),
		escape: esc / total,
		colorBalance: cb
	};
}
/** Проверка порогов. Возвращает список проблем, пустой — карта годная. */
function problems(m, P) {
	const out = [];
	if (m.knightReach < P.minKnightReach) out.push("knightReach");
	if (!m.promo) out.push("promo");
	if (m.escape < P.minEscape) out.push("escape");
	if (m.sliderLine < P.minSliderLine) out.push("sliderLine");
	if (m.colorBalance < P.minColorBalance) out.push("colorBalance");
	return out;
}
/**
* Пробивает стены, пока карта не пройдёт пороги. Не регенерирует комнату
* целиком: дешевле снести несколько блоков, чем выбросить удачную форму
* пространства из-за одного запертого угла.
*
* Мутирует переданный Set стен.
*
* @returns {{ok:boolean, metrics:object, problems:string[], repairs:number}}
*/
function validateAndRepair(walls, W, H, start, P, maxRepairs = 40) {
	const isWall = (x, y) => walls.has(key(x, y));
	let repairs = 0;
	for (let pass = 0; pass <= maxRepairs; pass++) {
		const m = metrics(W, H, isWall, start);
		const bad = problems(m, P);
		if (!bad.length) return {
			ok: true,
			metrics: m,
			problems: [],
			repairs
		};
		if (pass === maxRepairs) return {
			ok: false,
			metrics: m,
			problems: bad,
			repairs
		};
		if (bad.includes("knightReach") || bad.includes("promo")) {
			const reach = reachFor("knight", start, W, H, isWall);
			let victim = null;
			for (const k of reach) {
				const [x, y] = k.split(",").map(Number);
				for (const [dx, dy] of [...ORTHO, ...DIAG]) {
					const nx = x + dx, ny = y + dy;
					if (nx <= 0 || ny <= 0 || nx >= W - 1 || ny >= H - 1) continue;
					if (!walls.has(key(nx, ny))) continue;
					const bx = nx + dx, by = ny + dy;
					if (bx > 0 && by > 0 && bx < W - 1 && by < H - 1 && !reach.has(key(bx, by))) {
						victim = key(nx, ny);
						break;
					}
				}
				if (victim) break;
			}
			if (!victim) for (const k of reach) {
				const [x, y] = k.split(",").map(Number);
				const c = ORTHO.map(([dx, dy]) => key(x + dx, y + dy)).find((kk) => walls.has(kk));
				if (c) {
					victim = c;
					break;
				}
			}
			if (victim) {
				walls.delete(victim);
				repairs++;
				continue;
			}
		}
		let best = null, bestN = -1;
		for (const k of walls) {
			const [x, y] = k.split(",").map(Number);
			if (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1) continue;
			const n = [...ORTHO, ...DIAG].filter(([dx, dy]) => walls.has(key(x + dx, y + dy))).length;
			if (n > bestN) {
				bestN = n;
				best = k;
			}
		}
		if (!best) return {
			ok: false,
			metrics: m,
			problems: bad,
			repairs
		};
		walls.delete(best);
		repairs++;
	}
	const m = metrics(W, H, isWall, start);
	return {
		ok: false,
		metrics: m,
		problems: problems(m, P),
		repairs
	};
}
//#endregion
//#region src/gen/decorate.js
/**
* src/gen/decorate.js — расстановка механик.
*
* Старый placeSpecials() раскидывал всё по случайным клеткам: одинокий
* конвейер в углу никуда не ведёт, плита открывает стену, за которой ничего
* нет, ворота стоят посреди открытого поля и ни от чего не защищают.
*
* Здесь каждая механика ставится паттерном, у которого есть смысл:
*   лента     — цепочка конвейеров, ведущая куда-то (к награде или в опасность)
*   плита     — открывает проход к тому, что иначе недоступно
*   ворота    — вход в тупик с добычей: зашёл — обратно только в обход
*   цветозона — короткий путь, доступный слону и никому больше
*/
var inB = (x, y, W, H) => x >= 0 && x < W && y >= 0 && y < H;
/**
* @param {Set} walls
* @param {object} o — { W, H, start, P }
* @returns {Map} special — карта спец-клеток
*/
function decorate(walls, o) {
	const { W, H, start, P } = o;
	const sp = /* @__PURE__ */ new Map();
	const isWall = (x, y) => walls.has(key(x, y));
	const occupied = (x, y) => isWall(x, y) || sp.has(key(x, y));
	const free = [];
	for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (!isWall(x, y) && !(x === start.x && y === start.y)) free.push({
		x,
		y
	});
	shuffle(free);
	let ptr = 0;
	const take = (pred) => {
		for (let i = ptr; i < free.length; i++) {
			const c = free[i];
			if (occupied(c.x, c.y)) continue;
			if (pred && !pred(c)) continue;
			[free[ptr], free[i]] = [free[i], free[ptr]];
			return free[ptr++];
		}
		return null;
	};
	for (let r = 0; r < P.conveyorRuns; r++) {
		const dir = pick(ORTHO);
		const head = take((c) => {
			for (let s = 0; s < P.conveyorLen; s++) {
				const x = c.x + dir[0] * s, y = c.y + dir[1] * s;
				if (!inB(x, y, W, H) || occupied(x, y)) return false;
			}
			return true;
		});
		if (!head) continue;
		for (let s = 0; s < P.conveyorLen; s++) {
			const x = head.x + dir[0] * s, y = head.y + dir[1] * s;
			sp.set(key(x, y), {
				type: "conveyor",
				dir
			});
		}
		const ex = head.x + dir[0] * P.conveyorLen, ey = head.y + dir[1] * P.conveyorLen;
		if (inB(ex, ey, W, H) && !occupied(ex, ey)) sp.set(key(ex, ey), { type: random() < .55 ? "food" : "trap" });
	}
	const kReach = reachFor("knight", start, W, H, isWall);
	for (let p = 0; p < P.platePuzzles; p++) {
		let placed = false;
		const candidates = shuffle([...walls]);
		for (const wk of candidates) {
			const [wx, wy] = wk.split(",").map(Number);
			if (wx <= 0 || wy <= 0 || wx >= W - 1 || wy >= H - 1) continue;
			let pocket = null;
			for (const [dx, dy] of ORTHO) {
				const bx = wx + dx, by = wy + dy;
				if (!inB(bx, by, W, H) || isWall(bx, by)) continue;
				if (!kReach.has(key(bx, by))) pocket = {
					x: bx,
					y: by
				};
			}
			if (!pocket) continue;
			const plate = take((c) => Math.abs(c.x - wx) + Math.abs(c.y - wy) > 3);
			if (!plate) break;
			sp.set(key(plate.x, plate.y), {
				type: "plate",
				opens: {
					x: wx,
					y: wy
				}
			});
			if (!occupied(pocket.x, pocket.y)) sp.set(key(pocket.x, pocket.y), { type: "scroll" });
			placed = true;
			break;
		}
		if (!placed) {
			const c = take((cc) => ORTHO.some(([dx, dy]) => isWall(cc.x + dx, cc.y + dy)));
			if (!c) continue;
			const [dx, dy] = shuffle([...ORTHO]).find(([ax, ay]) => isWall(c.x + ax, c.y + ay)) || [];
			if (dx !== void 0) sp.set(key(c.x, c.y), {
				type: "plate",
				opens: {
					x: c.x + dx,
					y: c.y + dy
				}
			});
		}
	}
	for (let g = 0; g < P.gates; g++) {
		const neck = take((c) => {
			return ORTHO.filter(([dx, dy]) => !isWall(c.x + dx, c.y + dy)).length === 2;
		});
		if (!neck) continue;
		const dir = pick(ORTHO.filter(([dx, dy]) => !isWall(neck.x + dx, neck.y + dy))) || ORTHO[0];
		sp.set(key(neck.x, neck.y), {
			type: "gate",
			dir
		});
		const rx = neck.x + dir[0] * 2, ry = neck.y + dir[1] * 2;
		if (inB(rx, ry, W, H) && !occupied(rx, ry)) sp.set(key(rx, ry), { type: "scroll" });
	}
	for (let z = 0; z < P.colorZones; z++) {
		const head = take(null);
		if (!head) continue;
		const dir = pick(DIAG);
		const len = 1 + randInt(2);
		for (let s = 0; s < len; s++) {
			const x = head.x + dir[0] * s * 2, y = head.y + dir[1] * s * 2;
			if (!inB(x, y, W, H) || occupied(x, y)) break;
			sp.set(key(x, y), {
				type: "colorzone",
				color: tileColor(x, y)
			});
		}
	}
	const hazards = [
		"trap",
		"trap",
		"ice",
		"fog"
	];
	for (let h = 0; h < P.hazards; h++) {
		const c = take((cc) => ORTHO.filter(([dx, dy]) => !isWall(cc.x + dx, cc.y + dy)).length >= 3);
		if (!c) break;
		sp.set(key(c.x, c.y), { type: pick(hazards) });
	}
	if (random() < .35) {
		const c = take(null);
		if (c) sp.set(key(c.x, c.y), { type: "lava" });
	}
	if (random() < .55) {
		const a = take(null), b = take((c) => a && Math.abs(c.x - a.x) + Math.abs(c.y - a.y) > Math.min(W, H) * .6);
		if (a && b) {
			sp.set(key(a.x, a.y), {
				type: "portal",
				pair: {
					x: b.x,
					y: b.y
				}
			});
			sp.set(key(b.x, b.y), {
				type: "portal",
				pair: {
					x: a.x,
					y: a.y
				}
			});
		}
	}
	if (random() < .6) {
		const c = take(null);
		if (c) sp.set(key(c.x, c.y), { type: "rune" });
	}
	const wantLight = 1 + randInt(2), wantDark = 1 + randInt(2);
	let gotL = 0, gotD = 0;
	for (let i = 0; i < 12 && (gotL < wantLight || gotD < wantDark); i++) {
		const needLight = gotL < wantLight;
		const c = take((cc) => kReach.has(key(cc.x, cc.y)) && tileColor(cc.x, cc.y) === 0 === needLight);
		if (!c) break;
		sp.set(key(c.x, c.y), { type: "food" });
		if (needLight) gotL++;
		else gotD++;
	}
	const nScroll = 1 + randInt(2);
	for (let s = 0; s < nScroll; s++) {
		const c = take((cc) => kReach.has(key(cc.x, cc.y)));
		if (c) sp.set(key(c.x, c.y), { type: "scroll" });
	}
	return sp;
}
//#endregion
//#region src/gen/params.js
/** Общие для всех алгоритмов. */
var COMMON = [
	{
		key: "openness",
		label: "Открытость",
		min: .3,
		max: .95,
		step: .05,
		def: .7
	},
	{
		key: "symmetry",
		label: "Симметрия",
		min: 0,
		max: 1,
		step: .5,
		def: 0
	},
	{
		key: "braid",
		label: "Расплетание тупиков",
		min: 0,
		max: 1,
		step: .05,
		def: .35
	}
];
/** Настройки механик — общие, но осмысленные не для всех стилей. */
var MECHANICS = [
	{
		key: "conveyorRuns",
		label: "Конвейерных лент",
		min: 0,
		max: 3,
		step: 1,
		def: 1
	},
	{
		key: "conveyorLen",
		label: "Длина ленты",
		min: 2,
		max: 7,
		step: 1,
		def: 4
	},
	{
		key: "platePuzzles",
		label: "Плита + проход",
		min: 0,
		max: 3,
		step: 1,
		def: 1
	},
	{
		key: "gates",
		label: "Односторонние ворота",
		min: 0,
		max: 3,
		step: 1,
		def: 1
	},
	{
		key: "hazards",
		label: "Опасные клетки",
		min: 0,
		max: 8,
		step: 1,
		def: 3
	},
	{
		key: "colorZones",
		label: "Цветовые зоны",
		min: 0,
		max: 4,
		step: 1,
		def: 1
	}
];
/** Пороги приёмки — по ним валидатор решает, чинить карту или нет. */
var QUALITY = [
	{
		key: "minKnightReach",
		label: "Достижимость конём",
		min: .5,
		max: 1,
		step: .05,
		def: .92
	},
	{
		key: "minEscape",
		label: "Мин. ходов из клетки",
		min: 1,
		max: 6,
		step: 1,
		def: 3
	},
	{
		key: "minSliderLine",
		label: "Мин. длина линии",
		min: 1,
		max: 6,
		step: .5,
		def: 2.5
	},
	{
		key: "minColorBalance",
		label: "Баланс цветов",
		min: 0,
		max: .5,
		step: .05,
		def: .35
	}
];
var SCHEMA = {
	common: COMMON,
	mechanics: MECHANICS,
	quality: QUALITY,
	bsp: [
		{
			key: "minRoom",
			label: "Мин. комната",
			min: 3,
			max: 9,
			step: 1,
			def: 4
		},
		{
			key: "splits",
			label: "Глубина деления",
			min: 1,
			max: 5,
			step: 1,
			def: 3
		},
		{
			key: "corridorW",
			label: "Ширина коридора",
			min: 1,
			max: 3,
			step: 1,
			def: 1
		},
		{
			key: "roomChance",
			label: "Заполнение комнат",
			min: .4,
			max: 1,
			step: .1,
			def: .9
		}
	],
	caves: [
		{
			key: "density",
			label: "Начальная плотность",
			min: .35,
			max: .6,
			step: .01,
			def: .45
		},
		{
			key: "steps",
			label: "Шагов сглаживания",
			min: 1,
			max: 8,
			step: 1,
			def: 4
		},
		{
			key: "birth",
			label: "Порог рождения",
			min: 3,
			max: 6,
			step: 1,
			def: 5
		},
		{
			key: "survive",
			label: "Порог выживания",
			min: 2,
			max: 5,
			step: 1,
			def: 4
		}
	],
	maze: [{
		key: "cellStep",
		label: "Шаг ячейки",
		min: 2,
		max: 3,
		step: 1,
		def: 2
	}],
	corridors: [{
		key: "bands",
		label: "Барьеров",
		min: 1,
		max: 5,
		step: 1,
		def: 3
	}, {
		key: "gapsPerBand",
		label: "Проходов в барьере",
		min: 1,
		max: 3,
		step: 1,
		def: 2
	}],
	grid: [{
		key: "cells",
		label: "Ячеек по стороне",
		min: 2,
		max: 4,
		step: 1,
		def: 3
	}, {
		key: "doorsPerWall",
		label: "Проходов в стенке",
		min: 1,
		max: 2,
		step: 1,
		def: 1
	}],
	arena: [{
		key: "clutter",
		label: "Обломков",
		min: 0,
		max: 12,
		step: 1,
		def: 4
	}],
	pylons: [{
		key: "count",
		label: "Пилонов",
		min: 4,
		max: 24,
		step: 1,
		def: 13
	}, {
		key: "clustered",
		label: "Кучность",
		min: 0,
		max: 1,
		step: .1,
		def: 0
	}],
	stamps: [{
		key: "pieces",
		label: "Заготовок",
		min: 1,
		max: 6,
		step: 1,
		def: 3
	}, {
		key: "rotate",
		label: "Поворачивать",
		min: 0,
		max: 1,
		step: 1,
		def: 1
	}]
};
/** Дефолты одного алгоритма плюс общие. */
function defaults(algo) {
	const out = {};
	for (const list of [
		COMMON,
		MECHANICS,
		QUALITY,
		SCHEMA[algo] || []
	]) for (const p of list) out[p.key] = p.def;
	return out;
}
/**
* Пресет биома: какой алгоритм и с какими сдвигами относительно дефолтов.
* Биом задаёт характер, параметры — точную настройку.
*/
var BIOME_PRESET = {
	halls: {
		algo: "bsp",
		params: {
			openness: .82,
			minRoom: 5,
			conveyorRuns: 0,
			colorZones: 2
		}
	},
	corridors: {
		algo: "corridors",
		params: {
			openness: .5,
			gates: 2,
			platePuzzles: 2,
			conveyorRuns: 2
		}
	},
	maze: {
		algo: "maze",
		params: {
			braid: .45,
			hazards: 2,
			colorZones: 2
		}
	},
	grid: {
		algo: "grid",
		params: {
			openness: .6,
			platePuzzles: 2,
			gates: 1
		}
	},
	arena: {
		algo: "arena",
		params: {
			openness: .95,
			hazards: 5,
			conveyorRuns: 1,
			gates: 0
		}
	},
	pylons: {
		algo: "pylons",
		params: {
			count: 15,
			hazards: 4,
			colorZones: 2
		}
	}
};
/** Итоговые параметры для биома с ручными переопределениями поверх. */
function paramsForBiome(biomeId, overrides = {}) {
	const preset = BIOME_PRESET[biomeId] || BIOME_PRESET.halls;
	const algo = overrides.algo || preset.algo;
	return {
		algo,
		params: {
			...defaults(algo),
			...preset.params,
			...overrides.params || {}
		}
	};
}
//#endregion
//#region src/gen/index.js
/**
* src/gen/index.js — сборка генерации.
*
*   алгоритм → валидация по шахматным графам с починкой → механики
*
* Замена старому generateRoom(): тот сам решал и форму, и проходимость,
* и расстановку спец-клеток, и валидировал ортогональным flood fill, которым
* в игре не ходит ни одна фигура.
*/
/** Последний отчёт генерации — читает редактор и тесты. */
var lastReport = null;
/**
* Сгенерировать комнату.
*
* @param {object} [opts]
*   W, H       — размер (по умолчанию из CFG)
*   biome      — id биома, определяет пресет
*   algo       — переопределить алгоритм
*   params     — переопределить отдельные параметры
*   start      — стартовая клетка
* @returns {{walls:Set, special:Map, playerStart:object, reach:Set, report:object}}
*/
function generate(opts = {}) {
	const W = opts.W || CFG.W;
	const H = opts.H || CFG.H;
	const start = opts.start || {
		x: Math.floor(W / 2),
		y: H - 1
	};
	const { algo, params } = paramsForBiome(opts.biome || "halls", {
		algo: opts.algo,
		params: opts.params
	});
	const P = params;
	const canWall = (x, y) => x > 0 && x < W - 1 && y > 0 && y < H - 1 && !(x === start.x && y >= H - 2);
	const fn = ALGO_FN[algo] || ALGO_FN.bsp;
	const t0 = typeof performance !== "undefined" ? performance.now() : 0;
	let walls = fn({
		W,
		H,
		P,
		start,
		canWall
	});
	const cells = (W - 2) * (H - 2);
	const wantWalls = Math.round(cells * (1 - P.openness));
	if (walls.size > wantWalls) {
		const list = shuffle([...walls]);
		list.sort((a, b) => neighbours(walls, b) - neighbours(walls, a));
		while (walls.size > wantWalls && list.length) walls.delete(list.pop());
	}
	const v = validateAndRepair(walls, W, H, start, P);
	const special = decorate(walls, {
		W,
		H,
		start,
		P
	});
	const isWall = (x, y) => walls.has(key(x, y));
	const reach = reachFor("knight", start, W, H, isWall);
	lastReport = {
		algo,
		params: P,
		ok: v.ok,
		problems: v.problems,
		repairs: v.repairs,
		metrics: v.metrics,
		ms: (typeof performance !== "undefined" ? performance.now() : 0) - t0
	};
	return {
		walls,
		special,
		playerStart: start,
		reach,
		report: lastReport
	};
}
function neighbours(walls, k) {
	const [x, y] = k.split(",").map(Number);
	let n = 0;
	for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
		if (!dx && !dy) continue;
		if (walls.has(key(x + dx, y + dy))) n++;
	}
	return n;
}
/**
* Совместимость со старым вызовом из board.js.
* Возвращает ту же форму объекта, что и прежний generateRoom().
*/
function generateRoomCompat(biomeId) {
	const r = generate({ biome: biomeId });
	return {
		walls: r.walls,
		playerStart: r.playerStart,
		reach: r.reach,
		specials: r.special
	};
}
//#endregion
//#region src/board.js
/**
* src/board.js — генерация этажа: 6 стилей биомов, спавн врагов, босс-комнаты, комнаты.
* Основные экспорты: generateRoom(), generateBossRoom(), spawnEnemiesForFloor(), newFloor(), reset().
*/
/** Генерация комнаты — делегирована модулю gen/. */
function generateRoom() {
	return generateRoomCompat(S$1.biome && S$1.biome.id);
}
function buildFloorEnemies(flr, share = 1) {
	const D = CFG.DIFF;
	const maxEnemies = Math.max(2, Math.round(Math.min(5 + Math.floor(flr / 4), 10) * share));
	let budget = (D.budgetBase + D.budgetGrow * (flr - 1)) * Math.sqrt(CFG.W * CFG.H / 99) * share;
	if (flr === 1 && META.upgrades.headstart) budget -= 2;
	const qcap = flr >= D.queenCapDeepFloor ? D.queenCapDeep : D.queenCap;
	const avail = Object.keys(D.cost).filter((t) => flr >= D.unlockFloor[t]);
	const bag = [];
	let eliteCount = 0;
	let guard = 0;
	while (budget >= 1 && bag.length < maxEnemies && guard++ < 100) {
		const qc = bag.filter((t) => t === "queen").length;
		let aff = avail.filter((t) => D.cost[t] <= budget && !(t === "queen" && qc >= qcap));
		if (eliteCount >= D.maxElite) aff = aff.filter((t) => (D.cost[t] || 1) < 5);
		if (!aff.length) break;
		const fav = (S$1.biome && S$1.biome.favorEnemies || []).filter((t) => aff.includes(t));
		const t = fav.length && random() < .5 ? pick(fav) : pick(aff);
		bag.push(t);
		if ((D.cost[t] || 1) >= 5) eliteCount++;
		budget -= D.cost[t];
	}
	while (bag.length < Math.max(1, Math.round(D.minEnemies * share))) bag.push("pawn");
	return shuffle(bag);
}
function enemyRangeBonus(flr) {
	let b = 0;
	if (flr >= CFG.DIFF.rangeBumpFloor) b++;
	if (flr >= CFG.DIFF.rangeBumpFloor2) b++;
	if (curse("marked")) b++;
	return b;
}
function spawnEnemiesForFloor(f, reach, share = 1) {
	S$1.enemies = [];
	const bag = buildFloorEnemies(f, share);
	const rb = enemyRangeBonus(f);
	const pk = key(S$1.player.x, S$1.player.y);
	const cand = [];
	for (let y = 0; y < Math.ceil(CFG.H * .62); y++) for (let x = 0; x < CFG.W; x++) {
		if (!reach.has(key(x, y))) continue;
		if (S$1.special.get(key(x, y))?.type === "trap" || S$1.special.get(key(x, y))?.type === "lava") continue;
		if (Math.abs(y - S$1.player.y) < 2 && Math.abs(x - S$1.player.x) < 2) continue;
		cand.push({
			x,
			y
		});
	}
	shuffle(cand);
	const mk = (t, c) => {
		const o = {
			type: t,
			x: c.x,
			y: c.y,
			facing: [0, 1],
			cd: 0,
			status: {},
			homeColor: tileColor(c.x, c.y),
			r: (CFG.BASE_R[t] || 1) + rb,
			rb
		};
		if (t === "guardian") o.armor = 2 + (curse("guard_tough") ? 1 : 0);
		if (t === "necro") o.spawnCd = necroInterval();
		if (t === "priest") o.priestCd = CFG.DIFF.priestEvery;
		if (t === "frost") o.frostCd = CFG.DIFF.frostEvery;
		return o;
	};
	for (const t of bag) {
		let idx = cand.findIndex((c) => !enemyAt(c.x, c.y) && !threatCellsFrom(mk(t, c), c.x, c.y).has(pk) && isSpawnable(t, c.x, c.y));
		if (idx === -1) idx = cand.findIndex((c) => !enemyAt(c.x, c.y) && isSpawnable(t, c.x, c.y));
		if (idx === -1) idx = cand.findIndex((c) => !enemyAt(c.x, c.y));
		if (idx === -1) break;
		S$1.enemies.push(mk(t, cand[idx]));
		codexSeeEnemy(t);
		cand.splice(idx, 1);
	}
}
/** Авторская комната босса. */
function generateBossRoom(bossId) {
	if (bossId === "tormentor") {
		CFG.W = 15;
		CFG.H = 13;
		const w = /* @__PURE__ */ new Set();
		[
			[4, 4],
			[7, 6],
			[10, 8]
		].forEach(([cx, cy]) => {
			for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) w.add(key(cx + dx, cy + dy));
		});
		const sp = /* @__PURE__ */ new Map();
		return {
			walls: w,
			enemies: [{
				type: "bishop",
				x: Math.floor(CFG.W / 2),
				y: 3,
				status: {},
				armor: BOSS_CFG.tormentor.armor,
				r: BOSS_CFG.tormentor.range,
				phase: 1,
				stunCd: BOSS_CFG.tormentor.stunEvery,
				bossId: "tormentor"
			}],
			specials: sp
		};
	}
	if (bossId === "spawnedRooks") {
		CFG.W = 13;
		CFG.H = 11;
		const w = /* @__PURE__ */ new Set();
		const sp = /* @__PURE__ */ new Map();
		[
			[4, 5],
			[5, 5],
			[8, 5],
			[9, 5],
			[3, 7],
			[10, 7]
		].forEach(([x, y]) => sp.set(key(x, y), { type: "pillar" }));
		return {
			walls: w,
			enemies: [{
				type: "rook",
				x: 5,
				y: 2,
				r: BOSS_CFG.linkedRooks.range,
				linkedTo: "rookPair",
				status: {}
			}, {
				type: "rook",
				x: 6,
				y: 2,
				r: BOSS_CFG.linkedRooks.range,
				linkedTo: "rookPair",
				status: {}
			}],
			specials: sp
		};
	}
	if (bossId === "redKing") {
		CFG.W = 17;
		CFG.H = 15;
		const w = /* @__PURE__ */ new Set();
		const sp = /* @__PURE__ */ new Map();
		[
			[2, 2],
			[CFG.W - 3, 2],
			[2, CFG.H - 3],
			[CFG.W - 3, CFG.H - 3]
		].forEach(([cx, cy]) => {
			sp.set(key(cx, cy), {
				type: "plate",
				chain: true,
				broken: false
			});
		});
		return {
			walls: w,
			enemies: [
				{
					type: "king",
					x: Math.floor(CFG.W / 2),
					y: Math.floor(CFG.H / 2),
					status: {},
					r: 1,
					armor: 99,
					bossId: "redKing",
					king: true
				},
				{
					type: "queen",
					x: Math.floor(CFG.W / 2) - 4,
					y: Math.floor(CFG.H / 2) - 2,
					status: { shield: 1 },
					r: 8,
					bossId: "redKing",
					retinue: "queen"
				},
				{
					type: "rook",
					x: 3,
					y: Math.floor(CFG.H / 2),
					status: {},
					r: 8,
					bossId: "redKing",
					retinue: "rook",
					passive: true
				},
				{
					type: "rook",
					x: CFG.W - 4,
					y: Math.floor(CFG.H / 2),
					status: {},
					r: 8,
					bossId: "redKing",
					retinue: "rook",
					passive: true
				},
				{
					type: "knight",
					x: Math.floor(CFG.W / 2) + 3,
					y: Math.floor(CFG.H / 2) - 4,
					status: {},
					r: 1,
					bossId: "redKing",
					retinue: "knight",
					noAttackCd: true,
					attackReady: true
				},
				{
					type: "knight",
					x: Math.floor(CFG.W / 2) - 3,
					y: Math.floor(CFG.H / 2) - 4,
					status: {},
					r: 1,
					bossId: "redKing",
					retinue: "knight",
					noAttackCd: true,
					attackReady: true
				}
			],
			specials: sp
		};
	}
	if (bossId === "millstone") {
		CFG.W = 15;
		CFG.H = 13;
		const w = /* @__PURE__ */ new Set();
		for (let x = 0; x < CFG.W; x++) for (let y = 0; y < CFG.H; y++) {
			if (x < 3 || x > 7) w.add(key(x, y));
			if (y === 0 || y === CFG.H - 1) w.delete(key(x, y));
		}
		for (let y = 0; y < CFG.H; y++) for (let x = 3; x <= 7; x++) w.delete(key(x, y));
		w.delete(key(Math.floor(CFG.W / 2), CFG.H - 1));
		const sp = /* @__PURE__ */ new Map();
		sp.set(key(Math.floor(CFG.W / 2), 2), {
			type: "millstone",
			dir: [0, 1]
		});
		for (let x = 3; x <= 7; x++) sp.set(key(x, 0), { type: "pillar" });
		S$1.party = {
			dropCd: 0,
			pullCd: BOSS_CFG.puppeteer.pullEvery,
			reserve: BOSS_CFG.puppeteer.reserve
		};
		S$1.millFed = 0;
		return {
			walls: w,
			enemies: [],
			specials: sp
		};
	}
	return generateRoom();
}
/** Построить граф смежности комнат по дверям. */
function buildRoomGraph(rooms, n) {
	const adj = Array.from({ length: n }, () => []);
	for (let r = 0; r < n; r++) {
		const room = rooms[r];
		if (!room) continue;
		for (const [, s] of room.special) if (s.type === "door" && s.targetRoom != null && s.targetRoom >= 0 && s.targetRoom < n) {
			if (!adj[r].includes(s.targetRoom)) adj[r].push(s.targetRoom);
		}
	}
	return adj;
}
/** Проверить, что все комнаты достижимы из комнаты 0 через двери. */
function checkRoomConnectivity(rooms, n) {
	const adj = buildRoomGraph(rooms, n);
	const visited = /* @__PURE__ */ new Set([0]);
	const q = [0];
	while (q.length) {
		const cur = q.pop();
		for (const nxt of adj[cur]) if (!visited.has(nxt)) {
			visited.add(nxt);
			q.push(nxt);
		}
	}
	return visited.size >= n;
}
/** Обновить индикатор «Шах» после смены карты или комнаты. */
function syncCheckIndicator() {
	const onThreat = allThreats().has(key(S$1.player.x, S$1.player.y));
	dom.shahEl?.classList.toggle("on", onThreat);
}
function newFloor() {
	invalidateThreats();
	if (S$1.runMode === "campaign") seedRNG(CFG.CAMPAIGN_SEED + S$1.floor * 1e6 + S$1.turn);
	else seedRNG(Math.floor(Math.random() * 2147483647));
	screenFade("#000", 350);
	S$1.floor++;
	if (S$1.floor <= 2) {
		CFG.W = 11;
		CFG.H = 9;
	} else if (S$1.floor <= 4) {
		CFG.W = 13;
		CFG.H = 11;
	} else if (S$1.floor <= 6) {
		CFG.W = 15;
		CFG.H = 13;
	} else {
		CFG.W = 17;
		CFG.H = 15;
	}
	S$1.biome = biomeFor(S$1.floor);
	S$1.currentRoom = 0;
	S$1.rooms = [];
	S$1.keys.clear();
	S$1.player.x = Math.floor(CFG.W / 2);
	S$1.player.y = CFG.H - 1;
	S$1.player.facing = [0, -1];
	if (S$1.runMode === "campaign" && isBossFloor(S$1.floor)) {
		const bossId = bossOnFloor(S$1.floor);
		if (bossId) {
			const room = generateBossRoom(bossId);
			S$1.walls = room.walls;
			S$1.special = room.specials;
			S$1.enemies = room.enemies;
			S$1.rooms = [{
				walls: room.walls,
				enemies: S$1.enemies,
				special: room.specials,
				cleared: false
			}];
			loadRoom(0);
			S$1.player.x = Math.floor(CFG.W / 2);
			S$1.player.y = CFG.H - 1;
			S$1.player.facing = [0, -1];
			S$1.player.active = 0;
			S$1.promotionUsed = false;
			S$1.hoverEnemy = null;
			S$1.selectedEnemy = null;
			S$1.turn = 1;
			S$1.player.freeSwapUsed = false;
			S$1.player.capturedThisFloor = 0;
			S$1.player.hunger = CFG.HUNGER.start;
			S$1.bossPhase = 1;
			S$1.chainsBroken = 0;
			S$1.millTick = 0;
			if (bossId === "millstone") {
				S$1.party = S$1.party || {
					dropCd: 0,
					pullCd: BOSS_CFG.puppeteer.pullEvery,
					reserve: BOSS_CFG.puppeteer.reserve
				};
				S$1.millFed = S$1.millFed ?? 0;
			}
			clearSpeech();
			clearPending();
			cleanse(S$1.player);
			S$1.player.lostFormThisFloor = false;
			const bossNames = isEnglish() ? {
				tormentor: "Tormentor Bishop",
				spawnedRooks: "Linked Rooks",
				millstone: "Millstone",
				redKing: "Red King"
			} : {
				tormentor: "Слон-Мучитель",
				spawnedRooks: "Спаянные Ладьи",
				millstone: "Жернов",
				redKing: "Красный Король"
			};
			const bossScript = getScript().bosses[bossId];
			const appear = bossScript && bossScript.appear;
			if (appear) dispatchBossEvents(appear, {
				log: (t) => log(t),
				addSpeech: (x, y, t, kind) => addSpeech(x, y, t, kind)
			});
			else log(isEnglish() ? `-- Floor ${S$1.floor} · Boss: ${bossNames[bossId] || bossId} ──` : `── Ярус ${S$1.floor} · Босс: ${bossNames[bossId] || bossId} ──`, "e");
			syncCheckIndicator();
			render();
			syncUI();
			return;
		}
	}
	S$1.bossPhase = 0;
	S$1.chainsBroken = 0;
	S$1.millTick = 0;
	S$1.millFed = 0;
	S$1.party = null;
	const C = CFG.ROOMS;
	const maxRooms = Math.min(C.startMax + Math.floor(S$1.floor / C.growEvery), C.cap);
	const minRooms = Math.min(C.startMin + Math.floor(S$1.floor / C.growEvery), maxRooms);
	const nRooms = minRooms + randInt(Math.max(1, maxRooms - minRooms + 1));
	const share = Math.pow(nRooms, -(C.budgetExp ?? .65));
	for (let r = 0; r < nRooms; r++) {
		const room = generateRoom();
		S$1.walls = room.walls;
		S$1.special = room.specials;
		spawnEnemiesForFloor(S$1.floor, room.reach, share);
		S$1.rooms.push({
			walls: room.walls,
			enemies: S$1.enemies,
			special: room.specials,
			cleared: false
		});
	}
	if (nRooms > 1) {
		for (let r = 0; r < nRooms; r++) {
			if (nRooms === 2 && r > 0) break;
			const next = (r + 1) % nRooms;
			const doorX = CFG.W - 1;
			const doorY = Math.floor(CFG.H / 2);
			const locked = random() < .6 ? pick(KEY_COLORS) : null;
			let safeB = {
				x: 2,
				y: doorY
			};
			for (let sx = 2; sx <= 4; sx++) {
				if (!S$1.rooms[next].walls.has(key(sx, Math.floor(CFG.H / 2))) && S$1.rooms[next].special.get(key(sx, Math.floor(CFG.H / 2)))?.type !== "trap") {
					safeB = {
						x: sx,
						y: Math.floor(CFG.H / 2)
					};
					break;
				}
				for (let sy = doorY - 2; sy <= doorY + 2; sy++) if (sy > 0 && sy < CFG.H - 1 && !S$1.rooms[next].walls.has(key(sx, sy)) && S$1.rooms[next].special.get(key(sx, sy))?.type !== "trap") {
					safeB = {
						x: sx,
						y: sy
					};
					break;
				}
				if (safeB.x !== 2) break;
			}
			S$1.rooms[r].special.set(key(doorX, doorY), {
				type: "door",
				color: locked,
				targetRoom: next,
				targetPos: safeB
			});
			safeB = {
				x: CFG.W - 2,
				y: doorY
			};
			for (let sx = CFG.W - 2; sx >= CFG.W - 4; sx--) {
				if (!S$1.rooms[r].walls.has(key(sx, Math.floor(CFG.H / 2))) && S$1.rooms[r].special.get(key(sx, Math.floor(CFG.H / 2)))?.type !== "trap") {
					safeB = {
						x: sx,
						y: Math.floor(CFG.H / 2)
					};
					break;
				}
				for (let sy = doorY - 2; sy <= doorY + 2; sy++) if (sy > 0 && sy < CFG.H - 1 && !S$1.rooms[r].walls.has(key(sx, sy)) && S$1.rooms[r].special.get(key(sx, sy))?.type !== "trap") {
					safeB = {
						x: sx,
						y: sy
					};
					break;
				}
				if (safeB.x !== CFG.W - 2) break;
			}
			S$1.rooms[next].special.set(key(2, doorY), {
				type: "door",
				color: locked,
				targetRoom: r,
				targetPos: safeB
			});
			if (locked) {
				let kx, ky, tries = 0;
				do {
					kx = 1 + randInt(CFG.W - 2);
					ky = 1 + randInt(CFG.H - 2);
					tries++;
				} while (tries < 50 && (S$1.rooms[r].walls.has(key(kx, ky)) || S$1.rooms[r].special.get(key(kx, ky)) || kx === doorX && ky === doorY));
				if (tries < 50) S$1.rooms[r].special.set(key(kx, ky), {
					type: "key",
					color: locked
				});
			}
		}
		for (const room of S$1.rooms) room.special.forEach((s, k) => {
			if (s.type === "door") room.walls.delete(k);
		});
		let attempts = 0;
		while (attempts < 10 && !checkRoomConnectivity(S$1.rooms, nRooms)) {
			attempts++;
			const adj = buildRoomGraph(S$1.rooms, nRooms);
			const unreachable = [];
			const visited = /* @__PURE__ */ new Set([0]);
			const q = [0];
			while (q.length) {
				const cur = q.pop();
				for (const nxt of adj[cur]) if (!visited.has(nxt)) {
					visited.add(nxt);
					q.push(nxt);
				}
			}
			for (let i = 1; i < nRooms; i++) if (!visited.has(i)) unreachable.push(i);
			if (!unreachable.length) break;
			const target = pick(unreachable);
			const doorX2 = CFG.W - 1;
			const doorY2 = Math.floor(CFG.H / 2);
			S$1.rooms[0].special.set(key(doorX2, doorY2), {
				type: "door",
				color: null,
				targetRoom: target,
				targetPos: {
					x: 2,
					y: doorY2
				}
			});
			S$1.rooms[target].special.set(key(2, doorY2), {
				type: "door",
				color: null,
				targetRoom: 0,
				targetPos: {
					x: CFG.W - 2,
					y: doorY2
				}
			});
			S$1.rooms[0].walls.delete(key(doorX2, doorY2));
			S$1.rooms[target].walls.delete(key(2, doorY2));
		}
	}
	loadRoom(0);
	S$1.player.x = Math.floor(CFG.W / 2);
	S$1.player.y = CFG.H - 1;
	S$1.player.facing = [0, -1];
	S$1.player.active = 0;
	S$1.promotionUsed = false;
	S$1.hoverEnemy = null;
	S$1.selectedEnemy = null;
	S$1.turn = 1;
	S$1.player.freeSwapUsed = false;
	S$1.player.capturedThisFloor = 0;
	S$1.player.hunger = CFG.HUNGER.start;
	clearSpeech();
	clearPending();
	clearToastQueue();
	cleanse(S$1.player);
	S$1.player.lostFormThisFloor = false;
	updateMusic(S$1, bossOnFloor);
	if (S$1.runMode === "campaign" && bossOnFloor(S$1.floor + 1)) preload(bossOnFloor(S$1.floor + 1) === "redKing" ? "redking" : "boss");
	if (S$1.floor >= 5) unlockAch("deep");
	if (S$1.floor >= 10) unlockAch("abyss");
	if (has("smoke")) applyStatus(S$1.player, "shield", 1);
	if (has("second_wind")) applyStatus(S$1.player, "haste", 2);
	if (S$1.player.nextFloorStatus && S$1.player.nextFloorStatus.length) {
		S$1.player.nextFloorStatus.forEach((s) => applyStatus(S$1.player, s.k, s.n));
		S$1.player.nextFloorStatus = [];
	}
	if (S$1.challenge === "escalation") for (const room of S$1.rooms) room.enemies.forEach((e) => {
		e.r = (e.r || 1) + Math.min(3, Math.floor(S$1.floor / 3));
		e.rb = (e.rb || 0) + 1;
		if (S$1.floor >= 5 && !e.armor) e.armor = 1;
	});
	const totalEnemies = S$1.rooms.reduce((sum, r) => sum + r.enemies.length, 0);
	log(isEnglish() ? `-- Floor ${S$1.floor} · ${LContent(S$1.biome, "name")} · ${nRooms} rooms ── enemies: ${totalEnemies}` : `── Ярус ${S$1.floor} · ${LContent(S$1.biome, "name")} · ${nRooms} комн. ── врагов: ${totalEnemies}`, "e");
	log(isEnglish() ? `Board: ${CFG.W}×${CFG.H}` : `Поле: ${CFG.W}×${CFG.H}`, "");
	if (getScript().floorIntro[S$1.floor]) log(getScript().floorIntro[S$1.floor], "");
	recordSnapshot("floor_started", {
		biome: S$1.biome?.id,
		rooms: S$1.rooms.length
	});
	flushAnalytics();
	syncCheckIndicator();
	render();
	syncUI();
}
/** Сохранить текущую комнату в S.rooms. */
function snapshotRoom() {
	const id = S$1.currentRoom;
	S$1.rooms[id] = {
		walls: S$1.walls,
		enemies: S$1.enemies,
		special: S$1.special,
		cleared: S$1.rooms[id].cleared
	};
}
/** Загрузить комнату из S.rooms. */
function loadRoom(id) {
	S$1.currentRoom = id;
	const r = S$1.rooms[id];
	S$1.walls = r.walls;
	S$1.enemies = r.enemies;
	S$1.special = r.special;
	invalidateThreats();
}
/**
* Загрузить уровень из JSON (для отладки и редактора уровней).
* @param {object} data — распарсенный JSON
*/
function loadLevel(data) {
	S$1.floor = data.floor || 1;
	S$1.biome = BIOMES.find((b) => b.id === data.biome) || BIOMES[0];
	S$1.rooms = [];
	S$1.currentRoom = 0;
	if (data.rooms && Array.isArray(data.rooms)) {
		data.rooms.forEach((r, idx) => {
			const roomData = {
				walls: new Set(r.walls || []),
				special: new Map(Object.entries(r.special || {})),
				enemies: (r.enemies || []).map((e) => ({
					type: e.type,
					x: e.x,
					y: e.y,
					facing: e.facing || [0, 1],
					cd: 0,
					status: {},
					homeColor: tileColor(e.x, e.y),
					r: CFG.BASE_R[e.type] || 1,
					rb: enemyRangeBonus(S$1.floor)
				})),
				cleared: false
			};
			S$1.rooms.push(roomData);
			if (idx === 0) {
				CFG.W = r.W || 11;
				CFG.H = r.H || 9;
				S$1.player.x = r.playerStart && r.playerStart.x || Math.floor(CFG.W / 2);
				S$1.player.y = r.playerStart && r.playerStart.y || CFG.H - 1;
			}
		});
		if (data.doors && Array.isArray(data.doors)) data.doors.forEach((d) => {
			const doorFrom = {
				type: "door",
				color: d.color || null,
				targetRoom: d.toRoom,
				targetPos: {
					x: d.toX,
					y: d.toY
				}
			};
			const doorTo = {
				type: "door",
				color: d.color || null,
				targetRoom: d.fromRoom,
				targetPos: {
					x: d.fromX,
					y: d.fromY
				}
			};
			S$1.rooms[d.fromRoom].special.set(key(d.fromX, d.fromY), doorFrom);
			S$1.rooms[d.toRoom].special.set(key(d.toX, d.toY), doorTo);
			S$1.rooms[d.fromRoom].walls.delete(key(d.fromX, d.fromY));
			S$1.rooms[d.toRoom].walls.delete(key(d.toX, d.toY));
		});
	} else {
		CFG.W = data.W || 11;
		CFG.H = data.H || 9;
		const roomData = {
			walls: new Set(data.walls || []),
			special: new Map(Object.entries(data.special || {})),
			enemies: (data.enemies || []).map((e) => ({
				type: e.type,
				x: e.x,
				y: e.y,
				facing: e.facing || [0, 1],
				cd: 0,
				status: {},
				homeColor: tileColor(e.x, e.y),
				r: CFG.BASE_R[e.type] || 1,
				rb: enemyRangeBonus(S$1.floor)
			})),
			cleared: false
		};
		S$1.rooms.push(roomData);
		S$1.player.x = data.playerStart && data.playerStart.x || Math.floor(CFG.W / 2);
		S$1.player.y = data.playerStart && data.playerStart.y || CFG.H - 1;
	}
	loadRoom(0);
	S$1.player.facing = [0, -1];
	S$1.player.active = 0;
	S$1.promotionUsed = false;
	S$1.hoverEnemy = null;
	S$1.selectedEnemy = null;
	S$1.turn = 1;
	S$1.player.freeSwapUsed = false;
	S$1.player.capturedThisFloor = 0;
	const totalEnemies = S$1.rooms.reduce((sum, r) => sum + r.enemies.length, 0);
	log(isEnglish() ? "-- Level loaded: " + LContent(S$1.biome, "name") + " · " + S$1.rooms.length + " rooms ── enemies: " + totalEnemies : "── Загружен уровень · " + LContent(S$1.biome, "name") + " · " + S$1.rooms.length + " комн. ── врагов: " + totalEnemies, "e");
	syncCheckIndicator();
	render();
	syncUI();
}
function reset() {
	startAnalyticsRun({ mode: S$1.runMode || "campaign" });
	S$1.player = {
		x: 0,
		y: 0,
		facing: [0, -1],
		wheel: [
			makeForm("pawn"),
			makeForm("knight"),
			null
		],
		active: 0,
		relics: /* @__PURE__ */ new Set(),
		curses: /* @__PURE__ */ new Set(),
		pawnShieldUsed: false,
		freeSwapUsed: false,
		capturedThisFloor: 0,
		totalCaptures: 0,
		status: {},
		gold: 0,
		nextFloorStatus: [],
		hunger: CFG.HUNGER.start,
		hungerMark: 1,
		boneVoiceTimer: 0
	};
	S$1.unlocked = /* @__PURE__ */ new Set(["pawn", "knight"]);
	const exotic = [];
	if (META.upgrades.archbishop) exotic.push("archbishop");
	if (META.upgrades.chancellor) exotic.push("chancellor");
	if (META.upgrades.beast) exotic.push("beast");
	if (META.upgrades.infiltrator) exotic.push("infiltrator");
	if (META.upgrades.bastion) exotic.push("bastion");
	exotic.forEach((t) => {
		S$1.unlocked.add(t);
		const slot = S$1.player.wheel.findIndex((s, i) => i > 0 && s === null);
		if (slot !== -1) S$1.player.wheel[slot] = makeForm(t, 0);
	});
	S$1.gameOver = false;
	S$1.floor = 0;
	S$1.walls = /* @__PURE__ */ new Set();
	S$1.special = /* @__PURE__ */ new Map();
	if (dom.logEl) dom.logEl.innerHTML = "";
	log(L("log.default"), "");
	clearRunLog();
	clearToastQueue();
	const extraSlots = META.upgrades.startSlots || 0;
	for (let i = 0; i < extraSlots; i++) if (S$1.player.wheel.length < 5) S$1.player.wheel.push(null);
	const startRelics = META.upgrades.startRelics || 0;
	if (startRelics > 0) {
		const pool = Object.keys(RELICS);
		shuffle(pool);
		pool.slice(0, startRelics).forEach(applyRelic);
	}
	if (!META.tutorialDone) {
		console.log("Tutorial: first floor");
		startTutorial(() => {
			newFloor();
			openTitle();
		});
		return;
	}
	if (S$1.runMode === "campaign" && META.runs === 0 && getScript().interludes.prologue) {
		openInterlude({
			...getScript().interludes.prologue,
			art: ART.prologue
		}, () => newFloor());
		return;
	}
	if (S$1.runMode === "campaign" && META.runs >= 1 && getScript().repeat && getScript().repeat.prologue) {
		openInterlude({
			...getScript().repeat.prologue,
			art: ART.prologue,
			button: isEnglish() ? "Rise" : "Встать"
		}, () => newFloor());
		return;
	}
	newFloor();
}
//#endregion
//#region src/debug.js
/**
* src/debug.js — инструменты отладки: читы, тест боссов, редактор уровней.
* Вызываются через модальное окно по секретному слову "debug".
* Основные экспорты: feedDebugChar(), быстрый запуск босс-этажей.
*/
/**
* Инструменты отладки — читы для тестирования.
* Вызываются через модальное окно по секретному слову "debug".
*/
var debug_exports = /* @__PURE__ */ __exportAll({
	feedDebugChar: () => feedDebugChar,
	openDebugMenu: () => openDebugMenu
});
/**
* Слушатель ввода секретного слова. Вызывается из main.js.
*/
var DEBUG_WORD = "debug";
var inputBuffer = "";
function feedDebugChar(ch) {
	inputBuffer += ch;
	if (inputBuffer.length > 5) inputBuffer = inputBuffer.slice(-5);
	if (inputBuffer === DEBUG_WORD) {
		inputBuffer = "";
		openDebugMenu();
	}
}
function openDebugMenu() {
	S$1.modalOpen = true;
	dom.modalBox.classList.remove("death");
	dom.mTitle.textContent = "🛠 Инструменты разработчика";
	dom.mText.textContent = "Читы для тестирования — используй с умом.";
	dom.mChoices.innerHTML = "";
	dom.mChoices.classList.add("loot-list");
	[
		{
			label: "☠ Убить всех врагов",
			fn: killAllEnemies
		},
		{
			label: "⬇ Пропустить этаж",
			fn: skipFloor,
			keepOpen: true
		},
		{
			label: "🪙 +20 золота",
			fn: () => addGold(20)
		},
		{
			label: "✦ +50 осколков",
			fn: () => addShards(50)
		},
		{
			label: "🛡 Неуязвимость: " + (S$1.godMode ? "ВЫКЛ" : "ВКЛ"),
			fn: toggleGodMode
		},
		{
			label: "💊 Исцелиться (снять кулдауны и статусы)",
			fn: healAll
		},
		{
			label: "🔑 Все ключи",
			fn: addAllKeys
		},
		{
			label: "🗺 Редактор уровней",
			fn: () => {
				closeMenu();
				__vitePreload(() => Promise.resolve().then(() => editor_exports).then((m) => m.openEditor()), void 0, import.meta.url);
			}
		},
		{
			label: "♟ Добавить случайную форму",
			fn: addRandomForm
		},
		{
			label: "🧪 Босс: Мучитель",
			fn: startTormentor
		},
		{
			label: "🧪 Босс: Ладьи",
			fn: startRooks
		},
		{
			label: "🧪 Босс: Жернов",
			fn: startMillstone
		},
		{
			label: "🧪 Босс: Король",
			fn: startRedKing
		}
	].forEach((b) => {
		const btn = document.createElement("button");
		btn.textContent = b.label;
		btn.onclick = () => {
			b.fn();
			if (b.label !== "Закрыть" && !b.keepOpen) closeMenu();
		};
		dom.mChoices.appendChild(btn);
	});
	const loadRow = document.createElement("div");
	loadRow.style.cssText = "display:flex;gap:6px;margin-top:4px;";
	const input = document.createElement("input");
	input.type = "text";
	input.placeholder = "название уровня (level1)";
	input.style.cssText = "flex:1;background:#181b22;border:1px solid #3a3e49;border-radius:5px;padding:5px 8px;color:var(--txt);font-family:inherit;font-size:13px;";
	const loadBtn = document.createElement("button");
	loadBtn.textContent = "Загрузить";
	loadBtn.style.cssText = "min-height:unset;padding:5px 10px;font-size:12px;";
	loadBtn.onclick = async () => {
		const name = input.value.trim() || "level1";
		try {
			const res = await fetch(`/data/${encodeURIComponent(name)}.json`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			closeMenu();
			loadLevel(data);
			log(`✅ Уровень "${name}" загружен.`, "g");
		} catch (err) {
			log(`❌ Ошибка загрузки "${name}": ${err.message}`, "r");
		}
	};
	loadRow.appendChild(input);
	loadRow.appendChild(loadBtn);
	dom.mChoices.appendChild(loadRow);
	const resetBtn = document.createElement("button");
	resetBtn.textContent = "🗑 Сбросить прогресс (localStorage)";
	resetBtn.style.cssText = "margin-top:6px;border-color:#b3423a;color:#d66a62;";
	resetBtn.onclick = () => {
		localStorage.removeItem("chessrogue_meta_v1");
		localStorage.removeItem("chessrogue_settings_v1");
		log("🗑 Весь прогресс в localStorage сброшен. Перезапустите страницу.", "r");
		closeMenu();
	};
	dom.mChoices.appendChild(resetBtn);
	const closeBtn = document.createElement("button");
	closeBtn.textContent = "Закрыть";
	closeBtn.onclick = closeMenu;
	dom.mChoices.appendChild(closeBtn);
	dom.overlay.classList.add("on");
}
function closeMenu() {
	closeModal();
	render();
	syncUI();
}
function killAllEnemies() {
	S$1.enemies = [];
	log("☠ Все враги уничтожены.", "g");
}
function skipFloor() {
	S$1.enemies = [];
	log("⬇ Этаж пропущен.", "g");
	newFloor();
	render();
	syncUI();
}
function addGold(n) {
	S$1.player.gold = (S$1.player.gold || 0) + n;
	log(`🪙 +${n} золота (всего: ${S$1.player.gold}).`, "g");
	syncUI();
}
function addShards(n) {
	META.shards += n;
	metaSave();
	log(`✦ +${n} осколков (всего: ${META.shards}).`, "g");
	syncUI();
}
function toggleGodMode() {
	S$1.godMode = !S$1.godMode;
	log(`🛡 Неуязвимость: ${S$1.godMode ? "ВКЛ" : "ВЫКЛ"}.`, "g");
}
function healAll() {
	S$1.player.wheel.forEach((f) => {
		if (f) f.cooldown = 0;
	});
	cleanse(S$1.player);
	S$1.enemies.forEach((e) => {
		e.cd = 0;
		if (e.status) e.status = {};
	});
	log("💊 Все кулдауны и статусы сняты.", "g");
}
function addAllKeys() {
	KEY_COLORS.forEach((c) => S$1.keys.add(c));
	log(`🔑 Все ключи получены: ${KEY_COLORS.map((c) => KEY_GLYPH[c]).join("")}`, "g");
	syncUI();
}
function addRandomForm() {
	const pool = [...S$1.unlocked].filter((t) => t !== "pawn" && S$1.player.wheel.every((f) => !f || f.type !== t));
	if (!pool.length) {
		log("Нет доступных форм для добавления.", "r");
		return;
	}
	const slot = S$1.player.wheel.findIndex((s, i) => i > 0 && s === null);
	if (slot === -1) {
		log("Нет свободных слотов в колесе.", "r");
		return;
	}
	const t = pick(pool);
	S$1.player.wheel[slot] = makeForm(t, tileColor(S$1.player.x, S$1.player.y));
	log(`♟ Форма «${t}» добавлена в слот ${slot}.`, "g");
}
function initBossArena(bossId) {
	closeMenu();
	const room = generateBossRoom(bossId);
	S$1.walls = room.walls;
	S$1.special = room.specials;
	S$1.enemies = room.enemies;
	S$1.rooms = [{
		walls: room.walls,
		enemies: S$1.enemies,
		special: room.specials,
		cleared: false
	}];
	S$1.currentRoom = 0;
	loadRoom(0);
	S$1.player.x = Math.floor(CFG.W / 2);
	S$1.player.y = CFG.H - 1;
	S$1.player.facing = [0, -1];
	S$1.player.active = 0;
	S$1.promotionUsed = false;
	S$1.hoverEnemy = null;
	S$1.selectedEnemy = null;
	S$1.turn = 1;
	S$1.player.freeSwapUsed = false;
	S$1.player.capturedThisFloor = 0;
	S$1.player.hunger = CFG.HUNGER.start;
	S$1.bossPhase = 0;
	S$1.chainsBroken = 0;
	S$1.millTick = 0;
	S$1.millFed = 0;
	S$1.party = null;
	S$1.keys = /* @__PURE__ */ new Set();
	S$1.player.lostFormThisFloor = false;
	clearSpeech();
	cleanse(S$1.player);
}
function startTormentor() {
	initBossArena("tormentor");
	const e = S$1.enemies[0];
	if (e) {
		e.phase = 1;
		e.armor = BOSS_CFG.tormentor.armor;
		e.stunCd = BOSS_CFG.tormentor.stunEvery;
	}
	S$1.bossPhase = 1;
	log("🧪 Босс: Слон-Мучитель (ярус 6).", "e");
	render();
	syncUI();
}
function startRooks() {
	initBossArena("spawnedRooks");
	log("🧪 Босс: Спаянные Ладьи (ярус 8).", "e");
	render();
	syncUI();
}
function startMillstone() {
	initBossArena("millstone");
	S$1.party = {
		dropCd: 0,
		pullCd: BOSS_CFG.puppeteer.pullEvery,
		reserve: BOSS_CFG.puppeteer.reserve
	};
	log("🧪 Босс: Жернов (ярус 11).", "e");
	render();
	syncUI();
}
function startRedKing() {
	initBossArena("redKing");
	S$1.chainsBroken = 0;
	const king = S$1.enemies.find((e) => e.king);
	if (king) {
		king.armor = 99;
		king.exposed = false;
	}
	log("🧪 Босс: Красный Король (ярус 18).", "e");
	render();
	syncUI();
}
//#endregion
//#region src/keynav.js
/**
* src/keynav.js — навигация с клавиатуры поверх существующих хоткеев.
*
*   Tab / Shift+Tab — цикл по врагам с показом зоны боя (от ближнего к дальнему)
*   Esc             — снять выделение и отменить отложенный ход
*   Enter           — подтвердить отложенный ход
*
* Намеренно не трогает 1–3, Q/E, Space и R — они уже заняты. Если добавишь
* стрелки, проверь, что их не перехватывает существующий обработчик.
*
* Подключение: attachKeyNav() один раз при старте, рядом с startRenderLoop().
*/
/** Враги, отсортированные от ближнего к игроку. */
function ordered() {
	return [...S$1.enemies].sort((a, b) => cheb(a, S$1.player) - cheb(b, S$1.player));
}
function cycleEnemy(dir) {
	const list = ordered();
	if (!list.length) {
		S$1.selectedEnemy = null;
		return;
	}
	const cur = list.indexOf(S$1.selectedEnemy);
	S$1.selectedEnemy = list[cur === -1 ? dir > 0 ? 0 : list.length - 1 : (cur + dir + list.length) % list.length];
	setPreviewCell(null);
}
var attached = false;
function attachKeyNav() {
	if (attached || typeof window === "undefined") return;
	attached = true;
	window.addEventListener("keydown", (ev) => {
		if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
		const t = ev.target;
		if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
		if (S$1.modalOpen || S$1.gameOver) return;
		if (ev.key === "Tab") {
			ev.preventDefault();
			cycleEnemy(ev.shiftKey ? -1 : 1);
		} else if (ev.key === "Escape") {
			if (!S$1.selectedEnemy && !pendingMove()) return;
			S$1.selectedEnemy = null;
			clearPending();
		} else if (ev.key === "Enter") {
			const p = pendingMove();
			if (!p) return;
			ev.preventDefault();
			tryMoveTo(p.x, p.y);
			return;
		} else return;
		render();
		syncUI();
	});
}
//#endregion
//#region src/main.js
function loreArray() {
	return [
		0,
		1,
		2,
		3,
		4
	].map(function(i) {
		return L("loading.lore." + i);
	});
}
function tipArray() {
	return [
		0,
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8,
		9
	].map(function(i) {
		return L("loading.tip." + i);
	});
}
function showLoadingScreen() {
	const el = document.getElementById("loadingScreen");
	if (!el || typeof el.querySelector !== "function") {
		startGame();
		return;
	}
	const loreEl = el.querySelector(".loading-lore");
	const tipEl = el.querySelector(".loading-tip");
	document.body.style.overflow = "hidden";
	const logoEl = el.querySelector(".loading-logo");
	if (logoEl && ART.loading) logoEl.src = ART.loading;
	loadSettings();
	var lores = loreArray();
	var tips = tipArray();
	var hintEl = el.querySelector(".loading-hint");
	if (hintEl) hintEl.textContent = L("loading.hint");
	var titleEl = el.querySelector(".loading-title");
	if (titleEl) titleEl.textContent = L("app.title");
	loreEl.textContent = lores[Math.floor(Math.random() * lores.length)];
	tipEl.textContent = "💡 " + tips[Math.floor(Math.random() * tips.length)];
	const dismiss = () => {
		cleanup();
		initAudio();
		initMusic(getAudioContext());
		playTrack("title");
		el.classList.add("hidden");
		setTimeout(() => {
			el.style.display = "none";
			document.body.style.overflow = "";
			startGame();
		}, 600);
	};
	const onEv = (e) => {
		e.stopPropagation();
		dismiss();
	};
	const onKey = (e) => {
		e.stopPropagation();
		dismiss();
	};
	el.addEventListener("click", onEv);
	el.addEventListener("touchend", onEv);
	document.addEventListener("keydown", onKey, { once: true });
	function cleanup() {
		el.removeEventListener("click", onEv);
		el.removeEventListener("touchend", onEv);
		document.removeEventListener("keydown", onKey);
	}
}
function applyPageTitle() {
	var t = document.getElementById("gameTitle");
	if (t) t.innerHTML = L("app.title") + " <span class=\"v\">v1.0</span>";
	var s = document.getElementById("gameSub");
	if (s) s.textContent = L("app.sub");
	var pt = document.getElementById("pageTitle");
	if (pt) pt.textContent = L("app.title");
	var md = document.getElementById("metaDesc");
	if (md) md.setAttribute("content", L("app.metaDesc"));
	var ogt = document.getElementById("metaOgTitle");
	if (ogt) ogt.setAttribute("content", L("app.title"));
	var ogd = document.getElementById("metaOgDesc");
	if (ogd) ogd.setAttribute("content", L("app.metaOgDesc"));
	scanI18n();
}
function scanI18n() {
	var els = document.querySelectorAll(".i18n");
	for (var i = 0; i < els.length; i++) {
		var el = els[i];
		var key = el.getAttribute("data-key");
		if (key) el.textContent = L(key);
	}
}
function renderLegend() {
	var el = document.getElementById("legendBody");
	if (!el) return;
	var isEn = isEnglish();
	var html = "";
	if (isEn) {
		html += "<span class=\"sw\" style=\"background: var(--threat)\"></span><b>threatened cells</b> — tap an enemy to see its zone<br>";
		html += "<span class=\"sw\" style=\"background: #e0a03a\"></span><b>will appear after move</b> — threat preview<br>";
		html += "<span class=\"sw\" style=\"background: var(--promo)\"></span><b>ascension line</b> — end your turn as a pawn here<br>";
		html += "<span style=\"color: #c23b30\">▼</span> <b>web</b>: step on it — lose a form; enemy dies (one-use)<br>";
		html += "<span style=\"color: #9b6dd0\">◎</span> <b>portal</b> · <span style=\"color: #58b3a4\">◈</span> <b>vein</b> (feeds, removes fatigue) · <span style=\"color: #8fd0e6\">❄</span> <b>ice</b> (stuns)<br>";
		html += "<span style=\"color: #96a0b0\">☁</span> <b>fog</b> hides threats · <span style=\"color: #7aa0c0\">→</span> <b>conveyor</b> pushes · <span style=\"color: #c9a227\">→</span> <b>gate</b> (arrow-only)<br>";
		html += "<span style=\"color: #b0a8f0\">♝</span> <b>color zone</b> (bishop only) · <span style=\"color: #8fae7a\">▣</span> <b>plate</b> opens a wall · <span style=\"color: #d65a28\">≈</span> <b>lava</b> spreads and burns<br>";
		html += "🍖 <b>bone</b> — food, restores hunger · <span style=\"color: #8a8070\">▮</span> <b>pillar</b> impassable<br>";
		html += "<span class=\"sw\" style=\"background: var(--teal)\"></span>safe · <span class=\"sw\" style=\"background: #e0a03a\"></span>under threat · <span class=\"sw\" style=\"background: var(--threat)\"></span>fatal<br>";
		html += "Tap a cell — move or capture. Tap a slot — switch form (costs a turn).<br>";
		html += "Hunger drains each turn. Captures, veins and bones feed.<br>";
		html += "Keys: <kbd>1</kbd>–<kbd>5</kbd> forms, <kbd>Q</kbd>/<kbd>E</kbd> rotate, <kbd>Space</kbd> pass, <kbd>Tab</kbd> cycle enemies, <kbd>Esc</kbd> reset, <kbd>Enter</kbd> confirm.";
	} else {
		html += "<span class=\"sw\" style=\"background: var(--threat)\"></span><b>битые поля</b> врагов (тапни по врагу — его зона)<br>";
		html += "<span class=\"sw\" style=\"background: #e0a03a\"></span><b>появится после хода</b> — предпросмотр угроз<br>";
		html += "<span class=\"sw\" style=\"background: var(--promo)\"></span><b>линия восхождения</b> — закончи ход пешкой<br>";
		html += "<span style=\"color: #c23b30\">▼</span> <b>паутина</b>: наступишь — теряешь форму; враг гибнет (одноразово)<br>";
		html += "<span style=\"color: #9b6dd0\">◎</span> <b>портал</b> · <span style=\"color: #58b3a4\">◈</span> <b>жила</b> (насыщает, снимает усталость) · <span style=\"color: #8fd0e6\">❄</span> <b>лёд</b> (оглушает)<br>";
		html += "<span style=\"color: #96a0b0\">☁</span> <b>туман</b> скрывает угрозу · <span style=\"color: #7aa0c0\">→</span> <b>конвейер</b> сдвигает · <span style=\"color: #c9a227\">→</span> <b>ворота</b> (только по стрелке)<br>";
		html += "<span style=\"color: #b0a8f0\">♝</span> <b>цветовая зона</b> (только слон) · <span style=\"color: #8fae7a\">▣</span> <b>плита</b> открывает стену · <span style=\"color: #d65a28\">≈</span> <b>лава</b> растекается и жжёт<br>";
		html += "🍖 <b>кость</b> — еда, восполняет сытость · <span style=\"color: #8a8070\">▮</span> <b>пилон</b> непроходим<br>";
		html += "<span class=\"sw\" style=\"background: var(--teal)\"></span>ход безопасен · <span class=\"sw\" style=\"background: #e0a03a\"></span>под удар · <span class=\"sw\" style=\"background: var(--threat)\"></span>конец забега<br>";
		html += "Тап по клетке — ход или взятие; тап по слоту — смена формы (тратит ход).<br>";
		html += "Голод тает каждый ход. Взятия, жилы и кости насыщают.<br>";
		html += "Клавиши: <kbd>1</kbd>–<kbd>5</kbd> формы, <kbd>Q</kbd>/<kbd>E</kbd> поворот, <kbd>Space</kbd> пас, <kbd>Tab</kbd> перебор врагов, <kbd>Esc</kbd> сброс, <kbd>Enter</kbd> подтвердить ход.";
	}
	el.innerHTML = html;
}
function startGame() {
	seedRNG(Math.floor(Date.now()));
	applyPageTitle();
	renderLegend();
	metaLoad();
	reset();
	installAnalyticsLifecycle();
	resizeBoard();
	startRenderLoop();
	document.addEventListener("keydown", (ev) => {
		if (ev.key === "Escape") dismissModal();
	});
	dom.overlay.addEventListener("click", (ev) => {
		if (ev.target === dom.overlay) dismissModal();
	});
	window.addEventListener("popstate", () => dismissModal());
	if (!isTutorial()) openTitle();
}
attachKeyNav();
showLoadingScreen();
var _rt;
window.addEventListener("resize", () => {
	clearTimeout(_rt);
	_rt = setTimeout(resizeBoard, 80);
});
window.addEventListener("orientationchange", () => setTimeout(resizeBoard, 120));
function cellFromEvent(ev) {
	const r = dom.cv.getBoundingClientRect();
	const t = ev.changedTouches && ev.changedTouches[0];
	const cx = ev.clientX != null ? ev.clientX : t ? t.clientX : 0;
	const cy = ev.clientY != null ? ev.clientY : t ? t.clientY : 0;
	return {
		x: Math.floor((cx - r.left) / (r.width / CFG.VIEW_W) + camera.x),
		y: Math.floor((cy - r.top) / (r.height / CFG.VIEW_H) + camera.y)
	};
}
function handleTap(ev) {
	initAudio();
	if (editorActive) {
		const { x, y } = cellFromEvent(ev);
		handleEditorClick(x, y);
		return;
	}
	const { x, y } = cellFromEvent(ev);
	if (!inB$1(x, y) || S$1.gameOver || S$1.modalOpen) return;
	const { moves, captures } = playerOptions();
	if (moves.some((c) => c.x === x && c.y === y) || captures.some((c) => c.x === x && c.y === y)) {
		S$1.selectedEnemy = null;
		S$1.hoverEnemy = null;
		tryMoveTo(x, y);
		return;
	}
	const e = enemyAt(x, y);
	S$1.selectedEnemy = e && e !== S$1.selectedEnemy ? e : null;
	render();
}
document.addEventListener("keydown", (ev) => {
	if (S$1.modalOpen && ev.key.toLowerCase() !== "r") return;
	switch (ev.key.toLowerCase()) {
		case "q":
		case "й":
			snapBackCamera();
			rotate(-1);
			break;
		case "e":
		case "у":
			snapBackCamera();
			rotate(1);
			break;
		case " ":
			ev.preventDefault();
			snapBackCamera();
			pass();
			break;
		case "1":
			snapBackCamera();
			switchForm(0);
			break;
		case "2":
			snapBackCamera();
			switchForm(1);
			break;
		case "3":
			snapBackCamera();
			switchForm(2);
			break;
		case "h":
		case "р":
		case "?":
			openHelp();
			break;
		case "r":
		case "к":
			seedRNG(S$1.runMode === "campaign" ? CFG.CAMPAIGN_SEED : Date.now());
			closeModal();
			reset();
			break;
	}
});
document.getElementById("btnCCW").onclick = () => {
	snapBackCamera();
	rotate(-1);
};
document.getElementById("btnCW").onclick = () => {
	snapBackCamera();
	rotate(1);
};
document.getElementById("btnPass").onclick = () => {
	snapBackCamera();
	pass();
};
document.getElementById("btnSettings").onclick = () => openSettings();
document.getElementById("btnHelp").onclick = () => openHelp();
document.getElementById("btnDebug").onclick = () => {
	__vitePreload(() => Promise.resolve().then(() => debug_exports).then((m) => m.openDebugMenu()), void 0, import.meta.url);
};
document.getElementById("btnEditor").onclick = () => {
	openEditor();
};
document.getElementById("btnRestart").onclick = () => {
	seedRNG(S$1.runMode === "campaign" ? CFG.CAMPAIGN_SEED : Date.now());
	closeModal();
	reset();
};
initDom();
document.body.addEventListener("keydown", (ev) => {
	if (ev.key.length === 1) feedDebugChar(ev.key);
});
var DRAG_THRESH = 5;
var INERTIA_DECAY = .94;
var INERTIA_STOP = .5;
var dragState = null;
var inertiaVX = 0;
var inertiaVY = 0;
var inertiaRAF = null;
function startInertia() {
	if (inertiaRAF) return;
	function step() {
		inertiaVX *= INERTIA_DECAY;
		inertiaVY *= INERTIA_DECAY;
		if (Math.abs(inertiaVX) < INERTIA_STOP && Math.abs(inertiaVY) < INERTIA_STOP) {
			inertiaVX = 0;
			inertiaVY = 0;
			inertiaRAF = null;
			snapBackCamera();
			return;
		}
		const Tpix = dom.cv.clientWidth / CFG.VIEW_W;
		camera.x -= inertiaVX / Tpix;
		camera.y -= inertiaVY / Tpix;
		const minXi = Math.min(0, CFG.W - CFG.VIEW_W);
		const maxXi = Math.max(0, CFG.W - CFG.VIEW_W);
		const minYi = Math.min(0, CFG.H - CFG.VIEW_H);
		const maxYi = Math.max(0, CFG.H - CFG.VIEW_H);
		camera.x = Math.max(minXi, Math.min(camera.x, maxXi));
		camera.y = Math.max(minYi, Math.min(camera.y, maxYi));
		render();
		inertiaRAF = requestAnimationFrame(step);
	}
	inertiaRAF = requestAnimationFrame(step);
}
dom.cv.addEventListener("pointerdown", (ev) => {
	if (S$1.gameOver || S$1.modalOpen) return;
	initAudio();
	const r = dom.cv.getBoundingClientRect();
	const cx = ev.clientX - r.left;
	const cy = ev.clientY - r.top;
	if (editorActive) {
		dragState = {
			startX: cx,
			startY: cy,
			startCamX: camera.x,
			startCamY: camera.y,
			moved: false,
			editorBrush: isBrushActive(),
			editorLastCell: null
		};
		const { x, y } = cellFromEvent(ev);
		handleEditorClick(x, y);
		dragState.editorLastCell = key(x, y);
		render();
		ev.preventDefault();
		return;
	}
	dragState = {
		startX: cx,
		startY: cy,
		startCamX: camera.x,
		startCamY: camera.y,
		moved: false
	};
	snapBackCamera();
	inertiaVX = 0;
	inertiaVY = 0;
	if (inertiaRAF) {
		cancelAnimationFrame(inertiaRAF);
		inertiaRAF = null;
	}
	ev.preventDefault();
});
dom.cv.addEventListener("pointermove", (ev) => {
	if (!dragState || S$1.gameOver || S$1.modalOpen) return;
	ev.preventDefault();
	const r = dom.cv.getBoundingClientRect();
	const cx = ev.clientX - r.left;
	const cy = ev.clientY - r.top;
	const dx = cx - dragState.startX;
	const dy = cy - dragState.startY;
	if (editorActive) {
		if (!dragState.editorBrush) return;
		const { x, y } = cellFromEvent(ev);
		const k = key(x, y);
		if (k !== dragState.editorLastCell && inB$1(x, y)) {
			dragState.editorLastCell = k;
			handleEditorClick(x, y);
			render();
		}
		return;
	}
	if (!dragState.moved && Math.abs(dx) + Math.abs(dy) < DRAG_THRESH) return;
	if (!dragState.moved) {
		dragState.moved = true;
		setCameraDrag(true);
	}
	const Tpix = dom.cv.clientWidth / CFG.VIEW_W;
	camera.x = dragState.startCamX - dx / Tpix;
	camera.y = dragState.startCamY - dy / Tpix;
	const minXp = Math.min(0, CFG.W - CFG.VIEW_W);
	const maxXp = Math.max(0, CFG.W - CFG.VIEW_W);
	const minYp = Math.min(0, CFG.H - CFG.VIEW_H);
	const maxYp = Math.max(0, CFG.H - CFG.VIEW_H);
	camera.x = Math.max(minXp, Math.min(camera.x, maxXp));
	camera.y = Math.max(minYp, Math.min(camera.y, maxYp));
	render();
});
dom.cv.addEventListener("pointerup", (ev) => {
	if (!dragState) return;
	const wasEditor = editorActive;
	if (!wasEditor && !dragState.moved) handleTap(ev);
	if (!wasEditor && dragState.moved && ev.pointerType === "touch") {
		const r = dom.cv.getBoundingClientRect();
		const cx = ev.clientX - r.left;
		const cy = ev.clientY - r.top;
		const dx = cx - dragState.startX;
		const dy = cy - dragState.startY;
		if (dragState._lastX !== void 0) {
			const ldx = cx - dragState._lastX;
			const ldy = cy - dragState._lastY;
			inertiaVX = ldx;
			inertiaVY = ldy;
		} else {
			inertiaVX = dx * .15;
			inertiaVY = dy * .15;
		}
		startInertia();
	}
	if (!wasEditor && !dragState.moved) dragState = null;
	else if (!wasEditor && !inertiaRAF) {
		dragState = null;
		snapBackCamera();
	}
});
document.addEventListener("keydown", (ev) => {
	if (S$1.gameOver || S$1.modalOpen || editorActive) return;
	const step = 1;
	switch (ev.key) {
		case "ArrowUp":
			camera.y = Math.max(0, camera.y - step);
			setCameraDrag(true);
			render();
			break;
		case "ArrowDown":
			camera.y = Math.min(CFG.H - CFG.VIEW_H, camera.y + step);
			setCameraDrag(true);
			render();
			break;
		case "ArrowLeft":
			camera.x = Math.max(0, camera.x - step);
			setCameraDrag(true);
			render();
			break;
		case "ArrowRight":
			camera.x = Math.min(CFG.W - CFG.VIEW_W, camera.x + step);
			setCameraDrag(true);
			render();
			break;
	}
});
if (window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
	dom.cv.addEventListener("mousemove", (ev) => {
		const { x, y } = cellFromEvent(ev);
		const e = inB$1(x, y) ? enemyAt(x, y) : null;
		let changed = false;
		if (e !== S$1.hoverEnemy) {
			S$1.hoverEnemy = e;
			changed = true;
		}
		const cell = inB$1(x, y) ? {
			x,
			y
		} : null;
		if (cell && !S$1.hoveredCell || !cell && S$1.hoveredCell || cell && S$1.hoveredCell && (cell.x !== S$1.hoveredCell.x || cell.y !== S$1.hoveredCell.y)) {
			S$1.hoveredCell = cell;
			setPreviewCell(S$1.hoveredCell);
			changed = true;
		}
		if (changed) render();
	});
	dom.cv.addEventListener("mouseleave", () => {
		if (S$1.hoverEnemy || S$1.hoveredCell) {
			S$1.hoverEnemy = null;
			S$1.hoveredCell = null;
			render();
		}
	});
}
//#endregion
