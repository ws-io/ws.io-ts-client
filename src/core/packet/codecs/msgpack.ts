import {
    decode as msgPackDecode,
    encode as msgPackEncode,
} from 'msgpackr';

import { WsIoPacket } from '../';

export const decodeData = <T>(bytes: number[]): null | T => msgPackDecode(Uint8Array.from(bytes));
export const encode = (packet: WsIoPacket) => msgPackEncode(WsIoPacket.toInner(packet));
export const encodeData = (data: any) => msgPackEncode(data);

export function decode(data: ArrayBuffer | string) {
    if (typeof data === 'string') throw new Error('Invalid packet format: expected ArrayBuffer data');
    return WsIoPacket.fromInner(msgPackDecode(new Uint8Array(data)));
}
