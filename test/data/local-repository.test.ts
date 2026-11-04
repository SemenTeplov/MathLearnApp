// LocalStorageRepository: round-trip, повреждённые данные, квота и недоступность.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
    CorruptedDataError,
    QuotaExceededError,
    StorageUnavailableError
} from '../../src/core/errors';
import { LocalStorageRepository } from '../../src/data/local-repository';

const KEY = 'ml_repo_test';

describe('LocalStorageRepository', () => {
    let repo: LocalStorageRepository;

    beforeEach(() => {
        localStorage.clear();
        repo = new LocalStorageRepository(KEY);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    test('round-trip: save и load возвращают те же данные', () => {
        const data = { version: 3, currentMap: 'math', maps: { math: { totalScore: 10 } } };

        repo.save(data);

        expect(repo.load()).toEqual(data);
    });

    test('load без сохранённого ключа возвращает null', () => {
        expect(repo.load()).toBeNull();
    });

    test('повреждённый JSON → CorruptedDataError', () => {
        localStorage.setItem(KEY, '{not json');

        expect(() => repo.load()).toThrow(CorruptedDataError);
    });

    test.each([
        ['по name', Object.assign(new Error('quota'), { name: 'QuotaExceededError' })],
        ['по code 22', Object.assign(new Error('quota'), { code: 22 })]
    ])('превышение квоты %s → QuotaExceededError', (_label, thrown) => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw thrown;
        });

        expect(() => repo.save({})).toThrow(QuotaExceededError);
    });

    test('прочий throw при save → StorageUnavailableError', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('denied');
        });

        expect(() => repo.save({})).toThrow(StorageUnavailableError);
    });

    test('throw при getItem → StorageUnavailableError', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('denied');
        });

        expect(() => repo.load()).toThrow(StorageUnavailableError);
    });

    test('clear удаляет ключ', () => {
        repo.save({ a: 1 });

        repo.clear();

        expect(repo.load()).toBeNull();
    });
});
