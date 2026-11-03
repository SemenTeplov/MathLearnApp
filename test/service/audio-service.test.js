// Мокаем Audio
const mockAudioPlay = vi.fn().mockResolvedValue(undefined);
const mockAudioClone = vi.fn().mockReturnValue({ play: mockAudioPlay });
const mockAudioPause = vi.fn();

global.Audio = vi.fn(function () {
    this.play = mockAudioPlay;
    this.cloneNode = mockAudioClone;
    this.pause = mockAudioPause;
});

// Загружаем AudioService
eval(require('fs').readFileSync('./js/service/audio-service.js', 'utf8') + '\nglobal.AudioService = AudioService;');

describe('AudioService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        AudioService.preload();
    });

    describe('preload', () => {
        test('успешно загружается', () => {
            expect(AudioService).toBeDefined();
        });

        test('пытается загрузить 3 звука', () => {
            expect(global.Audio).toHaveBeenCalledTimes(3);
        });

        test('загружает звуки click, win, lose', () => {
            const calls = global.Audio.mock.calls.map(c => c[0]);
            expect(calls).toContain('audio/click.mp3');
            expect(calls).toContain('audio/win.mp3');
            expect(calls).toContain('audio/lose.mp3');
        });

        test('не блокирует приложение при ошибке загрузки', () => {
            const originalWarn = console.warn;
            const mockWarn = vi.fn();
            console.warn = mockWarn;

            const originalAudio = global.Audio;
            global.Audio = vi.fn().mockImplementation(() => {
                throw new Error('Audio error');
            });

            expect(() => AudioService.preload()).not.toThrow();
            expect(mockWarn).toHaveBeenCalled();

            console.warn = originalWarn;
            global.Audio = originalAudio;
        });
    });

    describe('play', () => {
        test('обрабатывает ошибку воспроизведения без падения', () => {
            expect(() => AudioService.play('click')).not.toThrow();
        });
    });
});
