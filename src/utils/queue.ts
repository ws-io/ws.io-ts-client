import type { Promisable } from 'type-fest';
import Queue from 'yocto-queue';

export class AsyncQueue<T> {
    // Private properties
    #closed = false;
    readonly #queue = new Queue<T>();
    readonly #resolvers = new Queue<((value: Promisable<null | T>) => void)>();

    // Symbols
    async* [Symbol.asyncIterator]() {
        while (true) {
            const value = await this.recv();
            if (value === null) break;
            yield value;
        }
    }

    // Public getters
    get closed() {
        return this.#closed;
    }

    // Public methods
    closeAndClear() {
        this.#closed = true;
        this.#queue.clear();
        for (const resolver of this.#resolvers.drain()) resolver(null);
    }

    recv(): Promisable<null | T> {
        if (this.#queue.size) return this.#queue.dequeue()!;
        if (this.#closed) return null;
        return new Promise<null | T>((resolve) => void this.#resolvers.enqueue(resolve));
    }

    reopen() {
        this.#closed = false;
    }

    send(value: T) {
        if (this.#closed) throw new Error('Queue is closed');
        const resolver = this.#resolvers.dequeue();
        if (resolver) resolver(value);
        else this.#queue.enqueue(value);
    }

    trySend(value: T) {
        try {
            this.send(value);
            return true;
        } catch {
            return false;
        }
    }
}
