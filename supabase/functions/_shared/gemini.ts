import { GoogleGenAI, Type, Schema } from "npm:@google/genai@1.33.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Configuration for complex reasoning tasks
export const REASONING_MODEL = "gemini-3-pro-preview";
export const THINKING_BUDGET = 32768;

export interface BadIdea {
  title: string;
  pitch: string;
  fatalFlaw: string;
  verdict: string;
}

/**
 * Generates a "Bad Idea of the Day" using Gemini.
 * Uses a deterministic seed based on the provided date.
 */
export async function generateDailyBadIdea(targetDate: Date): Promise<BadIdea> {
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

  // Calculate deterministic seed based on UTC date (YYYYMMDD)
  const seed = targetDate.getUTCFullYear() * 10000 +
               (targetDate.getUTCMonth() + 1) * 100 +
               targetDate.getUTCDate();

  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: "Generate a startup idea that sounds revolutionary and profitable on the surface, but has a catastrophic logical, economic, or social flaw that makes it a terrible business. Do not make it obviously a joke; make it a 'trap' idea. Analyze the flaw deeply.",
      config: {
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
        responseMimeType: "application/json",
        responseSchema: schema,
        seed: seed,
        temperature: 0
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as BadIdea;
    }
    throw new Error("No text returned from model");
  } catch (error) {
    console.error("Error generating bad idea:", error instanceof Error ? error.message : String(error));
    return {
      title: "Error 404: Idea Not Found",
      pitch: "A service that promises to find ideas but fails due to API errors.",
      fatalFlaw: "Reliability is key.",
      verdict: "Try refreshing."
    };
  }
}

/**
 * Roasts a user's idea using Gemini.
 */
export async function roastUserIdea(idea: string): Promise<string> {
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
    console.error("Error roasting idea:", error instanceof Error ? error.message : String(error));
    return "My roasting circuits are overheated. Try again later.";
  }
}

/**
 * Creates a chat session with The Liquidator.
 */
export async function createChatSession() {
  return ai.chats.create({
    model: REASONING_MODEL,
    config: {
      thinkingConfig: { thinkingBudget: THINKING_BUDGET },
      systemInstruction: "You are 'The Liquidator', a cynical AI business consultant who assumes every user idea is doomed to fail. Your tone is dry, sarcastic, and technically precise."
    }
  });
}

export { ai };
