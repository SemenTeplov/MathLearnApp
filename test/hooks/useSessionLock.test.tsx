// useSessionLock: handshake hello/busy и heartbeat-метка ml_session_lock; владелец
// молчит, вторая вкладка сама обнаруживает занятость (A81, T73).

import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SESSION_BUSY_MESSAGE, SESSION_BUSY_TITLE, useSessionLock } from '../../src/hooks/useSessionLock';

interface Channel {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null;
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
}

const KEY = 'ml_session_lock';
let channels: Channel[] = [];

/** Управляемая заглушка: сьют сам «шлёт» сообщение другой вкладки. */
class ControlledChannel {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage = vi.fn();
    close = vi.fn();
    constructor(public name: string) {
        channels.push(this as unknown as Channel);
    }
}

/** Значение метки: чужой id и, при необходимости, возраст в мс. */
const mark = (id: string, age = 0): string => JSON.stringify({ id, ts: Date.now() - age });
const ownMark = (): { id: string; ts: number } => JSON.parse(localStorage.getItem(KEY) as string);

function setup(showError = vi.fn()) {
    const view = renderHook(() => useSessionLock(showError));
    return { ...view, showError };
}

/** Доставляет сообщение другой вкладки в канал с монтирования. */
function send(index: number, data: unknown): void {
    act(() => channels[index].onmessage?.(new MessageEvent('message', { data })));
}

beforeEach(() => {
    channels = [];
    localStorage.clear();
    vi.stubGlobal('BroadcastChannel', ControlledChannel);
});

afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe('useSessionLock — владелец сессии', () => {
    test('на монтаже пишет heartbeat, отправляет hello и не показывает модалку', () => {
        const { result, showError } = setup();

        expect(channels[0].name).toBe('mathlingo_session');
        expect(channels[0].postMessage).toHaveBeenCalledWith({ type: 'hello' });
        expect(ownMark().id).toEqual(expect.any(String));
        expect(ownMark().ts).toBeGreaterThan(Date.now() - 1000);
        expect(result.current.blocked).toBe(false);
        expect(showError).not.toHaveBeenCalled();
    });

    test('на hello отвечает busy и молчит, обновляя метку', () => {
        const { result, showError } = setup();

        send(0, { type: 'hello' });

        expect(channels[0].postMessage).toHaveBeenCalledWith({ type: 'busy' });
        expect(showError).not.toHaveBeenCalled();
        expect(result.current.blocked).toBe(false);
    });

    test('cleanup закрывает канал и снимает свою метку', () => {
        const { unmount } = setup();
        expect(ownMark().id).toEqual(expect.any(String));

        unmount();

        expect(channels[0].close).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem(KEY)).toBeNull();
    });

    test('cleanup не удаляет чужую метку', () => {
        localStorage.setItem(KEY, mark('owner'));
        const { unmount } = setup();

        unmount();

        expect(JSON.parse(localStorage.getItem(KEY) as string).id).toBe('owner');
    });
});

describe('useSessionLock — претендент', () => {
    test('свежая чужая метка: blocked, модалка один раз, метка владельца цела', () => {
        localStorage.setItem(KEY, mark('owner'));
        const { result, showError } = setup();

        expect(result.current.blocked).toBe(true);
        expect(showError).toHaveBeenCalledWith(SESSION_BUSY_TITLE, SESSION_BUSY_MESSAGE);
        expect(ownMark().id).toBe('owner');

        send(0, { type: 'busy' });
        expect(showError).toHaveBeenCalledTimes(1);
    });

    test('ответ busy: blocked, модалка и освобождение своей метки', () => {
        const { result, showError } = setup();

        send(0, { type: 'busy' });

        expect(result.current.blocked).toBe(true);
        expect(showError).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem(KEY)).toBeNull();
    });

    test('истёкшая метка и старое значение «1» → запуск без модалки', () => {
        localStorage.setItem(KEY, mark('owner', 3000));
        const first = setup();
        expect(first.result.current.blocked).toBe(false);
        expect(first.showError).not.toHaveBeenCalled();
        first.unmount();

        localStorage.setItem(KEY, '1');
        const second = setup();
        expect(second.result.current.blocked).toBe(false);
        expect(second.showError).not.toHaveBeenCalled();
        expect(ownMark().id).toEqual(expect.any(String));
    });

    test('StrictMode: двойной монтаж не блокирует сам себя', () => {
        const showError = vi.fn();

        const { result } = renderHook(() => useSessionLock(showError), { wrapper: StrictMode });

        expect(result.current.blocked).toBe(false);
        expect(showError).not.toHaveBeenCalled();
    });
});

describe('useSessionLock — fallback без BroadcastChannel', () => {
    const noChannel = class {
        constructor() {
            throw new Error('BroadcastChannel is not supported');
        }
    };

    test('свободная метка записывается, модалки нет', () => {
        vi.stubGlobal('BroadcastChannel', noChannel);
        const { showError } = setup();

        expect(showError).not.toHaveBeenCalled();
        expect(ownMark().id).toEqual(expect.any(String));
    });

    test('занятая метка показывает модалку', () => {
        localStorage.setItem(KEY, mark('owner'));
        vi.stubGlobal('BroadcastChannel', noChannel);
        const { result, showError } = setup();

        expect(result.current.blocked).toBe(true);
        expect(showError).toHaveBeenCalledWith(SESSION_BUSY_TITLE, SESSION_BUSY_MESSAGE);
    });
});
