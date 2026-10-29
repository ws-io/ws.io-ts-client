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
    // Runs once per session on cleanup and is awaited; use client.onSessionClose for more listeners
    onSessionCloseHandler?: (session: WsIoClientSession) => Promisable<void>;
    onSessionCloseHandlerTimeout?: number;
    // Runs once per session on ready, including after reconnects; use client.onSessionReady for more listeners
    onSessionReadyHandler?: (session: WsIoClientSession) => Promisable<void>;
    packetCodec?: WsIoPacketCodec;
    pingInterval?: number;
    readyPacketTimeout?: number;
    reconnectDelay?: number;
    requestPath?: string;
}
