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

    // Get the next issue_number
    const { data: maxIssue } = await supabaseClient
      .from('daily_ideas')
      .select('issue_number')
      .order('issue_number', { ascending: false })
      .limit(1)
      .single();

    const nextIssueNumber = (maxIssue?.issue_number ?? 0) + 1;

    // Generate new idea
    console.log(`Generating idea for date: ${dateString}, seed: ${seed}, issue: ${nextIssueNumber}`);
    const idea = await generateDailyBadIdea(targetDate);

    // Store in database
    const { data, error } = await supabaseClient
      .from('daily_ideas')
      .insert({
        issue_number: nextIssueNumber,
        date: dateString,
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
    let errorMessage: string;
    let errorDetails: unknown;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack, name: error.name };
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
      errorDetails = error;
    } else {
      errorMessage = String(error);
    }

    console.error('Error in generate-daily-idea:', errorMessage, errorDetails);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
