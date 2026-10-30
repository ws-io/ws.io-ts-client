import type {
    Promisable,
    SetOptional,
} from 'type-fest';

import type { WsIoPacketCodec } from '../core/packet/codecs';
import type { WsIoClientSession } from '../session';

import type {
    DefaultEventsMap,
    EventsMap,
} from './';

export type ResolvedWsIoClientConfig<
    ToServerEvents extends EventsMap = DefaultEventsMap,
    ToClientEvents extends EventsMap = DefaultEventsMap,
> = SetOptional<
    Required<WsIoClientConfig<ToServerEvents, ToClientEvents>>,
    'initHandler' | 'onSessionCloseHandler' | 'onSessionReadyHandler'
>;

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
