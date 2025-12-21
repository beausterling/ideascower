import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getGeminiClient, MODEL_CONFIG } from "../_shared/gemini.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { idea } = await req.json();
    if (!idea) {
      return new Response(JSON.stringify({ error: 'No idea provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Call Gemini API
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: MODEL_CONFIG.REASONING_MODEL,
      contents: `Idea to analyze: "${idea}"`,
      config: {
        systemInstruction: `You are a ruthless venture capitalist who specializes in spotting failure.
        Your goal is to deconstruct why this startup idea will fail. Look for market size issues, unit economics, technical impossibility, or competition.
        Be harsh, witty, and deeply analytical.`,
        thinkingConfig: { thinkingBudget: MODEL_CONFIG.THINKING_BUDGET },
      }
    });

    const roastResult = response.text || "The idea was so bad I was left speechless.";

    // Save to database
    const { error: insertError } = await supabaseClient
      .from('roasts')
      .insert({
        user_id: user.id,
        idea_text: idea,
        roast_result: roastResult,
      });

    if (insertError) {
      console.error('Failed to save roast:', insertError);
      // Continue anyway - don't fail if save doesn't work
    }

    return new Response(JSON.stringify({ roast: roastResult, saved: !insertError }), {
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
