import type {
    WsIoPacket,
    WsIoPacketData,
} from '../';

export interface WsIoPacketCodec {
    decode: (data: ArrayBuffer | string) => WsIoPacket;
    decodeData: <T>(bytes: number[]) => null | T;
    encode: (packet: WsIoPacket) => ArrayBufferView | string;
    encodeData: (data: any) => WsIoPacketData;
}
