// Repository: базовый класс — контракт «Not implemented» для трёх методов.

import { describe, expect, test } from 'vitest';
import { Repository } from '../../src/data/repository';

describe('Repository', () => {
    test.each(['save', 'load', 'clear'] as const)('%s бросает Not implemented', (method) => {
        const repo = new Repository();

        expect(() => (method === 'save' ? repo.save({}) : repo[method]())).toThrow('Not implemented');
    });
});
