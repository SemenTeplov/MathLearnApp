// Боевой Scoring: очки за раунд и признак успешного раунда.

import { describe, expect, test } from 'vitest';
import { CONFIG } from '../../src/core/config';
import { Scoring } from '../../src/core/scoring';

describe('Scoring.calculateRoundScore', () => {
    test('возвращает 0 при 0 правильных ответах', () => {
        expect(Scoring.calculateRoundScore(0)).toBe(0);
    });

    test('возвращает POINTS_BASE при 1 правильном ответе', () => {
        expect(Scoring.calculateRoundScore(1)).toBe(CONFIG.POINTS_BASE);
    });

    test('возвращает 50 при 5 правильных ответах', () => {
        expect(Scoring.calculateRoundScore(5)).toBe(5 * CONFIG.POINTS_BASE);
    });

    test('возвращает 100 при 10 правильных ответах', () => {
        expect(Scoring.calculateRoundScore(10)).toBe(10 * CONFIG.POINTS_BASE);
    });
});

describe('Scoring.isRoundSuccessful', () => {
    test('возвращает true при lives > 0 и completed = true', () => {
        expect(Scoring.isRoundSuccessful(3, true)).toBe(true);
        expect(Scoring.isRoundSuccessful(1, true)).toBe(true);
    });

    test('возвращает false при lives = 0 и completed = true', () => {
        expect(Scoring.isRoundSuccessful(0, true)).toBe(false);
    });

    test('возвращает false при lives > 0 и completed = false', () => {
        expect(Scoring.isRoundSuccessful(3, false)).toBe(false);
        expect(Scoring.isRoundSuccessful(1, false)).toBe(false);
    });

    test('возвращает false при lives = 0 и completed = false', () => {
        expect(Scoring.isRoundSuccessful(0, false)).toBe(false);
    });
});
