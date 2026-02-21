export interface Character {
  name: string;
  role: string;
  location: string;
  current_action: string;
  mood: string;
  notes?: string;
}

export interface WorldState {
  time: string;
  characters: Character[];
  environment: {
    weather: string;
    temperature: string;
    notes: string;
  };
}

export interface SimulationResponse {
  narrative: string;
  state: WorldState;
}

export const INITIAL_STATE: WorldState = {
  time: "07:00",
  characters: [
    {
      name: "爸爸",
      role: "工程師",
      location: "主臥室",
      current_action: "睡覺",
      mood: "疲憊",
    },
    {
      name: "媽媽",
      role: "自由撰稿人",
      location: "廚房",
      current_action: "準備早餐",
      mood: "平靜",
    },
    {
      name: "哥哥",
      role: "高三生",
      location: "兒童房",
      current_action: "賴床",
      mood: "煩躁",
    },
    {
      name: "大妹",
      role: "高一生",
      location: "浴廁",
      current_action: "梳洗",
      mood: "匆忙",
    },
    {
      name: "小妹",
      role: "小學生",
      location: "客廳",
      current_action: "看電視",
      mood: "開心",
    },
  ],
  environment: {
    weather: "晴朗",
    temperature: "24°C",
    notes: "早晨的陽光灑進客廳",
  },
};
