// src/services/openrouter.ts
// Model list now fetched through the backend proxy — API key never leaves the server.

export interface OpenRouterModel {
    id: string;
    name: string;
    context_length: number;
    description?: string;
    pricing?: { prompt: string; completion: string };
}

export async function fetchModels(): Promise<OpenRouterModel[]> {
    const res = await fetch("/api/models");
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? `Failed to fetch models: ${res.statusText}`);
    }
    return res.json();
}
