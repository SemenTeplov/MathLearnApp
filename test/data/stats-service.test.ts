// StatsService через MemoryRepository: Stats v3, счёт, позиция, switchMap и действия
// ошибок — сообщения в шине, провал записи и режим памяти (TR-71, TR-72, TR-78).

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { STORAGE_ERROR_TITLE } from '../../src/core/error-reporting';
import { handleError } from '../../src/core/error-handler';
import { CorruptedDataError, QuotaExceededError, StorageUnavailableError } from '../../src/core/errors';
import { StatsService } from '../../src/data/stats-service';
import { MemoryRepository } from '../support/memory-repository';
import { defaults, failsOn, makeService, mapStats, read, rethrowing, withEnglish } from '../support/stats-fixtures';

vi.mock('../../src/core/error-handler', () => ({
    handleError: vi.fn(() => ({ action: 'reset', userMessage: 'reset' }))
}));

const handleErrorMock = vi.mocked(handleError);
let repo: MemoryRepository;
let stats: StatsService;
let received: string[][];
beforeEach(() => {
    handleErrorMock.mockClear();
    handleErrorMock.mockReturnValue({ action: 'reset', userMessage: 'reset' });
    ({ repo, stats, received } = makeService());
});

describe('StatsService.load', () => {
    test('создаётся через new StatsService(new MemoryRepository())', () => {
        expect(new StatsService(new MemoryRepository()).load()).toEqual(defaults());
    });
    test('без данных возвращает Stats v3 с картой math', () => expect(stats.load()).toEqual(defaults()));
    test('мигрирует запись версии 1 в версию 3, сохраняя счёт', () => {
        repo.save({ version: 1, totalScore: 30 });
        expect(stats.load()).toEqual(mapStats(30));
    });
    test('мигрирует запись версии 2, сохраняя счёт и позицию', () => {
        repo.save({ version: 2, totalScore: 5, currentTrainerIndex: 7 });
        const loaded = stats.load();
        expect(Object.keys(loaded).sort()).toEqual(['currentMap', 'maps', 'version']);
        expect(loaded.maps.math).toEqual({ totalScore: 5, currentTrainerIndex: 7 });
        repo.save({ version: 2, totalScore: 5 });
        expect(stats.getTrainerIndex()).toBe(-1);
    });
    test('неизвестная карта в сохранении → math, данные химии не теряются', () => {
        repo.save({
            version: 3,
            currentMap: 'chemistry',
            maps: { chemistry: { totalScore: 9, currentTrainerIndex: 2 } }
        });
        expect([stats.getCurrentMap(), stats.load().maps.chemistry.totalScore, stats.getTotalScore()]).toEqual([
            'math',
            9,
            0
        ]);
    });
    test('частичные данные карты дополняются', () => {
        repo.save({ version: 3, currentMap: 'math', maps: { math: { totalScore: 4 } } });
        expect(stats.load().maps.math).toEqual({ totalScore: 4, currentTrainerIndex: -1 });
    });
    test('запись новее текущей версии → сброс через handleError', () => {
        repo.save({ version: 9, totalScore: 100 });
        expect(stats.load()).toEqual(defaults());
        expect(handleErrorMock).toHaveBeenCalledTimes(1);
        expect(handleErrorMock.mock.calls[0][0]).toBeInstanceOf(CorruptedDataError);
    });
    test('повреждённые данные → сброс без исключения', () => {
        failsOn(repo, 'load', new CorruptedDataError('Данные повреждены.'));
        expect(stats.getTrainerIndex()).toBe(-1);
        expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });
    test('недоступное хранилище → работа без сохранения', () => {
        handleErrorMock.mockReturnValue({ action: 'memory', userMessage: 'memory' });
        failsOn(repo, 'load', new StorageUnavailableError('Нет хранилища.'));
        expect(stats.load()).toEqual(defaults());
        expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });
    test('неизвестная ошибка загрузки пробрасывается дальше', () => {
        rethrowing();
        failsOn(repo, 'load', new Error('boom'));
        expect(() => stats.load()).toThrow('boom');
        expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });
});

describe('StatsService — счёт, позиция и switchMap', () => {
    test('saveTrainerIndex(7) → getTrainerIndex() === 7 внутри maps.math', () => {
        expect(stats.saveTrainerIndex(7)).toBe(true);
        expect([stats.getTrainerIndex(), read(repo)]).toEqual([7, mapStats(0, 7)]);
    });
    test('updateAfterRound прибавляет счёт и не теряет индекс', () => {
        stats.saveTrainerIndex(7);
        expect(stats.updateAfterRound(50)).toBe(true);
        expect([stats.getTotalScore(), read(repo).maps.math]).toEqual([50, { totalScore: 50, currentTrainerIndex: 7 }]);
    });
    test('счёт другой карты не меняется', () =>
        withEnglish(() => {
            stats.updateAfterRound(20);
            expect(stats.switchMap('english')).toBe(true);
            stats.updateAfterRound(10);
            expect([stats.getTotalScore(), read(repo).maps.math.totalScore]).toEqual([10, 20]);
        }));
    test('позиция другой карты не меняется', () =>
        withEnglish(() => {
            stats.saveTrainerIndex(4);
            stats.switchMap('english');
            stats.saveTrainerIndex(2);
            expect([read(repo).maps.math.currentTrainerIndex, read(repo).maps.english.currentTrainerIndex]).toEqual([
                4, 2
            ]);
        }));
    test('getCurrentMap() возвращает сохранённую карту', () => {
        expect(stats.getCurrentMap()).toBe('math');
        repo.save({ version: 3, currentMap: 'english', maps: {} });
        expect(stats.getCurrentMap()).toBe('math');
    });
    test('getCurrentMap() возвращает известную карту после перезагрузки', () =>
        withEnglish(() => {
            repo.save({
                version: 3,
                currentMap: 'english',
                maps: {
                    math: { totalScore: 5, currentTrainerIndex: 1 },
                    english: { totalScore: 8, currentTrainerIndex: 2 }
                }
            });
            expect([stats.getCurrentMap(), stats.getTotalScore(), stats.getTrainerIndex()]).toEqual(['english', 8, 2]);
        }));
    test('reset() возвращает значения по умолчанию', () => {
        stats.saveTrainerIndex(7);
        stats.updateAfterRound(50);
        expect([stats.reset(), read(repo)]).toEqual([true, defaults()]);
    });
    test('save() пишет данные (write-ahead)', () => {
        stats.save(mapStats(10, 2));
        expect([stats.getTotalScore(), stats.getTrainerIndex()]).toEqual([10, 2]);
    });
    test.each(['math', 'chemistry'])('switchMap(«%s») → false и запись не выполняется', (mapId) => {
        const save = vi.spyOn(repo, 'save');
        expect(stats.switchMap(mapId)).toBe(false);
        expect(save).not.toHaveBeenCalled();
    });
    test('выбор другой карты → true, позиция новой карты −1', () =>
        withEnglish(() => {
            expect(stats.switchMap('english')).toBe(true);
            expect([stats.load().currentMap, stats.getTrainerIndex(), read(repo).currentMap]).toEqual([
                'english',
                -1,
                'english'
            ]);
        }));
    test('счёт и позиция прежней карты сохраняются при переключении', () =>
        withEnglish(() => {
            stats.updateAfterRound(40);
            stats.saveTrainerIndex(4);
            stats.switchMap('english');
            const maps = read(repo).maps;
            expect([maps.math.totalScore, stats.getTotalScore(), maps.math.currentTrainerIndex]).toEqual([40, 0, 4]);
        }));
    test('возврат на прежнюю карту сбрасывает её позицию, но не счёт', () =>
        withEnglish(() => {
            stats.updateAfterRound(40);
            stats.saveTrainerIndex(4);
            stats.switchMap('english');
            expect(stats.switchMap('math')).toBe(true);
            expect([stats.getTotalScore(), stats.getTrainerIndex()]).toEqual([40, -1]);
        }));
});

describe('StatsService — действия ошибок применяются', () => {
    test('reset: сообщение в шине, clear() и счёт 0', () => {
        const message = 'Данные повреждены. Счёт сброшен.';
        handleErrorMock.mockReturnValue({ action: 'reset', userMessage: message });
        repo.save({ version: 9, totalScore: 100 });
        const clear = vi.spyOn(repo, 'clear');
        expect(stats.load()).toEqual(defaults());
        expect(clear).toHaveBeenCalledTimes(1);
        expect(stats.getTotalScore()).toBe(0);
        expect(received).toEqual([[STORAGE_ERROR_TITLE, message]]);
    });
    test('memory: чтение и запись идут в память, основной репозиторий больше не вызывается', () => {
        handleErrorMock.mockReturnValue({ action: 'memory', userMessage: 'Хранилище недоступно.' });
        failsOn(repo, 'load', new StorageUnavailableError('Нет хранилища.'));
        const save = vi.spyOn(repo, 'save');
        expect(stats.load()).toEqual(defaults());
        const calls = vi.mocked(repo.load).mock.calls.length;
        expect(stats.updateAfterRound(30)).toBe(true);
        expect(stats.getTotalScore()).toBe(30);
        expect(vi.mocked(repo.load).mock.calls.length).toBe(calls);
        expect(save).not.toHaveBeenCalled();
        expect(received).toEqual([[STORAGE_ERROR_TITLE, 'Хранилище недоступно.']]);
    });
    test('skip: ошибка записи не ломает приложение, счёт 0 и сообщение в шине', () => {
        handleErrorMock.mockReturnValue({ action: 'skip', userMessage: 'Хранилище заполнено.' });
        failsOn(repo, 'save', new QuotaExceededError('Переполнено.'));
        expect(stats.updateAfterRound(50)).toBe(false);
        expect(stats.getTotalScore()).toBe(0);
        expect(handleErrorMock).toHaveBeenCalledWith(expect.any(QuotaExceededError), 'StatsService.save');
        expect(received).toEqual([[STORAGE_ERROR_TITLE, 'Хранилище заполнено.']]);
    });
});
