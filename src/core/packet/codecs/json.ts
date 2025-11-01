import { parseInnerPacket } from '../';
import type {
    WsIoPacket,
    WsIoPacketData,
} from '../';

// Constants
export const isText = true;

// Functions
export const decode = (data: string) => parseInnerPacket(JSON.parse(data));
export const decodeData = <T>(bytes: WsIoPacketData): T => JSON.parse(new TextDecoder().decode(new Uint8Array(bytes)));
export const encodeData = (data: any) => Array.from(new TextEncoder().encode(JSON.stringify(data)));

export function encode(packet: WsIoPacket) {
    return JSON.stringify({
        d: packet.data,
        k: packet.key,
        t: packet.type,
    });
}
