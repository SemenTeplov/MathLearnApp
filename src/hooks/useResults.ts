// ============================================
// SRC/HOOKS/useResults.ts — экран результатов (1.8.2)
// ============================================
// Оценка → успешность → onRoundFinished (позиция игрока) →
// StatsService.updateAfterRound (только победа) → звук → строка «Заработано».

import { useCallback, useState } from 'react';
import type { Services } from '../app/types';
import { GameRules } from '../core/game-rules';
import { Scoring } from '../core/scoring';
import type { GameResult, Rating } from '../core/types';
import type { ResultsView } from '../ui/types';

export interface UseResults {
    /** Данные экрана результатов; null — экран не показывался. */
    view: ResultsView | null;
    /** Показывает результаты раунда (вызывается по окончании игры). */
    show(results: GameResult): void;
}

/**
 * @param services — сервисы приложения (статистика, звук)
 * @param onRoundFinished — сообщает об итоге раунда (позиция на карте)
 */
export function useResults(
    services: Services,
    onRoundFinished: (isSuccessful: boolean) => void
): UseResults {
    const [view, setView] = useState<ResultsView | null>(null);

    const show = useCallback((results: GameResult): void => {
        const rating: Rating = GameRules.getRating(results);
        const isSuccessful = Scoring.isRoundSuccessful(results.lives, results.completed);

        onRoundFinished(isSuccessful);

        if (isSuccessful) {
            services.stats.updateAfterRound(results.roundScore);
            services.audio.play('win');
        } else {
            services.audio.play('lose');
        }

        const earnings = isSuccessful
            ? 'Заработано: ' + results.roundScore + ' ✓'
            : 'Заработано: ' + results.roundScore + ' (не зачтено)';

        setView({ results, rating, earnings });
    }, [onRoundFinished, services]);

    return { view, show };
}
