import type { Buffer as NodeBuffer } from 'node:buffer';

import { getEnumNumberValues } from '../../utils/enum';

export type WsIoPacketData = ArrayBuffer | NodeBuffer | number[];

export interface WsIoInnerPacket {
    d?: number[];
    k?: string;
    t: WsIoPacketType;
}

export interface WsIoPacket {
    data?: WsIoPacketData;
    key?: string;
    type: WsIoPacketType;
}

export enum WsIoPacketType {
    Auth = 0,
    Disconnect = 1,
    Event = 2,
    Init = 3,
    Ready = 4,
}

// Constants
const wsIoPacketTypes = getEnumNumberValues(WsIoPacketType);

// Functions
export function parseInnerPacket(packet: WsIoInnerPacket) {
    if (!packet.t) throw new Error('Missing packet type');
    if (!wsIoPacketTypes.includes(packet.t)) throw new Error(`Invalid packet type: ${packet.t}`);
    if (packet.d !== undefined && !Array.isArray(packet.d)) throw new Error(`Invalid packet data: ${packet.d}`);
    if (packet.k !== undefined && typeof packet.k !== 'string') throw new Error(`Invalid packet key: ${packet.k}`);
    return {
        data: packet.d,
        key: packet.k,
        type: packet.t,
    } as WsIoPacket;
}
