// ============================================
// CORE/GAME-RULES.TS — правила игры (1.10.0)
// ============================================

import { CONFIG } from './config';
import type { SessionModel } from './session-model';
import type { GameResult, Rating } from './types';

/** Объект для игровых правил. */
export const GameRules = {
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

    /** Определяет оценку по результатам: пороги берутся из CONFIG.RATINGS (A83, T75). */
    getRating(results: GameResult): Rating {
        if (results.lives <= 0) {
            return CONFIG.GAMEOVER;
        }
        const accuracy = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
        return CONFIG.RATINGS.find((rating) => accuracy >= rating.min) ?? CONFIG.RATINGS[CONFIG.RATINGS.length - 1];
    }
};
