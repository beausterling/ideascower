import { roastUserIdea } from "../_shared/gemini.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RATE_LIMIT = 3; // Max roasts per 24 hours
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // AUTHENTICATION REQUIRED
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Verify user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Invalid or expired session',
          code: 'AUTH_INVALID'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Use service role client for database operations
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // CHECK RATE LIMIT
    const twentyFourHoursAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const { data: usageData, error: usageError } = await supabaseServiceClient
      .from('roast_usage')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true });

    if (usageError) {
      console.error('Error checking usage:', usageError);
      // Continue anyway - don't block users due to usage check errors
    }

    const usageCount = usageData?.length ?? 0;
    const remaining = Math.max(0, RATE_LIMIT - usageCount);

    // Calculate when the oldest roast expires (for resetAt)
    let resetAt: string | null = null;
    if (usageData && usageData.length > 0) {
      const oldestRoast = new Date(usageData[0].created_at);
      resetAt = new Date(oldestRoast.getTime() + RATE_LIMIT_WINDOW_MS).toISOString();
    }

    // If rate limited, return 429
    if (usageCount >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. You have used all 3 roasts for today.',
          code: 'RATE_LIMITED',
          remaining: 0,
          resetAt: resetAt,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    // Parse request body
    const { idea, save, isPublic } = await req.json();

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

    // Roast the idea
    console.log(`Roasting idea for user ${user.id}: ${idea.substring(0, 50)}...`);
    const roast = await roastUserIdea(idea);

    // RECORD USAGE
    const { error: insertUsageError } = await supabaseServiceClient
      .from('roast_usage')
      .insert({ user_id: user.id });

    if (insertUsageError) {
      console.error('Error recording usage:', insertUsageError);
      // Don't fail the request - user already got their roast
    }

    // Calculate new remaining count
    const newRemaining = remaining - 1;

    // Calculate new resetAt (the roast we just inserted will be the new oldest if we were at 0)
    let newResetAt: string | null = resetAt;
    if (usageCount === 0) {
      // This is the first roast - it will expire in 24 hours
      newResetAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS).toISOString();
    }

    let savedId: string | undefined;

    // If save is requested, save the roasted idea
    if (save) {
      const { data: insertedData, error: insertError } = await supabaseServiceClient
        .from('roasted_ideas')
        .insert({
          user_id: user.id,
          idea_text: idea.trim(),
          roast_result: roast,
          is_public: isPublic ?? false,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error saving roasted idea:', insertError);
      } else {
        savedId = insertedData?.id;
        console.log(`Saved roasted idea with id: ${savedId}`);
      }
    }

    return new Response(
      JSON.stringify({
        roast: roast,
        savedId: savedId,
        remaining: newRemaining,
        resetAt: newResetAt,
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
