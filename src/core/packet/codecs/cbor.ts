import {
    decode as cborDecode,
    encode as cborEncode,
    isNativeAccelerationEnabled,
} from 'cbor-x';

import { WsIoPacket } from '../';
import type { WsIoPacketData } from '../';
import { isBrowser } from '../../../constants';

import { packetDataToUint8Array } from './';
import type {
    WsIoEncodedPacketData,
    WsIoPacketCodec,
} from './';

if (!isNativeAccelerationEnabled && !isBrowser) {
    console.warn('Native acceleration not enabled for cbor-x, verify that install finished properly');
}

export const wsIoPacketCborCodec: WsIoPacketCodec = Object.freeze({
    decode(data: WsIoEncodedPacketData) {
        if (typeof data === 'string') throw new Error('Invalid packet format: expected ArrayBuffer data');
        return WsIoPacket.fromInner(cborDecode(packetDataToUint8Array(data)));
    },
    decodeData: <T>(bytes: WsIoPacketData): null | T => cborDecode(packetDataToUint8Array(bytes)),
    encode: (packet: WsIoPacket) => cborEncode(WsIoPacket.toInner(packet)) as ArrayBufferView<ArrayBuffer>,
    encodeData: (data: any) => cborEncode(data) as ArrayBufferView<ArrayBuffer>,
});
