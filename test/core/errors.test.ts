// errors: цепочка наследования, имена и обособленность SessionError.

import { describe, expect, test } from 'vitest';
import {
    CorruptedDataError,
    QuotaExceededError,
    SessionError,
    StorageError,
    StorageUnavailableError
} from '../../src/core/errors';

describe('errors', () => {
    test('ошибки хранилища наследуются от StorageError и Error', () => {
        const errors = [
            new StorageError('base'),
            new CorruptedDataError('corrupted'),
            new StorageUnavailableError('unavailable'),
            new QuotaExceededError('quota')
        ];

        for (const error of errors) {
            expect(error).toBeInstanceOf(StorageError);
            expect(error).toBeInstanceOf(Error);
        }
    });

    test('у каждого класса своё имя', () => {
        expect(new StorageError('x').name).toBe('StorageError');
        expect(new CorruptedDataError('x').name).toBe('CorruptedDataError');
        expect(new StorageUnavailableError('x').name).toBe('StorageUnavailableError');
        expect(new QuotaExceededError('x').name).toBe('QuotaExceededError');
        expect(new SessionError('x').name).toBe('SessionError');
    });

    test('SessionError — Error, но не StorageError', () => {
        const error = new SessionError('dup');

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(StorageError);
        expect(error.message).toBe('dup');
    });
});
