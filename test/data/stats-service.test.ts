// StatsService через MemoryRepository: Stats v3, счёт и позиция по картам, switchMap.

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CONFIG } from '../../src/core/config';
import { handleError } from '../../src/core/error-handler';
import {
    CorruptedDataError,
    QuotaExceededError,
    StorageUnavailableError
} from '../../src/core/errors';
import type { GameMap, Stats } from '../../src/core/types';
import { MemoryRepository } from '../../src/data/memory-repository';
import { StatsService } from '../../src/data/stats-service';

vi.mock('../../src/core/error-handler', () => ({
    handleError: vi.fn(() => ({ action: 'reset', userMessage: 'reset' }))
}));

const handleErrorMock = vi.mocked(handleError);

const ENGLISH: GameMap = { id: 'english', title: 'Английский', zones: [] };
const emptyMap = { totalScore: 0, currentTrainerIndex: -1 };

/** Добавляет временную вторую карту каталога на время теста. */
function withEnglish(fn: () => void): void {
    CONFIG.MAPS.push(ENGLISH);
    try {
        fn();
    } finally {
        CONFIG.MAPS.pop();
    }
}

function defaults(): Stats {
    return {
        version: 3,
        currentMap: 'math',
        maps: { math: { ...emptyMap } }
    };
}

describe('StatsService.load', () => {
    let repo: MemoryRepository;
    let service: StatsService;

    beforeEach(() => {
        repo = new MemoryRepository();
        service = new StatsService(repo);
        handleErrorMock.mockClear();
        handleErrorMock.mockReturnValue({ action: 'reset', userMessage: 'reset' });
    });

    test('создаётся через new StatsService(new MemoryRepository())', () => {
        const direct = new StatsService(new MemoryRepository());

        expect(direct.load()).toEqual(defaults());
    });

    test('без данных возвращает Stats v3 с картой math', () => {
        expect(service.load()).toEqual(defaults());
    });

    test('мигрирует запись версии 1 в версию 3, сохраняя счёт', () => {
        repo.save({ version: 1, totalScore: 30 });

        expect(service.load()).toEqual({
            version: 3,
            currentMap: 'math',
            maps: { math: { totalScore: 30, currentTrainerIndex: -1 } }
        });
    });

    test('мигрирует запись версии 2, сохраняя счёт и позицию', () => {
        repo.save({ version: 2, totalScore: 5, currentTrainerIndex: 7 });

        const stats = service.load();

        expect(stats.version).toBe(3);
        expect(stats.maps.math).toEqual({ totalScore: 5, currentTrainerIndex: 7 });
        expect((stats as unknown as Record<string, unknown>).totalScore).toBeUndefined();
        expect((stats as unknown as Record<string, unknown>).currentTrainerIndex).toBeUndefined();
    });

    test('дописывает отсутствующий индекс в записи версии 2', () => {
        repo.save({ version: 2, totalScore: 5 });

        expect(service.getTrainerIndex()).toBe(-1);
    });

    test('неизвестная карта в сохранении → math, данные химии не теряются', () => {
        repo.save({
            version: 3,
            currentMap: 'chemistry',
            maps: { chemistry: { totalScore: 9, currentTrainerIndex: 2 } }
        });

        const stats = service.load();

        expect(stats.currentMap).toBe('math');
        expect(stats.maps.chemistry.totalScore).toBe(9);
        expect(service.getTotalScore()).toBe(0);
    });

    test('частичные данные карты дополняются', () => {
        repo.save({ version: 3, currentMap: 'math', maps: { math: { totalScore: 4 } } });

        expect(service.load().maps.math).toEqual({ totalScore: 4, currentTrainerIndex: -1 });
    });

    test('запись новее текущей версии → сброс через handleError', () => {
        repo.save({ version: 9, totalScore: 100 });

        expect(service.load()).toEqual(defaults());
        expect(handleErrorMock).toHaveBeenCalledTimes(1);
        expect(handleErrorMock.mock.calls[0][0]).toBeInstanceOf(CorruptedDataError);
    });

    test('повреждённые данные → сброс без исключения', () => {
        vi.spyOn(repo, 'load').mockImplementation(() => {
            throw new CorruptedDataError('Данные повреждены.');
        });

        expect(service.getTrainerIndex()).toBe(-1);
        expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });

    test('недоступное хранилище → работа без сохранения', () => {
        handleErrorMock.mockReturnValue({ action: 'memory', userMessage: 'memory' });
        vi.spyOn(repo, 'load').mockImplementation(() => {
            throw new StorageUnavailableError('Нет хранилища.');
        });

        expect(service.load()).toEqual(defaults());
        expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });

    test('неизвестная ошибка загрузки пробрасывается дальше', () => {
        vi.spyOn(repo, 'load').mockImplementation(() => {
            throw new Error('boom');
        });

        expect(() => service.load()).toThrow('boom');
        expect(handleErrorMock).not.toHaveBeenCalled();
    });
});

describe('StatsService — счёт и позиция текущей карты', () => {
    let repo: MemoryRepository;
    let service: StatsService;

    beforeEach(() => {
        repo = new MemoryRepository();
        service = new StatsService(repo);
        handleErrorMock.mockClear();
        handleErrorMock.mockReturnValue({ action: 'reset', userMessage: 'reset' });
    });

    test('saveTrainerIndex(7) → getTrainerIndex() === 7 внутри maps.math', () => {
        service.saveTrainerIndex(7);

        expect(service.getTrainerIndex()).toBe(7);
        expect(repo.load()).toEqual({
            version: 3,
            currentMap: 'math',
            maps: { math: { totalScore: 0, currentTrainerIndex: 7 } }
        });
        expect((repo.load() as Stats).maps.math).toBeDefined();
    });

    test('updateAfterRound прибавляет счёт и не теряет индекс', () => {
        service.saveTrainerIndex(7);
        service.updateAfterRound(50);

        expect((repo.load() as Stats).maps.math.totalScore).toBe(50);
        expect((repo.load() as Stats).maps.math.currentTrainerIndex).toBe(7);
        expect(service.getTotalScore()).toBe(50);
    });

    test('счёт другой карты не меняется', () => {
        withEnglish(() => {
            service.updateAfterRound(20);
            expect(service.switchMap('english')).toBe(true);

            service.updateAfterRound(10);

            expect(service.getTotalScore()).toBe(10);
            expect((repo.load() as Stats).maps.math.totalScore).toBe(20);
        });
    });

    test('позиция другой карты не меняется', () => {
        withEnglish(() => {
            service.saveTrainerIndex(4);
            service.switchMap('english');
            service.saveTrainerIndex(2);

            expect((repo.load() as Stats).maps.math.currentTrainerIndex).toBe(4);
            expect((repo.load() as Stats).maps.english.currentTrainerIndex).toBe(2);
        });
    });

    test('getCurrentMap() возвращает сохранённую карту', () => {
        expect(service.getCurrentMap()).toBe('math');

        repo.save({ version: 3, currentMap: 'english', maps: {} });
        expect(service.getCurrentMap()).toBe('math');
    });

    test('getCurrentMap() возвращает известную карту после перезагрузки', () => {
        withEnglish(() => {
            repo.save({
                version: 3,
                currentMap: 'english',
                maps: {
                    math: { totalScore: 5, currentTrainerIndex: 1 },
                    english: { totalScore: 8, currentTrainerIndex: 2 }
                }
            });

            expect(service.getCurrentMap()).toBe('english');
            expect(service.getTotalScore()).toBe(8);
            expect(service.getTrainerIndex()).toBe(2);
        });
    });

    test('reset() возвращает значения по умолчанию', () => {
        service.saveTrainerIndex(7);
        service.updateAfterRound(50);
        service.reset();

        expect(repo.load()).toEqual(defaults());
    });

    test('save() пишет данные (write-ahead)', () => {
        service.save({
            version: 3,
            currentMap: 'math',
            maps: { math: { totalScore: 10, currentTrainerIndex: 2 } }
        });

        expect(service.getTotalScore()).toBe(10);
        expect(service.getTrainerIndex()).toBe(2);
    });

    test('ошибка записи не ломает приложение', () => {
        handleErrorMock.mockReturnValue({ action: 'skip', userMessage: 'skip' });
        vi.spyOn(repo, 'save').mockImplementation(() => {
            throw new QuotaExceededError('Переполнено.');
        });

        expect(() => service.saveTrainerIndex(3)).not.toThrow();
        expect(handleErrorMock).toHaveBeenCalledWith(expect.any(QuotaExceededError), 'StatsService.save');
    });
});

describe('StatsService — switchMap', () => {
    let repo: MemoryRepository;
    let service: StatsService;

    beforeEach(() => {
        repo = new MemoryRepository();
        service = new StatsService(repo);
        handleErrorMock.mockClear();
    });

    test('выбор той же карты → false и запись не выполняется', () => {
        const save = vi.spyOn(repo, 'save');

        expect(service.switchMap('math')).toBe(false);
        expect(save).not.toHaveBeenCalled();
    });

    test('неизвестная карта → false без записи', () => {
        const save = vi.spyOn(repo, 'save');

        expect(service.switchMap('chemistry')).toBe(false);
        expect(save).not.toHaveBeenCalled();
    });

    test('выбор другой карты → true, позиция новой карты −1', () => {
        withEnglish(() => {
            expect(service.switchMap('english')).toBe(true);

            expect(service.getCurrentMap()).toBe('english');
            expect(service.getTrainerIndex()).toBe(-1);
            expect((repo.load() as Stats).currentMap).toBe('english');
        });
    });

    test('счёт прежней карты сохраняется при переключении', () => {
        withEnglish(() => {
            service.updateAfterRound(40);
            service.switchMap('english');

            expect((repo.load() as Stats).maps.math.totalScore).toBe(40);
            expect(service.getTotalScore()).toBe(0);
        });
    });

    test('позиция прежней карты сохраняется при переключении', () => {
        withEnglish(() => {
            service.saveTrainerIndex(4);
            service.switchMap('english');

            expect((repo.load() as Stats).maps.math.currentTrainerIndex).toBe(4);
        });
    });

    test('возврат на прежнюю карту сбрасывает её позицию, но не счёт', () => {
        withEnglish(() => {
            service.updateAfterRound(40);
            service.saveTrainerIndex(4);
            service.switchMap('english');

            expect(service.switchMap('math')).toBe(true);

            expect(service.getTotalScore()).toBe(40);
            expect(service.getTrainerIndex()).toBe(-1);
        });
    });
});
