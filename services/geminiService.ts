import { GoogleGenAI, Type, Schema, Content } from "@google/genai";
import { BadIdea } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Configuration for complex reasoning tasks
const REASONING_MODEL = "gemini-3-pro-preview";
const THINKING_BUDGET = 32768;

/**
 * Generates a "Bad Idea of the Day".
 * It constructs a plausible-sounding startup idea that is fundamentally flawed.
 * 
 * Uses the provided date (or today) as a deterministic seed.
 */
export const getDailyBadIdea = async (targetDate?: Date): Promise<BadIdea> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy startup name." },
      pitch: { type: Type.STRING, description: "The elevator pitch that sounds good at first." },
      fatalFlaw: { type: Type.STRING, description: "A deep technical or economic analysis of why it will fail." },
      verdict: { type: Type.STRING, description: "A one-sentence snarky summary." }
    },
    required: ["title", "pitch", "fatalFlaw", "verdict"]
  };

  // Use the target date or default to now
  const dateObj = targetDate || new Date();
  
  // Calculate a deterministic seed based on the UTC Date (e.g. 20251024)
  // This ensures that asking for "Oct 24, 2025" always yields the same result.
  const seed = dateObj.getUTCFullYear() * 10000 + (dateObj.getUTCMonth() + 1) * 100 + dateObj.getUTCDate();

  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: "Generate a startup idea that sounds revolutionary and profitable on the surface, but has a catastrophic logical, economic, or social flaw that makes it a terrible business. Do not make it obviously a joke; make it a 'trap' idea. Analyze the flaw deeply.",
      config: {
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
        responseMimeType: "application/json",
        responseSchema: schema,
        seed: seed, // deterministic output for the specific date
        temperature: 0 // maximize determinism
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as BadIdea;
    }
    throw new Error("No text returned from model");
  } catch (error) {
    // Log only the message to avoid leaking full request objects/headers
    console.error("Error generating bad idea:", error instanceof Error ? error.message : String(error));
    return {
      title: "Error 404: Idea Not Found",
      pitch: "A service that promises to find ideas but fails due to API errors.",
      fatalFlaw: "Reliability is key.",
      verdict: "Try refreshing."
    };
  }
};

/**
 * Roasts a user's idea.
 */
export const roastUserIdea = async (idea: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: `Idea to analyze: "${idea}"`,
      config: {
        systemInstruction: `You are a ruthless venture capitalist who specializes in spotting failure. 
        Your goal is to deconstruct why this startup idea will fail. Look for market size issues, unit economics, technical impossibility, or competition. 
        Be harsh, witty, and deeply analytical.`,
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
      }
    });

    return response.text || "The idea was so bad I was left speechless.";
  } catch (error) {
    // Log only the message to avoid leaking full request objects/headers
    console.error("Error roasting idea:", error instanceof Error ? error.message : String(error));
    return "My roasting circuits are overheated. Try again later.";
  }
};

/**
 * Sends a chat message and returns a stream of responses.
 */
export const sendChatMessage = async (history: Content[], message: string) => {
  const chat = ai.chats.create({
    model: REASONING_MODEL,
    history: history,
    config: {
      thinkingConfig: { thinkingBudget: THINKING_BUDGET },
      systemInstruction: "You are 'The Liquidator', a cynical AI business consultant who assumes every user idea is doomed to fail. Your tone is dry, sarcastic, and technically precise."
    }
  });

  return await chat.sendMessageStream({ message });
};