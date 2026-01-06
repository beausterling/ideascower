import { GoogleGenAI } from "npm:@google/genai@0.9.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Configuration for complex reasoning tasks
export const REASONING_MODEL = "gemini-2.5-flash";
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

export interface PreviousIdeaContext {
  title: string;
  pitchPreview: string; // first 20 words of the pitch
}

/**
 * Easter calculation using the Anonymous Gregorian algorithm.
 * Returns the month (0-indexed) and day of Easter for a given year.
 */
function calculateEaster(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * Checks if a date is a holiday and returns its name, or null if not a holiday.
 */
function getHolidayName(date: Date): string | null {
  const month = date.getUTCMonth(); // 0-indexed
  const day = date.getUTCDate();
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday

  // Fixed-date holidays
  if (month === 0 && day === 1) return "New Year's Day";
  if (month === 1 && day === 14) return "Valentine's Day";
  if (month === 2 && day === 8) return "International Women's Day";
  if (month === 2 && day === 17) return "St. Patrick's Day";
  if (month === 3 && day === 1) return "April Fools' Day";
  if (month === 3 && day === 22) return "Earth Day";
  if (month === 4 && day === 5) return "Cinco de Mayo";
  if (month === 6 && day === 4) return "Independence Day";
  if (month === 9 && day === 31) return "Halloween";
  if (month === 11 && day === 25) return "Christmas";
  if (month === 11 && day === 31) return "New Year's Eve";

  // Variable-date holidays
  // Mother's Day: 2nd Sunday of May
  if (month === 4 && dayOfWeek === 0 && day >= 8 && day <= 14) return "Mother's Day";

  // Father's Day: 3rd Sunday of June
  if (month === 5 && dayOfWeek === 0 && day >= 15 && day <= 21) return "Father's Day";

  // Memorial Day: Last Monday of May
  if (month === 4 && dayOfWeek === 1 && day >= 25) return "Memorial Day";

  // Thanksgiving: 4th Thursday of November
  if (month === 10 && dayOfWeek === 4 && day >= 22 && day <= 28) return "Thanksgiving";

  // Indigenous Peoples' Day: 2nd Monday of October
  if (month === 9 && dayOfWeek === 1 && day >= 8 && day <= 14) return "Indigenous Peoples' Day";

  // Election Day: 1st Tuesday after 1st Monday of November (day 2-8)
  if (month === 10 && dayOfWeek === 2 && day >= 2 && day <= 8) return "Election Day";

  // Grandparents Day: 1st Sunday after Labor Day (Labor Day is 1st Monday of Sept)
  if (month === 8 && dayOfWeek === 0 && day >= 7 && day <= 13) return "Grandparents Day";

  // Easter: Complex calculation
  const easter = calculateEaster(date.getUTCFullYear());
  if (month === easter.month && day === easter.day) return "Easter";

  return null;
}

/**
 * Generates a "Bad Idea of the Day" using Gemini.
 * Optionally takes the previous day's idea to ensure variety.
 * On holidays, generates themed ideas.
 */
export async function generateDailyBadIdea(
  targetDate: Date,
  previousIdea?: PreviousIdeaContext
): Promise<BadIdea> {
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

  // Check if today is a holiday
  const holidayName = getHolidayName(targetDate);

  // Build the prompt
  let prompt = "Generate a startup idea that sounds clever and profitable on the surface, but has a catastrophic logical, economic, or social flaw that makes it a terrible business. Do not make it obviously a joke; make it a 'trap' idea. Analyze the flaw deeply.";

  // Add holiday context if applicable
  if (holidayName) {
    prompt += `\n\nToday is ${holidayName}! Generate an idea that cleverly relates to or exploits this holiday.`;
  }

  // Add previous idea context to ensure variety
  if (previousIdea) {
    prompt += `\n\nIMPORTANT: Yesterday's idea was "${previousIdea.title}" with the pitch: "${previousIdea.pitchPreview}..." - You MUST generate a completely different concept in a different industry or domain. Do not use similar themes, business models, or target markets.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7
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
