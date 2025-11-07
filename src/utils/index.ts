import type { Promisable } from 'type-fest';

export function sleep(ms: number, signal?: AbortSignal) {
    return new Promise((resolve) => {
        const timeout = setTimeout(resolve, ms);
        if (signal) {
            signal.addEventListener(
                'abort',
                () => {
                    clearTimeout(timeout);
                    resolve(undefined);
                },
            );
        }
    });
}

export function waitWithTimeout<T>(timeoutMs: number, promise?: Promisable<T>): Promise<T | undefined> {
    if (!promise) return Promise.resolve(undefined);
    return new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
        (promise instanceof Promise ? promise : Promise.resolve(promise))
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(timeout));
    });
}
