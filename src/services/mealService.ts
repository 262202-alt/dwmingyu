import { GoogleGenAI, Type } from "@google/genai";

export interface MealData {
  menu: string[];
  calories: string;
  origin?: string;
}

export async function fetchMealFromAI(schoolName: string, date: string): Promise<MealData | null> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.error("Gemini API key is missing");
    return null;
  }
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log("Attempting to fetch meal using model: gemini-3-flash-preview");
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${schoolName}의 ${date} 급식 메뉴와 칼로리 정보를 알려줘.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            menu: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "급식 메뉴 리스트"
            },
            calories: {
              type: Type.STRING,
              description: "총 칼로리 (예: 850kcal)"
            },
            origin: {
              type: Type.STRING,
              description: "원산지 정보 (필요시)"
            }
          },
          required: ["menu", "calories"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as MealData;
    }
    return null;
  } catch (error: any) {
    console.error("Failed to fetch meal using gemini-3-flash-preview:", error);
    return null;
  }
}
