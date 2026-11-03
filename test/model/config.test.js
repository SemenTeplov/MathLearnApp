// Проверяем реальный js/model/config.ts и его синхронизацию с test/setup.js
const { readSource } = require('../ts-source');

eval(readSource('./js/model/config.ts') + '\nglobal.__REAL_CONFIG = CONFIG;');

const REAL = global.__REAL_CONFIG;

describe('CONFIG — каталог карт (1.5.0)', () => {
    test('версия формата данных — 3', () => {
        expect(REAL.VERSION).toBe(3);
    });

    test('карта по умолчанию — математика', () => {
        expect(REAL.DEFAULT_MAP).toBe('math');
    });

    test('каталог содержит карту «Математика»', () => {
        expect(REAL.MAPS).toHaveLength(1);
        expect(REAL.MAPS[0].id).toBe('math');
        expect(REAL.MAPS[0].title).toBe('Математика');
    });

    test('CONFIG.ZONES — та же ссылка, что и зоны карты по умолчанию', () => {
        expect(REAL.MAPS[0].zones).toBe(REAL.ZONES);
        expect(REAL.ZONES).toHaveLength(3);
    });

    test('остальные настройки не изменились', () => {
        expect(REAL.TOTAL_QUESTIONS).toBe(10);
        expect(REAL.MAX_LIVES).toBe(3);
        expect(REAL.START_DIFFICULTY).toBe('easy');
        expect(REAL.POINTS_BASE).toBe(10);
        expect(REAL.RATINGS).toHaveLength(4);
        expect(REAL.GAMEOVER.icon).toBe('💔');
        expect(REAL.STORAGE_PREFIX).toBe('ml_');
    });

    test('test/setup.js повторяет боевой CONFIG', () => {
        expect(global.CONFIG).toEqual(REAL);
    });
});
