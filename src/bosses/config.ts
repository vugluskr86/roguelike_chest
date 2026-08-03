/** Идентификаторы авторских босс-комнат. Кукловод — фаза комнаты Жернова. */
export type BossId = 'tormentor' | 'spawnedRooks' | 'millstone' | 'redKing';

/** Метаданные босса для реестра, достижений, награды и документации. */
export interface BossDefinition {
  id: BossId;
  name: string;
  description: string;
  counterplay: string;
  achievement: string;
  reward: string;
}

export const BOSS_DEFINITIONS: Readonly<Record<BossId, BossDefinition>> = Object.freeze({
  tormentor: {
    id: 'tormentor',
    name: 'Слон-Мучитель',
    description: 'Фазовый слон: теряет броню и в конце распадается на бегущих.',
    counterplay: 'Используйте укрытия и не оставляйте диагонали открытыми.',
    achievement: 'endless_tormentor_first',
    reward: 'tormentor_guard',
  },
  spawnedRooks: {
    id: 'spawnedRooks',
    name: 'Спаянные Ладьи',
    description: 'Две связанные ладьи мстят за уничтоженную пару.',
    counterplay: 'Не завершайте взятие на линии оставшейся ладьи.',
    achievement: 'endless_rooks_first',
    reward: 'rooks_momentum',
  },
  millstone: {
    id: 'millstone',
    name: 'Жернов и Кукловод',
    description: 'Жернов движется по коридору, а Кукловод подаёт в него фигуры.',
    counterplay: 'Контролируйте коридор и используйте разворот жернова.',
    achievement: 'endless_millstone_first',
    reward: 'millstone_feast',
  },
  redKing: {
    id: 'redKing',
    name: 'Красный Король',
    description: 'Непробиваемый король с цепями и свитой.',
    counterplay: 'Сначала разорвите четыре цепи, затем разбирайте свиту.',
    achievement: 'endless_red_king_first',
    reward: 'red_king_haste',
  },
});

/**
 * Числовые параметры боевых механик боссов.
 *
 * Конфигурация намеренно отделена от обработчиков ходов: балансировщик может
 * менять значения, не затрагивая правила движения, а симулятор — подменять
 * конфиг при проведении воспроизводимого прогона.  Все поля описывают базовую
 * сложность комнаты; модификаторы endless добавляются при её создании.
 */
export const BOSS_CONFIG = Object.freeze({
  /** Слон-Мучитель: фазовый диагональный противник. */
  tormentor: {
    armor: 3, // Количество снятых форм (слоёв), нужных для победы.
    range: 4, // Максимальная длина опасной диагонали.
    stunEvery: 3, // Период оглушающей реплики в ходах.
    stunRadius: 2, // Радиус оглушения вокруг босса.
    stunDur: 1, // Длительность оглушения в ходах.
    diagsByPhase: [4, 3, 2] as const, // Число активных диагоналей в фазах 1–3.
    keepDistance: 2, // Предпочтительная дистанция до игрока.
    splitCount: 3, // Количество бегущих пешек после распада.
    fleeSpeed: 1, // Шагов бегства пешки за один ход.
  },
  /** Спаянные ладьи: общая линия атаки и ответ за уничтоженную пару. */
  linkedRooks: {
    range: 6, // Длина луча атаки ладьи.
    revenge: true, // Разрешает внеочередной ответ оставшейся ладьи.
    bickerEvery: 3, // Период реплики пары в ходах.
    breakAfterStuck: 2, // Ходов в тупике до разрыва связки.
  },
  /** Жернов: передвижная опасность комнаты Кукловода. */
  millstone: {
    speed: 1, // Клеток за срабатывание механики.
    moveEvery: 1, // Период срабатывания в ходах.
    bounce: true, // Отражаться ли от стены вместо остановки.
    count: 2, // Целевое число жерновов на арене.
  },
  /** Кукловод: правила поступления и победы над куклами. */
  puppeteer: {
    jamQuota: 3, // Сколько кукол должно застрять в жернове для победы.
    pullEvery: 4, // Период массового рывка нитей.
    dropEvery: 3, // Период появления новой куклы.
    maxPuppets: 6, // Верхний предел кукол, одновременно стоящих на арене.
    reserve: 14, // Общий запас кукол в базовой сложности.
    protects: true, // Пытается ли ИИ уводить кукол от жернова.
  },
  /** Красный Король и его свита. */
  redKing: {
    chains: 4, // Число цепей, пока Король неуязвим.
    orderEvery: 1, // Период приказа свите.
    queenShield: 1, // Восстанавливаемая величина щита Королевы.
    queenShieldEvery: 2, // Период восстановления щита.
    rookFireEvery: 2, // Период прострела слепой ладьи.
    knightChaos: 0.5, // Доля случайности движения коня: 0 — точно к игроку.
    knightRestTurns: 1, // Отдых коня после атаки.
    kingArmorAfterChains: 1, // Броня Короля после разрушения цепей.
  },
});

/**
 * Настройки появления special-комнат в endless.
 * Все броски используют seeded RNG, поэтому результат воспроизводится по seed.
 */
export const ENDLESS_SPECIAL_ROOMS = Object.freeze({
  enabled: true, // false полностью исключает special-комнаты.
  minimumFloor: 5, // Первый этаж, на котором разрешён бросок на босса.
  chance: 0.18, // Вероятность special-комнаты после проверки минимального этажа.
  cooldownFloors: 4, // Минимальное число обычных этажей между special-комнатами.
  weights: { tormentor: 3, spawnedRooks: 3, millstone: 2, redKing: 1 } as const,
  difficulty: { base: 1, everyFloors: 5, maximum: 3 },
  parameterRanges: {
    armorBonus: [0, 1] as const, // Дополнительная броня/дальность в безопасном диапазоне.
    minionBonus: [0, 1] as const, // Дополнительные прислужники или резерв.
    mechanicSpeedBonus: [0, 1] as const, // Ускорение периодической механики не более чем на шаг.
  },
});
