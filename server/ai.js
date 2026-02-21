// server/ai.js
import { INITIAL_STATE } from "./constants.js";

/**
 * Call OpenRouter chat completions API.
 * @param {Array<{role:string, content:string}>} messages
 * @param {string} model
 * @param {string} apiKey
 * @returns {Promise<string>} raw assistant text
 */
export async function callOpenRouter(messages, model, apiKey) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "MicroSim Family",
        },
        body: JSON.stringify({ model, messages }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "(no response)";
}

/**
 * Parse the AI response into narrative + world state.
 * @param {string} text
 * @returns {{ narrative: string, state: object }}
 */
export function parseResponse(text) {
    const narrativeMatch = text.match(
        /=== 📝 敘事推演 ===\s*([\s\S]*?)\s*=== 💾 當前世界狀態庫 \(JSON\) ===/
    );
    const jsonMatch = text.match(
        /=== 💾 當前世界狀態庫 \(JSON\) ===\s*([\s\S]*)/
    );

    let narrative = "解析錯誤：無法讀取敘事內容。";
    let state = INITIAL_STATE;

    if (narrativeMatch?.[1]) {
        narrative = narrativeMatch[1].trim();
    }

    if (jsonMatch?.[1]) {
        try {
            let jsonStr = jsonMatch[1].trim();
            if (jsonStr.startsWith("```json"))
                jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
            else if (jsonStr.startsWith("```"))
                jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "");
            state = JSON.parse(jsonStr.trim());
        } catch (e) {
            console.error("Failed to parse JSON state:", e.message);
        }
    }

    return { narrative, state };
}
