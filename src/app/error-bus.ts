// ============================================
// APP/ERROR-BUS.TS — шина игровых сообщений (1.10.1)
// ============================================
// Data-слой публикует сообщение, оболочка (App) показывает его модалкой.
// Сообщение, опубликованное до подписки, ждёт в очереди экземпляра и отдаётся
// первому подписчику ровно один раз (A86/T79); window.* и модульных
// переменных нет (A78).

import type { ErrorReporter } from '../core/error-reporting';

/** Слушатель игрового сообщения: заголовок и текст модалки. */
export type ErrorListener = (title: string, message: string) => void;

/** Шина сообщений об ошибках: subscribe/report, единственный канал показа. */
export class ErrorBus implements ErrorReporter {
    _listeners: ErrorListener[] = [];
    _pending: Array<[string, string]> = [];

    /** Отдаёт очередь первому подписчику и регистрирует слушателя. */
    subscribe(listener: ErrorListener): () => void {
        this._pending.splice(0).forEach(([title, message]) => listener(title, message));
        this._listeners.push(listener);
        return () => {
            const index = this._listeners.indexOf(listener);
            if (index >= 0) this._listeners.splice(index, 1);
        };
    }

    /** Без подписчиков — в очередь; с подписчиками — сразу всем. */
    report(title: string, message: string): void {
        if (this._listeners.length === 0) {
            this._pending.push([title, message]);
            return;
        }
        this._listeners.forEach((listener) => listener(title, message));
    }
}
