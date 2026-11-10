// StatsService: write-back миграции, лог ступени один раз и дедупликация сообщений
// (A79/A89/T81, TR-84). Репозиторий сериализует данные, как localStorage.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ErrorBus } from '../../src/app/error-bus';
import { CorruptedDataError, QuotaExceededError } from '../../src/core/errors';
import { STORAGE_ERROR_TITLE } from '../../src/core/error-reporting';
import { StatsService } from '../../src/data/stats-service';
import { MemoryRepository } from '../support/memory-repository';
import { failsOn, mapStats, read } from '../support/stats-fixtures';

let repo: MemoryRepository;
let received: string[][];
let stats: StatsService;

beforeEach(() => {
    repo = new MemoryRepository();
    received = [];
    const errors = new ErrorBus();
    errors.subscribe((title, message) => received.push([title, message]));
    stats = new StatsService(repo, errors);
});

afterEach(() => {
    vi.restoreAllMocks();
});

/** Перехватывает console.info и возвращает шпион. */
const spyLog = () => vi.spyOn(console, 'info').mockImplementation(() => {});

describe('StatsService — write-back миграции', () => {
    test('v1: три load() дают две строки лога и одну запись v3', () => {
        const info = spyLog();
        repo.save({ version: 1, totalScore: 30 });
        const save = vi.spyOn(repo, 'save');

        stats.load();
        stats.load();
        stats.load();

        expect([info.mock.calls.length, save.mock.calls.length, read(repo)]).toEqual([2, 1, mapStats(30)]);
    });

    test('после write-back следующий load() не логирует и не пишет', () => {
        const info = spyLog();
        repo.save({ version: 1, totalScore: 30 });
        stats.load();
        info.mockClear();
        const save = vi.spyOn(repo, 'save');

        expect(stats.load()).toEqual(mapStats(30));
        expect([info.mock.calls.length, save.mock.calls.length]).toEqual([0, 0]);
    });

    test('v2 — одна строка лога; актуальная v3 — ни лога, ни записи', () => {
        const info = spyLog();
        repo.save({ version: 2, totalScore: 5, currentTrainerIndex: 2 });
        stats.load();
        expect(info.mock.calls).toEqual([['[StatsSchema] миграция', 2, '→', 3]]);

        info.mockClear();
        repo.save(mapStats(10, 3));
        const save = vi.spyOn(repo, 'save');
        save.mockClear();
        stats.load();
        expect([info.mock.calls.length, save.mock.calls.length]).toEqual([0, 0]);
    });

    test('провал write-back: сообщение игроку, данные мигрированы, ступень не дублируется', () => {
        const info = spyLog();
        repo.save({ version: 1, totalScore: 30 });
        failsOn(repo, 'save', new QuotaExceededError('Переполнено.'));

        expect(stats.load()).toEqual(mapStats(30));
        expect(stats.load()).toEqual(mapStats(30));
        expect(received).toEqual([[STORAGE_ERROR_TITLE, 'Хранилище заполнено. Данные не сохранятся.']]);
        expect(info.mock.calls).toEqual([
            ['[StatsSchema] миграция', 1, '→', 2],
            ['[StatsSchema] миграция', 2, '→', 3]
        ]);
    });
});

describe('StatsService — дедупликация сообщений (A79)', () => {
    test('тот же текст без успешной записи публикуется один раз', () => {
        failsOn(repo, 'save', new QuotaExceededError('Переполнено.'));

        stats.updateAfterRound(10);
        stats.updateAfterRound(10);

        expect(received).toEqual([[STORAGE_ERROR_TITLE, 'Хранилище заполнено. Данные не сохранятся.']]);
    });

    test('другой текст публикуется всегда', () => {
        failsOn(repo, 'save', new QuotaExceededError('Переполнено.'));
        stats.updateAfterRound(10);

        vi.mocked(repo.save).mockRestore();
        failsOn(repo, 'load', new CorruptedDataError('Данные повреждены.'));
        stats.load();

        expect(received).toEqual([
            [STORAGE_ERROR_TITLE, 'Хранилище заполнено. Данные не сохранятся.'],
            [STORAGE_ERROR_TITLE, 'Данные повреждены. Счёт сброшен.']
        ]);
    });

    test('успешная запись сбрасывает память сообщений', () => {
        failsOn(repo, 'save', new QuotaExceededError('Переполнено.'));
        stats.updateAfterRound(10);
        vi.mocked(repo.save).mockRestore();

        expect(stats.updateAfterRound(10)).toBe(true);

        failsOn(repo, 'save', new QuotaExceededError('Переполнено.'));
        stats.updateAfterRound(10);
        expect(received).toHaveLength(2);
    });
});
