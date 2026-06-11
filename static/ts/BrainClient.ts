class BrainClient {
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
        return BrainClient.postJson<Context | AnomalyContext, Decision>('/api/decide', payload);
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
