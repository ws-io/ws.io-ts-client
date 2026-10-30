import type { Promisable } from 'type-fest';

import { WsIoClientRuntime } from './runtime';
import type { SessionHandler } from './runtime';
import type {
    DefaultEventsMap,
    EventsMap,
} from './types';
import type { WsIoClientConfig } from './types/config';

// Classes
export class WsIoClient<
    ToServerEvents extends EventsMap = DefaultEventsMap,
    ToClientEvents extends EventsMap = DefaultEventsMap,
> {
    readonly #runtime: WsIoClientRuntime<ToServerEvents, ToClientEvents>;

    constructor(url: string | URL, config?: WsIoClientConfig<ToServerEvents, ToClientEvents>) {
        this.#runtime = new WsIoClientRuntime(this, url, config);
    }

    // Public getters
    get cancelled() {
        return this.#runtime._cancelled;
    }

    get isSessionReady() {
        return this.#runtime._isSessionReady;
    }

    // Public methods
    connect() {
        return this.#runtime._connect();
    }

    disconnect() {
        return this.#runtime._disconnect();
    }

    emit<E extends keyof ToServerEvents | (string & {})>(
        event: E,
        ...params: E extends keyof ToServerEvents ? Parameters<ToServerEvents[E]> : unknown[]
    ) {
        assertEventKey(event);
        this.#runtime._emit(event, params.length ? params : undefined);
    }

    on<E extends keyof ToClientEvents | (string & {})>(
        event: E,
        callback: E extends keyof ToClientEvents ? ToClientEvents[E] : (...args: any) => Promisable<any>,
    ) {
        assertEventKey(event);
        return this.#runtime._on(event, callback);
    }

    off(event: keyof ToClientEvents | (string & {})) {
        assertEventKey(event);
        this.#runtime._off(event);
    }

    offByHandlerId(event: keyof ToClientEvents | (string & {}), handlerId: number) {
        assertEventKey(event);
        this.#runtime._offByHandlerId(event, handlerId);
    }

    onSessionClose(handler: (client: this) => Promisable<void>) {
        return this.#runtime._onSessionClose(handler as SessionHandler<ToServerEvents, ToClientEvents>);
    }

    onSessionReady(handler: (client: this) => Promisable<void>, options?: { immediate?: boolean }) {
        return this.#runtime._onSessionReady(
            handler as SessionHandler<ToServerEvents, ToClientEvents>,
            options?.immediate,
        );
    }
}

// Functions
function assertEventKey(event: unknown): asserts event is string {
    if (typeof event !== 'string') throw new TypeError('Event must be a string');
    if (!event) throw new Error('Event key cannot be empty');
}
