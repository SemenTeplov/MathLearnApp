// ============================================
// CORE/ERRORS.TS — кастомные исключения (1.8.2)
// ============================================

/** Базовое исключение для ошибок хранилища. */
export class StorageError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StorageError';
    }
}

/** Данные в хранилище повреждены. */
export class CorruptedDataError extends StorageError {
    constructor(message: string) {
        super(message);
        this.name = 'CorruptedDataError';
    }
}

/** Хранилище недоступно. */
export class StorageUnavailableError extends StorageError {
    constructor(message: string) {
        super(message);
        this.name = 'StorageUnavailableError';
    }
}

/** Превышена квота хранилища. */
export class QuotaExceededError extends StorageError {
    constructor(message: string) {
        super(message);
        this.name = 'QuotaExceededError';
    }
}

/** Ошибка сессии (например, дубликат вкладки). */
export class SessionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SessionError';
    }
}
