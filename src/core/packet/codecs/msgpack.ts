import {
    isNativeAccelerationEnabled,
    decode as msgpackDecode,
    encode as msgpackEncode,
} from 'msgpackr';

import { WsIoPacket } from '../';
import { isBrowser } from '../../../constants';

import type { WsIoPacketCodec } from './';

if (!isNativeAccelerationEnabled && !isBrowser) {
    console.warn('Native acceleration not enabled for msgpackr, verify that install finished properly');
}

export const wsIoPacketMsgpackCodec: WsIoPacketCodec = Object.freeze({
    decode(data: ArrayBuffer | string) {
        if (typeof data === 'string') throw new Error('Invalid packet format: expected ArrayBuffer data');
        return WsIoPacket.fromInner(msgpackDecode(new Uint8Array(data)));
    },
    decodeData: <T>(bytes: number[]): null | T => msgpackDecode(new Uint8Array(bytes)),
    encode: (packet: WsIoPacket) => msgpackEncode(WsIoPacket.toInner(packet)) as ArrayBufferView<ArrayBuffer>,
    encodeData: (data: any) => msgpackEncode(data) as ArrayBufferView<ArrayBuffer>,
});
