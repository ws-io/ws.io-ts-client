import type { Promisable } from 'type-fest';

export async function delay(ms: number, signal?: AbortSignal): Promise<void> {
    return await new Promise((resolve) => {
        if (signal?.aborted) {
            resolve();
            return;
        }

        const done = () => {
            // eslint-disable-next-line ts/no-use-before-define
            clearTimeout(timeout);
            signal?.removeEventListener('abort', done);
            resolve();
        };

        const timeout = setTimeout(done, ms);
        signal?.addEventListener('abort', done, { once: true });
    });
}

export async function waitWithTimeout<T>(timeoutMs: number, promisable?: Promisable<T>): Promise<T | undefined> {
    if (!promisable) return await Promise.resolve(undefined);
    return await new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
        (promisable instanceof Promise ? promisable : Promise.resolve(promisable))
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(timeout));
    });
}
