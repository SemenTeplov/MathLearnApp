// ResultsScreen: оценка, карточки статистики, строка «Заработано» и две кнопки.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ResultsScreen } from '../../src/components/ResultsScreen';
import { CONFIG } from '../../src/core/config';
import type { GameResult } from '../../src/core/types';

const RESULTS: GameResult = {
    correct: 8,
    wrong: 2,
    total: 10,
    roundScore: 80,
    lives: 3,
    completed: true
};

function makeProps(overrides: Partial<Parameters<typeof ResultsScreen>[0]> = {}) {
    return {
        results: RESULTS,
        rating: CONFIG.RATINGS[1],
        earnings: 'Заработано: 80 ✓',
        onPlayAgain: vi.fn(),
        onBackToMap: vi.fn(),
        ...overrides
    };
}

describe('ResultsScreen', () => {
    test('показывает оценку и число правильных ответов', () => {
        const { container } = render(<ResultsScreen {...makeProps()} />);

        expect(screen.getByText('🎉')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Отлично!' })).toBeInTheDocument();
        expect(screen.getByText('Хороший результат!')).toBeInTheDocument();

        const cards = container.querySelectorAll('.stat-card');
        expect(cards[0].querySelector('.stat-value')).toHaveTextContent('8');
        expect(cards[0].querySelector('.stat-label')).toHaveTextContent('Правильных');
    });

    test('показывает очки раунда и строку заработка из props', () => {
        const { container } = render(<ResultsScreen {...makeProps()} />);

        const cards = container.querySelectorAll('.stat-card');
        expect(cards[1].querySelector('.stat-value')).toHaveTextContent('80');
        expect(cards[1].querySelector('.stat-label')).toHaveTextContent('Очков');
        expect(screen.getByText('Заработано: 80 ✓')).toBeInTheDocument();
    });

    test('«Играть снова» вызывает onPlayAgain', async () => {
        const user = userEvent.setup();
        const props = makeProps();
        render(<ResultsScreen {...props} />);

        await user.click(screen.getByRole('button', { name: 'Играть снова' }));

        expect(props.onPlayAgain).toHaveBeenCalledTimes(1);
    });

    test('«На карту» вызывает onBackToMap', async () => {
        const user = userEvent.setup();
        const props = makeProps();
        render(<ResultsScreen {...props} />);

        await user.click(screen.getByRole('button', { name: 'На карту' }));

        expect(props.onBackToMap).toHaveBeenCalledTimes(1);
    });
});
