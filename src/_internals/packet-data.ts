import type { WsIoPacketData } from '../core/packet';

export function packetDataToUint8Array(data: ArrayBuffer | WsIoPacketData) {
    if (!(data instanceof ArrayBuffer) && !ArrayBuffer.isView(data)) {
        throw new TypeError('Invalid packet format: expected binary data');
    }

    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return new Uint8Array(data);
}
