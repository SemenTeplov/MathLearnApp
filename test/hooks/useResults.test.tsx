// useResults: оценка, успешность, запись очков (или «не зачтено»), порядок и звук.

import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ErrorBus } from '../../src/app/error-bus';
import type { Services } from '../../src/app/types';
import { CONFIG } from '../../src/core/config';
import { QuotaExceededError } from '../../src/core/errors';
import type { GameResult } from '../../src/core/types';
import { StatsService } from '../../src/data/stats-service';
import { useResults } from '../../src/hooks/useResults';
import { MemoryRepository } from '../support/memory-repository';

const WIN: GameResult = { correct: 8, wrong: 2, total: 10, roundScore: 80, lives: 3, completed: true };
const LOSE: GameResult = { correct: 0, wrong: 3, total: 3, roundScore: 0, lives: 0, completed: true };

function setup() {
    const repo = new MemoryRepository();
    const errors = new ErrorBus();
    const received: string[][] = [];
    errors.subscribe((title, message) => received.push([title, message]));
    const stats = new StatsService(repo, errors);
    const audio = { play: vi.fn() };
    const services = { audio, stats, errors } as unknown as Services;
    const seen: number[] = [];
    const onRoundFinished = vi.fn(() => seen.push(stats.getTotalScore()));
    const view = renderHook(() => useResults(services, onRoundFinished));
    return { ...view, repo, received, stats, audio, onRoundFinished, seen };
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

    test('onRoundFinished видит счёт уже после записи (карта свежая)', () => {
        const { result, seen } = setup();

        act(() => result.current.show(WIN));

        expect(seen).toEqual([80]);
    });

    test('повторная победа суммирует очки: 80 → 160', () => {
        const { result, stats } = setup();
        act(() => result.current.show(WIN));

        act(() => result.current.show(WIN));

        expect(stats.getTotalScore()).toBe(160);
        expect(result.current.view?.earnings).toBe('Заработано: 80 ✓');
    });

    test('провал записи: очки не зачтены, счёт 0, сообщение в шине', () => {
        const { result, repo, stats, received, audio } = setup();
        vi.spyOn(repo, 'save').mockImplementation(() => {
            throw new QuotaExceededError('Переполнено.');
        });

        act(() => result.current.show(WIN));

        expect(stats.getTotalScore()).toBe(0);
        expect(result.current.view?.earnings).toBe('Заработано: 80 (не зачтено)');
        expect(result.current.view?.rating.icon).toBe('🎉');
        expect(received).toEqual([['Ошибка хранилища', 'Хранилище заполнено. Данные не сохранятся.']]);
        // Звук раунда не зависит от результата записи (решение 7 плана).
        expect(audio.play).toHaveBeenCalledWith('win');
    });
});
