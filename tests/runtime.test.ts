import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    WsIoPacket,
    WsIoPacketType,
} from '../src/core/packet';
import type {
    WsIoEncodedPacketData,
    WsIoPacketCodec,
} from '../src/core/packet/codecs';
import { wsIoPacketCborCodec } from '../src/core/packet/codecs/cbor';
import { wsIoPacketMsgpackCodec } from '../src/core/packet/codecs/msgpack';
import { WsIoClientRuntime } from '../src/runtime';

class FakeRuntimeWebSocket {
    static readonly instances: FakeRuntimeWebSocket[] = [];

    binaryType = '';
    onclose: ((event: CloseEvent) => unknown) | null = null;
    onmessage: ((event: MessageEvent) => unknown) | null = null;
    onopen: ((event: Event) => unknown) | null = null;
    readonly sent: unknown[] = [];

    constructor(readonly url: URL) {
        FakeRuntimeWebSocket.instances.push(this);
    }

    readonly close = vi.fn(() => {
        this.onclose?.({} as CloseEvent);
    });

    readonly send = vi.fn((data: unknown) => {
        this.sent.push(data);
    });

    emitMessage(data: WsIoEncodedPacketData) {
        this.onmessage?.({ data } as MessageEvent);
    }

    emitOpen() {
        this.onopen?.({} as Event);
    }

    static reset() {
        FakeRuntimeWebSocket.instances.length = 0;
    }
}

function decodeSentPackets(ws: FakeRuntimeWebSocket, codec: WsIoPacketCodec) {
    return ws.sent.map((data) => codec.decode(data as WsIoEncodedPacketData));
}

async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
}

async function waitFor(predicate: () => boolean) {
    for (let index = 0; index < 50; index++) {
        if (predicate()) return;
        await flushMicrotasks();
    }
}

describe('wsIoClientRuntime', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        FakeRuntimeWebSocket.reset();
    });

    it('connects to configured requestPath while preserving namespace in query', async () => {
        vi.stubGlobal('WebSocket', FakeRuntimeWebSocket);
        const runtime = new WsIoClientRuntime(
            {} as never,
            'ws://example.test/app//namespace//?token=a%26b&namespace=ignored',
            { requestPath: '/custom//ws/' },
        );

        await runtime._connect();

        const url = FakeRuntimeWebSocket.instances[0]!.url;
        expect(url.toString()).toBe('ws://example.test/custom/ws?token=a%26b&namespace=%2Fapp%2Fnamespace');
        expect(FakeRuntimeWebSocket.instances[0]!.binaryType).toBe('arraybuffer');

        await runtime._disconnect();
    });

    it('flushes queued emits after session ready wakes the send loop', async () => {
        vi.stubGlobal('WebSocket', FakeRuntimeWebSocket);
        const runtime = new WsIoClientRuntime(
            {} as never,
            'ws://example.test/app',
            {},
        );

        await runtime._connect();
        runtime._emit('queued-event', ['payload']);

        const ws = FakeRuntimeWebSocket.instances[0]!;
        ws.emitOpen();
        ws.emitMessage(wsIoPacketMsgpackCodec.encode(WsIoPacket.newInit()));
        await flushMicrotasks();
        ws.emitMessage(wsIoPacketMsgpackCodec.encode({ type: WsIoPacketType.Ready }));
        await waitFor(() => decodeSentPackets(ws, wsIoPacketMsgpackCodec)
            .some((packet) => packet.key === 'queued-event'));

        const eventPacket = decodeSentPackets(ws, wsIoPacketMsgpackCodec)
            .find((packet) => packet.key === 'queued-event');

        expect(eventPacket?.type).toBe(WsIoPacketType.Event);
        expect(wsIoPacketMsgpackCodec.decodeData(eventPacket!.data!)).toStrictEqual(['payload']);

        await runtime._disconnect();
    });

    it('runs session ready listeners on every ready and immediately only when requested', async () => {
        vi.stubGlobal('WebSocket', FakeRuntimeWebSocket);
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const client = {} as never;
        const runtime = new WsIoClientRuntime(client, 'ws://example.test/app', { reconnectDelay: 0 });
        const handshake = async (ws: FakeRuntimeWebSocket) => {
            ws.emitOpen();
            ws.emitMessage(wsIoPacketMsgpackCodec.encode(WsIoPacket.newInit()));
            await flushMicrotasks();
            ws.emitMessage(wsIoPacketMsgpackCodec.encode({ type: WsIoPacketType.Ready }));
            await flushMicrotasks();
        };

        try {
            const error = new Error('listener failed');
            const failingListener = vi.fn(() => Promise.reject(error));
            const earlyListener = vi.fn();
            const removedListener = vi.fn();
            runtime._onSessionReady(failingListener);
            runtime._onSessionReady(earlyListener, true);
            const removeListener = runtime._onSessionReady(removedListener);
            expect(earlyListener).not.toHaveBeenCalled();

            await runtime._connect();
            await handshake(FakeRuntimeWebSocket.instances[0]!);
            expect(earlyListener).toHaveBeenCalledExactlyOnceWith(client);
            expect(removedListener).toHaveBeenCalledOnce();
            await vi.waitFor(
                () => expect(errorSpy).toHaveBeenCalledWith('ws.io client session ready listener failed', error),
            );

            const immediateListener = vi.fn();
            const lazyListener = vi.fn();
            runtime._onSessionReady(immediateListener, true);
            runtime._onSessionReady(lazyListener);
            expect(immediateListener).toHaveBeenCalledExactlyOnceWith(client);
            expect(lazyListener).not.toHaveBeenCalled();

            removeListener();
            FakeRuntimeWebSocket.instances[0]!.close();
            await vi.waitFor(() => expect(FakeRuntimeWebSocket.instances).toHaveLength(2));
            await handshake(FakeRuntimeWebSocket.instances[1]!);

            expect(failingListener).toHaveBeenCalledTimes(2);
            expect(earlyListener).toHaveBeenCalledTimes(2);
            expect(immediateListener).toHaveBeenCalledTimes(2);
            expect(lazyListener).toHaveBeenCalledOnce();
            expect(removedListener).toHaveBeenCalledOnce();
        } finally {
            errorSpy.mockRestore();
            await runtime._disconnect();
        }
    });

    it('runs session close listeners for each closed session until removed', async () => {
        vi.stubGlobal('WebSocket', FakeRuntimeWebSocket);
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const client = {} as never;
        const runtime = new WsIoClientRuntime(client, 'ws://example.test/app', { reconnectDelay: 0 });

        try {
            const error = new Error('listener failed');
            const failingListener = vi.fn(() => Promise.reject(error));
            const listener = vi.fn();
            const removedListener = vi.fn();
            runtime._onSessionClose(failingListener);
            runtime._onSessionClose(listener);
            const removeListener = runtime._onSessionClose(removedListener);

            await runtime._connect();
            FakeRuntimeWebSocket.instances[0]!.close();
            await vi.waitFor(() => expect(listener).toHaveBeenCalledExactlyOnceWith(client));
            expect(removedListener).toHaveBeenCalledOnce();
            await vi.waitFor(
                () => expect(errorSpy).toHaveBeenCalledWith('ws.io client session close listener failed', error),
            );

            removeListener();
            await vi.waitFor(() => expect(FakeRuntimeWebSocket.instances).toHaveLength(2));
            await runtime._disconnect();

            expect(failingListener).toHaveBeenCalledTimes(2);
            expect(listener).toHaveBeenCalledTimes(2);
            expect(removedListener).toHaveBeenCalledOnce();
        } finally {
            errorSpy.mockRestore();
            await runtime._disconnect();
        }
    });

    it.each([
        [
            'cbor',
            wsIoPacketCborCodec,
        ],
        [
            'msgpack',
            wsIoPacketMsgpackCodec,
        ],
    ] as const)(
        'roundtrips %s packets through runtime and websocket transport',
        async (_name, codec) => {
            vi.stubGlobal('WebSocket', FakeRuntimeWebSocket);
            const eventHandler = vi.fn();
            const runtime = new WsIoClientRuntime(
                {} as never,
                'ws://example.test/app',
                {
                    initHandler: () => ['client-init'],
                    packetCodec: codec,
                },
            );

            runtime._eventHandlers.serverEvent = new Map([
                [
                    0,
                    eventHandler,
                ],
            ]);

            await runtime._connect();

            const ws = FakeRuntimeWebSocket.instances[0]!;
            ws.emitOpen();
            ws.emitMessage(codec.encode(WsIoPacket.newInit(codec.encodeData(['server-init']))));
            await waitFor(() => decodeSentPackets(ws, codec).some((packet) => packet.type === WsIoPacketType.Init));

            const initResponse = decodeSentPackets(ws, codec).find((packet) => packet.type === WsIoPacketType.Init);
            expect(codec.decodeData(initResponse!.data!)).toStrictEqual(['client-init']);

            ws.emitMessage(codec.encode({ type: WsIoPacketType.Ready }));
            await waitFor(() => runtime._isSessionReady);

            ws.emitMessage(codec.encode(
                WsIoPacket.newEvent('serverEvent', codec.encodeData(['server-payload'])),
            ));

            await waitFor(() => eventHandler.mock.calls.length === 1);
            expect(eventHandler).toHaveBeenCalledWith('server-payload');

            runtime._emit('clientEvent', ['client-payload']);
            await waitFor(() => decodeSentPackets(ws, codec).some((packet) => packet.key === 'clientEvent'));

            const eventPacket = decodeSentPackets(ws, codec).find((packet) => packet.key === 'clientEvent');
            expect(codec.decodeData(eventPacket!.data!)).toStrictEqual(['client-payload']);

            await runtime._disconnect();
        },
    );
});
