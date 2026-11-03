// ============================================
// UI/TYPES.TS — view-модели React-слоя (1.8.2)
// ============================================
// Только представление: доменные типы приходят из core/types через import type.

import type { Difficulty, GameResult, MapGeometry, Point, Rating, Zone } from '../core/types';

/** Данные карты для MapScreen. */
export interface MapViewData {
    zones: Zone[];
    geometry: MapGeometry;
    playerPoint: Point | null;
}

/** Цель модалки выбора сложности на карте. */
export interface MapModalTarget {
    zoneTitle: string;
    trainerNumber: number;
}

/** Экран результатов. */
export interface ResultsView {
    results: GameResult;
    rating: Rating;
    earnings: string;
}

/** Снимок состояния игры для GameScreen. */
export interface GameSessionView {
    lives: number;
    roundScore: number;
    questionNumber: number;
    totalQuestions: number;
    progress: number;
    difficulty: Difficulty;
}

/** Обратная связь после ответа. */
export interface GameFeedbackView {
    isCorrect: boolean;
    title: string;
    message: string;
}
