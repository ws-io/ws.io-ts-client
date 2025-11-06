import type { Promisable } from 'type-fest';

import type { WsIoPacketCodec } from '../core/packet/codecs';
import type { WsIoClientSession } from '../session';

export interface WsIoClientConfig {
    initHandler?: (session: WsIoClientSession, data?: any) => Promisable<any>;
    initHandlerTimeout: number;
    initPacketTimeout: number;
    packetCodec: WsIoPacketCodec;
    readyPacketTimeout: number;
    reconnectDelay: number;
    requestPath: string;
}
