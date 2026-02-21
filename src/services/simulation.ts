// src/services/simulation.ts
// Thin HTTP client — all AI logic lives in the backend server now.
import { WorldState, SimulationResponse, INITIAL_STATE } from "../types";

export class SimulationService {
  async startSimulation(): Promise<{ narrative: string; state: WorldState; narrativeHistory: string[] }> {
    const res = await fetch("/api/init", { method: "POST" });
    if (!res.ok) throw new Error(`Init failed: ${res.statusText}`);
    const data = await res.json();
    return { narrative: data.narrative, state: data.state, narrativeHistory: [data.narrative] };
  }

  async loadState(): Promise<{ state: WorldState; narrativeHistory: string[] }> {
    const res = await fetch("/api/state");
    if (!res.ok) throw new Error(`Load state failed: ${res.statusText}`);
    return res.json();
  }

  async processAction(input: string): Promise<SimulationResponse> {
    const res = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? res.statusText);
    }
    return res.json();
  }

  async configure(config: { apiKey?: string; model?: string }): Promise<void> {
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  }
}

export const simulationService = new SimulationService();
