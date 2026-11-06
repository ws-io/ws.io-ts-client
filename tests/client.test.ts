import {
    describe,
    it,
} from 'vitest';

import { WsIoClient } from '../src';

describe.concurrent('wsIoClient public guards', () => {
    it('should reject non-websocket URL schemes before any connection attempt', ({ expect }) => {
        expect(() => new WsIoClient('http://example.test')).toThrow('Invalid URL scheme: http');
    });

    it('should reject namespace paths outside the whitelist', ({ expect }) => {
        expect(() => new WsIoClient('ws://example.test/世界')).toThrow('Invalid path: /%E4%B8%96%E7%95%8C');
        expect(() => new WsIoClient('ws://example.test/a+b')).toThrow('Invalid path: /a+b');
        expect(() => new WsIoClient('ws://example.test/a-b_c.d/E9')).not.toThrow();
    });

    it('should reject invalid request paths before URL rewriting', ({ expect }) => {
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

    it('should reject non-string event names', ({ expect }) => {
        const client = new WsIoClient('ws://example.test') as any;

        expect(() => client.emit(1)).toThrow('Event must be a string');
        expect(() => client.on(1, () => {})).toThrow('Event must be a string');
        expect(() => client.off(1)).toThrow('Event must be a string');
        expect(() => client.offByHandlerId(1, 0)).toThrow('Event must be a string');
    });

    it('should reject empty event names', ({ expect }) => {
        const client = new WsIoClient('ws://example.test');

        expect(() => client.emit('')).toThrow('Event key cannot be empty');
        expect(() => client.on('', () => {})).toThrow('Event key cannot be empty');
        expect(() => client.off('')).toThrow('Event key cannot be empty');
        expect(() => client.offByHandlerId('', 0)).toThrow('Event key cannot be empty');
    });

    it('should not allow emit before connect starts the runtime', ({ expect }) => {
        const client = new WsIoClient('ws://example.test');

        expect(() => client.emit('event')).toThrow('Cannot emit in invalid status');
    });
});
