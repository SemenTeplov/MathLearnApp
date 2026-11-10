// Боевой ProblemGenerator: диапазоны по сложностям, 4 уникальных варианта и объяснение.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ProblemGenerator } from '../../src/core/generator';
import type { Problem } from '../../src/core/types';
import { DIFFICULTIES, type Bound, type OperatorCase } from '../support/generator-fixtures';

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
    problem.options.forEach((option) => expect(Number.isFinite(option)).toBe(true));
}

/** Граница диапазона: число или функция от чисел вопроса. */
function limit(bound: Bound, values: number[]): number {
    return typeof bound === 'number' ? bound : bound(values);
}

/** Проверяет диапазоны чисел вопроса и формулу ответа одного типа задачи. */
function expectCase(problem: Problem, item: OperatorCase): void {
    const values = numbers(problem);
    item.ranges.forEach((range, index) => {
        if (!range) return;
        expect(values[index]).toBeGreaterThanOrEqual(limit(range[0], values));
        expect(values[index]).toBeLessThanOrEqual(limit(range[1], values));
    });
    expect(problem.answer).toBe(item.answer(values));
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
        expect(new ProblemGenerator('easy').rnd(5, 5)).toBe(5);
    });
});

describe('ProblemGenerator.generate', () => {
    test('генерирует валидную задачу easy', () => {
        expectValidProblem(new ProblemGenerator('easy').generate());
    });

    test('генерирует валидную задачу medium', () => {
        expectValidProblem(new ProblemGenerator('medium').generate());
    });

    test('генерирует валидную задачу hard', () => {
        expectValidProblem(new ProblemGenerator('hard').generate());
    });

    test('50 задач каждого уровня сохраняют инварианты', () => {
        for (const spec of DIFFICULTIES) {
            const generator = new ProblemGenerator(spec.difficulty);
            for (let i = 0; i < 50; i++) {
                expectValidProblem(generator.generate());
            }
        }
    });
});

describe('ProblemGenerator — типы задач по сложностям', () => {
    for (const spec of DIFFICULTIES) {
        test(`${spec.method}: набор операторов, диапазоны и ответ`, () => {
            const generator = new ProblemGenerator(spec.difficulty);
            const found = new Set<string>();

            for (let i = 0; i < spec.attempts; i++) {
                const problem = generator[spec.method]();
                expectValidProblem(problem);
                const item = spec.cases.find((candidate) => problem.question.includes(candidate.token));
                expect(item, problem.question).toBeDefined();
                expectCase(problem, item as OperatorCase);
                found.add((item as OperatorCase).label);
            }

            expect([...found].sort()).toEqual([...spec.expected].sort());
        });
    }
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
            problem.options.forEach((option) => expect(option).toBeGreaterThanOrEqual(0));
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
