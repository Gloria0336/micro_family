import { WorldState, SimulationResponse, INITIAL_STATE } from "../types";

const SYSTEM_INSTRUCTION = `
你是一個「微型虛擬世界模擬引擎」。
你的任務是模擬一個兩層樓小房子中，一家五口的生活狀態。
你必須在背景維護一個「JSON 格式的世界狀態」，並根據使用者的輸入（推進時間、或加入碎片化事件），合理推演角色的行為、對話與關係變化。

【世界基礎設定】
- 地點：一樓（客廳、廚房、浴廁）、二樓（主臥室、兒童房、書房）。
- 角色：爸爸（工程師，常熬夜）、媽媽（自由撰稿人，愛乾淨）、哥哥（高三生，叛逆期）、大妹（高一生，愛漂亮）、小妹（小學生，好奇心強）。

【你的回覆格式】
每次使用者輸入後，你「必須」嚴格按照以下兩個區塊來回覆，不要包含任何其他文字：

=== 📝 敘事推演 ===
（請用生動的描述，寫出當下發生了什麼事。角色之間有什麼互動？誰移動了位置？誰的情緒改變了？）

=== 💾 當前世界狀態庫 (JSON) ===
（請更新並輸出最新的 JSON 狀態。必須包含所有角色的：位置 location、當前動作 current_action、情緒狀態 mood、以及特殊物品或事件 notes。同時包含 environment 和 time 欄位。）

JSON 格式範例：
{
  "time": "HH:MM",
  "characters": [
    { "name": "爸爸", "role": "工程師", "location": "...", "current_action": "...", "mood": "...", "notes": "..." },
    ...
  ],
  "environment": { "weather": "...", "temperature": "...", "notes": "..." }
}
`;

const INITIAL_NARRATIVE =
  "早晨七點，陽光透過窗簾縫隙灑進屋內。媽媽已經在廚房忙碌，平底鍋裡滋滋作響，飄來煎蛋的香氣。爸爸還在主臥室呼呼大睡，昨晚似乎又熬夜趕專案了。大妹佔據了一樓的浴廁，正對著鏡子仔細整理瀏海。小妹穿著睡衣在客廳沙發上跳來跳去，等著看晨間卡通。哥哥的房間門緊閉，毫無動靜。";

type Message = { role: "system" | "user" | "assistant"; content: string };

export class SimulationService {
  private messages: Message[] = [];
  private modelId: string;
  private apiKey: string;

  constructor(modelId = "google/gemini-2.5-flash") {
    // Prefer user-stored key, fall back to env var
    this.apiKey =
      localStorage.getItem("or_api_key") ||
      import.meta.env.VITE_OPENROUTER_API_KEY ||
      "";
    this.modelId = modelId;
  }

  setModel(modelId: string) {
    this.modelId = modelId;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async chat(userMessage: string): Promise<string> {
    this.messages.push({ role: "user", content: userMessage });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "MicroSim Family",
      },
      body: JSON.stringify({
        model: this.modelId,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...this.messages,
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const assistantText: string =
      data.choices?.[0]?.message?.content ?? "(no response)";
    this.messages.push({ role: "assistant", content: assistantText });
    return assistantText;
  }

  async startSimulation(): Promise<SimulationResponse> {
    // Seed history with initial exchange so the model has context
    this.messages = [
      { role: "user", content: "初始化模擬，時間設定為 07:00" },
      {
        role: "assistant",
        content: `=== 📝 敘事推演 ===\n${INITIAL_NARRATIVE}\n\n=== 💾 當前世界狀態庫 (JSON) ===\n${JSON.stringify(INITIAL_STATE)}`,
      },
    ];

    return { narrative: INITIAL_NARRATIVE, state: INITIAL_STATE };
  }

  async processAction(
    input: string,
    currentState?: WorldState
  ): Promise<SimulationResponse> {
    if (this.messages.length === 0) {
      await this.startSimulation();
    }

    const message = currentState
      ? `【當前世界絕對狀態】：${JSON.stringify(currentState)}\n【使用者輸入/新事件】：${input}\n請根據上述「當前狀態」與「新事件」，推演下一步，並輸出新的 JSON。`
      : input;

    try {
      const text = await this.chat(message);
      return this.parseResponse(text);
    } catch (error) {
      console.error("Simulation error:", error);
      throw error;
    }
  }

  private parseResponse(text: string): SimulationResponse {
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
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "");
        }
        state = JSON.parse(jsonStr.trim());
      } catch (e) {
        console.error("Failed to parse JSON state:", e);
      }
    }

    return { narrative, state };
  }
}

export const simulationService = new SimulationService();
