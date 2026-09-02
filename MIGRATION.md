# TypeScript Client Migration Notes

This document summarizes the user-visible migration items from baseline commit `0dc7fca18e14ad785566a107d5712b631639d544` to the current HEAD `8a2849fc2974233cff9c37703ed196a9906fce54`. Routine lockfile, script, test-infrastructure, and development-tool updates are intentionally omitted.

## Breaking Changes

### 1. Packets now use binary MsgPack

- The default `packetCodec` changed from JSON to `wsIoPacketMsgpackCodec`.
- `src/core/packet/codecs/json.ts` was removed, and `msgpackr` is now a runtime dependency rather than an optional peer dependency.
- `cbor-x` remains an optional peer dependency. Applications selecting `wsIoPacketCborCodec` must install `cbor-x`, and the Rust endpoint must use the matching CBOR codec.
- Codecs now accept and produce only binary data (`ArrayBuffer` or typed-array views). Legacy JSON/text frames are not interoperable, so the client and server must be upgraded together.

```ts
import { WsIoClient } from 'ws.io-client';
import { wsIoPacketMsgpackCodec } from 'ws.io-client/core/packet/codecs/msgpack';

const client = new WsIoClient(url, { packetCodec: wsIoPacketMsgpackCodec });
```

### 2. Packet data is binary view data

- `WsIoPacketData` changed from `ArrayBufferView<ArrayBuffer> | number[]` to `ArrayBufferView<ArrayBufferLike>`; `number[]` is no longer valid packet data.
- `WsIoEncodedPacketData = ArrayBuffer | ArrayBufferView<ArrayBufferLike>` is now used by codec encode/decode APIs and the session send path.
- Custom codecs must return `ArrayBuffer` or typed-array views and must decode binary input only. `packetDataToUint8Array` preserves normal view offsets and lengths, while SharedArrayBuffer-backed views are copied to a regular `Uint8Array` at the browser WebSocket boundary.

```ts
const encoded = codec.encodeData(payload); // ArrayBufferView<ArrayBufferLike>
const packet = WsIoPacket.newEvent('event', encoded);
```

### 3. Events are dispatched FIFO within each session

Each WebSocket session owns an async queue and a single dispatcher. Packets from one session are processed in wire order, and the dispatcher waits for the current packet's handler batch before processing the next packet. Different sessions remain independent and can run in parallel. Cleanup aborts the dispatcher, clears queued packets, and waits for the dispatcher to finish; pending events are discarded without persistence or replay.

Multiple handlers for one event are still supported. Handlers for the same packet start concurrently and are all awaited, so registration order does not define handler execution order. Handler throws and rejected promises are isolated and do not close the transport; packet decode failures or a fatal dispatcher error close the session.

The TypeScript queue is currently unbounded, so slow handlers or high event rates can accumulate memory. This differs from the Rust bounded queue, which applies backpressure when full.

### 4. Event keys must be non-empty

- `WsIoClient.emit`, `on`, `off`, `offByHandlerId`, the runtime `_on` method, and `WsIoPacket.newEvent` reject empty keys.
- Non-string public event names still throw `Event must be a string`.
- Decoding an event packet with a missing or empty key throws and closes the session instead of silently ignoring the malformed event.

### 5. Unused APIs were removed

- The unused `SessionStatus.Readying` variant was removed.
- `AsyncQueue.trySend()` was removed; use `send()` and handle the error when the queue is closed.

## Rust/TypeScript Payload Interoperability

TypeScript `emit('event', value)` always encodes its arguments as `[value]`, and multiple arguments as `[a, b, ...]`. Rust emit and handler types must therefore use a tuple, array, or other sequence such as `(value,)` and `(width, height)` rather than a scalar. TypeScript handlers receive the decoded array through argument spreading. Custom codecs must preserve this array payload shape.

```ts
client.emit('stdin', value); // wire payload: [value]
client.emit('resize', width, height); // wire payload: [width, height]
```

An event with no arguments can omit packet data.

## Migration Checklist

- [ ] Upgrade both endpoints to a common binary codec, using MsgPack by default or CBOR on both sides.
- [ ] Remove `wsIoPacketJsonCodec` and custom codec assumptions about strings or `number[]`.
- [ ] Update `WsIoPacketData`, `WsIoEncodedPacketData`, and WebSocket send-boundary types.
- [ ] Encode cross-language event arguments as tuples or other sequences matching the TypeScript array payload.
- [ ] Ensure every public event key is non-empty.
- [ ] Account for the unbounded TypeScript queue and the fact that pending events are dropped during cleanup.
- [ ] If using CBOR, install `cbor-x` and configure the Rust endpoint with its matching CBOR codec.
