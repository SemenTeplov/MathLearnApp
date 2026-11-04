// ErrorModal: текст из props, «OK», клик по оверлею закрывает, по карточке — нет.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ErrorModal } from '../../src/components/ErrorModal';

const props = {
    title: 'Игра уже запущена',
    message: 'Закройте другую вкладку с MathLingo.',
    onClose: () => {}
};

describe('ErrorModal', () => {
    test('показывает заголовок и сообщение из props', () => {
        render(<ErrorModal {...props} onClose={vi.fn()} />);

        expect(screen.getByRole('heading', { name: props.title })).toBeInTheDocument();
        expect(screen.getByText(props.message)).toBeInTheDocument();
    });

    test('«OK» закрывает модалку', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<ErrorModal {...props} onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: 'OK' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('клик по оверлею закрывает, по карточке — нет', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        const { container } = render(<ErrorModal {...props} onClose={onClose} />);

        await user.click(container.querySelector('.modal') as HTMLElement);
        expect(onClose).not.toHaveBeenCalled();

        await user.click(container.querySelector('.modal-overlay') as HTMLElement);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
