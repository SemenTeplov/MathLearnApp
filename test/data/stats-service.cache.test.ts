// StatsService: кэш в экземпляре — одно чтение на сервис, запись обновляет кэш,
// ошибка чтения не «залипает» (A95/T89, TR-92). App рендерится только для StrictMode.

import { StrictMode, createElement } from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { App } from '../../src/App';
import { ErrorBus } from '../../src/app/error-bus';
import type { Services } from '../../src/app/types';
import { CorruptedDataError, QuotaExceededError, StorageUnavailableError } from '../../src/core/errors';
import { StatsService } from '../../src/data/stats-service';
import { MemoryRepository } from '../support/memory-repository';
import { ControlledChannel, resetChannels } from '../support/session-channel';
import { defaults, failsOn, makeService, mapStats, withEnglish } from '../support/stats-fixtures';

describe('StatsService — кэш экземпляра', () => {
    afterEach(() => vi.restoreAllMocks());

    test('три геттера подряд читают хранилище один раз', () => {
        const { repo, stats } = makeService();
        repo.save(mapStats(30, 2));
        const load = vi.spyOn(repo, 'load');

        expect([stats.getCurrentMap(), stats.getTotalScore(), stats.getTrainerIndex()]).toEqual(['math', 30, 2]);
        expect(load).toHaveBeenCalledTimes(1);
    });

    test('после updateAfterRound новых чтений нет', () => {
        const { repo, stats } = makeService();
        stats.load();
        const load = vi.spyOn(repo, 'load');

        expect(stats.updateAfterRound(10)).toBe(true);
        expect(stats.getTotalScore()).toBe(10);
        expect(load).not.toHaveBeenCalled();
    });

    test('после switchMap карта и счёт берутся из кэша', () =>
        withEnglish(() => {
            const { repo, stats } = makeService();
            stats.updateAfterRound(40);
            const load = vi.spyOn(repo, 'load');

            expect(stats.switchMap('english')).toBe(true);
            expect([stats.getCurrentMap(), stats.getTotalScore()]).toEqual(['english', 0]);
            expect(load).not.toHaveBeenCalled();
        }));

    test('провал save кэш не меняет', () => {
        const { repo, stats } = makeService();
        expect(stats.saveTrainerIndex(3)).toBe(true);
        failsOn(repo, 'save', new QuotaExceededError('Переполнено.'));

        expect(stats.saveTrainerIndex(9)).toBe(false);
        expect([stats.getTrainerIndex(), stats.getTotalScore()]).toEqual([3, 0]);
    });

    test('режим «память» сбрасывает кэш прежнего хранилища', () => {
        const repo = new MemoryRepository();
        const memory = new MemoryRepository();
        memory.save(mapStats(77, 2));
        const stats = new StatsService(repo, new ErrorBus(), () => memory);
        expect(stats.getTotalScore()).toBe(0);

        failsOn(repo, 'save', new StorageUnavailableError('Нет хранилища.'));

        expect(stats.updateAfterRound(5)).toBe(false);
        expect([stats.getTotalScore(), stats.getTrainerIndex()]).toEqual([77, 2]);
    });

    test('ошибка чтения не кэшируется: следующий load снова идёт в хранилище', () => {
        const { repo, stats } = makeService();
        failsOn(repo, 'load', new CorruptedDataError('Данные повреждены.'));

        expect(stats.load()).toEqual(defaults());
        expect(stats.load()).toEqual(defaults());
        expect(vi.mocked(repo.load).mock.calls.length).toBe(4);
    });
});

describe('StatsService — первый рендер App', () => {
    beforeEach(() => {
        resetChannels();
        localStorage.clear();
        vi.stubGlobal('BroadcastChannel', ControlledChannel);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    test('App в StrictMode читает хранилище один раз', () => {
        const repo = new MemoryRepository();
        repo.save(mapStats(10, 2));
        const errors = new ErrorBus();
        const stats = new StatsService(repo, errors);
        const audio = { play: vi.fn(), preload: vi.fn() };
        const services = { audio, stats, errors } as unknown as Services;
        const load = vi.spyOn(repo, 'load');

        render(createElement(StrictMode, null, createElement(App, { services })));

        expect(stats.getTotalScore()).toBe(10);
        expect(load).toHaveBeenCalledTimes(1);
    });
});
