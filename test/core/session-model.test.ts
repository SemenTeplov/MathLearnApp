// Счётчики ответов в SessionModel: correct/wrong, total = correct + wrong, оценка, reset.

import { describe, expect, test } from 'vitest';
import { CONFIG } from '../../src/core/config';
import { GameRules } from '../../src/core/game-rules';
import { SessionModel } from '../../src/core/session-model';

/** Отвечает `times` раз правильно. */
function answerCorrect(model: SessionModel, times: number): void {
    for (let i = 0; i < times; i++) model.recordCorrect();
}

/** Отвечает `times` раз неправильно. */
function answerIncorrect(model: SessionModel, times: number): void {
    for (let i = 0; i < times; i++) model.recordIncorrect();
}

/** Продвигает индекс вопроса `times` раз. */
function advance(model: SessionModel, times: number): void {
    for (let i = 0; i < times; i++) model.advanceQuestion();
}

describe('SessionModel — recordCorrect', () => {
    test('один правильный ответ: correct = 1, roundScore = POINTS_BASE', () => {
        const model = new SessionModel();
        model.recordCorrect();
        const results = model.getResults();
        expect(results.correct).toBe(1);
        expect(results.wrong).toBe(0);
        expect(results.roundScore).toBe(CONFIG.POINTS_BASE);
    });

    test('восемь правильных ответов: correct = 8, roundScore = 80', () => {
        const model = new SessionModel();
        answerCorrect(model, 8);
        const results = model.getResults();
        expect(results.correct).toBe(8);
        expect(results.wrong).toBe(0);
        expect(results.roundScore).toBe(8 * CONFIG.POINTS_BASE);
    });

    test('счётчик не зависит от индекса вопроса (A48)', () => {
        const model = new SessionModel();
        advance(model, 3);
        model.recordCorrect();
        const results = model.getResults();
        expect(results.correct).toBe(1);
        expect(results.wrong).toBe(0);
    });
});

describe('SessionModel — recordIncorrect', () => {
    test('одна ошибка: wrong = 1, lives = MAX_LIVES − 1', () => {
        const model = new SessionModel();
        model.recordIncorrect();
        const results = model.getResults();
        expect(results.wrong).toBe(1);
        expect(results.correct).toBe(0);
        expect(results.lives).toBe(CONFIG.MAX_LIVES - 1);
    });

    test('три ошибки: wrong = 3, lives = 0', () => {
        const model = new SessionModel();
        answerIncorrect(model, 3);
        const results = model.getResults();
        expect(results.wrong).toBe(3);
        expect(results.lives).toBe(0);
    });

    test('верный и неверный ответ: 1/1, очки и жизни вместе', () => {
        const model = new SessionModel();
        model.recordCorrect();
        model.recordIncorrect();
        const results = model.getResults();
        expect(results.correct).toBe(1);
        expect(results.wrong).toBe(1);
        expect(results.roundScore).toBe(CONFIG.POINTS_BASE);
        expect(results.lives).toBe(CONFIG.MAX_LIVES - 1);
    });
});

describe('SessionModel — getResults', () => {
    test('8 правильных и 2 ошибки → 8/2/10 и оценка «Отлично!»', () => {
        const model = new SessionModel();
        answerCorrect(model, 8);
        answerIncorrect(model, 2);
        advance(model, 10);
        model.setCompleted(true);
        const results = model.getResults();
        expect(results).toEqual({
            correct: 8,
            wrong: 2,
            total: 10,
            roundScore: 80,
            lives: CONFIG.MAX_LIVES - 2,
            completed: true
        });
        expect(GameRules.getRating(results)).toEqual(CONFIG.RATINGS[1]);
    });

    test('10 правильных → 10/0/10 и оценка «Идеально!»', () => {
        const model = new SessionModel();
        answerCorrect(model, 10);
        advance(model, 10);
        model.setCompleted(true);
        const results = model.getResults();
        expect(results.correct).toBe(10);
        expect(results.wrong).toBe(0);
        expect(results.total).toBe(10);
        expect(results.roundScore).toBe(100);
        expect(GameRules.getRating(results)).toEqual(CONFIG.RATINGS[0]);
    });

    test('0 правильных и 3 ошибки → 0/3/3 и «Игра окончена»', () => {
        const model = new SessionModel();
        answerIncorrect(model, 3);
        advance(model, 3);
        model.setCompleted(true);
        const results = model.getResults();
        expect(results.correct).toBe(0);
        expect(results.wrong).toBe(3);
        expect(results.total).toBe(3);
        expect(results.lives).toBe(0);
        expect(GameRules.getRating(results)).toEqual(CONFIG.GAMEOVER);
    });

    test('total = correct + wrong, а не TOTAL_QUESTIONS (A49)', () => {
        const model = new SessionModel();
        answerCorrect(model, 3);
        model.recordIncorrect();
        advance(model, 4);
        const results = model.getResults();
        expect(results.correct).toBe(3);
        expect(results.wrong).toBe(1);
        expect(results.total).toBe(4);
    });

    test('без ответов → 0/0/0, точность 0 без деления на ноль', () => {
        const model = new SessionModel();
        const results = model.getResults();
        expect(results.correct).toBe(0);
        expect(results.wrong).toBe(0);
        expect(results.total).toBe(0);
        expect(results.roundScore).toBe(0);
        expect(GameRules.getRating(results)).toEqual(CONFIG.RATINGS[3]);
    });

    test('completed пробрасывается без ответов', () => {
        const model = new SessionModel();
        model.setCompleted(true);
        const results = model.getResults();
        expect(results.completed).toBe(true);
        expect(results.total).toBe(0);
    });
});

describe('SessionModel — reset', () => {
    test('reset() после ответов обнуляет счётчики и очки', () => {
        const model = new SessionModel();
        model.recordCorrect();
        model.recordIncorrect();
        model.reset();
        const results = model.getResults();
        expect(results.correct).toBe(0);
        expect(results.wrong).toBe(0);
        expect(results.total).toBe(0);
        expect(results.roundScore).toBe(0);
    });

    test('reset() возвращает жизни, сложность, индекс и completed', () => {
        const model = new SessionModel();
        model.setDifficulty('hard');
        model.setCompleted(true);
        model.recordCorrect();
        model.recordIncorrect();
        advance(model, 2);
        model.reset();
        expect(model.lives).toBe(CONFIG.MAX_LIVES);
        expect(model.difficulty).toBe(CONFIG.START_DIFFICULTY);
        expect(model.currentQuestionIndex).toBe(0);
        expect(model.completed).toBe(false);
    });

    test('второй раунд после reset() не наследует счётчики', () => {
        const model = new SessionModel();
        answerCorrect(model, 4);
        answerIncorrect(model, 2);
        model.reset();
        model.recordCorrect();
        const results = model.getResults();
        expect(results.correct).toBe(1);
        expect(results.wrong).toBe(0);
        expect(results.total).toBe(1);
    });
});
