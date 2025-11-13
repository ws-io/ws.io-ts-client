import {
    isNativeAccelerationEnabled,
    decode as msgpackDecode,
    encode as msgpackEncode,
} from 'msgpackr';

import { WsIoPacket } from '../';
import { isBrowser } from '../../../constants';

if (!isNativeAccelerationEnabled && !isBrowser) {
    console.warn('Native acceleration not enabled for msgpackr, verify that install finished properly');
}

export const decodeData = <T>(bytes: number[]): null | T => msgpackDecode(new Uint8Array(bytes));
export const encode = (packet: WsIoPacket) => msgpackEncode(WsIoPacket.toInner(packet));
export const encodeData = (data: any) => msgpackEncode(data);

export function decode(data: ArrayBuffer | string) {
    if (typeof data === 'string') throw new Error('Invalid packet format: expected ArrayBuffer data');
    return WsIoPacket.fromInner(msgpackDecode(new Uint8Array(data)));
}
