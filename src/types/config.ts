import type { Promisable } from 'type-fest';

import type { WsIoPacketCodec } from '../core/packet/codecs';
import type { WsIoClientSession } from '../session';

import type {
    DefaultEventsMap,
    EventsMap,
} from './';

export interface WsIoClientConfig<
    ToServerEvents extends EventsMap = DefaultEventsMap,
    ToClientEvents extends EventsMap = DefaultEventsMap,
> {
    connectTimeout?: number;
    disconnectTimeout?: number;
    initHandler?: (session: WsIoClientSession<ToServerEvents, ToClientEvents>, data?: any) => Promisable<any>;
    initHandlerTimeout?: number;
    initPacketTimeout?: number;
    // Runs once per session on cleanup and is awaited; use client.onSessionClose for more listeners
    onSessionCloseHandler?: (session: WsIoClientSession<ToServerEvents, ToClientEvents>) => Promisable<void>;
    onSessionCloseHandlerTimeout?: number;
    // Runs once per session on ready, including after reconnects; use client.onSessionReady for more listeners
    onSessionReadyHandler?: (session: WsIoClientSession<ToServerEvents, ToClientEvents>) => Promisable<void>;
    packetCodec?: WsIoPacketCodec;
    pingInterval?: number;
    readyPacketTimeout?: number;
    reconnectDelay?: number;
    requestPath?: string;
}
