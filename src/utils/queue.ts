import type { Promisable } from 'type-fest';

export class AsyncQueue<T> {
    // Private properties
    #closed: boolean = false;
    #queue: T[] = [];
    #resolvers: ((value: Promisable<null | T>) => void)[] = [];

    // Public getters
    get closed() {
        return this.#closed;
    }

    // Public methods
    close() {
        this.#closed = true;
        this.#resolvers.forEach((resolver) => resolver(null));
        this.#resolvers.length = 0;
    }

    recv() {
        if (this.#queue.length) return this.#queue.shift();
        if (this.#closed) return null;
        return new Promise<null | T>((resolve) => void this.#resolvers.push(resolve));
    }

    reopen() {
        this.#closed = false;
    }

    send(item: T) {
        if (this.#closed) throw new Error('Queue is closed');
        const resolver = this.#resolvers.shift();
        if (resolver) resolver(item);
        else this.#queue.push(item);
    }

    trySend(item: T) {
        try {
            this.send(item);
            return true;
        } catch {
            return false;
        }
    }
}
