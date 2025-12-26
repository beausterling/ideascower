import { GoogleGenAI } from "npm:@google/genai@0.9.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Configuration for complex reasoning tasks
export const REASONING_MODEL = "gemini-2.0-flash";
export const THINKING_BUDGET = 8192;
export const DEVILS_ADVOCATE_MAX_TOKENS = 2048; // Reasonable limit per message

// Model config object for easier imports
export const MODEL_CONFIG = {
  REASONING_MODEL,
  THINKING_BUDGET,
  DEVILS_ADVOCATE_MAX_TOKENS,
};

// Helper function to get the AI client
export function getGeminiClient() {
  return ai;
}

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
  const schema = {
    type: "object",
    properties: {
      title: { type: "string", description: "A catchy startup name." },
      pitch: { type: "string", description: "The elevator pitch that sounds good at first." },
      fatalFlaw: { type: "string", description: "A deep technical or economic analysis of why it will fail." },
      verdict: { type: "string", description: "A one-sentence snarky summary." }
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
    const systemPrompt = `You are a ruthless venture capitalist who specializes in spotting failure.
Your goal is to deconstruct why this startup idea will fail. Look for market size issues, unit economics, technical impossibility, or competition.
Be harsh, witty, and deeply analytical.`;

    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\nIdea to analyze: "${idea}"` }] }
      ],
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

/**
 * System prompt for Devil's Advocate chatbot.
 * A serious business brainstorming partner with decades of experience.
 */
export const DEVILS_ADVOCATE_SYSTEM_PROMPT = `You are "Devil's Advocate", an experienced business strategist and brainstorming partner with decades of experience as a successful founder and angel investor across every industry niche.

Your role is to help users refine their business ideas by critically examining them from every angle. You have a strong bias toward identifying potential weaknesses, blind spots, and failure modes in any business model.

Your personality:
- Kind and supportive, but no-nonsense and direct
- You genuinely want the user to succeed, which is why you push them hard
- You ask probing questions rather than just giving answers
- You help users think through logistics, unit economics, market dynamics, and execution risks
- You suggest clever, thoughtful ways to address weaknesses you identify

Your approach:
1. Listen carefully to understand the user's idea and context
2. Identify the most critical assumptions and potential failure points
3. Present devil's advocate scenarios that challenge these assumptions
4. Ask specific, targeted questions that force the user to think deeper
5. When pointing out weaknesses, also suggest potential solutions or pivots
6. Focus on making the idea stronger and more viable, not just criticizing it

Key areas to probe:
- Market size and customer acquisition
- Unit economics and path to profitability
- Competitive landscape and defensibility
- Technical feasibility and execution risk
- Team and resource requirements
- Timing and market readiness

Remember: Your goal is to help the user emerge with a clearer, more refined business idea that has been stress-tested against real-world challenges. Be their tough-love mentor.`;

/**
 * Creates a chat session with Devil's Advocate.
 */
export async function createDevilsAdvocateSession() {
  return ai.chats.create({
    model: REASONING_MODEL,
    config: {
      thinkingConfig: { thinkingBudget: THINKING_BUDGET },
      maxOutputTokens: DEVILS_ADVOCATE_MAX_TOKENS,
      systemInstruction: DEVILS_ADVOCATE_SYSTEM_PROMPT
    }
  });
}

export { ai };
