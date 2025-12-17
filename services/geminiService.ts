
import { GoogleGenAI, Type } from "@google/genai";
import { Meal, FoodItem, UnitType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const scanMealPhoto = async (base64Image: string): Promise<Partial<FoodItem>[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Identify the foods in this image and estimate their portions using these smart units: piece(s), slice(s), bowl(s), portion(s), cup(s). Return estimated calories, protein, carbs, and fats for each item. Be conservative with estimates." }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING, description: "Must be piece(s), slice(s), bowl(s), portion(s), or cup(s)" },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fats: { type: Type.NUMBER }
          },
          required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fats"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const getSmartInsights = async (history: { meals: Meal[], workouts: any[] }): Promise<string> => {
  const prompt = `Analyze this week's fitness data:
    Meals Logged: ${JSON.stringify(history.meals.map(m => ({ cal: m.totalCalories, prot: m.totalProtein })))}
    Workouts: ${JSON.stringify(history.workouts.map(w => ({ type: w.type, duration: w.duration })))}
    
    Provide 1 or 2 short, encouraging, human-friendly insights about their consistency, macro intake, or calorie balance. Do not give medical advice. Keep it under 40 words total.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });

  return response.text || "Keep up the great work on your journey!";
};
