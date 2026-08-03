/**
 * src/content/script.js — сценарий забега: реплики, диалоги боссов, интерлюдии, эпилоги.
 * Основные экспорты: SCRIPT, SCRIPT_EN, getScript(), pickLine(), actForFloor().
 */

export const SCRIPT = {
  // ── Вход на ярус (лог, 1 строка) ──
  floorIntro: {
    1: 'Ты вышел из ямы. Кости под ногой ломаются.',
    2: 'Стены сложены из рёбер. Некоторые ещё тёплые.',
    3: 'Здесь кто-то считал дни. Зарубок больше, чем стен.',
    4: 'Ров кончается. Дальше — ровный пол.',
    5: 'Ров кончается. Пол выложен лопатками — кто-то потрудился.',
    6: 'Пол расчерчен. Ты стоишь на клетке.',
    7: 'Сверху натянуты нити. Они уходят в темноту.',
    8: 'Здесь кого-то тащили. След не кончается.',
    9: 'Цепи движутся сами. Никто их не крутит.',
    10: 'Клетки мокрые. Пахнет железом.',
    11: 'Впереди — жернов. Он не остановится.',
    12: 'Клеток нет. Просто пол.',
    13: 'На стенах — записи. Все об одной партии.',
    14: 'Здесь стояли троны. Остались подставки.',
    15: 'Кто-то оставил фигуру на полу. Она смотрит вверх.',
    16: 'Свет ровный. Тени не двигаются.',
    17: 'Дверь. За ней — дыхание.',
    18: 'Тронный зал. Он ждёт.',
  },

  // ── Реплики врагов (доска, enemy) ──
  enemyLines: {
    pawn: {
      act1: [
        'Добей.',
        'Я помню имя.',
        'Сколько я здесь?',
        'Не подходи.',
        'Ты идёшь вверх?',
        'Там нет верха.',
        'Оно ест меня снизу.',
      ],
      act2: ['Не я.', 'Рука сама.', 'Стой. Не могу стоять.', 'Он смотрит не туда.'],
    },
    knight: { act1: ['Куда ты скачешь?', 'Мой конь ушёл.'], act2: ['Приказ.', 'Я держал фланг.'] },
    bishop: {
      act1: ['Диагональ пуста.', 'Он ждёт на белом.'],
      act2: ['Нить.', 'Не по этой линии.'],
    },
    rook: {
      act1: ['Прямо. Только прямо.', 'Я не умею иначе.'],
      act2: ['Линия занята.', 'Ты встал на мою.'],
    },
    queen: {
      act1: ['Я была всем сразу.', 'Теперь я в твоей руке.'],
      act2: ['Нить на шее.', 'Он играет мной.'],
    },
  },

  deathLines: {
    act1: ['Спасибо.', 'Наконец.', 'Ты такой же.', 'Скажи им, что я был первым.'],
    act2: ['Спасибо, что перерезал.', 'Нить. Не меня.'],
    act3: ['Прости.', 'Я не хотел.', 'Он не заставлял.'],
  },

  boneVoices: {
    pawn: ['Я не пойду туда.', 'Там мой брат.'],
    knight: ['Слишком высоко.', 'Я боюсь падать.'],
    bishop: ['Не по этой диагонали.', 'Он ждёт на белом.'],
    rook: ['Прямо. Только прямо.', 'Я не умею иначе.'],
    queen: ['Я была всем сразу.', 'Теперь я в твоей руке.'],
  },

  hungerLines: {
    0.4: 'Кости начинают ныть.',
    0.25: 'Под доской стало тише. Оно слушает.',
    0.1: 'Пальцы крошатся. Ты слышишь, как оно ест.',
    0: 'Ешь или будь съеден.',
  },

  bonesetterLines: {
    bySeams: {
      0: '— Ты чистый. Это ненадолго.',
      low: '— Швы держат. Пока.',
      mid: '— Ты гремишь при ходьбе. Слышно с яруса выше.',
      high: '— Я не знаю, что ты теперь. Возьми ещё. Хуже не будет.',
    },
    byBones: {
      many: '— Ты стал тяжёлым. Тьма любит тяжёлых.',
      few: '— Ты почти пешка. Так дольше живут.',
    },
    repeat: {
      2: '— Ты вернулся. Плохо.',
      3: '— Опять. Я начинаю тебя узнавать.',
      5: '— Слушай. Может, хватит?',
      10: '— Я перестал считать. Бери что нужно.',
    },
  },

  bosses: {
    tormentor: {
      appear: [
        { ch: 'log', text: 'Он стоит в конце зала. Три тела сшиты в одно.' },
        { ch: 'speech', kind: 'boss', text: 'Мы были инквизицией.' },
      ],
      phase1: [
        { ch: 'speech', kind: 'boss', text: 'Я жёг.' },
        { ch: 'speech', kind: 'boss', text: 'Я держал.' },
        { ch: 'speech', kind: 'boss', text: 'Я записывал.' },
      ],
      phase2: [
        { ch: 'log', text: 'Одно тело отваливается. Оно ещё шевелится.' },
        { ch: 'speech', kind: 'boss', text: 'Нас двое.' },
      ],
      phase3: [
        { ch: 'speech', kind: 'boss', text: 'Я записывал.' },
        { ch: 'speech', kind: 'boss', text: 'Я всё записал.' },
      ],
      death: [
        { ch: 'log', text: 'Он рассыпается. Три пешки бегут к стенам.' },
        { ch: 'speech', kind: 'enemy', text: 'Не нас.' },
        { ch: 'speech', kind: 'enemy', text: 'Мы только держали.' },
      ],
      mercyKill: { ch: 'log', text: 'Ты добил всех. Ров затих.' },
      mercySpare: { ch: 'log', text: 'Ты дал им уйти. Они не поблагодарили.' },
    },
    spawnedRooks: {
      appear: [
        { ch: 'log', text: 'Две Ладьи. Сросшиеся спинами. Они не смотрят друг на друга.' },
        { ch: 'speech', kind: 'boss', text: 'Он предал первым.' },
        { ch: 'speech', kind: 'boss', text: 'Он лжёт.' },
      ],
      banter: [
        { ch: 'speech', kind: 'boss', text: 'Ты открыл ворота.' },
        { ch: 'speech', kind: 'boss', text: 'Ты назвал моё имя.' },
        { ch: 'speech', kind: 'boss', text: 'Я держал левый край.' },
        { ch: 'speech', kind: 'boss', text: 'Ты держал нож.' },
        { ch: 'speech', kind: 'boss', text: 'Мы могли уйти.' },
        { ch: 'speech', kind: 'boss', text: 'Мы и ушли. Сюда.' },
      ],
      blocked: [
        { ch: 'log', text: 'Они упёрлись друг в друга. Впервые за века — стоят.' },
        { ch: 'speech', kind: 'boss', text: 'Отпусти меня.' },
        { ch: 'speech', kind: 'boss', text: 'Отпусти меня.' },
      ],
      firstDeath: { ch: 'speech', kind: 'boss', text: 'Наконец тихо.' },
      secondDeath: { ch: 'log', text: 'Второй не сопротивлялся.' },
    },
    millstone: {
      appear: [
        { ch: 'log', text: 'Жернов идёт по линии. Он не видит тебя.' },
        { ch: 'log', text: 'Он никогда не видел никого.' },
      ],
      death: {
        ch: 'log',
        text: 'Жернов встал. Внутри — кости. Много. Некоторые ещё сжимают чужие.',
      },
    },
    redKing: {
      appear: [
        { ch: 'log', text: 'Он сидит на троне из собственных костей.' },
        { ch: 'speech', kind: 'boss', text: 'Ты дошёл.' },
        { ch: 'speech', kind: 'boss', text: 'Садись. Или ломай цепи. Мне всё равно.' },
        { ch: 'speech', kind: 'boss', text: 'Я устал быть сердцем.' },
      ],
      chainBreak: {
        1: { ch: 'speech', kind: 'boss', text: 'Одна. Хорошо.' },
        2: { ch: 'speech', kind: 'boss', text: 'Ты быстрее прошлых.' },
        3: { ch: 'speech', kind: 'boss', text: 'Прошлых было сорок.' },
        4: { ch: 'speech', kind: 'boss', text: 'Никто не доходил до четвёртой.' },
      },
      orders: [
        { ch: 'speech', kind: 'boss', text: 'Иди.' },
        { ch: 'speech', kind: 'boss', text: 'Не он. Ты.' },
        { ch: 'speech', kind: 'boss', text: 'Простите.' },
      ],
      alone: [
        { ch: 'log', text: 'Зал пуст. Он остался один.' },
        { ch: 'speech', kind: 'boss', text: 'Все.' },
        { ch: 'speech', kind: 'boss', text: 'Больше некого послать.' },
      ],
      queen: {
        appear: {
          ch: 'speech',
          kind: 'boss',
          text: 'Я знала, что кто-то придёт. Я просто не думала, что пешка.',
        },
        fight: {
          ch: 'speech',
          kind: 'boss',
          text: 'Он не заставлял. Я сама легла на алтарь. У него не осталось никого.',
        },
        death: { ch: 'speech', kind: 'boss', text: 'Скажи ему, что я не жалею.' },
      },
      rooks: {
        appear: { ch: 'log', text: 'Две фигуры. Они не поворачиваются на звук.' },
        fight: { ch: 'log', text: 'Они бьют по линиям. Не по тебе. Просто по линиям.' },
        death: { ch: 'log', text: 'Она упала беззвучно. Как и стояла.' },
      },
      knights: {
        appear: { ch: 'speech', kind: 'boss', text: 'Сир. Сир. Сир.' },
        fight: [
          { ch: 'speech', kind: 'boss', text: 'Я держал правый фланг.' },
          { ch: 'speech', kind: 'boss', text: 'Правый фланг. Правый.' },
          { ch: 'speech', kind: 'boss', text: 'Где мой конь? Я и есть конь.' },
          { ch: 'speech', kind: 'boss', text: 'Который час? Который век?' },
        ],
        death: { ch: 'speech', kind: 'boss', text: 'Доложите королю.' },
      },
    },
  },

  interludes: {
    prologue: {
      title: '',
      lines: [
        'Ты проиграл битву.',
        'Ты умер.',
        'Тебя сбросили в Ров, к остальным.',
        '',
        'Сто лет ты лежал среди костей и не двигался.',
        'Тьма под доской начала тебя есть.',
        'Ты пошевелился — и она отступила.',
        '',
        'Теперь ты знаешь правило.',
        'Двигайся или будь съеден.',
      ],
      button: 'Встать',
    },
    act1to2: {
      title: '',
      lines: [
        'Ров кончился.',
        '',
        'Из груды поднимается фигура. Когда-то это была Ладья.',
        'Граней не осталось. Только обрубок и мешок.',
        '',
        '    — Ты идёшь вниз.',
        '    — Все идут вниз. Никто не возвращается.',
        '    — Возьми что-нибудь. Мёртвым не нужно.',
        '',
        'Он открывает мешок. Внутри — кости.',
      ],
      choices: [
        { label: '«Сколько?»', mercy: 0, desc: 'Кость бесплатно' },
        { label: '«Что ты хочешь взамен?»', mercy: 1, desc: 'Кость + 10 пепла' },
        { label: 'Забрать молча', mercy: -2, desc: 'Две кости' },
      ],
    },
    act2to3: {
      title: '',
      lines: [
        'Партия осталась выше.',
        '',
        'Ты спускаешься туда, куда не спускают фигуры.',
        'Ступени вырублены в кости. Кость — одна, целая.',
        'Ты идёшь по чьему-то позвоночнику.',
        '',
        'Внизу — свет. Красный, ровный, без источника.',
        '',
        '    Оттуда доносится дыхание.',
        '    Медленное. Усталое.',
        '    Кто-то очень давно не спал.',
      ],
      button: 'Спуститься',
    },
  },

  endings: {
    kill: {
      title: 'Разомкнуто',
      lines: [
        'Ты бьёшь. Он не закрывается.',
        '',
        'Кости трона рассыпаются. Свет гаснет ровно, без вспышки.',
        'Наверху, в мире живых, тысячи солдат падают на землю',
        'и остаются лежать. Просто лежать. Впервые.',
        '',
        'Ты чувствуешь, как швы расходятся.',
        'Чужие кости отваливаются одна за другой.',
        'Последней остаётся твоя. Пешечная.',
        '',
        'Ты не помнишь имени. Но помнишь, что оно было.',
      ],
    },
    throne: {
      title: 'Ходи',
      lines: [
        'Ты садишься. Пол смыкается на щиколотках.',
        '',
        'Он рассыпается у трона — тихо, с облегчением.',
        'Ты чувствуешь нити. Их тысячи. Каждая — чья-то рука.',
        '',
        'Внизу открывается яма. Оттуда несёт голодом.',
        'Ты понимаешь, чем Короли платили Тьме.',
        'Не собой.',
        '',
        'Первая фигура выходит на поле и ждёт приказа.',
        'Она смотрит на тебя, как ты смотрел на него.',
      ],
    },
    breakBoard: {
      title: '…пробудить',
      lines: [
        'Ты бьёшь не в него. В пол.',
        '',
        'Кости Павших в твоих руках трескаются разом — все двенадцать.',
        'Пол расходится.',
        '',
        'Под доской нет Тьмы. Под доской — череп.',
        'Огромный, старый, пустой. Подземелье — трещина в кости.',
        'Игроки — не демоны. Это сны, которые ему снились,',
        'пока он ещё мог спать.',
        '',
        'Ты падаешь внутрь черепа.',
        '',
        'Там нет клеток. Там нет правил.',
        'Там ходят фигуры, которых не бывает в шахматах.',
      ],
    },
  },

  repeat: {
    prologue: {
      lines: [
        'Ты снова в яме.',
        'Кости уложены иначе, но это те же кости.',
        '',
        'Ты помнишь, чем кончилось.',
        'Они — тоже.',
      ],
    },
    enemyLines: ['Опять ты.', 'В прошлый раз ты упал здесь.', 'Я ждала.', 'Сколько раз ты уже?'],
    kingSeen: [
      { ch: 'speech', kind: 'boss', text: 'Ты уже был здесь.' },
      { ch: 'speech', kind: 'boss', text: 'Ты уже выбирал.' },
      { ch: 'speech', kind: 'boss', text: 'Выбери иначе.' },
    ],
  },
};

export const SCRIPT_EN = {
  floorIntro: {
    1: 'You crawled out of the pit. Bones crack underfoot.',
    2: 'The walls are ribbed. Some are still warm.',
    3: 'Someone counted days here. More scratches than walls.',
    4: 'The ditch ends. Ahead — flat floor.',
    5: 'The ditch ends. The floor is tiled with shoulder blades — someone was busy.',
    6: 'The floor is squared. You stand on a cell.',
    7: 'Threads are strung overhead. They vanish into the dark.',
    8: 'Something was dragged here. The trail never ends.',
    9: 'The chains move on their own. No one is turning them.',
    10: 'The cells are wet. It smells of iron.',
    11: 'Ahead — a millstone. It will not stop.',
    12: 'No cells. Just floor.',
    13: 'Writings on the walls. All about a single game.',
    14: 'Thrones stood here. Only the pedestals remain.',
    15: 'Someone left a piece on the floor. It stares upward.',
    16: 'The light is flat. Shadows do not stir.',
    17: 'A door. Behind it — breathing.',
    18: 'The throne room. He waits.',
  },

  enemyLines: {
    pawn: {
      act1: [
        'Finish it.',
        'I remember the name.',
        'How long have I been here?',
        'Stay back.',
        'Are you going up?',
        'There is no up.',
        'It eats me from below.',
      ],
      act2: [
        'Not me.',
        'The hand moved on its own.',
        'Stop. I cannot stand.',
        'He looks the wrong way.',
      ],
    },
    knight: {
      act1: ['Where do you leap?', 'My horse left.'],
      act2: ['Orders.', 'I held the flank.'],
    },
    bishop: {
      act1: ['The diagonal is empty.', 'He waits on white.'],
      act2: ['A thread.', 'Not this line.'],
    },
    rook: {
      act1: ['Straight. Only straight.', 'I know no other way.'],
      act2: ['This line is taken.', 'You stepped onto mine.'],
    },
    queen: {
      act1: ['I was everything at once.', 'Now I am in your hand.'],
      act2: ['A thread on my neck.', 'He plays me.'],
    },
  },

  deathLines: {
    act1: ['Thank you.', 'At last.', 'You are the same.', 'Tell them I was first.'],
    act2: ['Thank you for cutting.', 'The thread. Not me.'],
    act3: ['Forgive me.', 'I did not want this.', 'He did not force me.'],
  },

  boneVoices: {
    pawn: ['I will not go there.', 'My brother is there.'],
    knight: ['Too high.', 'I fear the fall.'],
    bishop: ['Not this diagonal.', 'He waits on white.'],
    rook: ['Straight. Only straight.', 'I know no other way.'],
    queen: ['I was everything at once.', 'Now I am in your hand.'],
  },

  hungerLines: {
    0.4: 'Your bones begin to ache.',
    0.25: 'Below the board it grew quiet. It listens.',
    0.1: 'Your fingers crumble. You can hear it eating.',
    0: 'Eat or be eaten.',
  },

  bonesetterLines: {
    bySeams: {
      0: '"You are clean. It will not last."',
      low: '"The seams hold. For now."',
      mid: '"You rattle when you walk. Heard from a floor above."',
      high: '"I do not know what you are now. Take another. It cannot get worse."',
    },
    byBones: {
      many: '"You have grown heavy. The Darkness loves the heavy."',
      few: '"You are almost a pawn. They live longer."',
    },
    repeat: {
      2: '"You came back. Bad sign."',
      3: '"Again. I am beginning to know you."',
      5: '"Listen. Perhaps enough?"',
      10: '"I stopped counting. Take what you need."',
    },
  },

  bosses: {
    tormentor: {
      appear: [
        { ch: 'log', text: 'He stands at the far end. Three bodies sewn into one.' },
        { ch: 'speech', kind: 'boss', text: 'We were the Inquisition.' },
      ],
      phase1: [
        { ch: 'speech', kind: 'boss', text: 'I burned.' },
        { ch: 'speech', kind: 'boss', text: 'I held.' },
        { ch: 'speech', kind: 'boss', text: 'I wrote it down.' },
      ],
      phase2: [
        { ch: 'log', text: 'One body sloughs off. It still twitches.' },
        { ch: 'speech', kind: 'boss', text: 'Two of us left.' },
      ],
      phase3: [
        { ch: 'speech', kind: 'boss', text: 'I wrote it down.' },
        { ch: 'speech', kind: 'boss', text: 'I wrote everything.' },
      ],
      death: [
        { ch: 'log', text: 'He crumbles. Three pawns scatter to the walls.' },
        { ch: 'speech', kind: 'enemy', text: 'Not us.' },
        { ch: 'speech', kind: 'enemy', text: 'We only held.' },
      ],
      mercyKill: { ch: 'log', text: 'You finished them all. The ditch falls silent.' },
      mercySpare: { ch: 'log', text: 'You let them go. They did not thank you.' },
    },
    spawnedRooks: {
      appear: [
        { ch: 'log', text: 'Two Rooks. Spines fused. They do not look at each other.' },
        { ch: 'speech', kind: 'boss', text: 'He betrayed first.' },
        { ch: 'speech', kind: 'boss', text: 'He lies.' },
      ],
      banter: [
        { ch: 'speech', kind: 'boss', text: 'You opened the gate.' },
        { ch: 'speech', kind: 'boss', text: 'You spoke my name.' },
        { ch: 'speech', kind: 'boss', text: 'I held the left flank.' },
        { ch: 'speech', kind: 'boss', text: 'You held the knife.' },
        { ch: 'speech', kind: 'boss', text: 'We could have left.' },
        { ch: 'speech', kind: 'boss', text: 'We did leave. Here.' },
      ],
      blocked: [
        { ch: 'log', text: 'They jam against each other. For the first time in ages — they stop.' },
        { ch: 'speech', kind: 'boss', text: 'Let me go.' },
        { ch: 'speech', kind: 'boss', text: 'Let me go.' },
      ],
      firstDeath: { ch: 'speech', kind: 'boss', text: 'Quiet at last.' },
      secondDeath: { ch: 'log', text: 'The second did not resist.' },
    },
    millstone: {
      appear: [
        { ch: 'log', text: 'The millstone rolls along its line. It does not see you.' },
        { ch: 'log', text: 'It has never seen anyone.' },
      ],
      death: {
        ch: 'log',
        text: 'The millstone stops. Inside — bones. Many. Some still clutch others.',
      },
    },
    redKing: {
      appear: [
        { ch: 'log', text: 'He sits on a throne of his own bones.' },
        { ch: 'speech', kind: 'boss', text: 'You made it.' },
        { ch: 'speech', kind: 'boss', text: 'Sit. Or break the chains. I do not care.' },
        { ch: 'speech', kind: 'boss', text: 'I am tired of being the heart.' },
      ],
      chainBreak: {
        1: { ch: 'speech', kind: 'boss', text: 'One. Good.' },
        2: { ch: 'speech', kind: 'boss', text: 'You are faster than the last.' },
        3: { ch: 'speech', kind: 'boss', text: 'There were forty before you.' },
        4: { ch: 'speech', kind: 'boss', text: 'None reached the fourth.' },
      },
      orders: [
        { ch: 'speech', kind: 'boss', text: 'Go.' },
        { ch: 'speech', kind: 'boss', text: 'Not him. You.' },
        { ch: 'speech', kind: 'boss', text: 'Forgive me.' },
      ],
      alone: [
        { ch: 'log', text: 'The hall is empty. He is alone.' },
        { ch: 'speech', kind: 'boss', text: 'All of them.' },
        { ch: 'speech', kind: 'boss', text: 'No one left to send.' },
      ],
      queen: {
        appear: {
          ch: 'speech',
          kind: 'boss',
          text: 'I knew someone would come. I just did not think it would be a pawn.',
        },
        fight: {
          ch: 'speech',
          kind: 'boss',
          text: 'He did not force me. I lay on the altar myself. He had no one left.',
        },
        death: { ch: 'speech', kind: 'boss', text: 'Tell him I do not regret it.' },
      },
      rooks: {
        appear: { ch: 'log', text: 'Two figures. They do not turn toward sound.' },
        fight: { ch: 'log', text: 'They strike along lines. Not at you. Just the lines.' },
        death: { ch: 'log', text: 'She fell without a sound. As she stood.' },
      },
      knights: {
        appear: { ch: 'speech', kind: 'boss', text: 'Sire. Sire. Sire.' },
        fight: [
          { ch: 'speech', kind: 'boss', text: 'I held the right flank.' },
          { ch: 'speech', kind: 'boss', text: 'Right flank. Right.' },
          { ch: 'speech', kind: 'boss', text: 'Where is my horse? I am the horse.' },
          { ch: 'speech', kind: 'boss', text: 'What hour? What century?' },
        ],
        death: { ch: 'speech', kind: 'boss', text: 'Report to the King.' },
      },
    },
  },

  interludes: {
    prologue: {
      title: '',
      lines: [
        'You lost the battle.',
        'You died.',
        'They threw you into the Ditch, with the rest.',
        '',
        'A hundred years you lay among the bones and did not stir.',
        'The dark beneath the board began to eat you.',
        'You twitched — and it shrank back.',
        '',
        'Now you know the rule.',
        'Move or be taken.',
      ],
      button: 'Rise',
    },
    act1to2: {
      title: '',
      lines: [
        'The ditch ends.',
        '',
        'A figure lifts from the heap. It was once a Rook.',
        'No edges remain. Only a stump and a sack.',
        '',
        '    "You are going down."',
        '    "Everyone goes down. No one returns."',
        '    "Take something. The dead do not need it."',
        '',
        'He opens the sack. Inside — bones.',
      ],
      choices: [
        { label: '"How many?"', mercy: 0, desc: 'One bone, free' },
        { label: '"What do you want in return?"', mercy: 1, desc: 'One bone + 10 ash' },
        { label: 'Take in silence', mercy: -2, desc: 'Two bones' },
      ],
    },
    act2to3: {
      title: '',
      lines: [
        'The game stayed above.',
        '',
        'You descend where pieces are never sent.',
        'Stairs are carved from bone. One bone, whole.',
        "You walk along someone's spine.",
        '',
        'Below — light. Red, flat, sourceless.',
        '',
        '    Breathing comes from below.',
        '    Slow. Exhausted.',
        '    Someone has not slept for a very long time.',
      ],
      button: 'Descend',
    },
  },

  endings: {
    kill: {
      title: 'Unclasped',
      lines: [
        'You strike. He does not block.',
        '',
        'The bones of the throne scatter. The light goes out flat, without a flare.',
        'Above, in the world of the living, thousands of soldiers hit the ground',
        'and stay there. Just lying there. For the first time.',
        '',
        'You feel the seams unthread.',
        'Foreign bones drop off one by one.',
        'The last remaining one is yours. The pawn one.',
        '',
        'You do not remember your name. But you remember there was one.',
      ],
    },
    throne: {
      title: 'Move',
      lines: [
        'You sit. The floor seals at your ankles.',
        '',
        'He crumbles by the throne — quietly, relieved.',
        "You feel the threads. Thousands. Each one — someone's hand.",
        '',
        'A pit opens below. It reeks of hunger.',
        'You understand what the Kings paid the Darkness with.',
        'Not themselves.',
        '',
        'The first piece steps onto the board and awaits orders.',
        'It looks at you the way you looked at him.',
      ],
    },
    breakBoard: {
      title: '…awaken',
      lines: [
        'You strike not at him. At the floor.',
        '',
        'The Bones of the Fallen in your grip crack at once — all twelve.',
        'The floor splits.',
        '',
        'There is no Darkness beneath the board. Beneath is a skull.',
        'Huge, old, hollow. The Dungeon is a crack in the bone.',
        'The Players are not demons. They are dreams it dreamed',
        'while it could still sleep.',
        '',
        'You fall into the skull.',
        '',
        'There are no cells there. No rules.',
        'Pieces move that do not exist in chess.',
      ],
    },
  },

  repeat: {
    prologue: {
      lines: [
        'You are back in the pit.',
        'The bones are laid differently, but they are the same bones.',
        '',
        'You remember how it ended.',
        'So do they.',
      ],
    },
    enemyLines: ['You again.', 'Last time you fell here.', 'I waited.', 'How many times now?'],
    kingSeen: [
      { ch: 'speech', kind: 'boss', text: 'You have been here before.' },
      { ch: 'speech', kind: 'boss', text: 'You have already chosen.' },
      { ch: 'speech', kind: 'boss', text: 'Choose differently.' },
    ],
  },
};

import { isEnglish } from '../lang.js';
import { random } from '../util.js';

/** Return SCRIPT or SCRIPT_EN based on current language. */
export function getScript() {
  return isEnglish() ? SCRIPT_EN : SCRIPT;
}

/** Взять случайную строку из пула, не повторяя последнюю (по ключу lastKey). */
export function pickLine(pool, lastKey) {
  if (!pool || !pool.length) return null;
  if (pool.length === 1) return pool[0];
  let idx;
  do {
    idx = Math.floor(random() * pool.length);
  } while (pool[idx] === lastKey && pool.length > 1);
  return pool[idx];
}

/** Определить акт по номеру яруса: 1 → act1, 2 → act2, 3 → act3. */
export function actForFloor(f) {
  if (f <= 5) return 'act1';
  if (f <= 11) return 'act2';
  return 'act3';
}
