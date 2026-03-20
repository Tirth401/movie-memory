import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateMovieFact(movie: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are a movie expert. Provide one interesting and little-known fact about the movie "${movie}". Keep it concise (2-3 sentences). If you don't recognize the movie, say so politely.`,
    config: {
      maxOutputTokens: 200,
      temperature: 0.8,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return text;
}
