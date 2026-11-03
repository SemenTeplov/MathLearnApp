// Загружаем чистые правила игрока
const fs = require('fs');

eval(fs.readFileSync('./js/logic/player-rules.js', 'utf8') + '\nglobal.PlayerRules = PlayerRules;');

describe('PlayerRules — константы', () => {
    test('старт — перед первым тренажёром', () => {
        expect(PlayerRules.START_INDEX).toBe(-1);
    });

    test('длительность движения 600 мс', () => {
        expect(PlayerRules.MOVE_MS).toBe(600);
    });
});

describe('PlayerRules.getAction', () => {
    test('клик на текущий → play', () => {
        expect(PlayerRules.getAction(3, 3)).toBe('play');
        expect(PlayerRules.getAction(-1, -1)).toBe('play');
    });

    test('клик на соседний вперёд/назад → move', () => {
        expect(PlayerRules.getAction(3, 4)).toBe('move');
        expect(PlayerRules.getAction(3, 2)).toBe('move');
    });

    test('клик на дальний → ignore', () => {
        expect(PlayerRules.getAction(3, 5)).toBe('ignore');
        expect(PlayerRules.getAction(3, 0)).toBe('ignore');
    });

    test('на старте доступен только первый тренажёр', () => {
        expect(PlayerRules.getAction(-1, 0)).toBe('move');
        expect(PlayerRules.getAction(-1, 1)).toBe('ignore');
        expect(PlayerRules.getAction(-1, 14)).toBe('ignore');
    });

    test('на первом тренажёре — только вперёд и игра', () => {
        expect(PlayerRules.getAction(0, 1)).toBe('move');
        expect(PlayerRules.getAction(0, 0)).toBe('play');
        expect(PlayerRules.getAction(0, 2)).toBe('ignore');
    });

    test('на последнем — только назад и игра', () => {
        expect(PlayerRules.getAction(14, 13)).toBe('move');
        expect(PlayerRules.getAction(14, 14)).toBe('play');
        expect(PlayerRules.getAction(14, 12)).toBe('ignore');
    });
});

describe('PlayerRules.normalizeIndex', () => {
    test('корректный индекс не меняется', () => {
        expect(PlayerRules.normalizeIndex(7, 15)).toBe(7);
    });

    test('слишком маленький индекс → −1', () => {
        expect(PlayerRules.normalizeIndex(-5, 15)).toBe(-1);
        expect(PlayerRules.normalizeIndex(-1, 15)).toBe(-1);
    });

    test('слишком большой индекс → последний', () => {
        expect(PlayerRules.normalizeIndex(99, 15)).toBe(14);
    });

    test('нечисловое значение → −1', () => {
        expect(PlayerRules.normalizeIndex(undefined, 15)).toBe(-1);
        expect(PlayerRules.normalizeIndex(null, 15)).toBe(-1);
    });

    test('пустая карта → −1', () => {
        expect(PlayerRules.normalizeIndex(3, 0)).toBe(-1);
    });
});
