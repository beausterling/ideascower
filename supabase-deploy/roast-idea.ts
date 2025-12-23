import { GoogleGenAI } from "npm:@google/genai@1.33.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });
const REASONING_MODEL = "gemini-3-pro-preview";
const THINKING_BUDGET = 32768;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function roastUserIdea(idea: string): Promise<string> {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { idea } = await req.json();

    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request: idea is required and must be a non-empty string'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Roasting idea: ${idea.substring(0, 50)}...`);
    const roast = await roastUserIdea(idea);

    return new Response(
      JSON.stringify({
        roast: roast
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in roast-idea:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
