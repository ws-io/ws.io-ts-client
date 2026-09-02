import { defu } from 'defu';
import Mutex from 'p-mutex';

import { AtomicStatus } from './core/atomic/status';
import { WsIoPacket } from './core/packet';
import type { WsIoEncodedPacketData } from './core/packet/codecs';
import { wsIoPacketMsgpackCodec } from './core/packet/codecs/msgpack';
import { WsIoClientSession } from './session';
import type {
    ResolvedWsIoClientConfig,
    WsIoClientConfig,
} from './types/config';
import {
    sleep,
    waitWithTimeout,
} from './utils';
import { AsyncQueue } from './utils/queue';

import type { WsIoClient } from './';

// Enums
enum RuntimeStatus {
    Running,
    Stopped,
    Stopping,
}

// Classes
export class WsIoClientRuntime {
    // Private properties
    #cancel?: () => void;
    #connectionLoopPromise?: Promise<void>;
    readonly #connectUrl: URL;
    #nextEventHandlerId = 0;
    readonly #operateLock = new Mutex();
    #sendEventDataPromise?: Promise<void>;
    readonly #sendEventDataQueue = new AsyncQueue<WsIoEncodedPacketData>();
    #session?: WsIoClientSession;
    readonly #status = new AtomicStatus(RuntimeStatus.Stopped);
    #wakeReconnectWaitAbortController?: AbortController;

    // Internal properties
    _cancelled?: Promise<void>;
    readonly _client: WsIoClient;
    readonly _config: Readonly<ResolvedWsIoClientConfig>;
    readonly _eventHandlers: Record<string, Map<number, (...args: any[]) => any>> = {};
    _wakeSendEventDataPromise?: () => void;

    constructor(client: WsIoClient, url: string | URL, config?: WsIoClientConfig) {
        if (typeof url === 'string') url = new URL(url);
        if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
            throw new Error(`Invalid URL scheme: ${url.protocol.slice(0, -1)}`);
        }

        this._config = defu(
            config,
            {
                connectTimeout: 10 * 1000,
                disconnectTimeout: 5 * 1000,
                initHandlerTimeout: 3 * 1000,
                initPacketTimeout: 5 * 1000,
                onSessionCloseHandlerTimeout: 2 * 1000,
                packetCodec: wsIoPacketMsgpackCodec,
                pingInterval: 25 * 1000,
                readyPacketTimeout: 5 * 1000,
                reconnectDelay: 1 * 1000,
                requestPath: '/ws.io',
            } satisfies ResolvedWsIoClientConfig,
        );

        url.searchParams.set('namespace', url.pathname.replaceAll(/\/+/g, '/'));
        url.pathname = this._config.requestPath.replaceAll(/\/+/g, '/');
        this.#connectUrl = url;
        this._client = client;
    }

    // Private methods
    async #closeSessionAndWait(session: WsIoClientSession) {
        session._close();
        await waitWithTimeout(this._config.disconnectTimeout, session._waitForClose).catch(() => {});
    }

    async #runConnection() {
        // Connect to server
        const ws = new WebSocket(this.#connectUrl);
        ws.binaryType = 'arraybuffer';

        // Create session
        const session = new WsIoClientSession(this, ws);
        this.#session = session;

        const connectTimeoutAbortController = new AbortController();
        try {
            await Promise.race([
                (async () => {
                    await this._cancelled;
                    await this.#closeSessionAndWait(session);
                })(),
                (async () => {
                    await sleep(this._config.connectTimeout, connectTimeoutAbortController.signal);
                    if (connectTimeoutAbortController.signal.aborted) return;

                    if (session._isCreated) {
                        await this.#closeSessionAndWait(session);
                        return;
                    }

                    await session._waitForClose;
                })(),
                this.#session._waitForClose,
            ]);
        } finally {
            connectTimeoutAbortController.abort();
            this.#session = undefined;
            await session._cleanup();
        }
    }

    // Internal getters
    get _isSessionReady() {
        return this.#session?.isReady ?? false;
    }

    // Internal methods
    async _connect() {
        // Lock to prevent concurrent operation
        await this.#operateLock.withLock(() => {
            switch (this.#status.get()) {
                case RuntimeStatus.Running: return;
                case RuntimeStatus.Stopped:
                    this.#status.store(RuntimeStatus.Running);
                    break;
                default: throw new Error('unreachable');
            }

            // Create new cancel token
            this._cancelled = new Promise<void>((resolve) => void (this.#cancel = resolve));

            // Create connection loop promise
            this.#connectionLoopPromise = (async () => {
                while (true) {
                    if (!this.#status.is(RuntimeStatus.Running)) break;
                    await this.#runConnection();
                    if (this.#status.is(RuntimeStatus.Running)) {
                        this.#wakeReconnectWaitAbortController = new AbortController();
                        await sleep(this._config.reconnectDelay, this.#wakeReconnectWaitAbortController.signal);
                    }
                }
            })();

            // Create send event data promise
            this.#sendEventDataQueue.reopen();
            this.#sendEventDataPromise = (async () => {
                for await (const data of this.#sendEventDataQueue) {
                    while (true) {
                        try {
                            if (this.#session?._emit_event_data(data)) break;
                        } catch {}

                        let emitted = false;
                        await new Promise<void>((resolve) => {
                            const wake = () => {
                                if (this._wakeSendEventDataPromise === wake) this._wakeSendEventDataPromise = undefined;
                                resolve();
                            };

                            this._wakeSendEventDataPromise = wake;

                            try {
                                if (this.#session?._emit_event_data(data)) {
                                    emitted = true;
                                    wake();
                                }
                            } catch {}
                        });

                        if (
                            emitted
                            || !this.#status.is(RuntimeStatus.Running)
                            || this.#sendEventDataQueue.closed
                        ) break;
                    }
                }
            })();
        });
    }

    async _disconnect() {
        // Lock to prevent concurrent operation
        await this.#operateLock.withLock(async () => {
            switch (this.#status.get()) {
                case RuntimeStatus.Running:
                    this.#status.store(RuntimeStatus.Stopping);
                    break;
                case RuntimeStatus.Stopped: return;
                default: throw new Error('unreachable');
            }

            // Cancel token to abort all waiting operations
            this.#cancel?.();

            // Close send event data queue and await send event data promise termination
            this.#sendEventDataQueue.closeAndClear();
            this._wakeSendEventDataPromise?.();
            await this.#sendEventDataPromise;

            // Wake reconnect loop to break out of sleep early
            this.#wakeReconnectWaitAbortController?.abort();

            try {
                // Await connection loop promise termination
                await this.#connectionLoopPromise;
            } finally {
                this.#status.store(RuntimeStatus.Stopped);
            }
        });
    }

    _emit(event: string, params?: any[]) {
        this.#status.ensure(RuntimeStatus.Running, (status) => `Cannot emit in invalid status: ${status}`);
        this.#sendEventDataQueue.send(
            this._config.packetCodec.encode(
                WsIoPacket.newEvent(event, params ? this._config.packetCodec.encodeData(params) : undefined),
            ),
        );
    }

    _on(event: string, callback: (...args: any[]) => any) {
        const handlers = this._eventHandlers[event] ||= new Map();
        const nextEventHandlerId = this.#nextEventHandlerId++;
        handlers.set(nextEventHandlerId, callback);
        return nextEventHandlerId;
    }

    _off(event: string) {
        delete this._eventHandlers[event];
    }

    _offByHandlerId(event: string, handlerId: number) {
        const handlers = this._eventHandlers[event];
        if (handlers) {
            handlers.delete(handlerId);
            if (!handlers.size) this._off(event);
        }
    }
}
