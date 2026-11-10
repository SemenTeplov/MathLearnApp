// ============================================
// SRC/HOOKS/useGame.ts — игровой процесс (1.10.1)
// ============================================
// Модель раунда и генератор живут в ref; наружу — снимок GameSessionView.
// Порядок 1:1 с game-controller 1.8.0: ответ → правила → счёт/жизни →
// feedback «+10» на 1.5 с; «Продолжить» → advanceQuestion → результаты.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Services } from '../app/types';
import { CONFIG } from '../core/config';
import { GameRules } from '../core/game-rules';
import { ProblemGenerator } from '../core/generator';
import { SessionModel } from '../core/session-model';
import type { Difficulty, GameResult, Problem } from '../core/types';
import type { GameFeedbackView, GameSessionView } from '../ui/types';

export interface UseGameDeps {
    /** Конец раунда: показывает результаты и переключает экран. */
    onRoundFinished(results: GameResult): void;
    /** ✕ в раунде: игрок хочет выйти, раунд не завершается. */
    onExitRequested(roundScore: number): void;
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
        lives: CONFIG.MAX_LIVES,
        roundScore: 0,
        questionNumber: 1,
        totalQuestions: CONFIG.TOTAL_QUESTIONS,
        progress: 10,
        difficulty: CONFIG.START_DIFFICULTY
    };
}

export function useGame(services: Services, { onRoundFinished, onExitRequested }: UseGameDeps): UseGame {
    const modelRef = useRef<SessionModel | null>(null);
    const generatorRef = useRef<ProblemGenerator | null>(null);
    const questionCountRef = useRef(0);
    const answeredRef = useRef(false);
    const floatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const depsRef = useRef({ onRoundFinished, onExitRequested });
    depsRef.current = { onRoundFinished, onExitRequested };

    if (!modelRef.current) modelRef.current = new SessionModel();
    if (!generatorRef.current) generatorRef.current = new ProblemGenerator(CONFIG.START_DIFFICULTY);

    const [session, setSession] = useState<GameSessionView>(initialSession);
    const [question, setQuestion] = useState<Problem | null>(null);
    const [feedback, setFeedback] = useState<GameFeedbackView | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [correctIndex, setCorrectIndex] = useState<number | null>(null);
    const [floatingScore, setFloatingScore] = useState<number | null>(null);

    useEffect(
        () => () => {
            if (floatingTimerRef.current) {
                clearTimeout(floatingTimerRef.current);
            }
        },
        []
    );

    const start = useCallback((difficulty?: Difficulty) => {
        const model = modelRef.current!;
        const generator = generatorRef.current!;
        const diff: Difficulty = difficulty || model.difficulty || CONFIG.START_DIFFICULTY;

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
            totalQuestions: CONFIG.TOTAL_QUESTIONS,
            progress: 10,
            difficulty: diff
        });
    }, []);

    const answer = useCallback(
        (index: number) => {
            const model = modelRef.current!;
            if (!question || answeredRef.current) {
                return;
            }
            answeredRef.current = true;

            services.audio.play('click');

            const chosen = question.options[index];
            const isCorrect = GameRules.checkAnswer(chosen, question.answer);
            const rightIndex = question.options.indexOf(question.answer);

            if (isCorrect) {
                model.recordCorrect();
                setFloatingScore(CONFIG.POINTS_BASE);
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
        },
        [question, services]
    );

    const next = useCallback(() => {
        const model = modelRef.current!;
        const generator = generatorRef.current!;

        services.audio.play('click');
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
            progress: (counter / CONFIG.TOTAL_QUESTIONS) * 100
        }));
    }, [services]);

    // Подтверждение — кастомная модалка App: раунд не завершается (A88/T80).
    const exit = useCallback(() => {
        services.audio.play('click');
        depsRef.current.onExitRequested(modelRef.current!.roundScore);
    }, [services]);

    return { session, question, feedback, selectedIndex, correctIndex, floatingScore, start, answer, next, exit };
}
