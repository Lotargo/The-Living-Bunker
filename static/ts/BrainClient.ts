class BrainClient {
    private static queue: (() => void)[] = [];
    private static active: boolean = false;
    private static lastRequestAt: number = 0;

    private static enqueue<T>(task: () => Promise<T>): Promise<T> {
        if (Runtime.apiPaused || Runtime.paused) {
            return Promise.reject(new Error('Simulation paused'));
        }

        if (BrainClient.queue.length >= BRAIN.MAX_QUEUE_SIZE) {
            return Promise.reject(new Error('Brain queue is full'));
        }

        return new Promise<T>(function(resolve, reject): void {
            BrainClient.queue.push(function(): void {
                task().then(resolve).catch(reject);
            });
            BrainClient.pump();
        });
    }

    private static pump(): void {
        if (BrainClient.active) return;
        const next = BrainClient.queue.shift();
        if (!next) return;

        const delay = Math.max(0, BRAIN.MIN_REQUEST_INTERVAL_MS - (Date.now() - BrainClient.lastRequestAt));
        BrainClient.active = true;
        window.setTimeout(function(): void {
            if (Runtime.apiPaused || Runtime.paused) {
                BrainClient.clearQueue();
                BrainClient.active = false;
                return;
            }
            BrainClient.lastRequestAt = Date.now();
            next();
            BrainClient.active = false;
            BrainClient.pump();
        }, delay);
    }

    static clearQueue(): void {
        BrainClient.queue = [];
    }

    private static async postJson<TRequest, TResponse>(url: string, payload: TRequest): Promise<TResponse> {
        const res: Response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || data.response || ('Request failed: ' + res.status));
        }
        return data as TResponse;
    }

    static decide(payload: Context | AnomalyContext): Promise<Decision> {
        return BrainClient.enqueue(function(): Promise<Decision> {
            return BrainClient.postJson<Context | AnomalyContext, Decision>('/api/decide', payload);
        });
    }

    static architect(prompt: string): Promise<ArchitectResponse> {
        return BrainClient.postJson<ArchitectRequest, ArchitectResponse>('/api/architect', { prompt: prompt });
    }

    static getSettings(): Promise<RuntimeSettings> {
        return fetch('/api/settings').then(function(res: Response): Promise<RuntimeSettings> {
            if (!res.ok) throw new Error('Settings request failed: ' + res.status);
            return res.json();
        });
    }

    static updateSettings(payload: RuntimeSettings): Promise<RuntimeSettings> {
        return BrainClient.postJson<RuntimeSettings, RuntimeSettings>('/api/settings', payload);
    }
}
