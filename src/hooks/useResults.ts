// ============================================
// SRC/HOOKS/useResults.ts — экран результатов (1.8.0)
// ============================================
// Перенос логики экрана результатов 1:1 (бывший контроллер):
// оценка → успешность → onRoundFinished (позиция игрока) →
// StatsService.updateAfterRound (только победа) → звук → строка «Заработано».

import { useCallback, useState } from 'react';

export interface UseResults {
    /** Данные экрана результатов; null — экран не показывался. */
    view: ResultsView | null;
    /** Показывает результаты раунда (вызывается по окончании игры). */
    show(results: GameResult): void;
}

/**
 * @param onRoundFinished — сообщает об итоге раунда (позиция на карте)
 */
export function useResults(onRoundFinished: (isSuccessful: boolean) => void): UseResults {
    const [view, setView] = useState<ResultsView | null>(null);

    const show = useCallback((results: GameResult): void => {
        const rating: Rating = GameRules.getRating(results);
        const isSuccessful = Scoring.isRoundSuccessful(results.lives, results.completed);

        onRoundFinished(isSuccessful);

        if (isSuccessful) {
            StatsService.updateAfterRound(results.roundScore);
            AudioService.play('win');
        } else {
            AudioService.play('lose');
        }

        const earnings = isSuccessful
            ? 'Заработано: ' + results.roundScore + ' ✓'
            : 'Заработано: ' + results.roundScore + ' (не зачтено)';

        setView({ results, rating, earnings });
    }, [onRoundFinished]);

    return { view, show };
}
