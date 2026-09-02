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

export function packetDataToUint8Array(data: ArrayBuffer | WsIoPacketData) {
    if (!(data instanceof ArrayBuffer) && !ArrayBuffer.isView(data)) {
        throw new TypeError('Invalid packet format: expected binary data');
    }

    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return new Uint8Array(data);
}
