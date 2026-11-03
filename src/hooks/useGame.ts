// ============================================
// SRC/HOOKS/useGame.ts — игровой процесс (1.8.0)
// ============================================
// Перенос игрового процесса 1:1 (бывшие контроллер игры и старт раунда). Модель раунда и
// генератор живут в ref; наружу — снимок GameSessionView. Порядок действий
// 1:1 с game-controller.js: ответ → правила → счёт/жизни → feedback «+10»
// на 1.5 с; «Продолжить» → advanceQuestion → shouldEndGame → результаты.

import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '../config';

export interface UseGameDeps {
    /** Конец раунда: показывает результаты и переключает экран. */
    onRoundFinished(results: GameResult): void;
    /** Подтверждённый выход из игры на карту. */
    onExitToMap(): void;
}

export interface UseGame {
    session: GameSessionView;
    question: Problem | null;
    feedback: GameFeedbackView | null;
    selectedIndex: number | null;
    correctIndex: number | null;
    floatingScore: number | null;
    start(difficulty?: Difficulty): void;
    answer(index: number): void;
    next(): void;
    exit(): void;
}

function initialSession(): GameSessionView {
    return {
        lives: config.MAX_LIVES,
        roundScore: 0,
        questionNumber: 1,
        totalQuestions: config.TOTAL_QUESTIONS,
        progress: 10,
        difficulty: config.START_DIFFICULTY
    };
}

export function useGame({ onRoundFinished, onExitToMap }: UseGameDeps): UseGame {
    const modelRef = useRef<SessionModel | null>(null);
    const generatorRef = useRef<ProblemGenerator | null>(null);
    const questionCountRef = useRef(0);
    const answeredRef = useRef(false);
    const floatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const depsRef = useRef({ onRoundFinished, onExitToMap });
    depsRef.current = { onRoundFinished, onExitToMap };

    if (!modelRef.current) modelRef.current = new SessionModel();
    if (!generatorRef.current) generatorRef.current = new ProblemGenerator(config.START_DIFFICULTY);

    const [session, setSession] = useState<GameSessionView>(initialSession);
    const [question, setQuestion] = useState<Problem | null>(null);
    const [feedback, setFeedback] = useState<GameFeedbackView | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [correctIndex, setCorrectIndex] = useState<number | null>(null);
    const [floatingScore, setFloatingScore] = useState<number | null>(null);

    useEffect(() => () => {
        if (floatingTimerRef.current) {
            clearTimeout(floatingTimerRef.current);
        }
    }, []);

    const start = useCallback((difficulty?: Difficulty) => {
        const model = modelRef.current!;
        const generator = generatorRef.current!;
        const diff: Difficulty = difficulty || model.difficulty || config.START_DIFFICULTY;

        model.reset();
        model.setDifficulty(diff);
        generator.setDifficulty(diff);

        questionCountRef.current = 0;
        answeredRef.current = false;
        if (floatingTimerRef.current) {
            clearTimeout(floatingTimerRef.current);
            floatingTimerRef.current = null;
        }

        setQuestion(generator.generate());
        setFeedback(null);
        setSelectedIndex(null);
        setCorrectIndex(null);
        setFloatingScore(null);
        setSession({
            lives: model.lives,
            roundScore: model.roundScore,
            questionNumber: 1,
            totalQuestions: config.TOTAL_QUESTIONS,
            progress: 10,
            difficulty: diff
        });
    }, []);

    const answer = useCallback((index: number) => {
        const model = modelRef.current!;
        if (!question || answeredRef.current) {
            return;
        }
        answeredRef.current = true;

        AudioService.play('click');

        const chosen = question.options[index];
        const isCorrect = GameRules.checkAnswer(chosen, question.answer);
        const rightIndex = question.options.indexOf(question.answer);

        if (isCorrect) {
            model.recordCorrect();
            setFloatingScore(config.POINTS_BASE);
            if (floatingTimerRef.current) {
                clearTimeout(floatingTimerRef.current);
            }
            floatingTimerRef.current = setTimeout(() => {
                floatingTimerRef.current = null;
                setFloatingScore(null);
            }, 1500);
        } else {
            model.recordIncorrect();
        }

        setSelectedIndex(index);
        setCorrectIndex(rightIndex);
        setFeedback({
            isCorrect,
            title: isCorrect ? '✅ Правильно!' : '❌ Неправильно',
            message: isCorrect
                ? question.explanation
                : 'Правильный ответ: ' + question.answer + '. ' + question.explanation
        });
        setSession((prev) => ({ ...prev, lives: model.lives, roundScore: model.roundScore }));
    }, [question]);

    const next = useCallback(() => {
        const model = modelRef.current!;
        const generator = generatorRef.current!;

        AudioService.play('click');
        answeredRef.current = false;
        questionCountRef.current++;
        model.advanceQuestion();

        if (GameRules.shouldEndGame(model)) {
            model.setCompleted(true);
            depsRef.current.onRoundFinished(model.getResults());
            return;
        }

        const counter = questionCountRef.current + 1;
        setQuestion(generator.generate());
        setFeedback(null);
        setSelectedIndex(null);
        setCorrectIndex(null);
        setSession((prev) => ({
            ...prev,
            questionNumber: counter,
            progress: (counter / config.TOTAL_QUESTIONS) * 100
        }));
    }, []);

    const exit = useCallback(() => {
        const model = modelRef.current!;
        AudioService.play('click');

        if (confirm('Выйти из игры? Заработано ' + model.roundScore + ' очков сгорят.')) {
            depsRef.current.onExitToMap();
        }
    }, []);

    return { session, question, feedback, selectedIndex, correctIndex, floatingScore, start, answer, next, exit };
}
