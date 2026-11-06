import type { SetOptional } from 'type-fest';

import type {
    DefaultEventsMap,
    EventsMap,
} from '../types';
import type { WsIoClientConfig } from '../types/config';

export type ResolvedWsIoClientConfig<
    ToServerEvents extends EventsMap = DefaultEventsMap,
    ToClientEvents extends EventsMap = DefaultEventsMap,
> = SetOptional<
    Required<WsIoClientConfig<ToServerEvents, ToClientEvents>>,
    'initHandler' | 'onSessionCloseHandler' | 'onSessionReadyHandler'
>;
