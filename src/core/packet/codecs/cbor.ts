import {
    decode as cborDecode,
    encode as cborEncode,
    isNativeAccelerationEnabled,
} from 'cbor-x';

import { WsIoPacket } from '../';
import type { WsIoPacketData } from '../';
import { isBrowser } from '../../../constants';

import { packetDataToUint8Array } from './';
import type { WsIoPacketCodec } from './';

if (!isNativeAccelerationEnabled && !isBrowser) {
    console.warn('Native acceleration not enabled for cbor-x, verify that install finished properly');
}

export const wsIoPacketCborCodec: WsIoPacketCodec = Object.freeze({
    decode: (data) => WsIoPacket.fromInner(cborDecode(packetDataToUint8Array(data))),
    decodeData: <T>(bytes: WsIoPacketData): null | T => cborDecode(packetDataToUint8Array(bytes)),
    encode: (packet) => cborEncode(WsIoPacket.toInner(packet)),
    encodeData: (data) => cborEncode(data),
});
