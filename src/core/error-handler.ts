// ============================================
// CORE/ERROR-HANDLER.TS — централизованная обработка ошибок (1.8.2)
// ============================================

import { CorruptedDataError, QuotaExceededError, SessionError, StorageUnavailableError } from './errors';
import type { ErrorInfo } from './types';

/**
 * Классифицирует ошибку и возвращает действие и сообщение.
 * Неизвестная ошибка логируется и пробрасывается дальше.
 */
export function handleError(error: Error, context: string): ErrorInfo {
    if (error instanceof CorruptedDataError) {
        return { action: 'reset', userMessage: 'Данные повреждены. Счёт сброшен.' };
    }
    if (error instanceof QuotaExceededError) {
        return { action: 'skip', userMessage: 'Хранилище заполнено. Данные не сохранятся.' };
    }
    if (error instanceof StorageUnavailableError) {
        return { action: 'memory', userMessage: 'Хранилище недоступно. Игра работает без сохранения.' };
    }
    if (error instanceof SessionError) {
        return { action: 'reset', userMessage: 'Ошибка сессии. Начните заново.' };
    }
    console.error('[ErrorHandler]', error.message, context);
    throw error;
}

/** Инициализирует глобальные обработчики. */
export function initGlobalErrorHandlers(): void {
    window.addEventListener('error', function (event) {
        console.error('[ErrorHandler] uncaught', event.error?.message || event.message);
    });
    window.addEventListener('unhandledrejection', function (event) {
        console.error('[ErrorHandler] unhandled rejection', event.reason?.message || event.reason);
    });
}
