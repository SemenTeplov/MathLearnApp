// useSessionLock: канал BroadcastChannel, одно сообщение → одна модалка,
// cleanup и fallback через localStorage.

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useSessionLock } from '../../src/hooks/useSessionLock';

interface Channel {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null;
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
}

let channels: Channel[] = [];

/** Управляемая заглушка: сьют сам «шлёт» сообщение второй вкладки. */
class ControlledChannel {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage = vi.fn();
    close = vi.fn();
    constructor(public name: string) {
        channels.push(this as unknown as Channel);
    }
}

function setup(showError = vi.fn()) {
    const view = renderHook(() => useSessionLock(showError));
    return { ...view, showError };
}

describe('useSessionLock', () => {
    beforeEach(() => {
        channels = [];
        localStorage.clear();
        vi.stubGlobal('BroadcastChannel', ControlledChannel);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
    });

    test('на монтаже создаёт канал и отправляет hello', () => {
        setup();

        expect(channels).toHaveLength(1);
        expect(channels[0].name).toBe('mathlingo_session');
        expect(channels[0].postMessage).toHaveBeenCalledWith('hello');
    });

    test('сообщение второй вкладки показывает модалку', () => {
        const { showError } = setup();

        act(() => {
            channels[0].onmessage?.(new MessageEvent('message', { data: 'hello' }));
        });

        expect(showError).toHaveBeenCalledWith('Игра уже запущена', 'Закройте другую вкладку с MathLingo.');
    });

    test('два сообщения дают один показ (locked)', () => {
        const { showError } = setup();

        act(() => {
            channels[0].onmessage?.(new MessageEvent('message', { data: 'hello' }));
            channels[0].onmessage?.(new MessageEvent('message', { data: 'hello' }));
        });

        expect(showError).toHaveBeenCalledTimes(1);
    });

    test('cleanup закрывает канал и снимает ключ localStorage', () => {
        localStorage.setItem('ml_session_lock', '1');
        const { unmount } = setup();

        unmount();

        expect(channels[0].close).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem('ml_session_lock')).toBeNull();
    });

    test('fallback без канала: свободный ключ записывается', () => {
        vi.stubGlobal(
            'BroadcastChannel',
            class {
                constructor() {
                    throw new Error('BroadcastChannel is not supported');
                }
            }
        );
        const { showError } = setup();

        expect(showError).not.toHaveBeenCalled();
        expect(localStorage.getItem('ml_session_lock')).toBe('1');
    });

    test('fallback без канала: занятый ключ показывает модалку', () => {
        localStorage.setItem('ml_session_lock', '1');
        vi.stubGlobal(
            'BroadcastChannel',
            class {
                constructor() {
                    throw new Error('BroadcastChannel is not supported');
                }
            }
        );
        const { showError } = setup();

        expect(showError).toHaveBeenCalledTimes(1);
        expect(showError).toHaveBeenCalledWith('Игра уже запущена', 'Закройте другую вкладку с MathLingo.');
    });
});
