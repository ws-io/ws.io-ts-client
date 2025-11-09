import { AtomicStatus } from './core/atomic/status';
import {
    WsIoPacket,
    WsIoPacketType,
} from './core/packet';
import type { WsIoPacketData } from './core/packet';
import type { WsIoClientRuntime } from './runtime';
import { waitWithTimeout } from './utils';

// Enums
enum SessionStatus {
    AwaitingInit,
    AwaitingReady,
    Closed,
    Closing,
    Created,
    Initiating,
    Ready,
    Readying,
}

// Classes
export class WsIoClientSession {
    // Private properties
    #initTimeoutTimeout?: NodeJS.Timeout;
    #readyTimeoutTimeout?: NodeJS.Timeout;
    #runtime: WsIoClientRuntime;
    #status = new AtomicStatus(SessionStatus.Created);
    #ws: WebSocket;

    // Internal properties
    _waitForClose: Promise<CloseEvent>;

    constructor(runtime: WsIoClientRuntime, ws: WebSocket) {
        this.#runtime = runtime;
        this.#ws = ws;
        this._waitForClose = new Promise((resolve) => void (ws.onclose = resolve));
        ws.onmessage = (event) => this.#handleIncomingPacket(event.data);
        ws.onopen = () => {
            this.#status.store(SessionStatus.AwaitingInit);
            this.#initTimeoutTimeout = setTimeout(
                () => {
                    if (this.#status.is(SessionStatus.AwaitingInit)) this._close();
                },
                this.#runtime._config.initPacketTimeout,
            );
        };
    }

    // Private methods
    #handleDisconnectPacket() {
        this.#runtime.disconnect().catch(() => {});
    }

    async #handleIncomingPacket(data: ArrayBuffer | string) {
        const packet = this.#runtime._config.packetCodec.decode(data);
        switch (packet.type) {
            case WsIoPacketType.Disconnect: return this.#handleDisconnectPacket();
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
            ? this.#runtime._config.packetCodec.decodeData(packetData as number[])
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

        // Wake event message flush task
        // TODO

        // Invoke onSessionReadyHandler if configured
        (async () => await this.#runtime._config.onSessionReadyHandler?.(this))().catch(() => {});
    }

    #sendPacket(packet: WsIoPacket) {
        this.#ws.send(this.#runtime._config.packetCodec.encode(packet));
    }

    // Internal methods
    async _cleanup() {
        // Set state to Closing
        this.#status.store(SessionStatus.Closing);

        // Clear timeouts
        if (this.#initTimeoutTimeout) clearTimeout(this.#initTimeoutTimeout);
        if (this.#readyTimeoutTimeout) clearTimeout(this.#readyTimeoutTimeout);

        // Cancel all ongoing operations via cancel token
        // TODO?

        // Invoke onSessionCloseHandler with timeout protection if configured
        await waitWithTimeout(
            this.#runtime._config.onSessionCloseHandlerTimeout,
            this.#runtime._config.onSessionCloseHandler?.(this),
        );

        // Set state to Closed
        this.#status.store(SessionStatus.Closed);
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
        this.#ws.close();
    }

    // Public getters
    get client() {
        return this.#runtime._client;
    }

    get isReady() {
        return this.#status.is(SessionStatus.Ready);
    }
}
