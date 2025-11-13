import { WsIoPacket } from '../';

export const encode = (packet: WsIoPacket) => JSON.stringify(WsIoPacket.toInner(packet));
export const encodeData = (data: any) => Array.from(new TextEncoder().encode(JSON.stringify(data)));

export function decode(data: ArrayBuffer | string) {
    if (typeof data !== 'string') throw new Error('Invalid packet format: expected string data');
    return WsIoPacket.fromInner(JSON.parse(data));
}

export function decodeData<T>(bytes: number[]): null | T {
    return JSON.parse(new TextDecoder().decode(new Uint8Array(bytes)));
}
