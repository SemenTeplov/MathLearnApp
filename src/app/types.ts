// ============================================
// APP/TYPES.TS — тип Services для оболочки и хуков (1.8.2)
// ============================================

import type { StatsService } from '../data/stats-service';
import type { AudioService } from '../services/audio-service';

/** Сервисы приложения; создаются один раз в createServices(). */
export interface Services {
    audio: AudioService;
    stats: StatsService;
}
