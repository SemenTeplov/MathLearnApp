class ProblemGenerator {
    constructor(difficulty) {
        this.difficulty = difficulty;
    }

    setDifficulty(d) {
        this.difficulty = d;
    }

    rnd(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generate() {
        if (this.difficulty === 'easy') return this.easy();
        if (this.difficulty === 'medium') return this.medium();
        return this.hard();
    }

    easy() {
        const type = this.rnd(1, 3);
        let a, b, answer, question, explanation;

        if (type === 1) {
            a = this.rnd(1, 20); b = this.rnd(1, 20);
            answer = a + b;
            question = `${a} + ${b} = ?`;
            explanation = `${a} + ${b} = ${answer}`;
        } else if (type === 2) {
            a = this.rnd(5, 20); b = this.rnd(1, a);
            answer = a - b;
            question = `${a} − ${b} = ?`;
            explanation = `${a} − ${b} = ${answer}`;
        } else {
            a = this.rnd(1, 10); b = this.rnd(1, 10);
            answer = a * b;
            question = `${a} × ${b} = ?`;
            explanation = `${a} × ${b} = ${answer}`;
        }
        return this.build(question, answer, explanation);
    }

    medium() {
        const type = this.rnd(1, 5);
        let a, b, answer, question, explanation;

        if (type === 1) {
            a = this.rnd(10, 100); b = this.rnd(10, 100);
            answer = a + b;
            question = `${a} + ${b} = ?`;
            explanation = `${a} + ${b} = ${answer}`;
        } else if (type === 2) {
            a = this.rnd(50, 200); b = this.rnd(10, 50);
            answer = a - b;
            question = `${a} − ${b} = ?`;
            explanation = `${a} − ${b} = ${answer}`;
        } else if (type === 3) {
            a = this.rnd(2, 15); b = this.rnd(2, 12);
            answer = a * b;
            question = `${a} × ${b} = ?`;
            explanation = `${a} × ${b} = ${answer}`;
        } else if (type === 4) {
            b = this.rnd(2, 12);
            answer = this.rnd(2, 12);
            a = b * answer;
            question = `${a} ÷ ${b} = ?`;
            explanation = `${a} ÷ ${b} = ${answer}`;
        } else {
            a = this.rnd(2, 12);
            answer = a * a;
            question = `${a}² = ?`;
            explanation = `${a}² = ${a} × ${a} = ${answer}`;
        }
        return this.build(question, answer, explanation);
    }

    hard() {
        const type = this.rnd(1, 5);
        let a, b, answer, question, explanation;

        if (type === 1) {
            a = this.rnd(5, 20); b = this.rnd(2, 10);
            const c = this.rnd(1, 20);
            answer = a * b + c;
            question = `${a} × ${b} + ${c} = ?`;
            explanation = `${a} × ${b} = ${a * b}, затем ${a * b} + ${c} = ${answer}`;
        } else if (type === 2) {
            a = this.rnd(2, 12);
            answer = a * a * a;
            question = `${a}³ = ?`;
            explanation = `${a}³ = ${a} × ${a} × ${a} = ${answer}`;
        } else if (type === 3) {
            b = this.rnd(3, 15);
            answer = this.rnd(3, 15);
            a = b * answer;
            question = `${a} ÷ ${b} = ?`;
            explanation = `${a} ÷ ${b} = ${answer}`;
        } else if (type === 4) {
            a = this.rnd(10, 50);
            const p = this.rnd(10, 50);
            answer = Math.round(a * p / 100);
            question = `${p}% от ${a} = ?`;
            explanation = `${p}% от ${a} = ${a} × ${p / 100} = ${answer}`;
        } else {
            a = this.rnd(2, 9); b = this.rnd(2, 9);
            const c = this.rnd(2, 9);
            answer = a * b - c;
            question = `${a} × ${b} − ${c} = ?`;
            explanation = `${a} × ${b} = ${a * b}, затем ${a * b} − ${c} = ${answer}`;
        }
        return this.build(question, answer, explanation);
    }

    build(question, answer, explanation) {
        const options = new Set([answer]);
        while (options.size < 4) {
            let offset = this.rnd(-10, 10);
            if (offset === 0) offset = 1;
            const wrong = answer + offset;
            if (wrong >= 0 && wrong !== answer) options.add(wrong);
        }
        const arr = [...options].sort(() => Math.random() - 0.5);
        return { question, answer, options: arr, explanation };
    }
}

describe('ProblemGenerator', () => {
    let generator;

    beforeEach(() => {
        generator = new ProblemGenerator('easy');
    });

    describe('constructor', () => {
        test('устанавливает начальную сложность', () => {
            expect(generator.difficulty).toBe('easy');
        });

        test('создаёт генератор с указанной сложностью', () => {
            const gen = new ProblemGenerator('hard');
            expect(gen.difficulty).toBe('hard');
        });
    });

    describe('setDifficulty', () => {
        test('меняет сложность на easy', () => {
            generator.setDifficulty('easy');
            expect(generator.difficulty).toBe('easy');
        });

        test('меняет сложность на medium', () => {
            generator.setDifficulty('medium');
            expect(generator.difficulty).toBe('medium');
        });

        test('меняет сложность на hard', () => {
            generator.setDifficulty('hard');
            expect(generator.difficulty).toBe('hard');
        });
    });

    describe('rnd', () => {
        test('возвращает число в диапазоне [min, max]', () => {
            for (let i = 0; i < 100; i++) {
                const num = generator.rnd(5, 10);
                expect(num).toBeGreaterThanOrEqual(5);
                expect(num).toBeLessThanOrEqual(10);
            }
        });

        test('возвращает одно и то же число при min === max', () => {
            const num = generator.rnd(5, 5);
            expect(num).toBe(5);
        });
    });

    describe('generate', () => {
        test('генерирует задачу easy', () => {
            generator.setDifficulty('easy');
            const problem = generator.generate();
            expect(problem).toHaveProperty('question');
            expect(problem).toHaveProperty('answer');
            expect(problem).toHaveProperty('options');
            expect(problem).toHaveProperty('explanation');
            expect(problem.options).toHaveLength(4);
            expect(problem.options).toContain(problem.answer);
        });

        test('генерирует задачу medium', () => {
            generator.setDifficulty('medium');
            const problem = generator.generate();
            expect(problem).toHaveProperty('question');
            expect(problem).toHaveProperty('answer');
            expect(problem.options).toHaveLength(4);
            expect(problem.options).toContain(problem.answer);
        });

        test('генерирует задачу hard', () => {
            generator.setDifficulty('hard');
            const problem = generator.generate();
            expect(problem).toHaveProperty('question');
            expect(problem).toHaveProperty('answer');
            expect(problem.options).toHaveLength(4);
            expect(problem.options).toContain(problem.answer);
        });

        test('все варианты ответов уникальны', () => {
            generator.setDifficulty('easy');
            for (let i = 0; i < 50; i++) {
                const problem = generator.generate();
                const uniqueOptions = new Set(problem.options);
                expect(uniqueOptions.size).toBe(4);
            }
        });

        test('правильный ответ всегда среди вариантов', () => {
            generator.setDifficulty('medium');
            for (let i = 0; i < 50; i++) {
                const problem = generator.generate();
                expect(problem.options).toContain(problem.answer);
            }
        });
    });

    describe('easy', () => {
        test('генерирует сложение чисел 1-20', () => {
            for (let i = 0; i < 50; i++) {
                const problem = generator.easy();
                if (problem.question.includes('+')) {
                    const parts = problem.question.match(/\d+/g).map(Number);
                    expect(parts[0]).toBeGreaterThanOrEqual(1);
                    expect(parts[0]).toBeLessThanOrEqual(20);
                    expect(parts[1]).toBeGreaterThanOrEqual(1);
                    expect(parts[1]).toBeLessThanOrEqual(20);
                }
            }
        });

        test('генерирует вычитание с положительным результатом', () => {
            for (let i = 0; i < 50; i++) {
                const problem = generator.easy();
                if (problem.question.includes('−')) {
                    expect(problem.answer).toBeGreaterThanOrEqual(0);
                }
            }
        });

        test('генерирует умножение таблицы 1-10', () => {
            for (let i = 0; i < 50; i++) {
                const problem = generator.easy();
                if (problem.question.includes('×')) {
                    const parts = problem.question.match(/\d+/g).map(Number);
                    expect(parts[0]).toBeGreaterThanOrEqual(1);
                    expect(parts[0]).toBeLessThanOrEqual(10);
                    expect(parts[1]).toBeGreaterThanOrEqual(1);
                    expect(parts[1]).toBeLessThanOrEqual(10);
                }
            }
        });
    });

    describe('medium', () => {
        test('генерирует деление без остатка', () => {
            for (let i = 0; i < 50; i++) {
                const problem = generator.medium();
                if (problem.question.includes('÷')) {
                    const parts = problem.question.match(/\d+/g).map(Number);
                    expect(problem.answer * parts[1]).toBe(parts[0]);
                }
            }
        });

        test('генерирует квадраты чисел 2-12', () => {
            for (let i = 0; i < 50; i++) {
                const problem = generator.medium();
                if (problem.question.includes('²')) {
                    const num = parseInt(problem.question.match(/\d+/)[0]);
                    expect(problem.answer).toBe(num * num);
                }
            }
        });
    });

    describe('hard', () => {
        test('генерирует выражения с приоритетом', () => {
            for (let i = 0; i < 50; i++) {
                const problem = generator.hard();
                if (problem.question.includes('×') && problem.question.includes('+')) {
                    const parts = problem.question.match(/\d+/g).map(Number);
                    expect(problem.answer).toBe(parts[0] * parts[1] + parts[2]);
                }
            }
        });

        test('генерирует кубы чисел 2-12', () => {
            for (let i = 0; i < 50; i++) {
                const problem = generator.hard();
                if (problem.question.includes('³')) {
                    const num = parseInt(problem.question.match(/\d+/)[0]);
                    expect(problem.answer).toBe(num * num * num);
                }
            }
        });

        test('генерирует проценты', () => {
            for (let i = 0; i < 50; i++) {
                const problem = generator.hard();
                if (problem.question.includes('%')) {
                    expect(problem).toHaveProperty('answer');
                    expect(problem).toHaveProperty('explanation');
                }
            }
        });
    });

    describe('build', () => {
        test('создаёт 4 уникальных варианта', () => {
            const problem = generator.build('2 + 2 = ?', 4, '2 + 2 = 4');
            expect(problem.options).toHaveLength(4);
            const unique = new Set(problem.options);
            expect(unique.size).toBe(4);
        });

        test('включает правильный ответ', () => {
            const problem = generator.build('2 + 2 = ?', 4, '2 + 2 = 4');
            expect(problem.options).toContain(4);
        });

        test('не включает отрицательные числа', () => {
            for (let i = 0; i < 50; i++) {
                const problem = generator.build('test', 0, 'test');
                for (const opt of problem.options) {
                    expect(opt).toBeGreaterThanOrEqual(0);
                }
            }
        });
    });
});
