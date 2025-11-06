export class AtomicStatus<T> {
    #status: T;

    constructor(status: T) {
        this.#status = status;
    }

    // Public methods
    ensure(status: T, messageGenerator: (status: T) => string) {
        const currentStatus = this.#status;
        if (currentStatus !== status) throw new Error(messageGenerator(currentStatus));
    }

    get() {
        return this.#status;
    }

    is(status: T) {
        return this.#status === status;
    }

    store(status: T) {
        this.#status = status;
    }

    tryTransition(from: T, to: T) {
        if (this.#status !== from) throw new Error(`Invalid transition from ${this.#status} to ${to}`);
        this.#status = to;
    }
}
