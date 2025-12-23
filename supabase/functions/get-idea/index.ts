import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateDailyBadIdea } from "../_shared/gemini.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get date from query parameter
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');

    // Use provided date or default to today UTC
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dateString = targetDate.toISOString().split('T')[0];

    // Calculate seed
    const seed = targetDate.getUTCFullYear() * 10000 +
                 (targetDate.getUTCMonth() + 1) * 100 +
                 targetDate.getUTCDate();

    // Initialize Supabase client with anon key (public access)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Try to get idea from database
    const { data: existingIdea, error: fetchError } = await supabaseClient
      .from('ideas')
      .select('*')
      .eq('date', dateString)
      .single();

    if (existingIdea) {
      // Return cached idea from database
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

    // If not in database, generate on-demand (fallback for historical dates)
    console.log(`Idea not found in DB for ${dateString}, generating on-demand with seed: ${seed}`);
    const idea = await generateDailyBadIdea(targetDate);

    // Try to store in database (use service role for write access)
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

    // Return generated idea
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
