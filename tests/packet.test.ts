import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    WsIoPacket,
    WsIoPacketType,
} from '../src/core/packet';
import type { WsIoPacketCodec } from '../src/core/packet/codecs';
import { wsIoPacketCborCodec } from '../src/core/packet/codecs/cbor';
import { wsIoPacketMsgpackCodec } from '../src/core/packet/codecs/msgpack';

const binaryCodecs: readonly (readonly [string, WsIoPacketCodec])[] = [
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
    it('normalizes nullable inner fields to absent public fields', () => {
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

    it('rejects malformed inner packet shape at protocol boundary', () => {
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

    it('rejects text packet payloads at the codec boundary', () => {
        expect(() => wsIoPacketMsgpackCodec.decode('not binary' as never)).toThrow(
            'expected binary data',
        );
    });

    it.each(binaryCodecs)('keeps binary %s packet data roundtrippable as bytes', (_name, codec) => {
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
    });
});
