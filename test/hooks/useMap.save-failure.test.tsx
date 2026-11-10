// useMap: провал записи позиции синхронизирует игрока с хранилищем (TR-89, A92/T86).
// Отдельный сьют (A91): инвариант «UI = хранилище» проверяется и в победе, и в провале.

import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ErrorBus } from '../../src/app/error-bus';
import type { Services } from '../../src/app/types';
import { CONFIG } from '../../src/core/config';
import { QuotaExceededError } from '../../src/core/errors';
import { STORAGE_ERROR_TITLE } from '../../src/core/error-reporting';
import { StatsService } from '../../src/data/stats-service';
import { useMap } from '../../src/hooks/useMap';
import { MemoryRepository } from '../support/memory-repository';

const ADDITION = CONFIG.ZONES[0];

/** Игрок стоит на `startIndex` и перешёл на соседний; `repo.save` с этого момента бросает. */
function setupWithBrokenSave(startIndex: number) {
    const repo = new MemoryRepository();
    const errors = new ErrorBus();
    const received: string[][] = [];
    errors.subscribe((title, message) => received.push([title, message]));
    const stats = new StatsService(repo, errors);
    stats.saveTrainerIndex(startIndex);
    const view = renderHook(() => useMap({ audio: { play: vi.fn() }, stats } as unknown as Services));
    act(() => view.result.current.onTrainerClick(ADDITION, 2, startIndex + 1));
    vi.spyOn(repo, 'save').mockImplementation(() => {
        throw new QuotaExceededError('Переполнено.');
    });
    return { ...view, stats, repo, received };
}

describe('useMap — провал записи позиции', () => {
    test('победа: UI = хранилище = прежний индекс, счёт раунда не зачтён', () => {
        const { result, stats, received } = setupWithBrokenSave(0);

        act(() => result.current.gameFinished(true));

        expect(result.current.stats.currentTrainerIndex).toBe(0);
        expect(result.current.stats.currentTrainerIndex).toBe(stats.getTrainerIndex());
        expect(result.current.stats.totalScore).toBe(0);
        expect(received).toEqual([[STORAGE_ERROR_TITLE, 'Хранилище заполнено. Данные не сохранятся.']]);
    });

    test('проигрыш: UI = хранилище = предыдущий индекс', () => {
        const { result, stats } = setupWithBrokenSave(0);

        act(() => result.current.gameFinished(false));

        expect(result.current.stats.currentTrainerIndex).toBe(0);
        expect(stats.getTrainerIndex()).toBe(0);
        expect(result.current.stats.currentTrainerIndex).toBe(stats.getTrainerIndex());
        expect(result.current.stats.totalScore).toBe(0);
    });
});
