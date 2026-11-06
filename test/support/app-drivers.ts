// ============================================
// TEST/SUPPORT/APP-DRIVERS.TS — действия пользователя в сьюте App (1.10.0)
// ============================================
// Карта → модалка сложности → раунд → результаты: одна последовательность
// для App.test.tsx и App.map-freshness.test.tsx.

import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export type User = ReturnType<typeof userEvent.setup>;

export const trainers = (container: HTMLElement): NodeListOf<HTMLElement> =>
    container.querySelectorAll<HTMLElement>('.map-trainer');
export const answers = (container: HTMLElement): NodeListOf<HTMLElement> =>
    container.querySelectorAll<HTMLElement>('.answer-btn');
export const score = (container: HTMLElement): string =>
    (container.querySelector('#mapScreen .total-score') as HTMLElement).textContent ?? '';

/** Значение вопроса «a + b = ?», «a − b = ?», «a × b = ?». */
export function answerOf(question: string): string {
    const match = /^(\d+) ([+\u2212\u00d7]) (\d+) = \?$/.exec(question.trim());
    if (!match) throw new Error('неизвестный формат вопроса: ' + question);
    const [a, b] = [Number(match[1]), Number(match[3])];
    return String(match[2] === '+' ? a + b : match[2] === '−' ? a - b : a * b);
}

/** Клик по соседнему тренажёру + прибытие игрока (CSS transition 600 мс). */
export async function arrive(user: User, container: HTMLElement): Promise<void> {
    await user.click(trainers(container)[0]);
    fireEvent.transitionEnd(container.querySelector('.map-player') as HTMLElement, { propertyName: 'transform' });
}

/** Карта → модалка сложности → игра. */
export async function startGame(user: User, container: HTMLElement): Promise<void> {
    await arrive(user, container);
    await user.click(container.querySelector('[data-diff="easy"]') as HTMLElement);
}

/** Один шаг раунда: ответ (первый или правильный) и «Продолжить». */
async function step(user: User, container: HTMLElement, correctly: boolean): Promise<void> {
    const question = (container.querySelector('.question') as HTMLElement).textContent ?? '';
    const buttons = [...answers(container)];
    const button = correctly ? buttons.find((item) => item.textContent?.trim() === answerOf(question)) : buttons[0];
    if (!button) throw new Error('нет кнопки ответа для ' + question);
    await user.click(button);
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));
}

/** Цикл «ответ → Продолжить» до результатов: не больше 10 итераций. */
export async function playToResults(user: User, container: HTMLElement): Promise<number> {
    for (let i = 0; i < 10; i++) {
        if (container.querySelector('#resultScreen.active')) return i;
        await step(user, container, false);
    }
    return 10;
}

/** Раунд только правильных ответов: 10/10 → экран результатов. */
export async function playCorrectly(user: User, container: HTMLElement): Promise<void> {
    for (let i = 0; i < 10; i++) {
        await step(user, container, true);
    }
}
