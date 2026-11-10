// ============================================
// APP/CREATESERVICES.TS — composition root (1.10.0)
// ============================================

import { CONFIG } from '../core/config';
import { LocalStorageRepository } from '../data/local-repository';
import { createMemoryFallback } from '../data/memory-fallback';
import { StatsService } from '../data/stats-service';
import { AudioService } from '../services/audio-service';
import { ErrorBus } from './error-bus';
import type { Services } from './types';

/** Создаёт сервисы приложения (единственная точка new в приложении). */
export function createServices(): Services {
    const errors = new ErrorBus();
    const stats = new StatsService(
        new LocalStorageRepository(CONFIG.STORAGE_PREFIX + 'stats'),
        errors,
        createMemoryFallback
    );
    return { audio: new AudioService(), stats, errors };
}
