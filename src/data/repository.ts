// ============================================
// DATA/REPOSITORY.TS — базовый класс Repository (1.8.2)
// ============================================

/**
 * Базовый класс репозитория.
 * Определяет контракт для всех реализаций хранилища.
 */
export class Repository {
    /** Сохраняет данные. */
    save(data: unknown): void {
        throw new Error('Not implemented');
    }

    /** Загружает данные. */
    load(): unknown {
        throw new Error('Not implemented');
    }

    /** Очищает данные. */
    clear(): void {
        throw new Error('Not implemented');
    }
}
