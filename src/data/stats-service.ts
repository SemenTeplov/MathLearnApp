// ============================================
// DATA/STATS-SERVICE.TS — счёт и позиция по картам (1.10.1)
// ============================================
// Ожидаемая ошибка хранилища не глотается: handleError() классифицирует её,
// сервис применяет действие (reset/skip/memory) и публикует сообщение через
// порт ErrorReporter (A79/A87). Миграция фиксируется write-back (A89).

import { CONFIG } from '../core/config';
import { handleError } from '../core/error-handler';
import { STORAGE_ERROR_TITLE } from '../core/error-reporting';
import type { ErrorReporter } from '../core/error-reporting';
import { MapCatalog } from '../core/map-catalog';
import { StatsSchema } from '../core/stats-schema';
import type { ErrorInfo, Stats } from '../core/types';
import { createMemoryFallback } from './memory-fallback';
import type { FallbackFactory } from './memory-fallback';
import type { Repository } from './repository';

/** Глубокая копия: правки попадают в хранилище только после успешной записи (A12). */
function clone(stats: Stats): Stats {
    return JSON.parse(JSON.stringify(stats)) as Stats;
}

/**
 * Сервис статистики игрока: счёт и позиция текущей карты.
 * Работает через Repository и StatsSchema, обрабатывает ошибки.
 */
export class StatsService {
    _repo: Repository;
    _errors: ErrorReporter | null;
    _fallback: FallbackFactory;
    _reported: string | null = null;
    _logged: Set<string> = new Set();

    /**
     * @param repo — основное хранилище
     * @param errors — получатель игровых сообщений (без него сообщения не публикуются)
     * @param fallback — фабрика резервного репозитория для режима «память»
     */
    constructor(
        repo: Repository,
        errors: ErrorReporter | null = null,
        fallback: FallbackFactory = createMemoryFallback
    ) {
        this._repo = repo;
        this._errors = errors;
        this._fallback = fallback;
    }

    /** Загружает статистику: ошибка классифицируется, действие применяется (A79). */
    load(): Stats {
        try {
            return this._read();
        } catch (e) {
            this._recover(handleError(e as Error, 'StatsService.load'));
            return this._readOrDefaults();
        }
    }

    /** Сохраняет статистику (write-ahead); true — запись прошла. */
    save(stats: Stats): boolean {
        try {
            this._repo.save(stats);
            this._reported = null;
            return true;
        } catch (e) {
            this._recover(handleError(e as Error, 'StatsService.save'));
            return false;
        }
    }

    /** Идентификатор текущей карты. */
    getCurrentMap(): string {
        return this.load().currentMap;
    }

    /** Счёт текущей карты. */
    getTotalScore(): number {
        return StatsSchema.entry(this.load()).totalScore;
    }

    /** Обновляет счёт текущей карты; false — счёт не сохранён и не зачтён. */
    updateAfterRound(roundScore: number): boolean {
        const stats = clone(this.load());
        StatsSchema.entry(stats).totalScore += roundScore;
        return this.save(stats);
    }

    /** Возвращает сохранённый индекс текущего тренажёра текущей карты. */
    getTrainerIndex(): number {
        return StatsSchema.entry(this.load()).currentTrainerIndex;
    }

    /** Сохраняет индекс текущего тренажёра (после игры). */
    saveTrainerIndex(index: number): boolean {
        const stats = clone(this.load());
        StatsSchema.entry(stats).currentTrainerIndex = index;
        return this.save(stats);
    }

    /**
     * Переключает текущую карту и сбрасывает её позицию (A31).
     * Та же или неизвестная карта, а также провал записи → false.
     */
    switchMap(mapId: string): boolean {
        if (!MapCatalog.has(mapId)) {
            return false;
        }

        const stats = clone(this.load());
        if (stats.currentMap === mapId) {
            return false;
        }

        stats.currentMap = mapId;
        StatsSchema.entry(stats).currentTrainerIndex = -1;
        return this.save(stats);
    }

    /** Сбрасывает статистику всех карт. */
    reset(): boolean {
        return this.save(StatsSchema.defaults());
    }

    /** Применяет действие из ErrorInfo и публикует сообщение игроку (T71, TR-78). */
    _recover(info: ErrorInfo): void {
        if (info.action === 'reset') this._clear();
        if (info.action === 'memory') this._toMemory();
        this._report(info);
    }

    /** Очищает повреждённую запись; её место занимают значения по умолчанию. */
    _clear(): void {
        try {
            this._repo.clear();
        } catch {
            // Запись всё равно заменяется значениями по умолчанию — сбой очистки не критичен.
        }
    }

    /** Переводит статистику в режим «память вместо диска» (T72). */
    _toMemory(): void {
        let snapshot: unknown = null;
        try {
            snapshot = this._repo.load();
        } catch {
            // Основное хранилище недоступно: режим памяти стартует с пустых данных.
        }
        this._repo = this._fallback(snapshot);
    }

    /** Одна ошибка — одно сообщение, пока не было успешной записи (A79). */
    _report(info: ErrorInfo): void {
        if (!this._errors) return;
        const key = info.action + '|' + info.userMessage;
        if (key === this._reported) return;
        this._reported = key;
        this._errors.report(STORAGE_ERROR_TITLE, info.userMessage);
    }

    /** Читает запись, мигрирует и фиксирует миграцию в хранилище (A89/T81). */
    _read(): Stats {
        const data = this._repo.load();
        if (!data) return StatsSchema.defaults();

        const version = (data as { version?: number }).version || 0;
        const migrated = StatsSchema.migrate(data, (from, to) => this._logStep(from, to));
        if (version < CONFIG.VERSION) this._writeBack(migrated);
        return migrated;
    }

    /** Write-back мигрированной записи: провал не прерывает игру (A89/Z47). */
    _writeBack(stats: Stats): void {
        try {
            this._repo.save(stats);
            this._reported = null;
        } catch (e) {
            this._recover(handleError(e as Error, 'StatsService.save'));
        }
    }

    /** Ступень миграции печатается один раз за экземпляр (A89/Z47). */
    _logStep(from: number, to: number): void {
        const key = from + '→' + to;
        if (this._logged.has(key)) return;
        this._logged.add(key);
        console.info('[StatsSchema] миграция', from, '→', to);
    }

    /** Чтение после применённого действия: сбой чтения уже не показывается повторно. */
    _readOrDefaults(): Stats {
        try {
            return this._read();
        } catch {
            return StatsSchema.defaults();
        }
    }
}
