// ConfirmModal: тексты, кнопки, оверлей и клик внутри .modal (T80, TR-83).

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ConfirmModal } from '../../src/components/ConfirmModal';

function setup() {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { container } = render(
        <ConfirmModal
            title="Выйти из игры?"
            message="Заработано 40 очков сгорят."
            confirmLabel="Выйти"
            cancelLabel="Остаться"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
    return { container, onConfirm, onCancel };
}

describe('ConfirmModal', () => {
    test('показывает заголовок, текст и обе кнопки', () => {
        const { container } = setup();

        expect(screen.getByRole('heading', { name: 'Выйти из игры?' })).toBeInTheDocument();
        expect(screen.getByText('Заработано 40 очков сгорят.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Выйти' })).toHaveClass('btn', 'btn-primary');
        expect(screen.getByRole('button', { name: 'Остаться' })).toHaveClass('btn', 'btn-secondary');
        expect(container.querySelector('.modal-overlay.open > .modal')).toBeInTheDocument();
    });

    test('«Выйти» вызывает onConfirm и не вызывает onCancel', async () => {
        const user = userEvent.setup();
        const { onConfirm, onCancel } = setup();

        await user.click(screen.getByRole('button', { name: 'Выйти' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    test('«Остаться» вызывает onCancel и не вызывает onConfirm', async () => {
        const user = userEvent.setup();
        const { onConfirm, onCancel } = setup();

        await user.click(screen.getByRole('button', { name: 'Остаться' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    test('клик по оверлею закрывает (onCancel)', () => {
        const { container, onConfirm, onCancel } = setup();

        fireEvent.click(container.querySelector('.modal-overlay') as HTMLElement);

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    test('клик внутри .modal не закрывает', () => {
        const { container, onConfirm, onCancel } = setup();

        fireEvent.click(container.querySelector('.modal') as HTMLElement);

        expect(onCancel).not.toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
