import {
    describe,
    expect,
    it,
} from 'vitest';

import { AtomicStatus } from '../src/core/atomic/status';
import {
    getEnumNumberValues,
    getEnumValues,
} from '../src/utils/enum';

describe.concurrent('atomicStatus', () => {
    it('guards current status and validates transitions', () => {
        const status = new AtomicStatus('created');

        expect(status.is('created')).toBe(true);
        expect(() => status.ensure('ready', (currentStatus) => `bad ${currentStatus}`)).toThrow('bad created');

        status.tryTransition('created', 'ready');
        expect(status.get()).toBe('ready');
        expect(() => status.tryTransition('created', 'closed')).toThrow('Invalid transition from ready to closed');
    });
});

describe.concurrent('enum helpers', () => {
    it('filters TypeScript numeric enum reverse mappings', () => {
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
