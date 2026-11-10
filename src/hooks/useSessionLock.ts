// ============================================
// SRC/HOOKS/useSessionLock.ts — блокировка второй вкладки (1.10.0)
// ============================================
// Владелец сессии — первая вкладка: она молчит и отвечает 'busy' на 'hello'.
// Новая вкладка сама обнаруживает занятость: свежая чужая heartbeat-метка
// ml_session_lock ({id, ts}, TTL 2500 мс, шаг 1000 мс) или ответ 'busy'.
// Fallback без BroadcastChannel — та же метка и та же семантика (A81, T73).

import { useEffect, useRef, useState } from 'react';

/** Показ модалки ошибки (state в App). */
export type ShowError = (title: string, message: string) => void;

/** Заголовок модалки занятой сессии (текст не меняется). */
export const SESSION_BUSY_TITLE = 'Игра уже запущена';
/** Текст модалки занятой сессии (текст не меняется). */
export const SESSION_BUSY_MESSAGE = 'Закройте другую вкладку с MathLingo.';

const SESSION_CHANNEL = 'mathlingo_session';
const SESSION_LOCK_KEY = 'ml_session_lock';
const LOCK_TTL = 2500;
const HEARTBEAT_MS = 1000;

interface SessionMessage {
    type: 'hello' | 'busy';
}

interface LockMark {
    id: string;
    ts: number;
}

/** Метка блокировки; значение '1' или не-JSON считается свободной меткой (решение 9). */
function readMark(): LockMark | null {
    try {
        const raw = localStorage.getItem(SESSION_LOCK_KEY);
        if (!raw) return null;
        const mark = JSON.parse(raw) as LockMark;
        if (!mark || typeof mark !== 'object') return null;
        if (typeof mark.id !== 'string' || typeof mark.ts !== 'number') return null;
        return mark;
    } catch {
        // Нет localStorage или значение старого формата — метка свободна.
        return null;
    }
}

/** Записывает heartbeat владельца. */
function writeMark(id: string): void {
    try {
        localStorage.setItem(SESSION_LOCK_KEY, JSON.stringify({ id, ts: Date.now() }));
    } catch {
        // localStorage недоступен: остаётся канал, блокировка не критична для игры.
    }
}

/** Снимает метку, только если она наша (Z40). */
function removeMark(id: string): void {
    try {
        const mark = readMark();
        if (!mark || mark.id === id) localStorage.removeItem(SESSION_LOCK_KEY);
    } catch {
        // localStorage недоступен — удалять нечего.
    }
}

/** Свежая чужая метка означает занятую сессию. */
function isForeignFresh(mark: LockMark | null, id: string): boolean {
    return mark !== null && mark.id !== id && Date.now() - mark.ts < LOCK_TTL;
}

/**
 * Блокировка второй вкладки.
 * @param showError — модалка; вызывается один раз у вкладки-претендента
 */
export function useSessionLock(showError: ShowError): { blocked: boolean } {
    const [blocked, setBlocked] = useState(false);
    const blockedRef = useRef(false);

    useEffect(() => {
        const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
        let channel: BroadcastChannel | null = null;
        let beat: ReturnType<typeof setInterval> | null = null;
        let claimed = false;

        const release = (): void => {
            if (beat) clearInterval(beat);
            beat = null;
            if (claimed) removeMark(id);
            claimed = false;
        };

        const lock = (): void => {
            if (blockedRef.current) return;
            blockedRef.current = true;
            setBlocked(true);
            release();
            showError(SESSION_BUSY_TITLE, SESSION_BUSY_MESSAGE);
        };

        if (isForeignFresh(readMark(), id)) {
            lock();
        } else {
            claimed = true;
            writeMark(id);
            beat = setInterval(() => writeMark(id), HEARTBEAT_MS);
        }

        try {
            channel = new BroadcastChannel(SESSION_CHANNEL);
            channel.onmessage = (event: MessageEvent) => {
                const message = event.data as SessionMessage | null;
                if (message && message.type === 'hello') {
                    // Владелец модалку не показывает, а молча подтверждает занятость.
                    if (claimed) {
                        writeMark(id);
                        channel?.postMessage({ type: 'busy' });
                    }
                    return;
                }
                if (message && message.type === 'busy') lock();
            };
            channel.postMessage({ type: 'hello' });
        } catch {
            // BroadcastChannel не поддерживается — блокировка по метке localStorage (Z39).
        }

        return () => {
            release();
            if (channel) {
                try {
                    channel.close();
                } catch {
                    // канал уже закрыт
                }
            }
        };
    }, [showError]);

    return { blocked };
}
