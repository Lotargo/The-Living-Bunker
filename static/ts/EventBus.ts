class EventBus {
    private static handlers: RuntimeEventHandler[] = [];
    private static history: RuntimeEvent[] = [];
    private static nextId: number = 1;
    private static maxHistory: number = 300;

    static emit(type: string, source: string, payload: Record<string, any> = {}): RuntimeEvent {
        const baseEvent: RuntimeEvent = {
            version: 'v1',
            id: 'evt_' + EventBus.nextId++,
            type: type,
            ts: Date.now(),
            source: source
        };
        const event: RuntimeEvent = Object.assign(baseEvent, payload);

        EventBus.history.push(event);
        while (EventBus.history.length > EventBus.maxHistory) {
            EventBus.history.shift();
        }

        EventBus.handlers.forEach(function(handler: RuntimeEventHandler): void {
            handler(event);
        });
        window.dispatchEvent(new CustomEvent('bunker:event', { detail: event }));

        return event;
    }

    static on(handler: RuntimeEventHandler): () => void {
        EventBus.handlers.push(handler);
        return function(): void {
            EventBus.handlers = EventBus.handlers.filter(function(h: RuntimeEventHandler): boolean {
                return h !== handler;
            });
        };
    }

    static getHistory(): RuntimeEvent[] {
        return EventBus.history.slice();
    }
}
