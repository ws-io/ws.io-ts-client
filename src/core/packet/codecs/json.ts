import { WsIoPacket } from '../';
import type { WsIoPacketData } from '../';

import { packetDataToUint8Array } from './';
import type { WsIoPacketCodec } from './';

export const wsIoPacketJsonCodec: WsIoPacketCodec = Object.freeze({
    decode(data) {
        if (typeof data !== 'string') throw new Error('Invalid packet format: expected string data');
        return WsIoPacket.fromInner(JSON.parse(data));
    },
    decodeData: <T>(bytes: WsIoPacketData): null | T => JSON.parse(
        new TextDecoder().decode(packetDataToUint8Array(bytes)),
    ),
    encode: (packet) => JSON.stringify(WsIoPacket.toInner(packet)),
    encodeData: (data) => Array.from(new TextEncoder().encode(JSON.stringify(data))),
});
