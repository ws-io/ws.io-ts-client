import { getEnumNumberValues } from '../../utils/enum';

export type InnerPacket = [WsIoPacketType, null | string, null | WsIoPacketData];
export type WsIoPacketData = ArrayBufferView | number[];

// eslint-disable-next-line ts/no-unsafe-declaration-merging
export interface WsIoPacket {
    data?: WsIoPacketData;
    key?: string;
    type: WsIoPacketType;
}

export enum WsIoPacketType {
    Disconnect = 0,
    Event = 1,
    Init = 2,
    Ready = 3,
}

// Constants
const wsIoPacketTypes = getEnumNumberValues(WsIoPacketType);

// Classes
// eslint-disable-next-line ts/no-unsafe-declaration-merging
export class WsIoPacket {
    // Private static methods
    static #new(type: WsIoPacketType, key?: string, data?: WsIoPacketData) {
        return {
            data,
            key,
            type,
        };
    }

    // Public static methods
    static fromInner(innerPacket: InnerPacket) {
        if (!innerPacket[0]) throw new Error('Missing packet type');
        if (!wsIoPacketTypes.includes(innerPacket[0])) throw new Error(`Invalid packet type: ${innerPacket[0]}`);
        if (innerPacket[1] !== null && typeof innerPacket[1] !== 'string') {
            throw new Error(`Invalid packet key: ${innerPacket[1]}`);
        }

        if (innerPacket[2] !== null && !Array.isArray(innerPacket[2])) {
            throw new Error(`Invalid packet data: ${innerPacket[2]}`);
        }

        return {
            data: innerPacket[2] ?? undefined,
            key: innerPacket[1] ?? undefined,
            type: innerPacket[0],
        };
    }

    static newInit(data?: WsIoPacketData) {
        return this.#new(WsIoPacketType.Init, undefined, data);
    }

    static toInner(packet: WsIoPacket) {
        return [
            packet.type,
            packet.key ?? null,
            packet.data ?? null,
        ];
    }
}
