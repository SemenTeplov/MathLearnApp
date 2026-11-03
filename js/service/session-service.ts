// ============================================
// SERVICE/SESSION-SERVICE.TS — управление состоянием раунда
// ============================================

/**
 * Сервис для управления состоянием раунда.
 * Ничего не сохраняет — состояние раунда сгорает при выходе (US-15).
 */
const SessionService = {
    _repo: null as Repository | null,

    /** Инициализирует репозиторий. */
    init(repo: Repository): void {
        this._repo = repo;
    },

    /** No-op: состояние раунда не сохраняется. */
    save(_session: unknown): void {
        // no-op
    },

    /** Всегда возвращает null. */
    load(): null {
        return null;
    },

    /** No-op. */
    clear(): void {
        // no-op
    }
};
