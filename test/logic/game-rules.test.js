const RATINGS = [
    { icon: '🏆', title: 'Идеально!', subtitle: 'Все ответы правильные!' },
    { icon: '🎉', title: 'Отлично!', subtitle: 'Хороший результат!' },
    { icon: '💪', title: 'Неплохо!', subtitle: 'Есть куда расти!' },
    { icon: '📚', title: 'Нужно потренироваться', subtitle: 'Не сдавайся!' }
];

const GAMEOVER = {
    icon: '💔',
    title: 'Игра окончена',
    subtitle: 'Потеряны все жизни.'
};

const TOTAL_QUESTIONS = 10;

describe('GameRules', () => {
    const checkAnswer = (chosen, correct) => {
        return chosen === correct;
    };

    const shouldEndGame = (session) => {
        if (session.lives <= 0) return true;
        if (session.currentQuestionIndex >= TOTAL_QUESTIONS) return true;
        return false;
    };

    const getRating = (results) => {
        if (results.lives <= 0) {
            return GAMEOVER;
        }
        const accuracy = results.total > 0
            ? Math.round((results.correct / results.total) * 100)
            : 0;
        if (accuracy >= 100) return RATINGS[0];
        if (accuracy >= 70) return RATINGS[1];
        if (accuracy >= 40) return RATINGS[2];
        return RATINGS[3];
    };

    describe('checkAnswer', () => {
        test('возвращает true при правильном ответе', () => {
            expect(checkAnswer(4, 4)).toBe(true);
            expect(checkAnswer(10, 10)).toBe(true);
            expect(checkAnswer(0, 0)).toBe(true);
        });

        test('возвращает false при неправильном ответе', () => {
            expect(checkAnswer(3, 4)).toBe(false);
            expect(checkAnswer(10, 5)).toBe(false);
            expect(checkAnswer(0, 1)).toBe(false);
        });
    });

    describe('shouldEndGame', () => {
        test('возвращает true при lives <= 0', () => {
            const session = { lives: 0, currentQuestionIndex: 5 };
            expect(shouldEndGame(session)).toBe(true);
        });

        test('возвращает true при достижении TOTAL_QUESTIONS', () => {
            const session = { lives: 2, currentQuestionIndex: TOTAL_QUESTIONS };
            expect(shouldEndGame(session)).toBe(true);
        });

        test('возвращает false при lives > 0 и текущем вопросе < TOTAL_QUESTIONS', () => {
            const session = { lives: 2, currentQuestionIndex: 5 };
            expect(shouldEndGame(session)).toBe(false);
        });

        test('возвращает false при старте игры', () => {
            const session = { lives: 3, currentQuestionIndex: 0 };
            expect(shouldEndGame(session)).toBe(false);
        });
    });

    describe('getRating', () => {
        test('возвращает GAMEOVER при lives <= 0', () => {
            const results = { lives: 0, correct: 5, wrong: 5, total: 10, roundScore: 50 };
            expect(getRating(results)).toBe(GAMEOVER);
        });

        test('возвращает "Идеально" при точности 100%', () => {
            const results = { lives: 3, correct: 10, wrong: 0, total: 10, roundScore: 100 };
            expect(getRating(results)).toBe(RATINGS[0]);
        });

        test('возвращает "Отлично" при точности >= 70%', () => {
            const results = { lives: 2, correct: 7, wrong: 3, total: 10, roundScore: 70 };
            expect(getRating(results)).toBe(RATINGS[1]);
        });

        test('возвращает "Неплохо" при точности >= 40%', () => {
            const results = { lives: 1, correct: 4, wrong: 6, total: 10, roundScore: 40 };
            expect(getRating(results)).toBe(RATINGS[2]);
        });

        test('возвращает "Нужно потренироваться" при точности < 40%', () => {
            const results = { lives: 1, correct: 3, wrong: 7, total: 10, roundScore: 30 };
            expect(getRating(results)).toBe(RATINGS[3]);
        });

        test('возвращает "Нужно потренироваться" при total = 0', () => {
            const results = { lives: 3, correct: 0, wrong: 0, total: 0, roundScore: 0 };
            expect(getRating(results)).toBe(RATINGS[3]);
        });
    });
});
