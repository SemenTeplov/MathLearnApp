// ============================================
// CORE/TYPES.TS — доменные типы (1.8.2)
// ============================================
// Только типы: без DOM, React и Storage. Геометрия карты тоже здесь —
// её возвращает чистая функция MapLayout из этого же слоя.

/** Сложность тренировки. */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** Условие задачи. */
export interface Problem {
    question: string;
    answer: number;
    options: number[];
    explanation: string;
}

/** Результат одного раунда. */
export interface GameResult {
    correct: number;
    wrong: number;
    total: number;
    roundScore: number;
    lives: number;
    completed: boolean;
}

/** Данные одной карты. */
export interface MapData {
    totalScore: number;
    currentTrainerIndex: number;
}

/** Статистика игрока v3. */
export interface Stats {
    version: number;
    currentMap: string;
    maps: Record<string, MapData>;
}

/** Состояние раунда. */
export interface SessionState {
    lives: number;
    roundScore: number;
    currentQuestionIndex: number;
    difficulty: Difficulty;
    completed: boolean;
}

/** Инструкция обработчика ошибок. */
export interface ErrorInfo {
    action: 'reset' | 'skip' | 'memory';
    userMessage: string;
}

/** Оценка за раунд; `min` — нижняя граница точности (метаданные). */
export interface Rating {
    min: number;
    icon: string;
    title: string;
    subtitle: string;
}

/** Зона карты. */
export interface Zone {
    id: string;
    title: string;
    color: string;
    trainersCount: number;
}

/** Карта (предмет). */
export interface GameMap {
    id: string;
    title: string;
    zones: Zone[];
}

/** Константы приложения. */
export interface Config {
    TOTAL_QUESTIONS: number;
    MAX_LIVES: number;
    START_DIFFICULTY: Difficulty;
    POINTS_BASE: number;
    RATINGS: Rating[];
    GAMEOVER: Rating;
    ZONES: Zone[];
    MAPS: GameMap[];
    DEFAULT_MAP: string;
    VERSION: number;
    STORAGE_PREFIX: string;
}

/** Точка на полотне карты. */
export interface Point {
    x: number;
    y: number;
}

/** Тренажёр в раскладке карты. */
export interface TrainerPoint extends Point {
    index: number;
    zoneId: string;
    number: number;
}

/** Полоса зоны на карте. */
export interface MapBand {
    id: string;
    title: string;
    color: string;
    top: number;
    height: number;
}

/** Геометрия карты из MapLayout.buildLayout(). */
export interface MapGeometry {
    width: number;
    height: number;
    bands: MapBand[];
    trainers: TrainerPoint[];
    roadPath: string;
}
