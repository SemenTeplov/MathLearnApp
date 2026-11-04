// ============================================
// SETUP.TS — общие моки для тестов
// ============================================
// Никаких копий CONFIG: тесты импортируют боевой src/core/config.
// jsdom не умеет воспроизводить звук, поэтому Audio замокан один раз.

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

vi.stubGlobal('Audio', AudioMock);
