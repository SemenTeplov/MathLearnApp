// ============================================
// ERRORS/CUSTOM-ERRORS.TS — кастомные исключения
// ============================================

/** Базовое исключение для ошибок хранилища. */
class StorageError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StorageError';
    }
}

/** Данные в хранилище повреждены. */
class CorruptedDataError extends StorageError {
    constructor(message: string) {
        super(message);
        this.name = 'CorruptedDataError';
    }
}

/** Хранилище недоступно. */
class StorageUnavailableError extends StorageError {
    constructor(message: string) {
        super(message);
        this.name = 'StorageUnavailableError';
    }
}

/** Превышена квота хранилища. */
class QuotaExceededError extends StorageError {
    constructor(message: string) {
        super(message);
        this.name = 'QuotaExceededError';
    }
}

/** Ошибка сессии (например, дубликат вкладки). */
class SessionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SessionError';
    }
}
