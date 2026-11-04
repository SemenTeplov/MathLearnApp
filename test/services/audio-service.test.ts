// AudioService: предзагрузка трёх звуков и безопасное воспроизведение.

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AudioService } from '../../src/services/audio-service';

const play = vi.fn().mockResolvedValue(undefined);
const pause = vi.fn();
const cloneNode = vi.fn(() => ({ play, pause }));
const AudioMock = vi.fn(function (src?: string) {
    void src;
    return { play, pause, cloneNode };
});

vi.stubGlobal('Audio', AudioMock);

describe('AudioService', () => {
    let service: AudioService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AudioService();
    });

    describe('preload', () => {
        test('успешно загружается', () => {
            expect(service).toBeDefined();
        });

        test('пытается загрузить 3 звука', () => {
            service.preload();

            expect(AudioMock).toHaveBeenCalledTimes(3);
        });

        test('загружает звуки click, win, lose', () => {
            service.preload();
            const calls = AudioMock.mock.calls.map((call) => call[0]);

            expect(calls).toContain('audio/click.mp3');
            expect(calls).toContain('audio/win.mp3');
            expect(calls).toContain('audio/lose.mp3');
        });

        test('не блокирует приложение при ошибке загрузки', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            AudioMock.mockImplementationOnce(() => {
                throw new Error('Audio error');
            });

            expect(() => service.preload()).not.toThrow();
            expect(warn).toHaveBeenCalled();

            warn.mockRestore();
        });
    });

    describe('play', () => {
        test('до preload ничего не делает', () => {
            expect(() => service.play('click')).not.toThrow();
            expect(cloneNode).not.toHaveBeenCalled();
        });

        test('после preload клонирует и запускает нужный звук', () => {
            service.preload();
            service.play('win');

            expect(cloneNode).toHaveBeenCalledTimes(1);
            expect(play).toHaveBeenCalledTimes(1);
        });

        test('обрабатывает ошибку клонирования без падения', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            service.preload();
            cloneNode.mockImplementationOnce(() => {
                throw new Error('clone error');
            });

            expect(() => service.play('click')).not.toThrow();
            expect(warn).toHaveBeenCalled();

            warn.mockRestore();
        });

        test('глотает отклонённый play()', async () => {
            service.preload();
            play.mockRejectedValueOnce(new Error('blocked'));

            expect(() => service.play('lose')).not.toThrow();
            await Promise.resolve();
        });
    });
});
