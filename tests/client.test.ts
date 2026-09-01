import {
    describe,
    expect,
    it,
} from 'vitest';

import { WsIoClient } from '../src';

describe.concurrent('wsIoClient public guards', () => {
    it('rejects non-websocket URL schemes before any connection attempt', () => {
        expect(() => new WsIoClient('http://example.test')).toThrow('Invalid URL scheme: http');
    });

    it('rejects non-string event names', () => {
        const client = new WsIoClient('ws://example.test') as any;

        expect(() => client.emit(1)).toThrow('Event must be a string');
        expect(() => client.on(1, () => {})).toThrow('Event must be a string');
        expect(() => client.off(1)).toThrow('Event must be a string');
        expect(() => client.offByHandlerId(1, 0)).toThrow('Event must be a string');
    });

    it('does not allow emit before connect starts the runtime', () => {
        const client = new WsIoClient('ws://example.test');

        expect(() => client.emit('event')).toThrow('Cannot emit in invalid status');
    });
});
