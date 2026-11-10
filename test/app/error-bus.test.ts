// ErrorBus: очередь сообщений до подписки, доставка и отписка (A86/T79, TR-81).

import { describe, expect, test, vi } from 'vitest';
import { ErrorBus } from '../../src/app/error-bus';

describe('ErrorBus', () => {
    test('две публикации до подписки отдаются по порядку, очередь пустеет', () => {
        const bus = new ErrorBus();
        const first = vi.fn();
        const second = vi.fn();

        bus.report('Ошибка хранилища', 'первое');
        bus.report('Ошибка хранилища', 'второе');
        bus.subscribe(first);
        bus.subscribe(second);

        expect(first.mock.calls).toEqual([
            ['Ошибка хранилища', 'первое'],
            ['Ошибка хранилища', 'второе']
        ]);
        expect(second).not.toHaveBeenCalled();
    });

    test('report после подписки доставляется сразу всем слушателям', () => {
        const bus = new ErrorBus();
        const first = vi.fn();
        const second = vi.fn();
        bus.subscribe(first);
        bus.subscribe(second);

        bus.report('Заголовок', 'текст');

        expect(first).toHaveBeenCalledWith('Заголовок', 'текст');
        expect(second).toHaveBeenCalledWith('Заголовок', 'текст');
    });

    test('отписка снимает слушателя и не мешает остальным', () => {
        const bus = new ErrorBus();
        const first = vi.fn();
        const second = vi.fn();
        const off = bus.subscribe(first);
        bus.subscribe(second);

        off();
        bus.report('Заголовок', 'текст');

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    test('очередь одного экземпляра не видна другому (A78/Z44)', () => {
        const one = new ErrorBus();
        const other = new ErrorBus();
        const listener = vi.fn();

        one.report('Заголовок', 'текст');
        other.subscribe(listener);

        expect(listener).not.toHaveBeenCalled();
    });

    test('подписка без публикаций ничего не отдаёт', () => {
        const bus = new ErrorBus();
        const listener = vi.fn();

        bus.subscribe(listener);

        expect(listener).not.toHaveBeenCalled();
    });
});
