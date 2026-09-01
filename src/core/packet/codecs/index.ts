import type {
    WsIoPacket,
    WsIoPacketData,
} from '../';

export type WsIoEncodedPacketData = ArrayBuffer | ArrayBufferView<ArrayBuffer> | string;
export type WsIoPacketCodec = Readonly<{
    decode: (data: WsIoEncodedPacketData) => WsIoPacket;
    decodeData: <T>(bytes: WsIoPacketData) => null | T;
    encode: (packet: WsIoPacket) => ArrayBufferView<ArrayBuffer> | string;
    encodeData: (data: any) => WsIoPacketData;
}>;

export function packetDataToUint8Array(data: ArrayBuffer | WsIoPacketData) {
    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return new Uint8Array(data);
}
