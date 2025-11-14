import { WsIoPacket } from '../';

import type { WsIoPacketCodec } from './';

export const wsIoPacketJsonCodec: WsIoPacketCodec = Object.freeze({
    decode(data: ArrayBuffer | string) {
        if (typeof data !== 'string') throw new Error('Invalid packet format: expected string data');
        return WsIoPacket.fromInner(JSON.parse(data));
    },
    decodeData: <T>(bytes: number[]): null | T => JSON.parse(new TextDecoder().decode(new Uint8Array(bytes))),
    encode: (packet: WsIoPacket) => JSON.stringify(WsIoPacket.toInner(packet)),
    encodeData: (data: any) => Array.from(new TextEncoder().encode(JSON.stringify(data))),
});
