import {
    decode as cborDecode,
    encode as cborEncode,
    isNativeAccelerationEnabled,
} from 'cbor-x';

import { WsIoPacket } from '../';
import { isBrowser } from '../../../constants';

import type { WsIoPacketCodec } from './';

if (!isNativeAccelerationEnabled && !isBrowser) {
    console.warn('Native acceleration not enabled for cbor-x, verify that install finished properly');
}

export const wsIoPacketCborCodec: WsIoPacketCodec = Object.freeze({
    decode(data: ArrayBuffer | string) {
        if (typeof data === 'string') throw new Error('Invalid packet format: expected ArrayBuffer data');
        return WsIoPacket.fromInner(cborDecode(new Uint8Array(data)));
    },
    decodeData: <T>(bytes: number[]): null | T => cborDecode(new Uint8Array(bytes)),
    encode: (packet: WsIoPacket) => cborEncode(WsIoPacket.toInner(packet)),
    encodeData: (data: any) => cborEncode(data),
});
