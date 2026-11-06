import {
    describe,
    it,
    vi,
} from 'vitest';

import { AsyncQueue } from '../src/_internals/async-queue';
import {
    delay,
    waitWithTimeout,
} from '../src/_internals/timing';

describe.concurrent('asyncQueue', () => {
    it('should deliver a send to an already waiting receiver', async ({ expect }) => {
        const queue = new AsyncQueue<string>();
        const received = queue.recv();

        queue.send('value');

        await expect(received).resolves.toBe('value');
    });

    it('should drain buffered values then stops iteration after close', async ({ expect }) => {
        const queue = new AsyncQueue<number>();
        queue.send(1);
        queue.send(2);
        queue.closeAndClear();

        const values: number[] = [];
        for await (const value of queue) values.push(value);

        expect(values).toStrictEqual([]);
    });

    it('should release pending receivers with null on close and can reopen', async ({ expect }) => {
        const queue = new AsyncQueue<string>();
        const pending = queue.recv();

        queue.closeAndClear();
        await expect(pending).resolves.toBeNull();
        expect(() => queue.send('closed')).toThrow('Queue is closed');

        queue.reopen();
        queue.send('open');
        expect(queue.recv()).toBe('open');
    });
});

describe('async timing utilities', () => {
    it('should resolve delay early when aborted', async ({ expect }) => {
        vi.useFakeTimers();
        try {
            const controller = new AbortController();
            const promise = delay(1_000, controller.signal);

            controller.abort();
            await expect(promise).resolves.toBeUndefined();
        } finally {
            vi.useRealTimers();
        }
    });

    it('should reject waitWithTimeout when the operation does not settle in time', async ({ expect }) => {
        vi.useFakeTimers();
        try {
            await Promise.all([
                expect(waitWithTimeout(10, new Promise(() => {}))).rejects.toThrow('Timeout'),
                vi.advanceTimersByTimeAsync(10),
            ]);
        } finally {
            vi.useRealTimers();
        }
    });
});
