// ============================================
// SETUP.TS — общие моки и матчеры для тестов
// ============================================
// Никаких копий CONFIG: тесты импортируют боевой src/core/config.
// jsdom не умеет воспроизводить звук, поэтому Audio замокан один раз.
// BroadcastChannel замокан безопасной по умолчанию заглушкой (D39/D40):
// сообщений она не рассылает, поэтому вторая вкладка «не мешает».
// Управляемую заглушку сьют ставит сам через vi.stubGlobal в beforeEach.

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const play = vi.fn().mockResolvedValue(undefined);
const pause = vi.fn();
const cloneNode = vi.fn(() => ({ play, pause }));

const AudioMock = vi.fn(function (this: {
    play: typeof play;
    pause: typeof pause;
    cloneNode: typeof cloneNode;
}) {
    this.play = play;
    this.pause = pause;
    this.cloneNode = cloneNode;
});

/** Заглушка канала: ничего не принимает и не рассылает. */
class BroadcastChannelStub {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage = vi.fn();
    close = vi.fn();
    constructor(public name: string) {}
}

vi.stubGlobal('Audio', AudioMock);
vi.stubGlobal('BroadcastChannel', BroadcastChannelStub);
