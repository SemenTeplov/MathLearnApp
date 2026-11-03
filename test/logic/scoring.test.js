describe('Scoring', () => {
    const POINTS_BASE = 10;

    const calculateRoundScore = (correctCount) => {
        return correctCount * POINTS_BASE;
    };

    const isRoundSuccessful = (lives, completed) => {
        return lives > 0 && completed;
    };

    describe('calculateRoundScore', () => {
        test('возвращает 0 при 0 правильных ответах', () => {
            expect(calculateRoundScore(0)).toBe(0);
        });

        test('возвращает 10 при 1 правильном ответе', () => {
            expect(calculateRoundScore(1)).toBe(10);
        });

        test('возвращает 50 при 5 правильных ответах', () => {
            expect(calculateRoundScore(5)).toBe(50);
        });

        test('возвращает 100 при 10 правильных ответах', () => {
            expect(calculateRoundScore(10)).toBe(100);
        });
    });

    describe('isRoundSuccessful', () => {
        test('возвращает true при lives > 0 и completed = true', () => {
            expect(isRoundSuccessful(3, true)).toBe(true);
            expect(isRoundSuccessful(1, true)).toBe(true);
        });

        test('возвращает false при lives = 0 и completed = true', () => {
            expect(isRoundSuccessful(0, true)).toBe(false);
        });

        test('возвращает false при lives > 0 и completed = false', () => {
            expect(isRoundSuccessful(3, false)).toBe(false);
            expect(isRoundSuccessful(1, false)).toBe(false);
        });

        test('возвращает false при lives = 0 и completed = false', () => {
            expect(isRoundSuccessful(0, false)).toBe(false);
        });
    });
});
