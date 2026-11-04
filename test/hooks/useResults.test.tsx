// useResults: оценка, успешность, запись статистики только за победу и звук.

import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import type { Services } from '../../src/app/types';
import { CONFIG } from '../../src/core/config';
import type { GameResult } from '../../src/core/types';
import { MemoryRepository } from '../../src/data/memory-repository';
import { StatsService } from '../../src/data/stats-service';
import { useResults } from '../../src/hooks/useResults';
import type { AudioService } from '../../src/services/audio-service';

const WIN: GameResult = { correct: 8, wrong: 2, total: 10, roundScore: 80, lives: 3, completed: true };
const LOSE: GameResult = { correct: 0, wrong: 3, total: 3, roundScore: 0, lives: 0, completed: true };

function setup() {
    const stats = new StatsService(new MemoryRepository());
    const audio = { play: vi.fn() };
    const services = { audio, stats } as unknown as Services;
    const onRoundFinished = vi.fn();
    const view = renderHook(() => useResults(services, onRoundFinished));
    return { ...view, stats, audio, onRoundFinished };
}

describe('useResults', () => {
    test('победа 8/2: 🎉 «Отлично!», заработок и onRoundFinished(true)', () => {
        const { result, onRoundFinished } = setup();

        act(() => result.current.show(WIN));

        expect(result.current.view?.results).toEqual(WIN);
        expect(result.current.view?.rating.icon).toBe('🎉');
        expect(result.current.view?.rating.title).toBe('Отлично!');
        expect(result.current.view?.earnings).toBe('Заработано: 80 ✓');
        expect(onRoundFinished).toHaveBeenCalledWith(true);
    });

    test('провал: GAMEOVER 💔 и «(не зачтено)»', () => {
        const { result, onRoundFinished } = setup();

        act(() => result.current.show(LOSE));

        expect(result.current.view?.rating).toEqual(CONFIG.GAMEOVER);
        expect(result.current.view?.rating.icon).toBe('💔');
        expect(result.current.view?.earnings).toBe('Заработано: 0 (не зачтено)');
        expect(onRoundFinished).toHaveBeenCalledWith(false);
    });

    test('победа пишет статистику и играет win', () => {
        const { result, stats, audio } = setup();

        act(() => result.current.show(WIN));

        expect(stats.getTotalScore()).toBe(80);
        expect(audio.play).toHaveBeenCalledWith('win');
    });

    test('провал не пишет статистику и играет lose', () => {
        const { result, stats, audio } = setup();

        act(() => result.current.show(LOSE));

        expect(stats.getTotalScore()).toBe(0);
        expect(audio.play).toHaveBeenCalledWith('lose');
        expect(audio.play).not.toHaveBeenCalledWith('win');
    });

    test('повторный show перезаписывает view, старые данные не утекают', () => {
        const { result, stats, onRoundFinished } = setup();
        act(() => result.current.show(WIN));

        act(() => result.current.show(LOSE));

        expect(result.current.view?.results).toEqual(LOSE);
        expect(result.current.view?.rating).toEqual(CONFIG.GAMEOVER);
        expect(result.current.view?.earnings).toContain('(не зачтено)');
        expect(onRoundFinished).toHaveBeenCalledTimes(2);
        // Вторая, неуспешная игра не обнуляет и не удваивает счёт.
        expect(stats.getTotalScore()).toBe(80);
    });
});
