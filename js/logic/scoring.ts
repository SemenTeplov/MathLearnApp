// ============================================
// LOGIC/SCORING.TS — расчёт очков
// ============================================

/** Объект для расчёта очков. */
const Scoring = {
    /** Считает очки за раунд. */
    calculateRoundScore(correctCount: number): number {
        return correctCount * CONFIG.POINTS_BASE;
    },

    /** Проверяет, успешен ли раунд. */
    isRoundSuccessful(lives: number, completed: boolean): boolean {
        return lives > 0 && completed;
    }
};
