import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateDailyBadIdea } from "../_shared/gemini.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { date } = await req.json().catch(() => ({}));

    // Use provided date or default to today UTC
    const targetDate = date ? new Date(date) : new Date();
    const dateString = targetDate.toISOString().split('T')[0];

    // Calculate seed
    const seed = targetDate.getUTCFullYear() * 10000 +
                 (targetDate.getUTCMonth() + 1) * 100 +
                 targetDate.getUTCDate();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check if idea already exists for this date
    const { data: existingIdea } = await supabaseClient
      .from('ideas')
      .select('*')
      .eq('date', dateString)
      .single();

    if (existingIdea) {
      return new Response(
        JSON.stringify({
          message: 'Idea already exists for this date',
          idea: existingIdea
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Generate new idea
    console.log(`Generating idea for date: ${dateString}, seed: ${seed}`);
    const idea = await generateDailyBadIdea(targetDate);

    // Store in database
    const { data, error } = await supabaseClient
      .from('ideas')
      .insert({
        date: dateString,
        seed: seed,
        title: idea.title,
        pitch: idea.pitch,
        fatal_flaw: idea.fatalFlaw,
        verdict: idea.verdict,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        message: 'Idea generated and stored successfully',
        idea: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-daily-idea:', error);
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
