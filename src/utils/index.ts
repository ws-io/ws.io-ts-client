import type { Promisable } from 'type-fest';

export const sleep = (ms: number) => new Promise((resolve) => void setTimeout(resolve, ms));

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
