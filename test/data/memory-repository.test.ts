// MemoryRepository: save/load в памяти, сериализация как в localStorage (T84.4).

import { beforeEach, describe, expect, test } from 'vitest';
import { MemoryRepository } from '../support/memory-repository';

describe('MemoryRepository', () => {
    let repo: MemoryRepository;

    beforeEach(() => {
        repo = new MemoryRepository();
    });

    test('до записи load возвращает null', () => {
        expect(repo.load()).toBeNull();
    });

    test('save и load возвращают равные данные', () => {
        const data = { totalScore: 5 };

        repo.save(data);

        expect(repo.load()).toEqual(data);
    });

    test('load отдаёт копию: мутация не меняет сохранённое', () => {
        repo.save({ totalScore: 5, nested: { index: 1 } });

        const loaded = repo.load() as { totalScore: number; nested: { index: number } };
        loaded.totalScore = 99;
        loaded.nested.index = 7;

        expect(repo.load()).toEqual({ totalScore: 5, nested: { index: 1 } });
    });

    test('save копирует данные: мутация исходного объекта не видна', () => {
        const data = { totalScore: 5 };
        repo.save(data);

        data.totalScore = 99;

        expect(repo.load()).toEqual({ totalScore: 5 });
    });

    test('clear обнуляет данные', () => {
        repo.save({ totalScore: 5 });

        repo.clear();

        expect(repo.load()).toBeNull();
    });
});
