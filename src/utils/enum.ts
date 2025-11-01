export function getEnumNumberValues<T extends Record<string, any>>(enumObject: T): Extract<T[keyof T], number>[] {
    return getEnumValues(enumObject).filter((value) => typeof value === 'number');
}

export function getEnumValues<T extends Record<string, any>>(enumObject: T): (T[keyof T])[] {
    const values = Object.values(enumObject);
    const hasNumberValues = values.some((value) => typeof value === 'number');
    if (!hasNumberValues) return values;
    return Object.keys(enumObject).filter((key) => Number.isNaN(Number(key))).map((key) => enumObject[key]);
}
