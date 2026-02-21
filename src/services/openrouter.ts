export interface OpenRouterModel {
    id: string;
    name: string;
    context_length: number;
    description?: string;
    pricing?: {
        prompt: string;
        completion: string;
    };
}

export async function fetchModels(apiKey: string): Promise<OpenRouterModel[]> {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    });
    if (!res.ok) throw new Error(`Failed to fetch models: ${res.statusText}`);
    const data = await res.json();
    // Sort alphabetically by name
    return (data.data as OpenRouterModel[]).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}
