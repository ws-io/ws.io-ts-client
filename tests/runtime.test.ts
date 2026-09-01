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
import type { WsIoEncodedPacketData } from '../src/core/packet/codecs';
import { wsIoPacketJsonCodec } from '../src/core/packet/codecs/json';
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

function decodeSentPackets(ws: FakeRuntimeWebSocket) {
    return ws.sent
        .filter((data): data is string => typeof data === 'string')
        .map((data) => wsIoPacketJsonCodec.decode(data));
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
            { packetCodec: wsIoPacketJsonCodec },
        );

        await runtime._connect();
        runtime._emit('queued-event', ['payload']);

        const ws = FakeRuntimeWebSocket.instances[0]!;
        ws.emitOpen();
        ws.emitMessage(wsIoPacketJsonCodec.encode(WsIoPacket.newInit()));
        await flushMicrotasks();
        ws.emitMessage(wsIoPacketJsonCodec.encode({ type: WsIoPacketType.Ready }));
        await waitFor(() => decodeSentPackets(ws).some((packet) => packet.key === 'queued-event'));

        const eventPacket = decodeSentPackets(ws).find((packet) => packet.key === 'queued-event');
        expect(eventPacket?.type).toBe(WsIoPacketType.Event);
        expect(wsIoPacketJsonCodec.decodeData(eventPacket!.data!)).toStrictEqual(['payload']);

        await runtime._disconnect();
    });
});
