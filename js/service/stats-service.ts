// ============================================
// SERVICE/STATS-SERVICE.TS — счёт и позиция по картам
// ============================================

/**
 * Сервис статистики игрока: счёт и позиция текущей карты.
 * Работает через Repository и StatsSchema, обрабатывает ошибки.
 */
const StatsService = {
    _repo: null as Repository | null,

    /** Инициализирует репозиторий. */
    init(repo: Repository): void {
        this._repo = repo;
    },

    /** Загружает статистику с обработкой ошибок и миграций. */
    load(): Stats {
        try {
            const data = this._repo!.load();
            if (!data) {
                return StatsSchema.defaults();
            }
            return StatsSchema.migrate(data);
        } catch (e) {
            if (e instanceof CorruptedDataError) {
                ErrorHandler.handle(e, 'StatsService.load');
                return StatsSchema.defaults();
            }
            if (e instanceof StorageUnavailableError) {
                ErrorHandler.handle(e, 'StatsService.load');
                return StatsSchema.defaults();
            }
            throw e;
        }
    },

    /** Сохраняет статистику (write-ahead). */
    save(stats: Stats): void {
        try {
            this._repo!.save(stats);
        } catch (e) {
            ErrorHandler.handle(e as Error, 'StatsService.save');
        }
    },

    /** Идентификатор текущей карты. */
    getCurrentMap(): string {
        return this.load().currentMap;
    },

    /** Счёт текущей карты. */
    getTotalScore(): number {
        const entry: MapData = StatsSchema.entry(this.load());
        return entry.totalScore;
    },

    /** Обновляет счёт текущей карты после успешного раунда. */
    updateAfterRound(roundScore: number): void {
        const stats = this.load();
        const entry: MapData = StatsSchema.entry(stats);
        entry.totalScore += roundScore;
        this.save(stats);
    },

    /** Возвращает сохранённый индекс текущего тренажёра текущей карты. */
    getTrainerIndex(): number {
        const entry: MapData = StatsSchema.entry(this.load());
        return entry.currentTrainerIndex;
    },

    /** Сохраняет индекс текущего тренажёра (после игры). */
    saveTrainerIndex(index: number): void {
        const stats = this.load();
        const entry: MapData = StatsSchema.entry(stats);
        entry.currentTrainerIndex = index;
        this.save(stats);
    },

    /**
     * Переключает текущую карту и сбрасывает её позицию (A31).
     * Та же или неизвестная карта → false без записи.
     */
    switchMap(mapId: string): boolean {
        if (!MapCatalog.has(mapId)) {
            return false;
        }

        const stats = this.load();
        if (stats.currentMap === mapId) {
            return false;
        }

        stats.currentMap = mapId;
        const entry: MapData = StatsSchema.entry(stats);
        entry.currentTrainerIndex = -1;
        this.save(stats);
        return true;
    },

    /** Сбрасывает статистику всех карт. */
    reset(): void {
        this.save(StatsSchema.defaults());
    }
};
