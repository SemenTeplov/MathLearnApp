// Боевой ProblemGenerator: диапазоны, 4 уникальных варианта и объяснение.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ProblemGenerator } from '../../src/core/generator';
import type { Problem } from '../../src/core/types';

/** Детерминированный PRNG, чтобы ветки генератора проверялись стабильно. */
function seedRandom(seed: number): void {
    let state = seed >>> 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    });
}

function numbers(problem: Problem): number[] {
    return (problem.question.match(/\d+/g) || []).map(Number);
}

function expectValidProblem(problem: Problem): void {
    expect(problem.question).toMatch(/[?]/);
    expect(problem.explanation).toContain(String(problem.answer));
    expect(problem.options).toHaveLength(4);
    expect(new Set(problem.options).size).toBe(4);
    expect(problem.options).toContain(problem.answer);
    problem.options.forEach((option) => {
        expect(Number.isFinite(option)).toBe(true);
    });
}

beforeEach(() => {
    seedRandom(42);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('ProblemGenerator — конструктор и сложность', () => {
    test('устанавливает начальную сложность', () => {
        expect(new ProblemGenerator('easy').difficulty).toBe('easy');
    });

    test('создаёт генератор с указанной сложностью', () => {
        expect(new ProblemGenerator('hard').difficulty).toBe('hard');
    });

    test('setDifficulty меняет сложность', () => {
        const generator = new ProblemGenerator('easy');
        generator.setDifficulty('medium');
        expect(generator.difficulty).toBe('medium');

        generator.setDifficulty('hard');
        expect(generator.difficulty).toBe('hard');

        generator.setDifficulty('easy');
        expect(generator.difficulty).toBe('easy');
    });
});

describe('ProblemGenerator.rnd', () => {
    test('возвращает число в диапазоне [min, max]', () => {
        const generator = new ProblemGenerator('easy');
        for (let i = 0; i < 100; i++) {
            const num = generator.rnd(5, 10);
            expect(num).toBeGreaterThanOrEqual(5);
            expect(num).toBeLessThanOrEqual(10);
        }
    });

    test('возвращает одно и то же число при min === max', () => {
        const generator = new ProblemGenerator('easy');
        expect(generator.rnd(5, 5)).toBe(5);
    });
});

describe('ProblemGenerator.generate', () => {
    test('генерирует валидную задачу easy', () => {
        const problem = new ProblemGenerator('easy').generate();
        expectValidProblem(problem);
    });

    test('генерирует валидную задачу medium', () => {
        const problem = new ProblemGenerator('medium').generate();
        expectValidProblem(problem);
    });

    test('генерирует валидную задачу hard', () => {
        const problem = new ProblemGenerator('hard').generate();
        expectValidProblem(problem);
    });

    test('50 задач каждого уровня сохраняют инварианты', () => {
        for (const difficulty of ['easy', 'medium', 'hard'] as const) {
            const generator = new ProblemGenerator(difficulty);
            for (let i = 0; i < 50; i++) {
                expectValidProblem(generator.generate());
            }
        }
    });
});

describe('ProblemGenerator.easy', () => {
    test('использует сложение, вычитание и умножение', () => {
        const generator = new ProblemGenerator('easy');
        const operators = new Set<string>();

        for (let i = 0; i < 200; i++) {
            const problem = generator.easy();
            expectValidProblem(problem);

            if (problem.question.includes('+')) {
                operators.add('+');
                const [a, b] = numbers(problem);
                expect(a).toBeGreaterThanOrEqual(1);
                expect(a).toBeLessThanOrEqual(20);
                expect(b).toBeGreaterThanOrEqual(1);
                expect(b).toBeLessThanOrEqual(20);
                expect(problem.answer).toBe(a + b);
            } else if (problem.question.includes('−')) {
                operators.add('−');
                const [a, b] = numbers(problem);
                expect(a).toBeGreaterThanOrEqual(5);
                expect(a).toBeLessThanOrEqual(20);
                expect(b).toBeGreaterThanOrEqual(1);
                expect(b).toBeLessThanOrEqual(a);
                expect(problem.answer).toBe(a - b);
            } else {
                operators.add('×');
                const [a, b] = numbers(problem);
                expect(a).toBeGreaterThanOrEqual(1);
                expect(a).toBeLessThanOrEqual(10);
                expect(b).toBeGreaterThanOrEqual(1);
                expect(b).toBeLessThanOrEqual(10);
                expect(problem.answer).toBe(a * b);
            }
        }

        expect(operators).toEqual(new Set(['+', '−', '×']));
    });
});

describe('ProblemGenerator.medium', () => {
    test('использует все пять типов задач', () => {
        const generator = new ProblemGenerator('medium');
        const operators = new Set<string>();

        for (let i = 0; i < 300; i++) {
            const problem = generator.medium();
            expectValidProblem(problem);

            if (problem.question.includes('÷')) {
                operators.add('÷');
                const [a, b] = numbers(problem);
                expect(problem.answer * b).toBe(a);
            } else if (problem.question.includes('²')) {
                operators.add('²');
                const [a] = numbers(problem);
                expect(a).toBeGreaterThanOrEqual(2);
                expect(a).toBeLessThanOrEqual(12);
                expect(problem.answer).toBe(a * a);
            } else if (problem.question.includes('+')) {
                operators.add('+');
                const [a, b] = numbers(problem);
                expect(a).toBeGreaterThanOrEqual(10);
                expect(a).toBeLessThanOrEqual(100);
                expect(b).toBeGreaterThanOrEqual(10);
                expect(b).toBeLessThanOrEqual(100);
                expect(problem.answer).toBe(a + b);
            } else if (problem.question.includes('−')) {
                operators.add('−');
                const [a, b] = numbers(problem);
                expect(a).toBeGreaterThanOrEqual(50);
                expect(a).toBeLessThanOrEqual(200);
                expect(b).toBeGreaterThanOrEqual(10);
                expect(b).toBeLessThanOrEqual(50);
                expect(problem.answer).toBe(a - b);
            } else {
                operators.add('×');
                const [a, b] = numbers(problem);
                expect(a).toBeGreaterThanOrEqual(2);
                expect(a).toBeLessThanOrEqual(15);
                expect(b).toBeGreaterThanOrEqual(2);
                expect(b).toBeLessThanOrEqual(12);
                expect(problem.answer).toBe(a * b);
            }
        }

        expect(operators).toEqual(new Set(['+', '−', '×', '÷', '²']));
    });
});

describe('ProblemGenerator.hard', () => {
    test('использует приоритет, кубы, деление, проценты и вычитание', () => {
        const generator = new ProblemGenerator('hard');
        const operators = new Set<string>();

        for (let i = 0; i < 400; i++) {
            const problem = generator.hard();
            expectValidProblem(problem);
            const parts = numbers(problem);

            if (problem.question.includes('%')) {
                operators.add('%');
                const [p, a] = parts;
                expect(p).toBeGreaterThanOrEqual(10);
                expect(p).toBeLessThanOrEqual(50);
                expect(a).toBeGreaterThanOrEqual(10);
                expect(a).toBeLessThanOrEqual(50);
                expect(problem.answer).toBe(Math.round(a * p / 100));
            } else if (problem.question.includes('³')) {
                operators.add('³');
                const [a] = parts;
                expect(a).toBeGreaterThanOrEqual(2);
                expect(a).toBeLessThanOrEqual(12);
                expect(problem.answer).toBe(a * a * a);
            } else if (problem.question.includes('÷')) {
                operators.add('÷');
                const [a, b] = parts;
                expect(b).toBeGreaterThanOrEqual(3);
                expect(b).toBeLessThanOrEqual(15);
                expect(problem.answer * b).toBe(a);
            } else if (problem.question.includes('+')) {
                operators.add('×+');
                const [a, b, c] = parts;
                expect(a).toBeGreaterThanOrEqual(5);
                expect(a).toBeLessThanOrEqual(20);
                expect(b).toBeGreaterThanOrEqual(2);
                expect(b).toBeLessThanOrEqual(10);
                expect(c).toBeGreaterThanOrEqual(1);
                expect(c).toBeLessThanOrEqual(20);
                expect(problem.answer).toBe(a * b + c);
            } else {
                operators.add('×−');
                const [a, b, c] = parts;
                expect(a).toBeGreaterThanOrEqual(2);
                expect(a).toBeLessThanOrEqual(9);
                expect(b).toBeGreaterThanOrEqual(2);
                expect(b).toBeLessThanOrEqual(9);
                expect(c).toBeGreaterThanOrEqual(2);
                expect(c).toBeLessThanOrEqual(9);
                expect(problem.answer).toBe(a * b - c);
            }
        }

        expect(operators).toEqual(new Set(['×+', '³', '÷', '%', '×−']));
    });
});

describe('ProblemGenerator.build', () => {
    test('создаёт 4 уникальных варианта и включает правильный ответ', () => {
        const problem = new ProblemGenerator('easy').build('2 + 2 = ?', 4, '2 + 2 = 4');

        expect(problem.question).toBe('2 + 2 = ?');
        expect(problem.explanation).toBe('2 + 2 = 4');
        expect(problem.options).toHaveLength(4);
        expect(new Set(problem.options).size).toBe(4);
        expect(problem.options).toContain(4);
    });

    test('не включает отрицательные числа', () => {
        const generator = new ProblemGenerator('easy');
        for (let i = 0; i < 100; i++) {
            const problem = generator.build('test', 0, 'test');
            problem.options.forEach((option) => {
                expect(option).toBeGreaterThanOrEqual(0);
            });
        }
    });

    test('перемешивает варианты (порядок не фиксирован)', () => {
        const generator = new ProblemGenerator('easy');
        const orders = new Set<string>();

        for (let i = 0; i < 30; i++) {
            orders.add(generator.build('q', 10, 'q').options.join(','));
        }

        expect(orders.size).toBeGreaterThan(1);
    });
});
