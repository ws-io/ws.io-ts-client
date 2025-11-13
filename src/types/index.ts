export interface DefaultEventsMap {
    [event: string]: (...args: any[]) => void;
}

export interface EventsMap {
    [event: string]: any;
}
