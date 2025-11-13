import type { Promisable } from 'type-fest';

import type { WsIoPacketCodec } from '../core/packet/codecs';
import type { WsIoClientSession } from '../session';

export interface WsIoClientConfig {
    initHandler?: (session: WsIoClientSession, data?: any) => Promisable<any>;
    initHandlerTimeout: number;
    initPacketTimeout: number;
    onSessionCloseHandler?: (session: WsIoClientSession) => Promisable<void>;
    onSessionCloseHandlerTimeout: number;
    onSessionReadyHandler?: (session: WsIoClientSession) => Promisable<void>;
    packetCodec: WsIoPacketCodec;
    pingInterval: number;
    readyPacketTimeout: number;
    reconnectDelay: number;
    requestPath: string;
}
