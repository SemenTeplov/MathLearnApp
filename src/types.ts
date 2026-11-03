// ============================================
// SRC/TYPES.TS — все типы проекта (1.8.0)
// ============================================
// Переезд из js/model/types.ts (1.7.0). ВНИМАНИЕ: файл нужен только `tsc`
// и НЕ подключается в index.html — это ES-модуль (`export {}`), браузер
// упадёт на `export` при загрузке классическим <script>. Интерфейсы
// объявлены глобально через `declare global`, поэтому доступны всем файлам
// без import, включая классические слои js/ (allowJs).
// ============================================

export {};

declare global {
    /** Сложность тренировки. */
    type Difficulty = 'easy' | 'medium' | 'hard';

    /** Условие задачи. */
    interface Problem {
        question: string;
        answer: number;
        options: number[];
        explanation: string;
    }

    /** Результат одного раунда. */
    interface GameResult {
        correct: number;
        wrong: number;
        total: number;
        roundScore: number;
        lives: number;
        completed: boolean;
    }

    /** Данные одной карты. */
    interface MapData {
        totalScore: number;
        currentTrainerIndex: number;
    }

    /** Статистика игрока v3. */
    interface Stats {
        version: number;
        currentMap: string;
        maps: Record<string, MapData>;
    }

    /** Состояние раунда. */
    interface SessionState {
        lives: number;
        roundScore: number;
        currentQuestionIndex: number;
        difficulty: Difficulty;
        completed: boolean;
    }

    /** Инструкция обработчика ошибок. */
    interface ErrorInfo {
        action: 'reset' | 'skip' | 'memory';
        userMessage: string;
    }

    /** Оценка за раунд; `min` — нижняя граница точности (метаданные). */
    interface Rating {
        min: number;
        icon: string;
        title: string;
        subtitle: string;
    }

    /** Зона карты. */
    interface Zone {
        id: string;
        title: string;
        color: string;
        trainersCount: number;
    }

    /** Карта (предмет). */
    interface GameMap {
        id: string;
        title: string;
        zones: Zone[];
    }

    /** Константы приложения. */
    interface Config {
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

    // ── View-модели (только для React; не заменяют доменные типы) ──

    /** Точка на полотне карты. */
    interface Point {
        x: number;
        y: number;
    }

    /** Тренажёр в раскладке карты. */
    interface TrainerPoint extends Point {
        index: number;
        zoneId: string;
        number: number;
    }

    /** Полоса зоны на карте. */
    interface MapBand {
        id: string;
        title: string;
        color: string;
        top: number;
        height: number;
    }

    /** Геометрия карты из MapLayout.buildLayout(). */
    interface MapGeometry {
        width: number;
        height: number;
        bands: MapBand[];
        trainers: TrainerPoint[];
        roadPath: string;
    }

    /** Данные карты для MapScreen. */
    interface MapViewData {
        zones: Zone[];
        geometry: MapGeometry;
        playerPoint: Point | null;
    }

    /** Цель модалки выбора сложности на карте. */
    interface MapModalTarget {
        zoneTitle: string;
        trainerNumber: number;
    }

    /** Экран результатов. */
    interface ResultsView {
        results: GameResult;
        rating: Rating;
        earnings: string;
    }

    /** Снимок состояния игры для GameScreen. */
    interface GameSessionView {
        lives: number;
        roundScore: number;
        questionNumber: number;
        totalQuestions: number;
        progress: number;
        difficulty: Difficulty;
    }

    /** Обратная связь после ответа. */
    interface GameFeedbackView {
        isCorrect: boolean;
        title: string;
        message: string;
    }

}
