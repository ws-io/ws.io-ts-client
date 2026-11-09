import {
    objectKeys,
    objectValues,
} from 'ts-extras';
import type { ValueOf } from 'type-fest';

export function getEnumNumberValues<T extends Record<string, any>>(enumObject: T): Array<Extract<ValueOf<T>, number>> {
    return getEnumValues(enumObject).filter((value) => typeof value === 'number');
}

export function getEnumValues<T extends Record<string, any>>(enumObject: T): Array<ValueOf<T>> {
    const values = objectValues(enumObject);
    const hasNumberValues = values.some((value) => typeof value === 'number');
    if (!hasNumberValues) return values;
    return objectKeys(enumObject).filter((key) => Number.isNaN(Number(key))).map((key) => enumObject[key]);
}
