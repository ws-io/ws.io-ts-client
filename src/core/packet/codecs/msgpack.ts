import {
    isNativeAccelerationEnabled,
    decode as msgPackDecode,
    encode as msgPackEncode,
} from 'msgpackr';

import { WsIoPacket } from '../';

if (
    !isNativeAccelerationEnabled
    && typeof document !== 'undefined'
    && typeof globalThis.window === 'object'
    && typeof window !== 'undefined'
) console.warn('Native acceleration not enabled for msgpackr, verify that install finished properly');

export const decodeData = <T>(bytes: number[]): null | T => msgPackDecode(Uint8Array.from(bytes));
export const encode = (packet: WsIoPacket) => msgPackEncode(WsIoPacket.toInner(packet));
export const encodeData = (data: any) => msgPackEncode(data);

export function decode(data: ArrayBuffer | string) {
    if (typeof data === 'string') throw new Error('Invalid packet format: expected ArrayBuffer data');
    return WsIoPacket.fromInner(msgPackDecode(new Uint8Array(data)));
}
