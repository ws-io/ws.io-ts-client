import type {
    WsIoPacket,
    WsIoPacketData,
} from '../';

export type WsIoEncodedPacketData = ArrayBuffer | ArrayBufferView<ArrayBufferLike>;
export type WsIoPacketCodec = Readonly<{
    decode: (data: WsIoEncodedPacketData) => WsIoPacket;
    decodeData: <T>(bytes: WsIoPacketData) => null | T;
    encode: (packet: WsIoPacket) => WsIoEncodedPacketData;
    encodeData: (data: any) => WsIoPacketData;
}>;
