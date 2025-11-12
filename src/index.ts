import type { Promisable } from 'type-fest';

import { WsIoClientRuntime } from './runtime';
import type { WsIoClientConfig } from './types/config';

// Classes
export class WsIoClient<
    ToServerEvents extends Record<string, (...args: any[]) => any> = Record<string, never>,
    ToClientEvents extends Record<string, (...args: any[]) => any> = Record<string, never>,
> {
    #runtime: WsIoClientRuntime;

    constructor(url: string | URL, config?: Partial<WsIoClientConfig>) {
        this.#runtime = new WsIoClientRuntime(this, url, config);
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
        if (typeof event !== 'string') throw new Error('Event must be a string');
        this.#runtime._emit(event, params.length ? params : undefined);
    }

    on<E extends keyof ToClientEvents | (string & {})>(
        event: E,
        callback: E extends keyof ToServerEvents ? ToClientEvents[E] : (...args: any[]) => Promisable<any>,
    ) {
        if (typeof event !== 'string') throw new Error('Event must be a string');
        return this.#runtime._on(event, callback);
    }

    off(event: keyof ToClientEvents | (string & {})) {
        if (typeof event !== 'string') throw new Error('Event must be a string');
        this.#runtime._off(event);
    }

    offByHandlerId(event: keyof ToClientEvents | (string & {}), handlerId: number) {
        if (typeof event !== 'string') throw new Error('Event must be a string');
        this.#runtime._offByHandlerId(event, handlerId);
    }
}
