import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getGeminiClient, MODEL_CONFIG } from "../_shared/gemini.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { Type, Schema } from "npm:@google/genai@^1.33.0";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { targetDate } = await req.json();
    const dateObj = new Date(targetDate || new Date().toISOString().split('T')[0]);
    const dateStr = dateObj.toISOString().split('T')[0];

    // Initialize Supabase client with Service Role Key (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if idea already exists
    const { data: existing, error: fetchError } = await supabaseClient
      .from('daily_ideas')
      .select('*')
      .eq('date', dateStr)
      .single();

    if (existing && !fetchError) {
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Generate new idea with Gemini
    const ai = getGeminiClient();

    // Use date as seed for deterministic generation
    const seed = dateObj.getUTCFullYear() * 10000 +
                 (dateObj.getUTCMonth() + 1) * 100 +
                 dateObj.getUTCDate();

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

    const response = await ai.models.generateContent({
      model: MODEL_CONFIG.REASONING_MODEL,
      contents: `Date: ${dateStr}. Generate a unique startup idea specifically for this date's entry in the archive. It must sound revolutionary and profitable on the surface, but have a catastrophic logical, economic, or social flaw that makes it a terrible business. Do not make it obviously a joke; make it a 'trap' idea. Analyze the flaw deeply.`,
      config: {
        thinkingConfig: { thinkingBudget: MODEL_CONFIG.THINKING_BUDGET },
        responseMimeType: "application/json",
        responseSchema: schema,
        seed: seed,
        temperature: 0
      }
    });

    const idea = JSON.parse(response.text);

    // Calculate issue number
    const LAUNCH_DATE = new Date('2025-12-13T00:00:00Z').getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    const issueNumber = Math.max(1, Math.floor((dateObj.getTime() - LAUNCH_DATE) / msPerDay) + 1);

    // Store in database
    const { data: newIdea, error: insertError } = await supabaseClient
      .from('daily_ideas')
      .insert({
        date: dateStr,
        issue_number: issueNumber,
        title: idea.title,
        pitch: idea.pitch,
        fatal_flaw: idea.fatalFlaw,
        verdict: idea.verdict,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify(newIdea), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
