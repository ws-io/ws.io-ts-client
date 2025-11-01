import type {
    WsIoPacket,
    WsIoPacketData,
} from '../';

export interface WsIoPacketCodec {
    decode: ((data: ArrayBuffer) => WsIoPacket) | ((data: string) => WsIoPacket);
    decodeData: <T>(bytes: WsIoPacketData) => T;
    encode: ((packet: WsIoPacket) => ArrayBuffer) | ((packet: WsIoPacket) => string);
    encodeData: (data: any) => WsIoPacketData;
    isText: boolean;
}
