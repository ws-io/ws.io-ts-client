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
            'ws://example.test/app//namespace?token=1',
            { requestPath: '/custom//ws' },
        );

        await runtime._connect();

        const url = FakeRuntimeWebSocket.instances[0]!.url;
        expect(url.toString()).toBe('ws://example.test/custom/ws?token=1&namespace=%2Fapp%2Fnamespace');
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

    it.each([
        [
            'cbor',
            wsIoPacketCborCodec,
        ],
        [
            'msgpack',
            wsIoPacketMsgpackCodec,
        ],
    ] as const)('roundtrips %s packets through runtime and websocket transport', async (_name, codec) => {
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
    });
});
