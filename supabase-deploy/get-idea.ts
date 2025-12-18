import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenAI, Type, Schema } from "npm:@google/genai@1.33.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });
const REASONING_MODEL = "gemini-3-pro-preview";
const THINKING_BUDGET = 32768;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BadIdea {
  title: string;
  pitch: string;
  fatalFlaw: string;
  verdict: string;
}

async function generateDailyBadIdea(targetDate: Date): Promise<BadIdea> {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dateString = targetDate.toISOString().split('T')[0];

    const seed = targetDate.getUTCFullYear() * 10000 +
                 (targetDate.getUTCMonth() + 1) * 100 +
                 targetDate.getUTCDate();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: existingIdea } = await supabaseClient
      .from('ideas')
      .select('*')
      .eq('date', dateString)
      .single();

    if (existingIdea) {
      return new Response(
        JSON.stringify({
          title: existingIdea.title,
          pitch: existingIdea.pitch,
          fatalFlaw: existingIdea.fatal_flaw,
          verdict: existingIdea.verdict,
          date: existingIdea.date,
          cached: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Idea not found in DB for ${dateString}, generating on-demand with seed: ${seed}`);
    const idea = await generateDailyBadIdea(targetDate);

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await supabaseServiceClient
      .from('ideas')
      .insert({
        date: dateString,
        seed: seed,
        title: idea.title,
        pitch: idea.pitch,
        fatal_flaw: idea.fatalFlaw,
        verdict: idea.verdict,
      })
      .single();

    return new Response(
      JSON.stringify({
        title: idea.title,
        pitch: idea.pitch,
        fatalFlaw: idea.fatalFlaw,
        verdict: idea.verdict,
        date: dateString,
        cached: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in get-idea:', error);
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
