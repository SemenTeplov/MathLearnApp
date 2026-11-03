// ============================================
// STORAGE/REPOSITORY.TS — базовый класс Repository
// ============================================

/**
 * Базовый класс репозитория.
 * Определяет контракт для всех реализаций хранилища.
 */
class Repository {
    /**
     * Сохраняет данные.
     * @throws — не реализовано
     */
    save(data: unknown): void {
        throw new Error('Not implemented');
    }

    /**
     * Загружает данные.
     * @throws — не реализовано
     */
    load(): unknown {
        throw new Error('Not implemented');
    }

    /**
     * Очищает данные.
     * @throws — не реализовано
     */
    clear(): void {
        throw new Error('Not implemented');
    }
}
