// ============================================
// LOGIC/GENERATOR.TS — генератор математических задач
// ============================================

/**
 * Генерирует математические задачи по трём сложностям.
 */
class ProblemGenerator {
    difficulty: Difficulty;

    constructor(difficulty: Difficulty) {
        this.difficulty = difficulty;
    }

    setDifficulty(d: Difficulty): void {
        this.difficulty = d;
    }

    /**
     * Генерирует случайное целое число в диапазоне [min, max].
     */
    rnd(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** Генерирует задачу. */
    generate(): Problem {
        if (this.difficulty === 'easy') return this.easy();
        if (this.difficulty === 'medium') return this.medium();
        return this.hard();
    }

    easy(): Problem {
        const type = this.rnd(1, 3);
        let a: number, b: number, answer: number, question: string, explanation: string;

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

    medium(): Problem {
        const type = this.rnd(1, 5);
        let a: number, b: number, answer: number, question: string, explanation: string;

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

    hard(): Problem {
        const type = this.rnd(1, 5);
        let a: number, b: number, answer: number, question: string, explanation: string;

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

    /** Создаёт 3 неправильных варианта и перемешивает. */
    build(question: string, answer: number, explanation: string): Problem {
        const options = new Set<number>([answer]);
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
