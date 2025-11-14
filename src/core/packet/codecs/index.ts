import type {
    WsIoPacket,
    WsIoPacketData,
} from '../';

export type WsIoPacketCodec = Readonly<{
    decode: (data: ArrayBuffer | string) => WsIoPacket;
    decodeData: <T>(bytes: number[]) => null | T;
    encode: (packet: WsIoPacket) => ArrayBufferView | string;
    encodeData: (data: any) => WsIoPacketData;
}>;
