// ============================================
// LOGIC/GAME-RULES.TS — правила игры
// ============================================

/** Объект для игровых правил. */
const GameRules = {
    /** Проверяет ответ. */
    checkAnswer(chosen: number, correct: number): boolean {
        return chosen === correct;
    },

    /** Определяет, следует ли завершить игру. */
    shouldEndGame(session: SessionModel): boolean {
        if (session.lives <= 0) return true;
        if (session.currentQuestionIndex >= CONFIG.TOTAL_QUESTIONS) return true;
        return false;
    },

    /** Определяет оценку по результатам. */
    getRating(results: GameResult): Rating {
        if (results.lives <= 0) {
            return CONFIG.GAMEOVER;
        }
        const accuracy = results.total > 0
            ? Math.round((results.correct / results.total) * 100)
            : 0;
        if (accuracy >= 100) return CONFIG.RATINGS[0];
        if (accuracy >= 70) return CONFIG.RATINGS[1];
        if (accuracy >= 40) return CONFIG.RATINGS[2];
        return CONFIG.RATINGS[3];
    }
};
