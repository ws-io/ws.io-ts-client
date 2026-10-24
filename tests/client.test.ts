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

    it('rejects namespace paths outside the whitelist', () => {
        expect(() => new WsIoClient('ws://example.test/世界')).toThrow('Invalid path: /%E4%B8%96%E7%95%8C');
        expect(() => new WsIoClient('ws://example.test/a+b')).toThrow('Invalid path: /a+b');
        expect(() => new WsIoClient('ws://example.test/a-b_c.d/E9')).not.toThrow();
    });

    it('rejects invalid request paths before URL rewriting', () => {
        for (const requestPath of [
            '/世界',
            '/a%20b',
            '/a/../b',
            '/a\\b',
            '/a\tb',
            '/a\nb',
        ]) {
            expect(() => new WsIoClient('ws://example.test/test', { requestPath })).toThrow('Invalid path:');
        }
    });

    it('rejects non-string event names', () => {
        const client = new WsIoClient('ws://example.test') as any;

        expect(() => client.emit(1)).toThrow('Event must be a string');
        expect(() => client.on(1, () => {})).toThrow('Event must be a string');
        expect(() => client.off(1)).toThrow('Event must be a string');
        expect(() => client.offByHandlerId(1, 0)).toThrow('Event must be a string');
    });

    it('rejects empty event names', () => {
        const client = new WsIoClient('ws://example.test');

        expect(() => client.emit('')).toThrow('Event key cannot be empty');
        expect(() => client.on('', () => {})).toThrow('Event key cannot be empty');
        expect(() => client.off('')).toThrow('Event key cannot be empty');
        expect(() => client.offByHandlerId('', 0)).toThrow('Event key cannot be empty');
    });

    it('does not allow emit before connect starts the runtime', () => {
        const client = new WsIoClient('ws://example.test');

        expect(() => client.emit('event')).toThrow('Cannot emit in invalid status');
    });
});
