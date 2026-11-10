// ============================================
// TEST/SUPPORT/GENERATOR-FIXTURES.TS — таблица диапазонов генератора (1.10.0)
// ============================================
// Один набор данных на сложность: маркер типа задачи, диапазоны чисел вопроса
// и формула правильного ответа. Сценарии сьюта остаются прежними.

import type { Difficulty } from '../../src/core/types';

/** Граница диапазона: число или функция от уже проверенных чисел вопроса. */
export type Bound = number | ((values: number[]) => number);

/** Один тип задачи: как найти в вопросе, какие диапазоны и какой ответ. */
export interface OperatorCase {
    label: string;
    token: string;
    /** Диапазоны чисел в порядке появления; null — без проверки. */
    ranges: ([Bound, Bound] | null)[];
    answer: (values: number[]) => number;
}

export interface DifficultySpec {
    difficulty: Difficulty;
    method: 'easy' | 'medium' | 'hard';
    attempts: number;
    cases: OperatorCase[];
    expected: string[];
}

export const DIFFICULTIES: DifficultySpec[] = [
    {
        difficulty: 'easy',
        method: 'easy',
        attempts: 200,
        expected: ['+', '−', '×'],
        cases: [
            {
                label: '+',
                token: '+',
                ranges: [
                    [1, 20],
                    [1, 20]
                ],
                answer: (v) => v[0] + v[1]
            },
            {
                label: '−',
                token: '−',
                ranges: [
                    [5, 20],
                    [1, (v) => v[0]]
                ],
                answer: (v) => v[0] - v[1]
            },
            {
                label: '×',
                token: '×',
                ranges: [
                    [1, 10],
                    [1, 10]
                ],
                answer: (v) => v[0] * v[1]
            }
        ]
    },
    {
        difficulty: 'medium',
        method: 'medium',
        attempts: 300,
        expected: ['+', '−', '×', '÷', '²'],
        cases: [
            { label: '÷', token: '÷', ranges: [null, null], answer: (v) => v[0] / v[1] },
            { label: '²', token: '²', ranges: [[2, 12]], answer: (v) => v[0] * v[0] },
            {
                label: '+',
                token: '+',
                ranges: [
                    [10, 100],
                    [10, 100]
                ],
                answer: (v) => v[0] + v[1]
            },
            {
                label: '−',
                token: '−',
                ranges: [
                    [50, 200],
                    [10, 50]
                ],
                answer: (v) => v[0] - v[1]
            },
            {
                label: '×',
                token: '×',
                ranges: [
                    [2, 15],
                    [2, 12]
                ],
                answer: (v) => v[0] * v[1]
            }
        ]
    },
    {
        difficulty: 'hard',
        method: 'hard',
        attempts: 400,
        expected: ['×+', '³', '÷', '%', '×−'],
        cases: [
            {
                label: '%',
                token: '%',
                ranges: [
                    [10, 50],
                    [10, 50]
                ],
                answer: (v) => Math.round((v[1] * v[0]) / 100)
            },
            { label: '³', token: '³', ranges: [[2, 12]], answer: (v) => v[0] * v[0] * v[0] },
            { label: '÷', token: '÷', ranges: [null, [3, 15]], answer: (v) => v[0] / v[1] },
            {
                label: '×+',
                token: '+',
                ranges: [
                    [5, 20],
                    [2, 10],
                    [1, 20]
                ],
                answer: (v) => v[0] * v[1] + v[2]
            },
            {
                label: '×−',
                token: '×',
                ranges: [
                    [2, 9],
                    [2, 9],
                    [2, 9]
                ],
                answer: (v) => v[0] * v[1] - v[2]
            }
        ]
    }
];
