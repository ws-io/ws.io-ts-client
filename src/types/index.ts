export interface DefaultEventsMap {
    [event: string]: (...args: any[]) => void;
}

export interface EventsMap {
    [event: string]: (...args: any[]) => any;
}
