import {
    describe,
    it,
} from 'vitest';

import { AtomicStatus } from '../src/_internals/atomic-status';
import {
    getEnumNumberValues,
    getEnumValues,
} from '../src/_internals/enum';

describe.concurrent('atomicStatus', () => {
    it('should guard current status and validates transitions', ({ expect }) => {
        const status = new AtomicStatus('created');

        expect(status.is('created')).toBe(true);
        expect(() => status.ensure('ready', (currentStatus) => `bad ${currentStatus}`)).toThrow('bad created');

        status.tryTransition('created', 'ready');
        expect(status.get()).toBe('ready');
        expect(() => status.tryTransition('created', 'closed')).toThrow('Invalid transition from ready to closed');
    });
});

describe.concurrent('enum helpers', () => {
    it('should filter TypeScript numeric enum reverse mappings', ({ expect }) => {
        enum MixedEnum {
            First,
            Second,
            Named = 'named',
        }

        expect(getEnumValues(MixedEnum)).toStrictEqual([
            0,
            1,
            'named',
        ]);

        expect(getEnumNumberValues(MixedEnum)).toStrictEqual([
            0,
            1,
        ]);
    });
});
