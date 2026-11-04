// MapSelectionModal: карты только из props, класс selected, выбор и закрытие.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { MapSelectionModal } from '../../src/components/MapSelectionModal';
import type { GameMap } from '../../src/core/types';

const MAPS: GameMap[] = [
    { id: 'math', title: 'Математика', zones: [] },
    { id: 'english', title: 'Английский', zones: [] }
];

const props = { maps: MAPS, currentMap: 'math', onSelect: () => {}, onClose: () => {} };

describe('MapSelectionModal', () => {
    test('показывает карты из props без CONFIG', () => {
        render(<MapSelectionModal {...props} onSelect={vi.fn()} onClose={vi.fn()} />);

        expect(screen.getByText('Математика')).toBeInTheDocument();
        expect(screen.getByText('Английский')).toBeInTheDocument();
    });

    test('выделяет текущую карту классом selected', () => {
        const { container } = render(
            <MapSelectionModal {...props} onSelect={vi.fn()} onClose={vi.fn()} />
        );

        const items = container.querySelectorAll('.map-select-item');
        expect(items[0]).toHaveClass('selected');
        expect(items[1]).not.toHaveClass('selected');
    });

    test('выбор другой карты отдаёт её id', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<MapSelectionModal {...props} onSelect={onSelect} onClose={vi.fn()} />);

        await user.click(screen.getByText('Английский'));

        expect(onSelect).toHaveBeenCalledWith('english');
    });

    test('выбор текущей карты тоже вызывает onSelect — no-op решает хук', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<MapSelectionModal {...props} onSelect={onSelect} onClose={vi.fn()} />);

        await user.click(screen.getByText('Математика'));

        expect(onSelect).toHaveBeenCalledWith('math');
    });

    test('«Закрыть» вызывает onClose', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<MapSelectionModal {...props} onSelect={vi.fn()} onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: 'Закрыть' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
