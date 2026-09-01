import {
    isNativeAccelerationEnabled,
    decode as msgpackDecode,
    encode as msgpackEncode,
} from 'msgpackr';

import { WsIoPacket } from '../';
import type { WsIoPacketData } from '../';
import { isBrowser } from '../../../constants';

import { packetDataToUint8Array } from './';
import type {
    WsIoEncodedPacketData,
    WsIoPacketCodec,
} from './';

if (!isNativeAccelerationEnabled && !isBrowser) {
    console.warn('Native acceleration not enabled for msgpackr, verify that install finished properly');
}

export const wsIoPacketMsgpackCodec: WsIoPacketCodec = Object.freeze({
    decode(data: WsIoEncodedPacketData) {
        if (typeof data === 'string') throw new Error('Invalid packet format: expected ArrayBuffer data');
        return WsIoPacket.fromInner(msgpackDecode(packetDataToUint8Array(data)));
    },
    decodeData: <T>(bytes: WsIoPacketData): null | T => msgpackDecode(packetDataToUint8Array(bytes)),
    encode: (packet: WsIoPacket) => msgpackEncode(WsIoPacket.toInner(packet)) as ArrayBufferView<ArrayBuffer>,
    encodeData: (data: any) => msgpackEncode(data) as ArrayBufferView<ArrayBuffer>,
});
