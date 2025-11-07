import type { ReadonlyDeep } from 'type-fest';

import { AtomicStatus } from './core/atomic/status';
import * as wsIoPacketJsonCodec from './core/packet/codecs/json';
import { WsIoClientSession } from './session';
import type { WsIoClientConfig } from './types/config';
import { sleep } from './utils';

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
    #session?: WsIoClientSession;
    #status = new AtomicStatus(RuntimeStatus.Stopped);

    // Internal properties
    _client: WsIoClient;
    _config: ReadonlyDeep<WsIoClientConfig>;

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

    // Public methods
    connect() {
        // Lock to prevent concurrent operation
        // TODO

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
                    // TODO: wake break
                    await sleep(this._config.reconnectDelay);
                }
            }
        })();

        // Create flush messages promise
        // TODO
    }

    async disconnect() {
        // Lock to prevent concurrent operation
        // TODO

        switch (this.#status.get()) {
            case RuntimeStatus.Running:
                this.#status.store(RuntimeStatus.Stopping);
                break;
            case RuntimeStatus.Stopped: return;
            default: throw new Error('unreachable');
        }

        // Close session
        this.#session?._close();

        // Cancel all ongoing operations via cancel token and store a new one
        // TODO?

        // Abort event-message-flush task if still active
        // TODO

        // Drop all pending event messages in the channel
        // TODO

        // Wake reconnect loop to break out of sleep early
        // TODO

        // Await connection loop task termination
        await this.#connectionLoopPromise;

        this.#status.store(RuntimeStatus.Stopped);
    }
}
