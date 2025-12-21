import { GoogleGenAI } from "npm:@google/genai@^1.33.0";

const REASONING_MODEL = "gemini-3-pro-preview";
const THINKING_BUDGET = 32768;

export const getGeminiClient = () => {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured in Edge Function secrets');
  }
  return new GoogleGenAI({ apiKey });
};

export const MODEL_CONFIG = {
  REASONING_MODEL,
  THINKING_BUDGET,
};
