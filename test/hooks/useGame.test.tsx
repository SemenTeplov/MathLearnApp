// useGame: раунд на реальных SessionModel/GameRules/ProblemGenerator,
// фейковый Services (только звук). Ответы берутся из сгенерированного вопроса.

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Services } from '../../src/app/types';
import { CONFIG } from '../../src/core/config';
import type { Problem } from '../../src/core/types';
import { useGame } from '../../src/hooks/useGame';

function makeServices(): { services: Services; audio: { play: ReturnType<typeof vi.fn> } } {
    const audio = { play: vi.fn() };
    return { services: { audio } as unknown as Services, audio };
}

function setup() {
    const { services, audio } = makeServices();
    const onRoundFinished = vi.fn();
    const onExitToMap = vi.fn();
    const view = renderHook(() => useGame(services, { onRoundFinished, onExitToMap }));
    return { ...view, audio, onRoundFinished, onExitToMap };
}

const correctIndexOf = (question: Problem): number => question.options.indexOf(question.answer);
const wrongIndexOf = (question: Problem): number => question.options.findIndex((option) => option !== question.answer);

describe('useGame', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    test('start(easy): вопрос, 3 жизни, прогресс 10, 1/10, счёт 0', () => {
        const { result } = setup();

        act(() => result.current.start('easy'));

        expect(result.current.question).not.toBeNull();
        expect(result.current.session).toEqual({
            lives: CONFIG.MAX_LIVES,
            roundScore: 0,
            questionNumber: 1,
            totalQuestions: CONFIG.TOTAL_QUESTIONS,
            progress: 10,
            difficulty: 'easy'
        });
    });

    test('верный ответ: +10, плашка 10, верный feedback и звук', () => {
        const { result, audio } = setup();
        act(() => result.current.start('easy'));
        const question = result.current.question!;
        const index = correctIndexOf(question);

        act(() => result.current.answer(index));

        expect(result.current.session.roundScore).toBe(CONFIG.POINTS_BASE);
        expect(result.current.floatingScore).toBe(CONFIG.POINTS_BASE);
        expect(result.current.feedback?.isCorrect).toBe(true);
        expect(result.current.feedback?.title).toBe('✅ Правильно!');
        expect(result.current.selectedIndex).toBe(index);
        expect(result.current.correctIndex).toBe(index);
        expect(audio.play).toHaveBeenCalledWith('click');
    });

    test('неверный ответ: жизнь минус, feedback false, плашки нет', () => {
        const { result } = setup();
        act(() => result.current.start('easy'));
        const question = result.current.question!;

        act(() => result.current.answer(wrongIndexOf(question)));

        expect(result.current.session.lives).toBe(CONFIG.MAX_LIVES - 1);
        expect(result.current.session.roundScore).toBe(0);
        expect(result.current.feedback?.isCorrect).toBe(false);
        expect(result.current.floatingScore).toBeNull();
    });

    test('повторный answer игнорируется (answeredRef)', () => {
        const { result, audio } = setup();
        act(() => result.current.start('easy'));
        const question = result.current.question!;
        act(() => result.current.answer(correctIndexOf(question)));
        const after = result.current.session;

        act(() => result.current.answer(0));

        expect(result.current.session).toEqual(after);
        expect(audio.play).toHaveBeenCalledTimes(1);
    });

    test('next: 2/10, прогресс 20, feedback и выбор сброшены', () => {
        const { result } = setup();
        act(() => result.current.start('easy'));
        const question = result.current.question!;
        act(() => result.current.answer(correctIndexOf(question)));

        act(() => result.current.next());

        expect(result.current.session.questionNumber).toBe(2);
        expect(result.current.session.progress).toBe(20);
        expect(result.current.feedback).toBeNull();
        expect(result.current.selectedIndex).toBeNull();
        expect(result.current.correctIndex).toBeNull();
        expect(result.current.question).not.toBeNull();
    });

    test('раунд 10/10 завершается результатами', () => {
        const { result, onRoundFinished } = setup();
        act(() => result.current.start('easy'));

        for (let i = 0; i < CONFIG.TOTAL_QUESTIONS; i++) {
            const question = result.current.question!;
            act(() => result.current.answer(correctIndexOf(question)));
            act(() => result.current.next());
        }

        expect(onRoundFinished).toHaveBeenCalledTimes(1);
        expect(onRoundFinished).toHaveBeenCalledWith({
            correct: 10,
            wrong: 0,
            total: 10,
            roundScore: 100,
            lives: 3,
            completed: true
        });
    });

    test('провал 0/3 завершает раунд с total = 3', () => {
        const { result, onRoundFinished } = setup();
        act(() => result.current.start('easy'));

        for (let i = 0; i < CONFIG.MAX_LIVES; i++) {
            const question = result.current.question!;
            act(() => result.current.answer(wrongIndexOf(question)));
            act(() => result.current.next());
        }

        expect(onRoundFinished).toHaveBeenCalledWith({
            correct: 0,
            wrong: 3,
            total: 3,
            roundScore: 0,
            lives: 0,
            completed: true
        });
    });

    test('плашка «+10» исчезает через 1500 мс (fake timers)', () => {
        vi.useFakeTimers();
        const { result } = setup();
        act(() => result.current.start('easy'));
        const question = result.current.question!;

        act(() => result.current.answer(correctIndexOf(question)));
        expect(result.current.floatingScore).toBe(10);

        act(() => vi.advanceTimersByTime(1500));

        expect(result.current.floatingScore).toBeNull();
    });

    test('exit с подтверждением выходит на карту и играет звук', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const { result, onExitToMap, audio } = setup();

        act(() => result.current.exit());

        expect(onExitToMap).toHaveBeenCalledTimes(1);
        expect(audio.play).toHaveBeenCalledWith('click');
    });

    test('exit с отменой остаётся в игре', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        const { result, onExitToMap } = setup();

        act(() => result.current.exit());

        expect(onExitToMap).not.toHaveBeenCalled();
    });
});
