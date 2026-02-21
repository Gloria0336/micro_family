// server/constants.js
// Shared constants between server modules (mirrors src/types.ts INITIAL_STATE)

export const INITIAL_STATE = {
    time: "07:00",
    characters: [
        { name: "爸爸", role: "工程師", location: "主臥室", current_action: "睡覺", mood: "疲憊" },
        { name: "媽媽", role: "自由撰稿人", location: "廚房", current_action: "準備早餐", mood: "平靜" },
        { name: "哥哥", role: "高三生", location: "兒童房", current_action: "賴床", mood: "煩躁" },
        { name: "大妹", role: "高一生", location: "浴廁", current_action: "梳洗", mood: "匆忙" },
        { name: "小妹", role: "小學生", location: "客廳", current_action: "看電視", mood: "開心" },
    ],
    environment: {
        weather: "晴朗",
        temperature: "24°C",
        notes: "早晨的陽光灑進客廳",
    },
};

export const INITIAL_NARRATIVE =
    "早晨七點，陽光透過窗簾縫隙灑進屋內。媽媽已經在廚房忙碌，平底鍋裡滋滋作響，飄來煎蛋的香氣。爸爸還在主臥室呼呼大睡，昨晚似乎又熬夜趕專案了。大妹佔據了一樓的浴廁，正對著鏡子仔細整理瀏海。小妹穿著睡衣在客廳沙發上跳來跳去，等著看晨間卡通。哥哥的房間門緊閉，毫無動靜。";

export const SYSTEM_INSTRUCTION = `
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
