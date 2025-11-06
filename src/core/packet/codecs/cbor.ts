import {
    decode as cborDecode,
    encode as cborEncode,
} from 'cbor-x';

import { WsIoPacket } from '../';

export const decodeData = <T>(bytes: number[]): null | T => cborDecode(Uint8Array.from(bytes));
export const encode = (packet: WsIoPacket) => cborEncode(WsIoPacket.toInner(packet));
export const encodeData = (data: any) => cborEncode(data);

export function decode(data: ArrayBuffer | string) {
    if (typeof data === 'string') throw new Error('Invalid packet format: expected ArrayBuffer data');
    return WsIoPacket.fromInner(cborDecode(new Uint8Array(data)));
}
