// ============================================
// CORE/SCORING.TS — расчёт очков (1.8.2)
// ============================================

import { CONFIG } from './config';

/** Объект для расчёта очков. */
export const Scoring = {
    /** Считает очки за раунд. */
    calculateRoundScore(correctCount: number): number {
        return correctCount * CONFIG.POINTS_BASE;
    },

    /** Проверяет, успешен ли раунд. */
    isRoundSuccessful(lives: number, completed: boolean): boolean {
        return lives > 0 && completed;
    }
};
