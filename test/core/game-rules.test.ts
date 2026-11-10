// Боевой GameRules: ответ, конец игры и оценка по точности.

import { afterEach, describe, expect, test } from 'vitest';
import { CONFIG } from '../../src/core/config';
import { GameRules } from '../../src/core/game-rules';
import { SessionModel } from '../../src/core/session-model';
import type { GameResult } from '../../src/core/types';

function results(overrides: Partial<GameResult> = {}): GameResult {
    return {
        correct: 0,
        wrong: 0,
        total: 0,
        roundScore: 0,
        lives: CONFIG.MAX_LIVES,
        completed: true,
        ...overrides
    };
}

function sessionWith(lives: number, questionIndex: number): SessionModel {
    const session = new SessionModel();
    session.setLives(lives);
    for (let i = 0; i < questionIndex; i++) session.advanceQuestion();
    return session;
}

describe('GameRules.checkAnswer', () => {
    test('возвращает true при правильном ответе', () => {
        expect(GameRules.checkAnswer(4, 4)).toBe(true);
        expect(GameRules.checkAnswer(10, 10)).toBe(true);
        expect(GameRules.checkAnswer(0, 0)).toBe(true);
    });

    test('возвращает false при неправильном ответе', () => {
        expect(GameRules.checkAnswer(3, 4)).toBe(false);
        expect(GameRules.checkAnswer(10, 5)).toBe(false);
        expect(GameRules.checkAnswer(0, 1)).toBe(false);
    });
});

describe('GameRules.shouldEndGame', () => {
    test('возвращает true при lives <= 0', () => {
        expect(GameRules.shouldEndGame(sessionWith(0, 5))).toBe(true);
    });

    test('возвращает true при достижении TOTAL_QUESTIONS', () => {
        expect(GameRules.shouldEndGame(sessionWith(2, CONFIG.TOTAL_QUESTIONS))).toBe(true);
    });

    test('возвращает false при lives > 0 и текущем вопросе < TOTAL_QUESTIONS', () => {
        expect(GameRules.shouldEndGame(sessionWith(2, 5))).toBe(false);
    });

    test('возвращает false при старте игры', () => {
        expect(GameRules.shouldEndGame(sessionWith(CONFIG.MAX_LIVES, 0))).toBe(false);
    });

    test('отрицательные жизни тоже завершают игру', () => {
        expect(GameRules.shouldEndGame(sessionWith(-1, 0))).toBe(true);
    });
});

describe('GameRules.getRating', () => {
    test('возвращает GAMEOVER при lives <= 0', () => {
        expect(GameRules.getRating(results({ lives: 0, correct: 5, wrong: 5, total: 10 }))).toBe(CONFIG.GAMEOVER);
    });

    test('возвращает «Идеально» при точности 100%', () => {
        expect(GameRules.getRating(results({ correct: 10, total: 10 }))).toBe(CONFIG.RATINGS[0]);
    });

    test('возвращает «Отлично» при точности >= 70%', () => {
        expect(GameRules.getRating(results({ correct: 7, wrong: 3, total: 10 }))).toBe(CONFIG.RATINGS[1]);
    });

    test('возвращает «Неплохо» при точности >= 40%', () => {
        expect(GameRules.getRating(results({ correct: 4, wrong: 6, total: 10 }))).toBe(CONFIG.RATINGS[2]);
    });

    test('возвращает «Нужно потренироваться» при точности < 40%', () => {
        expect(GameRules.getRating(results({ correct: 3, wrong: 7, total: 10 }))).toBe(CONFIG.RATINGS[3]);
    });

    test('возвращает «Нужно потренироваться» при total = 0', () => {
        expect(GameRules.getRating(results({ total: 0 }))).toBe(CONFIG.RATINGS[3]);
    });

    test('округляет точность до целых процентов', () => {
        // 2/3 = 66.67% → 67%, всё ещё ниже порога 70%.
        expect(GameRules.getRating(results({ correct: 2, wrong: 1, total: 3 }))).toBe(CONFIG.RATINGS[2]);
    });
});

describe('GameRules.getRating — пороги из CONFIG.RATINGS', () => {
    const original = CONFIG.RATINGS.map((rating) => ({ ...rating }));

    afterEach(() => {
        CONFIG.RATINGS.splice(0, CONFIG.RATINGS.length, ...original.map((rating) => ({ ...rating })));
    });

    test('правка порога в CONFIG меняет оценку без правок кода (A83)', () => {
        const ninetyFive = results({ correct: 19, total: 20 });
        expect(GameRules.getRating(ninetyFive)).toBe(CONFIG.RATINGS[1]);

        CONFIG.RATINGS[0].min = 90;
        expect(GameRules.getRating(ninetyFive)).toBe(CONFIG.RATINGS[0]);
    });

    test('порядок проверок: lives <= 0 важнее любого порога', () => {
        CONFIG.RATINGS[0].min = 0;
        expect(GameRules.getRating(results({ lives: 0, correct: 10, total: 10 }))).toBe(CONFIG.GAMEOVER);
    });
});
