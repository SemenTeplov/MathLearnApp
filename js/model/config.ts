// ============================================
// MODEL/CONFIG.TS — константы и настройки
// ============================================

/** Зоны карты по умолчанию (математика). */
const ZONES: Zone[] = [
    { id: 'addition', title: 'Сложение', color: '#4CAF50', trainersCount: 5 },
    { id: 'subtraction', title: 'Вычитание', color: '#2196F3', trainersCount: 5 },
    { id: 'multiplication', title: 'Умножение', color: '#FF9800', trainersCount: 5 }
];

/** Каталог карт (предметов). Пока только математика. */
const MAPS: GameMap[] = [
    { id: 'math', title: 'Математика', zones: ZONES }
];

const CONFIG: Config = {
    TOTAL_QUESTIONS: 10,
    MAX_LIVES: 3,
    START_DIFFICULTY: 'easy',
    POINTS_BASE: 10,

    RATINGS: [
        { min: 100, icon: '🏆', title: 'Идеально!', subtitle: 'Все ответы правильные!' },
        { min: 70, icon: '🎉', title: 'Отлично!', subtitle: 'Хороший результат!' },
        { min: 40, icon: '💪', title: 'Неплохо!', subtitle: 'Есть куда расти!' },
        { min: 0, icon: '📚', title: 'Нужно потренироваться', subtitle: 'Не сдавайся!' }
    ],

    GAMEOVER: {
        min: 0,
        icon: '💔',
        title: 'Игра окончена',
        subtitle: 'Потеряны все жизни.'
    },

    ZONES,
    MAPS,
    DEFAULT_MAP: 'math',

    VERSION: 3,
    STORAGE_PREFIX: 'ml_'
};
