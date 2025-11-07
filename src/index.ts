import { WsIoClientRuntime } from './runtime';
import type { WsIoClientConfig } from './types/config';

// Classes
export class WsIoClient {
    #runtime: WsIoClientRuntime;

    constructor(url: string | URL, config?: Partial<WsIoClientConfig>) {
        this.#runtime = new WsIoClientRuntime(this, url, config);
    }

    // Public methods
    connect() {
        return this.#runtime.connect();
    }

    disconnect() {
        return this.#runtime.disconnect();
    }
}
