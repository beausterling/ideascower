import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateDailyBadIdea, PreviousIdeaContext } from "../_shared/gemini.ts";
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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check if idea already exists for this date
    const { data: existingIdea } = await supabaseClient
      .from('daily_ideas')
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

    // Generate new idea
    console.log(`Generating idea for date: ${dateString}`);
    if (previousContext) {
      console.log(`Previous idea context: "${previousContext.title}"`);
    }
    const idea = await generateDailyBadIdea(targetDate, previousContext);

    // Store in database
    const { data, error } = await supabaseClient
      .from('daily_ideas')
      .insert({
        date: dateString,
        issue_number: issueNumber,
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
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }
    return new Response(
      JSON.stringify({
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
