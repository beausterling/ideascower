import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateDailyBadIdea, PreviousIdeaContext } from "../_shared/gemini.ts";
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

    // Initialize Supabase client with anon key (public access)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Try to get idea from database
    const { data: existingIdea, error: fetchError } = await supabaseClient
      .from('daily_ideas')
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

    // Fetch previous day's idea to ensure variety
    const previousDate = new Date(targetDate);
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    const previousDateString = previousDate.toISOString().split('T')[0];

    const { data: previousIdeaData } = await supabaseClient
      .from('daily_ideas')
      .select('title, pitch, issue_number')
      .eq('date', previousDateString)
      .single();

    // Calculate issue number (previous + 1, or 1 if no previous)
    const issueNumber = previousIdeaData?.issue_number ? previousIdeaData.issue_number + 1 : 1;

    // Prepare context for generation
    const previousContext: PreviousIdeaContext | undefined = previousIdeaData ? {
      title: previousIdeaData.title,
      pitchPreview: previousIdeaData.pitch.split(' ').slice(0, 20).join(' ')
    } : undefined;

    // If not in database, generate on-demand (fallback for historical dates)
    console.log(`Idea not found in DB for ${dateString}, generating on-demand`);
    if (previousContext) {
      console.log(`Previous idea context: "${previousContext.title}"`);
    }
    const idea = await generateDailyBadIdea(targetDate, previousContext);

    // Try to store in database (use service role for write access)
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await supabaseServiceClient
      .from('daily_ideas')
      .insert({
        date: dateString,
        issue_number: issueNumber,
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
