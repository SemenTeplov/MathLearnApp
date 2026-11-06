// ============================================
// APP/TYPES.TS — тип Services для оболочки и хуков (1.10.0)
// ============================================

import type { StatsService } from '../data/stats-service';
import type { AudioService } from '../services/audio-service';
import type { ErrorBus } from './error-bus';

/** Сервисы приложения; создаются один раз в createServices(). */
export interface Services {
    audio: AudioService;
    stats: StatsService;
    /** Шина игровых сообщений: data-слой → единственный showError в App. */
    errors: ErrorBus;
}
