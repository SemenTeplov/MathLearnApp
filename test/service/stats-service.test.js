// Сервис статистики: Stats v3, счёт и позиция по картам, переключение карты
const { readSource } = require('../ts-source');

eval(readSource('./js/errors/custom-errors.ts') +
    '\nglobal.StorageError = StorageError;' +
    '\nglobal.CorruptedDataError = CorruptedDataError;' +
    '\nglobal.StorageUnavailableError = StorageUnavailableError;' +
    '\nglobal.QuotaExceededError = QuotaExceededError;' +
    '\nglobal.SessionError = SessionError;');

eval(readSource('./js/errors/error-handler.ts') + '\nglobal.ErrorHandler = ErrorHandler;');
eval(readSource('./js/model/map-catalog.js') + '\nglobal.MapCatalog = MapCatalog;');
eval(readSource('./js/model/stats-schema.js') + '\nglobal.StatsSchema = StatsSchema;');
eval(readSource('./js/service/stats-service.ts') + '\nglobal.StatsService = StatsService;');

/**
 * Простой репозиторий в памяти для тестов.
 * @param {object|null} initial
 * @returns {object}
 */
function makeRepo(initial) {
    return {
        data: initial === undefined ? null : initial,
        save(value) {
            this.data = value;
        },
        load() {
            return this.data;
        }
    };
}

const ENGLISH = { id: 'english', title: 'Английский', zones: [] };

/** Добавляет временную вторую карту каталога на время теста. */
function withEnglish(fn) {
    CONFIG.MAPS.push(ENGLISH);
    try {
        fn();
    } finally {
        CONFIG.MAPS.pop();
    }
}

/** Ожидаемые значения по умолчанию для одной карты. */
const emptyMap = { totalScore: 0, currentTrainerIndex: -1 };

describe('StatsService.load', () => {
    let repo;

    beforeEach(() => {
        repo = makeRepo();
        StatsService.init(repo);
    });

    test('без данных возвращает Stats v3 с картой math', () => {
        expect(StatsService.load()).toEqual({
            version: 3,
            currentMap: 'math',
            maps: { math: emptyMap }
        });
    });

    test('мигрирует запись версии 1 в версию 3, сохраняя счёт', () => {
        repo.data = { version: 1, totalScore: 30 };

        expect(StatsService.load()).toEqual({
            version: 3,
            currentMap: 'math',
            maps: { math: { totalScore: 30, currentTrainerIndex: -1 } }
        });
    });

    test('мигрирует запись версии 2, сохраняя счёт и позицию', () => {
        repo.data = { version: 2, totalScore: 5, currentTrainerIndex: 7 };

        const stats = StatsService.load();

        expect(stats.version).toBe(3);
        expect(stats.maps.math).toEqual({ totalScore: 5, currentTrainerIndex: 7 });
        expect(stats.totalScore).toBeUndefined();
        expect(stats.currentTrainerIndex).toBeUndefined();
    });

    test('дописывает отсутствующий индекс в записи версии 2', () => {
        repo.data = { version: 2, totalScore: 5 };

        expect(StatsService.getTrainerIndex()).toBe(-1);
    });

    test('неизвестная карта в сохранении → math, данные химии не теряются', () => {
        repo.data = {
            version: 3,
            currentMap: 'chemistry',
            maps: { chemistry: { totalScore: 9, currentTrainerIndex: 2 } }
        };

        const stats = StatsService.load();

        expect(stats.currentMap).toBe('math');
        expect(stats.maps.chemistry.totalScore).toBe(9);
        expect(StatsService.getTotalScore()).toBe(0);
    });

    test('частичные данные карты дополняются', () => {
        repo.data = { version: 3, currentMap: 'math', maps: { math: { totalScore: 4 } } };

        expect(StatsService.load().maps.math).toEqual({ totalScore: 4, currentTrainerIndex: -1 });
    });

    test('запись новее текущей версии → сброс через ErrorHandler', () => {
        const handle = vi.spyOn(ErrorHandler, 'handle').mockReturnValue({
            action: 'reset',
            userMessage: 'reset'
        });
        repo.data = { version: 9, totalScore: 100 };

        expect(StatsService.load()).toEqual({
            version: 3,
            currentMap: 'math',
            maps: { math: emptyMap }
        });
        expect(handle).toHaveBeenCalled();
        expect(handle.mock.calls[0][0]).toBeInstanceOf(CorruptedDataError);
        handle.mockRestore();
    });

    test('повреждённые данные → сброс без исключения', () => {
        const handle = vi.spyOn(ErrorHandler, 'handle').mockReturnValue({
            action: 'reset',
            userMessage: 'reset'
        });
        repo.load = () => {
            throw new CorruptedDataError('Данные повреждены.');
        };

        expect(StatsService.getTrainerIndex()).toBe(-1);
        expect(handle).toHaveBeenCalled();
        handle.mockRestore();
    });

    test('недоступное хранилище → работа без сохранения', () => {
        const handle = vi.spyOn(ErrorHandler, 'handle').mockReturnValue({
            action: 'memory',
            userMessage: 'memory'
        });
        repo.load = () => {
            throw new StorageUnavailableError('Нет хранилища.');
        };

        expect(StatsService.load()).toEqual({
            version: 3,
            currentMap: 'math',
            maps: { math: emptyMap }
        });
        expect(handle).toHaveBeenCalled();
        handle.mockRestore();
    });
});

describe('StatsService — счёт и позиция текущей карты', () => {
    let repo;

    beforeEach(() => {
        repo = makeRepo();
        StatsService.init(repo);
    });

    test('saveTrainerIndex(7) → getTrainerIndex() === 7 внутри maps.math', () => {
        StatsService.saveTrainerIndex(7);

        expect(StatsService.getTrainerIndex()).toBe(7);
        expect(repo.data).toEqual({
            version: 3,
            currentMap: 'math',
            maps: { math: { totalScore: 0, currentTrainerIndex: 7 } }
        });
        expect(repo.data.currentTrainerIndex).toBeUndefined();
    });

    test('updateAfterRound прибавляет счёт и не теряет индекс', () => {
        StatsService.saveTrainerIndex(7);
        StatsService.updateAfterRound(50);

        expect(repo.data.maps.math.totalScore).toBe(50);
        expect(repo.data.maps.math.currentTrainerIndex).toBe(7);
        expect(StatsService.getTotalScore()).toBe(50);
    });

    test('счёт другой карты не меняется', () => {
        withEnglish(() => {
            StatsService.updateAfterRound(20);
            expect(StatsService.switchMap('english')).toBe(true);

            StatsService.updateAfterRound(10);

            expect(StatsService.getTotalScore()).toBe(10);
            expect(repo.data.maps.math.totalScore).toBe(20);
        });
    });

    test('позиция другой карты не меняется', () => {
        withEnglish(() => {
            StatsService.saveTrainerIndex(4);
            StatsService.switchMap('english');
            StatsService.saveTrainerIndex(2);

            expect(repo.data.maps.math.currentTrainerIndex).toBe(4);
            expect(repo.data.maps.english.currentTrainerIndex).toBe(2);
        });
    });

    test('getCurrentMap() возвращает сохранённую карту', () => {
        expect(StatsService.getCurrentMap()).toBe('math');

        repo.data = { version: 3, currentMap: 'english', maps: {} };
        expect(StatsService.getCurrentMap()).toBe('math');
    });

    test('reset() возвращает значения по умолчанию', () => {
        StatsService.saveTrainerIndex(7);
        StatsService.updateAfterRound(50);
        StatsService.reset();

        expect(repo.data).toEqual({
            version: 3,
            currentMap: 'math',
            maps: { math: emptyMap }
        });
    });

    test('save() пишет данные (write-ahead)', () => {
        StatsService.save({
            version: 3,
            currentMap: 'math',
            maps: { math: { totalScore: 10, currentTrainerIndex: 2 } }
        });

        expect(StatsService.getTotalScore()).toBe(10);
        expect(StatsService.getTrainerIndex()).toBe(2);
    });

    test('ошибка записи не ломает приложение', () => {
        const handle = vi.spyOn(ErrorHandler, 'handle').mockReturnValue({
            action: 'skip',
            userMessage: 'skip'
        });
        repo.save = () => {
            throw new QuotaExceededError('Переполнено.');
        };

        expect(() => StatsService.saveTrainerIndex(3)).not.toThrow();
        expect(handle).toHaveBeenCalled();
        handle.mockRestore();
    });
});

describe('StatsService — switchMap', () => {
    let repo;

    beforeEach(() => {
        repo = makeRepo();
        StatsService.init(repo);
    });

    test('выбор той же карты → false и запись не выполняется', () => {
        const save = vi.spyOn(repo, 'save');
        const before = JSON.stringify(repo.data);

        expect(StatsService.switchMap('math')).toBe(false);
        expect(save).not.toHaveBeenCalled();
        expect(JSON.stringify(repo.data)).toBe(before);
        save.mockRestore();
    });

    test('неизвестная карта → false без записи', () => {
        const save = vi.spyOn(repo, 'save');

        expect(StatsService.switchMap('chemistry')).toBe(false);
        expect(save).not.toHaveBeenCalled();
        save.mockRestore();
    });

    test('выбор другой карты → true, позиция новой карты −1', () => {
        withEnglish(() => {
            expect(StatsService.switchMap('english')).toBe(true);

            expect(StatsService.getCurrentMap()).toBe('english');
            expect(StatsService.getTrainerIndex()).toBe(-1);
            expect(repo.data.currentMap).toBe('english');
        });
    });

    test('счёт прежней карты сохраняется при переключении', () => {
        withEnglish(() => {
            StatsService.updateAfterRound(40);
            StatsService.switchMap('english');

            expect(repo.data.maps.math.totalScore).toBe(40);
            expect(StatsService.getTotalScore()).toBe(0);
        });
    });

    test('позиция прежней карты сохраняется при переключении', () => {
        withEnglish(() => {
            StatsService.saveTrainerIndex(4);
            StatsService.switchMap('english');

            expect(repo.data.maps.math.currentTrainerIndex).toBe(4);
        });
    });

    test('возврат на прежнюю карту сбрасывает её позицию, но не счёт', () => {
        withEnglish(() => {
            StatsService.updateAfterRound(40);
            StatsService.saveTrainerIndex(4);
            StatsService.switchMap('english');

            expect(StatsService.switchMap('math')).toBe(true);

            expect(StatsService.getTotalScore()).toBe(40);
            expect(StatsService.getTrainerIndex()).toBe(-1);
        });
    });

    test('текущая карта восстанавливается после перезагрузки', () => {
        withEnglish(() => {
            repo.data = {
                version: 3,
                currentMap: 'english',
                maps: {
                    math: { totalScore: 5, currentTrainerIndex: 1 },
                    english: { totalScore: 8, currentTrainerIndex: 2 }
                }
            };

            expect(StatsService.getCurrentMap()).toBe('english');
            expect(StatsService.getTotalScore()).toBe(8);
            expect(StatsService.getTrainerIndex()).toBe(2);
        });
    });
});
