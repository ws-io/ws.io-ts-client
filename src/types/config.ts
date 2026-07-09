import type {
    Promisable,
    SetOptional,
} from 'type-fest';

import type { WsIoPacketCodec } from '../core/packet/codecs';
import type { WsIoClientSession } from '../session';

export type ResolvedWsIoClientConfig = SetOptional<
    Required<WsIoClientConfig>,
    'initHandler' | 'onSessionCloseHandler' | 'onSessionReadyHandler'
>;

export interface WsIoClientConfig {
    connectTimeout?: number;
    disconnectTimeout?: number;
    initHandler?: (session: WsIoClientSession, data?: any) => Promisable<any>;
    initHandlerTimeout?: number;
    initPacketTimeout?: number;
    onSessionCloseHandler?: (session: WsIoClientSession) => Promisable<void>;
    onSessionCloseHandlerTimeout?: number;
    onSessionReadyHandler?: (session: WsIoClientSession) => Promisable<void>;
    packetCodec?: WsIoPacketCodec;
    pingInterval?: number;
    readyPacketTimeout?: number;
    reconnectDelay?: number;
    requestPath?: string;
}
