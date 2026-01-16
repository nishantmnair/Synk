
import { GoogleGenAI, Type } from "@google/genai";

// Initialize GoogleGenAI with the API key from environment variables
// Vite exposes env variables via import.meta.env, but we also support process.env via vite.config.ts define
const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY || 
                import.meta.env?.GEMINI_API_KEY || 
                (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                (typeof process !== 'undefined' && process.env?.API_KEY) ||
                '');

const ai = new GoogleGenAI({ apiKey });

export const generateDateIdea = async (vibe: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a creative date idea for a couple who is currently feeling: "${vibe}". Provide a title, a short description, and a location type.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            location: { type: Type.STRING }
          },
          required: ["title", "description", "location"]
        }
      }
    });
    // Fix: Access .text property directly (not as a method)
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: "Cozy Movie Marathon",
      description: "Since the AI is shy, how about a themed movie night with homemade popcorn?",
      location: "Home Sweet Home"
    };
  }
};

export const getProTip = async (milestones: any[]) => {
  try {
    const summary = milestones.map(m => `${m.name} (${m.status})`).join(', ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this couple's road map: ${summary}. Give them one short, romantic, and actionable "Pro Tip" or encouragement to reach their goals. Keep it under 25 words.`,
    });
    // Fix: Access .text property directly
    return response.text;
  } catch (error) {
    return "The best journey is the one you take together. Keep dreaming big!";
  }
};

export const getDailyConnectionPrompt = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a single, deep, or fun conversation starter for a couple to ask each other today. It should be one sentence and promote intimacy or laughter.`,
    });
    // Fix: Access .text property directly
    return response.text;
  } catch (error) {
    return "If we could teleport anywhere for just one hour today, where would we go?";
  }
};
