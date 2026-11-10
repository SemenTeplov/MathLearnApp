// Боевой CONFIG: каталог карт, версия формата и неизменность настроек.

import { describe, expect, test } from 'vitest';
import { CONFIG } from '../../src/core/config';

describe('CONFIG — каталог карт (1.5.0)', () => {
    test('версия формата данных — 3', () => {
        expect(CONFIG.VERSION).toBe(3);
    });

    test('карта по умолчанию — математика', () => {
        expect(CONFIG.DEFAULT_MAP).toBe('math');
    });

    test('каталог содержит карту «Математика»', () => {
        expect(CONFIG.MAPS).toHaveLength(1);
        expect(CONFIG.MAPS[0].id).toBe('math');
        expect(CONFIG.MAPS[0].title).toBe('Математика');
    });

    test('CONFIG.ZONES — та же ссылка, что и зоны карты по умолчанию', () => {
        expect(CONFIG.MAPS[0].zones).toBe(CONFIG.ZONES);
        expect(CONFIG.ZONES).toHaveLength(3);
    });

    test('в каталоге 3 зоны по 5 тренажёров', () => {
        expect(CONFIG.ZONES.map((zone) => zone.id)).toEqual(['addition', 'subtraction', 'multiplication']);
        CONFIG.ZONES.forEach((zone) => {
            expect(zone.trainersCount).toBe(5);
        });
    });

    test('остальные настройки не изменились', () => {
        expect(CONFIG.TOTAL_QUESTIONS).toBe(10);
        expect(CONFIG.MAX_LIVES).toBe(3);
        expect(CONFIG.START_DIFFICULTY).toBe('easy');
        expect(CONFIG.POINTS_BASE).toBe(10);
        expect(CONFIG.RATINGS).toHaveLength(4);
        expect(CONFIG.RATINGS.map((rating) => rating.min)).toEqual([100, 70, 40, 0]);
        expect(CONFIG.GAMEOVER.icon).toBe('💔');
        expect(CONFIG.STORAGE_PREFIX).toBe('ml_');
    });
});
