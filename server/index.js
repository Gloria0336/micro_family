// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getState, getChatHistory, saveSimulation, resetSimulation } from "./db.js";
import { callOpenRouter, parseResponse } from "./ai.js";
import {
    INITIAL_STATE,
    INITIAL_NARRATIVE,
    SYSTEM_INSTRUCTION,
} from "./constants.js";

dotenv.config();

const app = express();
const PORT = 3001;

// ── In-memory config (never persisted to disk) ─────────────────────────────
let activeApiKey = process.env.OPENROUTER_API_KEY ?? "";
let activeModel = "google/gemini-2.5-flash";

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/state
 * Returns persisted world state + initial narrative history for page reload.
 */
app.get("/api/state", (_req, res) => {
    const worldState = getState();
    const chatHistory = getChatHistory();
    // Extract only narrative lines from chat history for the UI
    const narratives = chatHistory
        .filter((m) => m.role === "assistant")
        .map((m) => parseResponse(m.content).narrative);

    res.json({
        state: worldState,
        narrativeHistory: narratives.length ? narratives : [INITIAL_NARRATIVE],
    });
});

/**
 * POST /api/init
 * Resets simulation to INITIAL_STATE and clears chat history.
 */
app.post("/api/init", (_req, res) => {
    resetSimulation();
    res.json({ narrative: INITIAL_NARRATIVE, state: INITIAL_STATE });
});

/**
 * POST /api/action
 * Body: { input: string }
 * Reads current state → calls AI → saves new state → returns result.
 */
app.post("/api/action", async (req, res) => {
    const { input } = req.body;
    if (!input?.trim()) return res.status(400).json({ error: "input is required" });

    const apiKey = activeApiKey;
    if (!apiKey) return res.status(401).json({ error: "No API key configured. Set it via POST /api/config." });

    try {
        const currentState = getState();
        const chatHistory = getChatHistory();

        // Build message array
        const userMessage = `【當前世界絕對狀態】：${JSON.stringify(currentState)}\n【使用者輸入/新事件】：${input}\n請根據上述「當前狀態」與「新事件」，推演下一步，並輸出新的 JSON。`;

        const messages = [
            { role: "system", content: SYSTEM_INSTRUCTION },
            // Seed with initial exchange if fresh start
            ...(chatHistory.length === 0
                ? [
                    { role: "user", content: "初始化模擬，時間設定為 07:00" },
                    {
                        role: "assistant",
                        content: `=== 📝 敘事推演 ===\n${INITIAL_NARRATIVE}\n\n=== 💾 當前世界狀態庫 (JSON) ===\n${JSON.stringify(INITIAL_STATE)}`,
                    },
                ]
                : chatHistory),
            { role: "user", content: userMessage },
        ];

        const rawText = await callOpenRouter(messages, activeModel, apiKey);
        const { narrative, state } = parseResponse(rawText);

        // Persist: update chat history (drop system prompt to avoid bloat)
        const newHistory = [
            ...(chatHistory.length === 0
                ? [
                    { role: "user", content: "初始化模擬，時間設定為 07:00" },
                    {
                        role: "assistant",
                        content: `=== 📝 敘事推演 ===\n${INITIAL_NARRATIVE}\n\n=== 💾 當前世界狀態庫 (JSON) ===\n${JSON.stringify(INITIAL_STATE)}`,
                    },
                ]
                : chatHistory),
            { role: "user", content: userMessage },
            { role: "assistant", content: rawText },
        ];

        saveSimulation(state, newHistory);

        res.json({ narrative, state });
    } catch (err) {
        console.error("Action error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/config
 * Body: { apiKey?: string, model?: string }
 * Stores settings in memory (never on disk). Also resets model list cache.
 */
app.post("/api/config", (req, res) => {
    const { apiKey, model } = req.body;
    if (apiKey !== undefined) activeApiKey = apiKey;
    if (model !== undefined) activeModel = model;
    res.json({ ok: true, model: activeModel, hasApiKey: !!activeApiKey });
});

/**
 * GET /api/models
 * Proxies OpenRouter /v1/models — key stays server-side, never in browser.
 */
app.get("/api/models", async (_req, res) => {
    if (!activeApiKey) return res.status(401).json({ error: "No API key configured." });
    try {
        const upstream = await fetch("https://openrouter.ai/api/v1/models", {
            headers: { Authorization: `Bearer ${activeApiKey}` },
        });
        if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);
        const data = await upstream.json();
        const sorted = data.data.sort((a, b) => a.name.localeCompare(b.name));
        res.json(sorted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ MicroSim server running on http://localhost:${PORT}`);
    if (!activeApiKey) console.warn("⚠️  No OPENROUTER_API_KEY set. Configure via UI or .env");
});
