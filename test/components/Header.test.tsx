// Header: счёт 🏆 и кнопка 🌍 (T52); жизни проверяет GameScreen.test.tsx (N5).

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { Header } from '../../src/components/Header';

describe('Header', () => {
    test('показывает счёт из props', () => {
        render(<Header totalScore={80} onOpenMapSelection={vi.fn()} />);

        expect(screen.getByText('🏆 80')).toBeInTheDocument();
    });

    test('показывает нулевой счёт', () => {
        render(<Header totalScore={0} onOpenMapSelection={vi.fn()} />);

        expect(screen.getByText('🏆 0')).toBeInTheDocument();
    });

    test('в шапке только счёт и кнопка карты — жизней нет', () => {
        const { container } = render(<Header totalScore={80} onOpenMapSelection={vi.fn()} />);

        expect(container.querySelectorAll('.total-score')).toHaveLength(1);
        expect(container.querySelectorAll('button')).toHaveLength(1);
        expect(container.textContent).not.toContain('❤️');
        expect(container.querySelector('.lives')).toBeNull();
    });

    test('кнопка карты доступна по aria-label и вызывает onOpenMapSelection', async () => {
        const user = userEvent.setup();
        const onOpenMapSelection = vi.fn();
        render(<Header totalScore={0} onOpenMapSelection={onOpenMapSelection} />);

        const button = screen.getByRole('button', { name: 'Выбор карты' });
        await user.click(button);

        expect(onOpenMapSelection).toHaveBeenCalledTimes(1);
    });
});
