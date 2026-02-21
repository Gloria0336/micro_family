import { GoogleGenAI } from "@google/genai";
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

export class SimulationService {
  private ai: GoogleGenAI;
  private model: any;
  private chat: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || "dummy" });
  }

  async startSimulation(): Promise<SimulationResponse> {
    this.chat = this.ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: [
        {
          role: "user",
          parts: [{ text: "初始化模擬，時間設定為 07:00" }],
        },
        {
          role: "model",
          parts: [
            {
              text: `=== 📝 敘事推演 ===
早晨七點，陽光透過窗簾縫隙灑進屋內。媽媽已經在廚房忙碌，平底鍋裡滋滋作響，飄來煎蛋的香氣。爸爸還在主臥室呼呼大睡，昨晚似乎又熬夜趕專案了。大妹佔據了一樓的浴廁，正對著鏡子仔細整理瀏海。小妹穿著睡衣在客廳沙發上跳來跳去，等著看晨間卡通。哥哥的房間門緊閉，毫無動靜。

=== 💾 當前世界狀態庫 (JSON) ===
${JSON.stringify(INITIAL_STATE)}`,
            },
          ],
        },
      ],
    });

    // Return initial state directly
    return {
      narrative:
        "早晨七點，陽光透過窗簾縫隙灑進屋內。媽媽已經在廚房忙碌，平底鍋裡滋滋作響，飄來煎蛋的香氣。爸爸還在主臥室呼呼大睡，昨晚似乎又熬夜趕專案了。大妹佔據了一樓的浴廁，正對著鏡子仔細整理瀏海。小妹穿著睡衣在客廳沙發上跳來跳去，等著看晨間卡通。哥哥的房間門緊閉，毫無動靜。",
      state: INITIAL_STATE,
    };
  }

  async processAction(input: string): Promise<SimulationResponse> {
    if (!this.chat) {
      await this.startSimulation();
    }

    try {
      const result = await this.chat.sendMessage({ message: input });
      const text = result.text;
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

    if (narrativeMatch && narrativeMatch[1]) {
      narrative = narrativeMatch[1].trim();
    }

    if (jsonMatch && jsonMatch[1]) {
      try {
        // Clean up markdown code blocks if present
        let jsonStr = jsonMatch[1].trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "");
        }
        state = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse JSON state:", e);
        // Keep previous state if parse fails
      }
    }

    return { narrative, state };
  }
}

export const simulationService = new SimulationService();
