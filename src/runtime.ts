import Mutex from 'p-mutex';
import type { ReadonlyDeep } from 'type-fest';

import { AtomicStatus } from './core/atomic/status';
import { WsIoPacket } from './core/packet';
import * as wsIoPacketJsonCodec from './core/packet/codecs/json';
import { WsIoClientSession } from './session';
import type { WsIoClientConfig } from './types/config';
import { sleep } from './utils';
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
    #connectionLoopPromise?: Promise<void>;
    #connectUrl: URL;
    #operateLock = new Mutex();
    #sendEventDataPromise?: Promise<void>;
    #sendEventDataQueue = new AsyncQueue<ArrayBufferView | string>();
    #session?: WsIoClientSession;
    #status = new AtomicStatus(RuntimeStatus.Stopped);
    #wakeReconnectWaitAbortController?: AbortController;

    // Internal properties
    _client: WsIoClient;
    _config: ReadonlyDeep<WsIoClientConfig>;
    _wakeSendEventDataPromise?: () => void;

    constructor(client: WsIoClient, url: string | URL, config?: Partial<WsIoClientConfig>) {
        if (typeof url === 'string') url = new URL(url);
        if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
            throw new Error(`Invalid URL scheme: ${url.protocol.slice(0, -1)}`);
        }

        this._config = {
            initHandlerTimeout: 3000,
            initPacketTimeout: 3000,
            onSessionCloseHandlerTimeout: 2000,
            packetCodec: wsIoPacketJsonCodec,
            readyPacketTimeout: 3000,
            reconnectDelay: 1000,
            requestPath: '/ws.io',
            ...config,
        };

        url.searchParams.set('namespace', url.pathname.replaceAll(/\/+/g, '/'));
        url.pathname = this._config.requestPath.replaceAll(/\/+/g, '/');
        this.#connectUrl = url;
        this._client = client;
    }

    // Private methods
    async #runConnection() {
        const ws = new WebSocket(this.#connectUrl);
        ws.binaryType = 'arraybuffer';

        const session = new WsIoClientSession(this, ws);
        this.#session = session;

        await this.#session._waitForClose;
        this.#session = undefined;
        await session._cleanup();
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
                        await new Promise<void>((resolve) => void (this._wakeSendEventDataPromise = resolve));
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

            // Close session
            this.#session?._close();

            // Close send event data queue and await send event data promise termination
            this.#sendEventDataQueue.closeAndClear();
            this._wakeSendEventDataPromise?.();
            await this.#sendEventDataPromise;

            // Cancel all ongoing operations via cancel token and store a new one
            // TODO?

            // Wake reconnect loop to break out of sleep early
            this.#wakeReconnectWaitAbortController?.abort();

            // Await connection loop promise termination
            await this.#connectionLoopPromise;

            this.#status.store(RuntimeStatus.Stopped);
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
}
