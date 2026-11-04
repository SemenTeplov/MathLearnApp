// MemoryRepository: save/load в памяти, null до записи и clear.

import { beforeEach, describe, expect, test } from 'vitest';
import { MemoryRepository } from '../../src/data/memory-repository';

describe('MemoryRepository', () => {
    let repo: MemoryRepository;

    beforeEach(() => {
        repo = new MemoryRepository();
    });

    test('до записи load возвращает null', () => {
        expect(repo.load()).toBeNull();
    });

    test('save и load возвращают одни и те же данные', () => {
        const data = { totalScore: 5 };

        repo.save(data);

        expect(repo.load()).toBe(data);
    });

    test('clear обнуляет данные', () => {
        repo.save({ totalScore: 5 });

        repo.clear();

        expect(repo.load()).toBeNull();
    });
});
