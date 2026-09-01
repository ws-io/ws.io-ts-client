import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    sleep,
    waitWithTimeout,
} from '../src/utils';
import { AsyncQueue } from '../src/utils/queue';

describe.concurrent('asyncQueue', () => {
    it('delivers a send to an already waiting receiver', async () => {
        const queue = new AsyncQueue<string>();
        const received = queue.recv();

        queue.send('value');

        await expect(received).resolves.toBe('value');
    });

    it('drains buffered values then stops iteration after close', async () => {
        const queue = new AsyncQueue<number>();
        queue.send(1);
        queue.send(2);
        queue.closeAndClear();

        const values: number[] = [];
        for await (const value of queue) values.push(value);

        expect(values).toStrictEqual([]);
    });

    it('releases pending receivers with null on close and can reopen', async () => {
        const queue = new AsyncQueue<string>();
        const pending = queue.recv();

        queue.closeAndClear();
        await expect(pending).resolves.toBeNull();
        expect(queue.trySend('closed')).toBe(false);

        queue.reopen();
        expect(queue.trySend('open')).toBe(true);
        expect(queue.recv()).toBe('open');
    });
});

describe('async timing utilities', () => {
    it('resolves sleep early when aborted', async () => {
        vi.useFakeTimers();
        try {
            const controller = new AbortController();
            const promise = sleep(1_000, controller.signal);

            controller.abort();
            await expect(promise).resolves.toBeUndefined();
        } finally {
            vi.useRealTimers();
        }
    });

    it('rejects waitWithTimeout when the operation does not settle in time', async () => {
        vi.useFakeTimers();
        try {
            const promise = expect(waitWithTimeout(10, new Promise(() => {}))).rejects.toThrow('Timeout');
            await vi.advanceTimersByTimeAsync(10);
            await promise;
        } finally {
            vi.useRealTimers();
        }
    });
});
