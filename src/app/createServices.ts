// ============================================
// APP/CREATESERVICES.TS — composition root (1.8.2)
// ============================================

import { CONFIG } from '../core/config';
import { LocalStorageRepository } from '../data/local-repository';
import { StatsService } from '../data/stats-service';
import { AudioService } from '../services/audio-service';
import type { Services } from './types';

/** Создаёт сервисы приложения (единственная точка new в приложении). */
export function createServices(): Services {
    const stats = new StatsService(new LocalStorageRepository(CONFIG.STORAGE_PREFIX + 'stats'));
    return { audio: new AudioService(), stats };
}
