import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    WsIoPacket,
    WsIoPacketType,
} from '../src/core/packet';
import type { WsIoEncodedPacketData } from '../src/core/packet/codecs';
import { wsIoPacketJsonCodec } from '../src/core/packet/codecs/json';
import type { WsIoClientRuntime } from '../src/runtime';
import { WsIoClientSession } from '../src/session';
import type { ResolvedWsIoClientConfig } from '../src/types/config';

class FakeWebSocket {
    autoClose = true;
    onclose: ((event: CloseEvent) => unknown) | null = null;
    onmessage: ((event: MessageEvent) => unknown) | null = null;
    onopen: ((event: Event) => unknown) | null = null;
    readonly sent: unknown[] = [];

    readonly close = vi.fn(() => {
        if (this.autoClose) this.emitClose();
    });

    readonly send = vi.fn((data: unknown) => {
        this.sent.push(data);
    });

    emitClose() {
        this.onclose?.({} as CloseEvent);
    }

    emitMessage(data: WsIoEncodedPacketData) {
        this.onmessage?.({ data } as MessageEvent);
    }

    emitOpen() {
        this.onopen?.({} as Event);
    }
}

function createRuntime(config: Partial<ResolvedWsIoClientConfig> = {}) {
    return {
        _client: {},
        _config: {
            connectTimeout: 10_000,
            disconnectTimeout: 5_000,
            initHandlerTimeout: 1_000,
            initPacketTimeout: 10_000,
            onSessionCloseHandlerTimeout: 1_000,
            packetCodec: wsIoPacketJsonCodec,
            pingInterval: 10_000,
            readyPacketTimeout: 10_000,
            reconnectDelay: 1_000,
            requestPath: '/ws.io',
            ...config,
        },
        _disconnect: vi.fn(async () => {}),
        _eventHandlers: {},
        _wakeSendEventDataPromise: vi.fn(),
    } as unknown as WsIoClientRuntime;
}

function createSession(config: Partial<ResolvedWsIoClientConfig> = {}) {
    const runtime = createRuntime(config);
    const ws = new FakeWebSocket();
    const session = new WsIoClientSession(runtime, ws as unknown as WebSocket);
    return {
        runtime,
        session,
        ws,
    };
}

async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
}

describe.concurrent('wsIoClientSession', () => {
    it('performs init to ready handshake and wakes buffered emit flushing', async () => {
        const initHandler = vi.fn(() => ['client-init']);
        const onSessionReadyHandler = vi.fn();
        const {
            runtime,
            session,
            ws,
        } = createSession({
            initHandler,
            onSessionReadyHandler,
        });

        ws.emitOpen();
        ws.emitMessage(wsIoPacketJsonCodec.encode(WsIoPacket.newInit(wsIoPacketJsonCodec.encodeData(['server-init']))));
        await flushMicrotasks();

        expect(initHandler).toHaveBeenCalledWith(session, ['server-init']);
        const initResponse = wsIoPacketJsonCodec.decode(ws.sent.at(-1) as string);
        expect(initResponse.type).toBe(WsIoPacketType.Init);
        expect(wsIoPacketJsonCodec.decodeData(initResponse.data!)).toStrictEqual(['client-init']);

        ws.emitMessage(wsIoPacketJsonCodec.encode({ type: WsIoPacketType.Ready }));
        await flushMicrotasks();

        expect(session.isReady).toBe(true);
        expect(runtime._wakeSendEventDataPromise).toHaveBeenCalledOnce();
        expect(onSessionReadyHandler).toHaveBeenCalledWith(session);

        session._close();
        await session._waitForClose;
        await session._cleanup();
    });

    it('closes the transport when packet handling fails', async () => {
        const { session, ws } = createSession();

        ws.emitOpen();
        ws.emitMessage(wsIoPacketJsonCodec.encode({ type: WsIoPacketType.Ready }));
        await session._waitForClose;

        expect(ws.close).toHaveBeenCalledOnce();
        await session._cleanup();
    });

    it('isolates user event handler failures from the transport lifecycle', async () => {
        const handler = vi.fn(() => {
            throw new Error('handler failed');
        });

        const {
            runtime,
            session,
            ws,
        } = createSession();

        runtime._eventHandlers.event = new Map([
            [
                0,
                handler,
            ],
        ]);

        ws.emitOpen();
        ws.emitMessage(wsIoPacketJsonCodec.encode(WsIoPacket.newInit()));
        await flushMicrotasks();
        ws.emitMessage(wsIoPacketJsonCodec.encode({ type: WsIoPacketType.Ready }));
        await flushMicrotasks();

        ws.close.mockClear();
        ws.emitMessage(wsIoPacketJsonCodec.encode(
            WsIoPacket.newEvent('event', wsIoPacketJsonCodec.encodeData(['payload'])),
        ));

        await flushMicrotasks();

        expect(handler).toHaveBeenCalledWith('payload');
        expect(ws.close).not.toHaveBeenCalled();

        session._close();
        await session._waitForClose;
        await session._cleanup();
    });

    it('does not revive a closing session on a late websocket open', () => {
        const { session, ws } = createSession();
        ws.autoClose = false;

        session._close();
        ws.close.mockClear();
        ws.emitOpen();

        expect(session._isCreated).toBe(false);
        expect(session.isReady).toBe(false);
        expect(ws.close).toHaveBeenCalledOnce();
    });
});
