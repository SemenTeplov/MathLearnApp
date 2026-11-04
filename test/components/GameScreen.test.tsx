// GameScreen: вопрос, 4 ответа, счётчик, жизни, feedback и плашка «+10».

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { GameScreen } from '../../src/components/GameScreen';
import type { GameScreenProps } from '../../src/components/GameScreen';
import { CONFIG } from '../../src/core/config';
import type { Problem } from '../../src/core/types';
import type { GameFeedbackView } from '../../src/ui/types';

const QUESTION: Problem = {
    question: '2 + 2',
    answer: 4,
    options: [3, 4, 5, 6],
    explanation: 'Два плюс два — четыре.'
};

function makeProps(overrides: Partial<GameScreenProps> = {}): GameScreenProps {
    return {
        session: {
            lives: 3,
            roundScore: 0,
            questionNumber: 1,
            totalQuestions: CONFIG.TOTAL_QUESTIONS,
            progress: 10,
            difficulty: 'easy'
        },
        question: QUESTION,
        feedback: null,
        selectedIndex: null,
        correctIndex: null,
        floatingScore: null,
        onAnswer: vi.fn(),
        onNext: vi.fn(),
        onExit: vi.fn(),
        ...overrides
    };
}

const CORRECT_FB: GameFeedbackView = { isCorrect: true, title: '✅ Правильно!', message: QUESTION.explanation };
const WRONG_FB: GameFeedbackView = {
    isCorrect: false,
    title: '❌ Неправильно',
    message: 'Правильный ответ: 4. ' + QUESTION.explanation
};

describe('GameScreen', () => {
    test('рендерит вопрос, четыре варианта, счёт, счётчик и три жизни', () => {
        const { container } = render(<GameScreen {...makeProps()} />);
        const answers = container.querySelectorAll('.answer-btn');

        expect(screen.getByText('2 + 2')).toBeInTheDocument();
        expect(answers).toHaveLength(4);
        expect(Array.from(answers).map((item) => item.textContent)).toEqual(['3', '4', '5', '6']);
        expect(screen.getByText('🏆 0')).toBeInTheDocument();
        expect(screen.getByText('1/10')).toBeInTheDocument();
        expect(container.querySelector('.lives')).toHaveTextContent('❤️❤️❤️');
    });

    test('клик по варианту отдаёт его индекс', async () => {
        const user = userEvent.setup();
        const props = makeProps();
        render(<GameScreen {...props} />);

        await user.click(screen.getByRole('button', { name: '4' }));

        expect(props.onAnswer).toHaveBeenCalledWith(1);
    });

    test('верный ответ: класс correct, остальные без wrong, кнопки disabled', () => {
        const { container } = render(
            <GameScreen {...makeProps({ selectedIndex: 1, correctIndex: 1, feedback: CORRECT_FB })} />
        );
        const answers = container.querySelectorAll('.answer-btn');

        expect(answers[1]).toHaveClass('correct');
        expect(answers[1]).not.toHaveClass('wrong');
        expect(answers[0]).not.toHaveClass('correct');
        expect(answers[0]).not.toHaveClass('wrong');
        expect(Array.from(answers).every((item) => item.hasAttribute('disabled'))).toBe(true);
    });

    test('неверный ответ: wrong у выбранной, correct у правильной', () => {
        const { container } = render(
            <GameScreen {...makeProps({ selectedIndex: 0, correctIndex: 1, feedback: WRONG_FB })} />
        );
        const answers = container.querySelectorAll('.answer-btn');

        expect(answers[0]).toHaveClass('wrong');
        expect(answers[1]).toHaveClass('correct');
    });

    test('верный feedback: класс correct-fb show и текст', () => {
        const { container } = render(
            <GameScreen {...makeProps({ selectedIndex: 1, correctIndex: 1, feedback: CORRECT_FB })} />
        );
        const feedback = container.querySelector('.feedback');

        expect(feedback).toHaveClass('feedback', 'correct-fb', 'show');
        expect(feedback).toHaveTextContent('✅ Правильно!');
        expect(feedback).toHaveTextContent(QUESTION.explanation);
    });

    test('неверный feedback: класс wrong-fb show и правильный ответ', () => {
        const { container } = render(
            <GameScreen {...makeProps({ selectedIndex: 0, correctIndex: 1, feedback: WRONG_FB })} />
        );
        const feedback = container.querySelector('.feedback');

        expect(feedback).toHaveClass('feedback', 'wrong-fb', 'show');
        expect(feedback).toHaveTextContent('❌ Неправильно');
        expect(feedback).toHaveTextContent('Правильный ответ: 4.');
    });

    test('без ответа feedback скрыт, кнопки активны', () => {
        const { container } = render(<GameScreen {...makeProps()} />);
        const feedback = container.querySelector('.feedback');

        expect(feedback).toHaveClass('hidden');
        expect(Array.from(container.querySelectorAll('.answer-btn')).some((item) => item.hasAttribute('disabled'))).toBe(false);
    });

    test('«Продолжить» вызывает onNext один раз', async () => {
        const user = userEvent.setup();
        const props = makeProps();
        render(<GameScreen {...props} />);

        await user.click(screen.getByRole('button', { name: 'Продолжить' }));

        expect(props.onNext).toHaveBeenCalledTimes(1);
    });

    test('«✕» вызывает onExit', async () => {
        const user = userEvent.setup();
        const props = makeProps();
        render(<GameScreen {...props} />);

        await user.click(screen.getByRole('button', { name: '✕' }));

        expect(props.onExit).toHaveBeenCalledTimes(1);
    });

    test('плашка «+10» видна при floatingScore, скрыта при null', () => {
        const { container, rerender } = render(<GameScreen {...makeProps({ floatingScore: 10 })} />);
        const badge = container.querySelector('.score-badge');

        expect(badge).toHaveTextContent('+10');
        expect(badge).toHaveStyle({ display: 'block' });

        rerender(<GameScreen {...makeProps({ floatingScore: null })} />);
        expect(container.querySelector('.score-badge')).toHaveStyle({ display: 'none' });
    });
});
