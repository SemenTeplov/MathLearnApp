// ============================================
// STORAGE/SESSION-REPOSITORY.TS — no-op хранилище
// ============================================

/**
 * Реализация Repository для состояния раунда.
 * Не сохраняет ничего на диск — состояние раунда не сохраняется (US-15).
 */
class SessionRepository extends Repository {
    /** No-op: состояние раунда не сохраняется. */
    save(_data: unknown): void {
        // no-op
    }

    /** Всегда возвращает null — нет сохранённого состояния. */
    load(): null {
        return null;
    }

    /** No-op. */
    clear(): void {
        // no-op
    }
}
