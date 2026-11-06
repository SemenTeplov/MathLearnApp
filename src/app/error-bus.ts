// ============================================
// APP/ERROR-BUS.TS — шина игровых сообщений (1.10.0)
// ============================================
// Data-слой публикует сообщение, оболочка (App) показывает его модалкой.
// Состояние живёт только в экземпляре: без window.* и модульных переменных (A78).

/** Слушатель игрового сообщения: заголовок и текст модалки. */
export type ErrorListener = (title: string, message: string) => void;

/** Заголовок модалки для ошибок хранилища (решение 3 плана). */
export const STORAGE_ERROR_TITLE = 'Ошибка хранилища';

/** Шина сообщений об ошибках: subscribe/report, единственный канал показа. */
export class ErrorBus {
    _listeners: ErrorListener[] = [];

    /** Подписывает слушателя; возвращает функцию отписки. */
    subscribe(listener: ErrorListener): () => void {
        this._listeners.push(listener);
        return () => {
            const index = this._listeners.indexOf(listener);
            if (index >= 0) this._listeners.splice(index, 1);
        };
    }

    /** Публикует сообщение всем подписчикам. */
    report(title: string, message: string): void {
        this._listeners.forEach((listener) => listener(title, message));
    }
}
