// ============================================
// SRC/HOOKS/useResults.ts — экран результатов (1.10.0)
// ============================================
// Оценка → успешность → запись очков (updateAfterRound) → onRoundFinished →
// звук → строка «Заработано». Провал записи не зачитывает очки (A80, T74).

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
export function useResults(services: Services, onRoundFinished: (isSuccessful: boolean) => void): UseResults {
    const [view, setView] = useState<ResultsView | null>(null);

    const show = useCallback(
        (results: GameResult): void => {
            const rating: Rating = GameRules.getRating(results);
            const isSuccessful = Scoring.isRoundSuccessful(results.lives, results.completed);
            const written = isSuccessful && services.stats.updateAfterRound(results.roundScore);

            // Карта читает счёт в gameFinished уже после записи (корень P4).
            onRoundFinished(isSuccessful);

            // Звук раунда не зависит от результата записи (решение 7 плана).
            services.audio.play(isSuccessful ? 'win' : 'lose');

            const earnings = 'Заработано: ' + results.roundScore + (isSuccessful && written ? ' ✓' : ' (не зачтено)');

            setView({ results, rating, earnings });
        },
        [onRoundFinished, services]
    );

    return { view, show };
}
