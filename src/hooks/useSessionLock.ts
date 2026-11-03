// ============================================
// SRC/HOOKS/useSessionLock.ts — блокировка второй вкладки (1.8.0)
// ============================================
// Замена SessionController: BroadcastChannel('mathlingo_session') + 'hello';
// сообщение от другой вкладки один раз показывает модалку «Игра уже запущена».
// Fallback без BroadcastChannel — ключ ml_session_lock в localStorage.
// Cleanup закрывает канал и снимает ключ (идемпотентно для StrictMode).

import { useEffect } from 'react';

/** Показ модалки ошибки (state в App). */
export type ShowError = (title: string, message: string) => void;

export function useSessionLock(showError: ShowError): void {
    useEffect(() => {
        let channel: BroadcastChannel | null = null;
        let locked = false;

        const lock = (): void => {
            if (locked) return;
            locked = true;
            showError('Игра уже запущена', 'Закройте другую вкладку с MathLingo.');
        };

        try {
            channel = new BroadcastChannel('mathlingo_session');
            channel.onmessage = lock;
            channel.postMessage('hello');
        } catch {
            // BroadcastChannel не поддерживается — блокировка через localStorage
            try {
                if (localStorage.getItem('ml_session_lock')) {
                    lock();
                } else {
                    localStorage.setItem('ml_session_lock', '1');
                }
            } catch {
                // localStorage недоступен — блокировки нет
            }
        }

        return () => {
            if (channel) {
                try {
                    channel.close();
                } catch {
                    // канал уже закрыт
                }
            }
            try {
                localStorage.removeItem('ml_session_lock');
            } catch {
                // localStorage недоступен
            }
        };
    }, [showError]);
}
