// Боевая схема Stats v3: значения по умолчанию, миграции, доступ по текущей карте.

import { describe, expect, test } from 'vitest';
import { CONFIG } from '../../src/core/config';
import { CorruptedDataError } from '../../src/core/errors';
import { StatsSchema } from '../../src/core/stats-schema';
import type { GameMap, Stats } from '../../src/core/types';

/** Добавляет временную вторую карту и убирает её после теста. */
function withMap(map: GameMap, fn: () => void): void {
    CONFIG.MAPS.push(map);
    try {
        fn();
    } finally {
        CONFIG.MAPS.pop();
    }
}

/** Плоские поля версий 1–2, которых нет в актуальном Stats. */
type LegacyStats = Stats & { totalScore?: number; currentTrainerIndex?: number };

describe('StatsSchema — значения по умолчанию', () => {
    test('emptyMap() — нулевой счёт и стартовая позиция', () => {
        expect(StatsSchema.emptyMap()).toEqual({ totalScore: 0, currentTrainerIndex: -1 });
    });

    test('defaults() — версия 3, карта math, данные по картам', () => {
        expect(StatsSchema.defaults()).toEqual({
            version: 3,
            currentMap: 'math',
            maps: { math: { totalScore: 0, currentTrainerIndex: -1 } }
        });
    });

    test('defaults() включает все карты каталога', () => {
        withMap({ id: 'english', title: 'Английский', zones: [] }, () => {
            const stats = StatsSchema.defaults();

            expect(Object.keys(stats.maps)).toEqual(['math', 'english']);
            expect(stats.maps.english).toEqual({ totalScore: 0, currentTrainerIndex: -1 });
        });
    });

    test('defaults() не разделяет объекты карт между вызовами', () => {
        const first = StatsSchema.defaults();
        first.maps.math.totalScore = 99;

        expect(StatsSchema.defaults().maps.math.totalScore).toBe(0);
    });

    test('entry() возвращает данные текущей карты (T25)', () => {
        const stats = StatsSchema.defaults();
        stats.maps.math.totalScore = 42;

        expect(StatsSchema.entry(stats)).toBe(stats.maps.math);
        expect(StatsSchema.entry(stats).totalScore).toBe(42);
    });
});

describe('StatsSchema — миграции', () => {
    test('без данных → v3 по умолчанию', () => {
        expect(StatsSchema.migrate({})).toEqual(StatsSchema.defaults());
        expect(StatsSchema.migrate(null)).toEqual(StatsSchema.defaults());
    });

    test('v1 → v3 сохраняет счёт в карте math', () => {
        const stats = StatsSchema.migrate({ version: 1, totalScore: 30 });

        expect(stats.version).toBe(3);
        expect(stats.currentMap).toBe('math');
        expect(stats.maps.math).toEqual({ totalScore: 30, currentTrainerIndex: -1 });
    });

    test('v2 → v3 сохраняет счёт и позицию', () => {
        const stats = StatsSchema.migrate({ version: 2, totalScore: 5, currentTrainerIndex: 7 });

        expect(stats.maps.math).toEqual({ totalScore: 5, currentTrainerIndex: 7 });
    });

    test('v2 без индекса получает −1', () => {
        const stats = StatsSchema.migrate({ version: 2, totalScore: 5 });

        expect(stats.maps.math.currentTrainerIndex).toBe(-1);
    });

    test('после миграции плоских полей не остаётся (Z14)', () => {
        const stats = StatsSchema.migrate({ version: 2, totalScore: 5, currentTrainerIndex: 7 });
        const legacy = stats as LegacyStats;

        expect(legacy.totalScore).toBeUndefined();
        expect(legacy.currentTrainerIndex).toBeUndefined();
    });

    test('неизвестная currentMap → math, данные карты сохраняются', () => {
        const stats = StatsSchema.migrate({
            version: 3,
            currentMap: 'chemistry',
            maps: { chemistry: { totalScore: 9, currentTrainerIndex: 2 } }
        });

        expect(stats.currentMap).toBe('math');
        expect(stats.maps.chemistry).toEqual({ totalScore: 9, currentTrainerIndex: 2 });
        expect(stats.maps.math).toEqual({ totalScore: 0, currentTrainerIndex: -1 });
    });

    test('версия новее текущей → CorruptedDataError', () => {
        expect(() => StatsSchema.migrate({ version: 9, totalScore: 100 })).toThrow(CorruptedDataError);
    });

    test('повторная миграция идемпотентна', () => {
        const once = StatsSchema.migrate({ version: 2, totalScore: 10, currentTrainerIndex: 3 });
        const twice = StatsSchema.migrate(once);

        expect(twice).toEqual(once);
    });
});

describe('StatsSchema — ensureMaps', () => {
    test('добавляет отсутствующую карту каталога', () => {
        const stats = StatsSchema.ensureMaps({ version: 3, currentMap: 'math', maps: {} });

        expect(stats.maps.math).toEqual({ totalScore: 0, currentTrainerIndex: -1 });
    });

    test('дополняет недостающие поля карты', () => {
        const stats = StatsSchema.ensureMaps({
            version: 3,
            currentMap: 'math',
            maps: { math: { totalScore: 5 } as { totalScore: number; currentTrainerIndex: number } }
        });

        expect(stats.maps.math).toEqual({ totalScore: 5, currentTrainerIndex: -1 });
    });

    test('сохраняет карты вне каталога и чинит currentMap', () => {
        const stats = StatsSchema.ensureMaps({
            version: 3,
            currentMap: 'chemistry',
            maps: { chemistry: { totalScore: 1, currentTrainerIndex: 0 } }
        });

        expect(stats.currentMap).toBe('math');
        expect(stats.maps.chemistry.totalScore).toBe(1);
    });

    test('чинит отсутствующий объект maps', () => {
        const stats = StatsSchema.ensureMaps({
            version: 3,
            currentMap: 'math'
        } as unknown as Stats);

        expect(stats.maps.math).toEqual({ totalScore: 0, currentTrainerIndex: -1 });
    });
});
