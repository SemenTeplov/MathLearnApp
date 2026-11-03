// ============================================
// ERRORS/ERROR-HANDLER.TS — централизованная обработка ошибок
// ============================================

/**
 * Централизованный обработчик ошибок.
 * Классифицирует ошибки, возвращает действие и сообщение.
 */
const ErrorHandler = {
    /**
     * Обрабатывает ошибку и возвращает инструкцию.
     * @param error — перехваченная ошибка
     * @param context — контекст вызова
     */
    handle(error: Error, context: string): ErrorInfo {
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
    },

    /** Инициализирует глобальные обработчики. */
    init(): void {
        window.addEventListener('error', function (event) {
            console.error('[ErrorHandler] uncaught', event.error?.message || event.message);
        });
        window.addEventListener('unhandledrejection', function (event) {
            console.error('[ErrorHandler] unhandled rejection', event.reason?.message || event.reason);
        });
    }
};
