import { AtomicStatus } from './core/atomic/status';
import {
    WsIoPacket,
    WsIoPacketType,
} from './core/packet';
import type { WsIoPacketData } from './core/packet';
import type { WsIoEncodedPacketData } from './core/packet/codecs';
import type { WsIoClientRuntime } from './runtime';
import { waitWithTimeout } from './utils';
import { AsyncQueue } from './utils/queue';

type WsIoWebSocketData = ArrayBuffer | ArrayBufferView<ArrayBuffer>;

// Enums
enum SessionStatus {
    AwaitingInit,
    AwaitingReady,
    Closed,
    Closing,
    Created,
    Initiating,
    Ready,
}

// Classes
export class WsIoClientSession {
    // Private properties
    #initTimeoutTimeout?: NodeJS.Timeout;
    readonly #eventDispatchAbortController = new AbortController();
    readonly #eventDispatchAbortPromise: Promise<void>;
    readonly #eventDispatchPromise: Promise<void>;
    readonly #eventQueue = new AsyncQueue<WsIoPacket>();
    #pingIntervalTimer?: NodeJS.Timeout;
    #readyTimeoutTimeout?: NodeJS.Timeout;
    #resolveClose?: (event?: CloseEvent) => void;
    readonly #runtime: WsIoClientRuntime;
    readonly #status = new AtomicStatus(SessionStatus.Created);
    readonly #ws: WebSocket;

    // Internal properties
    readonly _waitForClose: Promise<CloseEvent | undefined>;

    constructor(runtime: WsIoClientRuntime, ws: WebSocket) {
        this.#runtime = runtime;
        this.#ws = ws;
        this.#eventDispatchAbortPromise = new Promise((resolve) => {
            this.#eventDispatchAbortController.signal.addEventListener('abort', () => resolve(), { once: true });
        });

        this.#eventDispatchPromise = this.#runEventDispatcher();

        this._waitForClose = new Promise((resolve) => {
            this.#resolveClose = resolve;
            ws.onclose = (event) => this.#finishClose(event);
        });

        ws.onmessage = (event) => this.#handleIncomingPacket(event.data).catch(() => this._close());
        ws.onopen = () => {
            if (!this.#status.is(SessionStatus.Created)) {
                this.#closeWebSocket();
                return;
            }

            this.#status.store(SessionStatus.AwaitingInit);
            this.#initTimeoutTimeout = setTimeout(
                () => {
                    if (this.#status.is(SessionStatus.AwaitingInit)) this._close();
                },
                this.#runtime._config.initPacketTimeout,
            );

            // Create ping interval timer to send 1-byte heartbeat frame to keep the connection alive
            this.#pingIntervalTimer = setInterval(
                () => {
                    try {
                        this.#ws.send(new Uint8Array([0x01]));
                    } catch {
                        this._close();
                    }
                },
                this.#runtime._config.pingInterval,
            );
        };
    }

    // Private methods
    #closeWebSocket() {
        try {
            this.#ws.close();
        } catch {
            this.#finishClose();
        }
    }

    async #dispatchEventPacket(packet: WsIoPacket) {
        if (!packet.key) return;

        const handlers = this.#runtime._eventHandlers[packet.key];
        if (!handlers) return;

        const data = packet.data ? this.#runtime._config.packetCodec.decodeData<any[]>(packet.data) || [] : [];
        const handlersPromise = Promise.all(
            [...handlers.values()].map((handler) => Promise.resolve()
                .then(() => handler(...data))
                .catch(() => {})),
        );

        await Promise.race([
            handlersPromise,
            this.#eventDispatchAbortPromise,
        ]);
    }

    #finishClose(event?: CloseEvent) {
        this.#ws.onclose = null;
        this.#ws.onmessage = null;
        this.#ws.onopen = null;
        this.#resolveClose?.(event);
        this.#resolveClose = undefined;
    }

    #handleDisconnectPacket() {
        this.#runtime._disconnect().catch(() => {});
    }

    #handleEventPacket(packet: WsIoPacket) {
        if (!packet.key) throw new Error('Event packet missing key');
        this.#eventQueue.send(packet);
    }

    async #handleIncomingPacket(data: WsIoEncodedPacketData) {
        const packet = this.#runtime._config.packetCodec.decode(data);
        switch (packet.type) {
            case WsIoPacketType.Disconnect: return this.#handleDisconnectPacket();
            case WsIoPacketType.Event:
                if (!this.isReady) return;
                return this.#handleEventPacket(packet);
            case WsIoPacketType.Init: return await this.#handleInitPacket(packet.data);
            case WsIoPacketType.Ready: return this.#handleReadyPacket();
        }
    }

    async #handleInitPacket(packetData?: WsIoPacketData) {
        // Verify current state; only valid from AwaitingInit → Initiating
        const status = this.#status.get();
        switch (status) {
            case SessionStatus.AwaitingInit:
                this.#status.tryTransition(status, SessionStatus.Initiating);
                break;
            default: throw new Error(`Received init packet in invalid status: ${status}`);
        }

        // Clear init-timeout task
        if (this.#initTimeoutTimeout) clearTimeout(this.#initTimeoutTimeout);

        // Invoke initHandler with timeout protection if configured
        const decodedPacketData = packetData
            ? this.#runtime._config.packetCodec.decodeData(packetData)
            : undefined;

        const responseData = await waitWithTimeout(
            this.#runtime._config.initHandlerTimeout,
            this.#runtime._config.initHandler?.(this, decodedPacketData),
        );

        const encodedResponseData = responseData !== undefined
            ? this.#runtime._config.packetCodec.encodeData(responseData)
            : undefined;

        // Transition state to AwaitingReady
        this.#status.tryTransition(SessionStatus.Initiating, SessionStatus.AwaitingReady);

        // Spawn ready-timeout watchdog to close session if Ready is not received in time
        this.#readyTimeoutTimeout = setTimeout(
            () => {
                if (this.#status.is(SessionStatus.AwaitingReady)) this._close();
            },
            this.#runtime._config.readyPacketTimeout,
        );

        // Send init packet
        this.#sendPacket(WsIoPacket.newInit(encodedResponseData));
    }

    #handleReadyPacket() {
        // Verify current state; only valid from AwaitingReady → Ready
        const status = this.#status.get();
        switch (status) {
            case SessionStatus.AwaitingReady:
                this.#status.tryTransition(status, SessionStatus.Ready);
                break;
            default: throw new Error(`Received ready packet in invalid status: ${status}`);
        }

        // Clear ready-timeout task
        if (this.#readyTimeoutTimeout) clearTimeout(this.#readyTimeoutTimeout);

        // Wake send event data promise
        this.#runtime._wakeSendEventDataPromise?.();

        // Invoke onSessionReadyHandler if configured
        (async () => await this.#runtime._config.onSessionReadyHandler?.(this))().catch(() => {});
    }

    async #runEventDispatcher() {
        for await (const packet of this.#eventQueue) {
            if (this.#eventDispatchAbortController.signal.aborted) break;

            try {
                await this.#dispatchEventPacket(packet);
            } catch {
                this._close();
                break;
            }
        }
    }

    #sendPacket(packet: WsIoPacket) {
        this.#ws.send(toWsIoWebSocketData(this.#runtime._config.packetCodec.encode(packet)));
    }

    // Internal getters
    get _isCreated() {
        return this.#status.is(SessionStatus.Created);
    }

    // Internal methods
    async _cleanup() {
        // Set state to Closing
        this.#status.store(SessionStatus.Closing);

        // Stop event dispatch and drop queued packets.
        this.#eventDispatchAbortController.abort();
        this.#eventQueue.closeAndClear();
        await this.#eventDispatchPromise;

        // Clear timeouts
        if (this.#initTimeoutTimeout) clearTimeout(this.#initTimeoutTimeout);
        if (this.#pingIntervalTimer) clearInterval(this.#pingIntervalTimer);
        if (this.#readyTimeoutTimeout) clearTimeout(this.#readyTimeoutTimeout);

        // Cancel all ongoing operations via cancel token
        // TODO?

        try {
            // Invoke onSessionCloseHandler with timeout protection if configured
            await waitWithTimeout(
                this.#runtime._config.onSessionCloseHandlerTimeout,
                this.#runtime._config.onSessionCloseHandler?.(this),
            );
        } catch {
            // Ignore cleanup hook failures so runtime shutdown/reconnect can make progress.
        } finally {
            // Set state to Closed
            this.#status.store(SessionStatus.Closed);
        }
    }

    _close() {
        // Skip if session is already Closing or Closed, otherwise set state to Closing
        switch (this.#status.get()) {
            case SessionStatus.Closed:
            case SessionStatus.Closing:
                return;
            default: this.#status.store(SessionStatus.Closing);
        }

        // Send websocket close frame to initiate graceful shutdown
        this.#closeWebSocket();
    }

    _emit_event_data(data: WsIoEncodedPacketData) {
        this.#status.ensure(SessionStatus.Ready, (status) => `Cannot emit event data in invalid status: ${status}`);
        this.#ws.send(toWsIoWebSocketData(data));
        return true;
    }

    // Public getters
    get client() {
        return this.#runtime._client;
    }

    get isReady() {
        return this.#status.is(SessionStatus.Ready);
    }
}

function toWsIoWebSocketData(data: WsIoEncodedPacketData): WsIoWebSocketData {
    if (data instanceof ArrayBuffer) return data;
    if (data.buffer instanceof ArrayBuffer) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }

    return Uint8Array.from(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
}
