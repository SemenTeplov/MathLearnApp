// ============================================
// MODEL/SESSION-MODEL.TS — состояние раунда
// ============================================

/**
 * Модель состояния одного раунда (игры).
 * Содержит только данные: поля, геттеры, сеттеры, reset().
 */
class SessionModel {
    _lives: number;
    _roundScore: number;
    _correct: number;
    _wrong: number;
    _currentQuestionIndex: number;
    _difficulty: Difficulty;
    _completed: boolean;

    constructor() {
        this._lives = CONFIG.MAX_LIVES;
        this._roundScore = 0;
        this._correct = 0;
        this._wrong = 0;
        this._currentQuestionIndex = 0;
        this._difficulty = CONFIG.START_DIFFICULTY;
        this._completed = false;
    }

    get lives(): number {
        return this._lives;
    }

    get roundScore(): number {
        return this._roundScore;
    }

    get currentQuestionIndex(): number {
        return this._currentQuestionIndex;
    }

    get difficulty(): Difficulty {
        return this._difficulty;
    }

    get completed(): boolean {
        return this._completed;
    }

    setLives(value: number): void {
        this._lives = value;
    }

    setRoundScore(value: number): void {
        this._roundScore = value;
    }

    setDifficulty(value: Difficulty): void {
        this._difficulty = value;
    }

    setCompleted(value: boolean): void {
        this._completed = value;
    }

    /** Сбрасывает все поля к начальным значениям. */
    reset(): void {
        this._lives = CONFIG.MAX_LIVES;
        this._roundScore = 0;
        this._correct = 0;
        this._wrong = 0;
        this._currentQuestionIndex = 0;
        this._difficulty = CONFIG.START_DIFFICULTY;
        this._completed = false;
    }

    /** Перемещает к следующему вопросу. */
    advanceQuestion(): void {
        this._currentQuestionIndex++;
    }

    /** Начисляет очки за правильный ответ. */
    recordCorrect(): void {
        this._correct++;
        this._roundScore += CONFIG.POINTS_BASE;
    }

    /** Уменьшает жизни при неправильном ответе. */
    recordIncorrect(): void {
        this._wrong++;
        this._lives--;
    }

    getResults(): GameResult {
        return {
            correct: this._correct,
            wrong: this._wrong,
            // A49: total — фактически отвечено, а не длина раунда:
            // при досрочном окончании «0 из 10» вводил бы в заблуждение,
            // а неотвеченные вопросы не являются ошибками.
            total: this._correct + this._wrong,
            roundScore: this._roundScore,
            lives: this._lives,
            completed: this._completed
        };
    }
}
