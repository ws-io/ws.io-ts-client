import type { Promisable } from 'type-fest';

import type { WsIoPacketData } from '../core/packet';
import type { WsIoPacketCodec } from '../core/packet/codecs';
import type { WsIoClientSession } from '../session';

export interface WsIoClientConfig {
    initHandler?: (session: WsIoClientSession, bytes?: WsIoPacketData) => Promisable<undefined | WsIoPacketData>;
    initHandlerTimeout: number;
    initPacketTimeout: number;
    packetCodec: WsIoPacketCodec;
    readyPacketTimeout: number;
    reconnectDelay: number;
    requestPath: string;
}
