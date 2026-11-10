// error-handler: классификация четырёх известных ошибок, проброс неизвестной
// и регистрация глобальных обработчиков.

import { afterEach, describe, expect, test, vi } from 'vitest';
import { handleError, initGlobalErrorHandlers } from '../../src/core/error-handler';
import { CorruptedDataError, QuotaExceededError, SessionError, StorageUnavailableError } from '../../src/core/errors';

const CASES: [Error, string, string][] = [
    [new CorruptedDataError('broken'), 'reset', 'Данные повреждены. Счёт сброшен.'],
    [new QuotaExceededError('full'), 'skip', 'Хранилище заполнено. Данные не сохранятся.'],
    [new StorageUnavailableError('offline'), 'memory', 'Хранилище недоступно. Игра работает без сохранения.'],
    [new SessionError('dup'), 'reset', 'Ошибка сессии. Начните заново.']
];

describe('handleError', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test.each(CASES)('%s → action %s', (error, action, userMessage) => {
        expect(handleError(error, 'ctx')).toEqual({ action, userMessage });
    });

    test('неизвестная ошибка логируется и пробрасывается', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const error = new Error('boom');

        expect(() => handleError(error, 'app.start')).toThrow(error);
        expect(consoleError).toHaveBeenCalledWith('[ErrorHandler]', 'boom', 'app.start');
    });
});

describe('initGlobalErrorHandlers', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('вешает обработчики error и unhandledrejection', () => {
        const spy = vi.spyOn(window, 'addEventListener');

        initGlobalErrorHandlers();

        expect(spy).toHaveBeenCalledWith('error', expect.any(Function));
        expect(spy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    test('обработчики логируют ошибку и rejection', () => {
        const listeners: Record<string, EventListener> = {};
        vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
            listeners[type] = listener as EventListener;
        });
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        initGlobalErrorHandlers();

        listeners.error(new ErrorEvent('error', { message: 'oops', error: new Error('oops') }));
        listeners.unhandledrejection(Object.assign(new Event('unhandledrejection'), { reason: new Error('rejected') }));

        expect(consoleError).toHaveBeenCalledWith('[ErrorHandler] uncaught', 'oops');
        expect(consoleError).toHaveBeenCalledWith('[ErrorHandler] unhandled rejection', 'rejected');
    });

    test('обработчик error работает без объекта ошибки', () => {
        const listeners: Record<string, EventListener> = {};
        vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
            listeners[type] = listener as EventListener;
        });
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        initGlobalErrorHandlers();

        listeners.error(new ErrorEvent('error', { message: 'plain' }));

        expect(consoleError).toHaveBeenCalledWith('[ErrorHandler] uncaught', 'plain');
    });
});
