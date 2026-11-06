import {
    describe,
    it,
} from 'vitest';

import {
    WsIoPacket,
    WsIoPacketType,
} from '../src/core/packet';
import type { WsIoPacketCodec } from '../src/core/packet/codecs';
import { wsIoPacketCborCodec } from '../src/core/packet/codecs/cbor';
import { wsIoPacketMsgpackCodec } from '../src/core/packet/codecs/msgpack';

const binaryCodecs: ReadonlyArray<readonly [string, WsIoPacketCodec]> = [
    [
        'cbor',
        wsIoPacketCborCodec,
    ],
    [
        'msgpack',
        wsIoPacketMsgpackCodec,
    ],
];

describe.concurrent('wsIoPacket', () => {
    it('should normalize nullable inner fields to absent public fields', ({ expect }) => {
        expect(WsIoPacket.fromInner([
            WsIoPacketType.Ready,
            null,
            null,
        ])).toStrictEqual({
            data: undefined,
            key: undefined,
            type: WsIoPacketType.Ready,
        });
    });

    it('should reject malformed inner packet shape at protocol boundary', ({ expect }) => {
        expect(() => WsIoPacket.fromInner([
            99 as WsIoPacketType,
            null,
            null,
        ])).toThrow('Invalid packet type');

        expect(() => WsIoPacket.fromInner([
            WsIoPacketType.Event,
            1 as never,
            null,
        ])).toThrow('Invalid packet key');

        expect(() => WsIoPacket.fromInner([
            WsIoPacketType.Event,
            '',
            null,
        ])).toThrow('Event packet missing key');

        expect(() => WsIoPacket.fromInner([
            WsIoPacketType.Event,
            'event',
            'bad' as never,
        ])).toThrow('Invalid packet data');

        expect(() => WsIoPacket.fromInner([
            WsIoPacketType.Event,
            'event',
            [
                1,
                2,
                3,
            ] as never,
        ])).toThrow('Invalid packet data');
    });

    it('should reject text packet payloads at the codec boundary', ({ expect }) => {
        expect(() => wsIoPacketMsgpackCodec.decode('not binary' as never)).toThrow(
            'expected binary data',
        );
    });

    it.for(binaryCodecs)(
        'should keep binary %s packet data roundtrippable as bytes',
        ([_name, codec], { expect }) => {
            const data = codec.encodeData([
                'payload',
                1,
            ]);

            const encodedPacket = codec.encode(WsIoPacket.newEvent('event', data));
            const decoded = codec.decode(encodedPacket);

            expect(decoded).toMatchObject({
                key: 'event',
                type: WsIoPacketType.Event,
            });

            expect(ArrayBuffer.isView(decoded.data)).toBe(true);
            expect(codec.decodeData(decoded.data!)).toStrictEqual([
                'payload',
                1,
            ]);
        },
    );

    it('should reject empty event keys when creating event packets', ({ expect }) => {
        expect(() => WsIoPacket.newEvent('')).toThrow('Event key cannot be empty');
    });
});
