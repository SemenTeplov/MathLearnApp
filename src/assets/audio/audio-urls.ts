// ============================================
// ASSETS/AUDIO/AUDIO-URLS.TS — адреса звуков (1.8.4)
// ============================================
// Vite подставляет сюда URL собранного файла (?url): в dev — путь к исходнику,
// в production — ./assets/<name>-<hash>.mp3. Строковых путей к звукам в коде нет,
// поэтому отсутствующий mp3 ломает сборку, а не даёт 404 в проде.

import clickUrl from './click.mp3?url';
import winUrl from './win.mp3?url';
import loseUrl from './lose.mp3?url';

/** Звуки приложения; порядок предзагрузки сохранён с 1.2.0. */
export const AUDIO_URLS = {
    click: clickUrl,
    win: winUrl,
    lose: loseUrl
} as const;

/** Имя звука, который умеет проигрывать AudioService. */
export type AudioKind = keyof typeof AUDIO_URLS;
