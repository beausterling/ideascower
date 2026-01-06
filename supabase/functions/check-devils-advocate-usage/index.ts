import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RATE_LIMIT = 5; // Max messages per 24 hours for Devil's Advocate
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

    // Check usage in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const { data: usageData, error: usageError } = await supabaseServiceClient
      .from('devils_advocate_usage')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true });

    if (usageError) {
      console.error('Error checking usage:', usageError);
      // Return full limit on error to avoid blocking users
      return new Response(
        JSON.stringify({
          remaining: RATE_LIMIT,
          resetAt: null,
          limit: RATE_LIMIT,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const usageCount = usageData?.length ?? 0;
    const remaining = Math.max(0, RATE_LIMIT - usageCount);

    // Calculate when the oldest message expires (for resetAt)
    let resetAt: string | null = null;
    if (usageData && usageData.length > 0) {
      const oldestMessage = new Date(usageData[0].created_at);
      resetAt = new Date(oldestMessage.getTime() + RATE_LIMIT_WINDOW_MS).toISOString();
    }

    return new Response(
      JSON.stringify({
        remaining,
        resetAt,
        limit: RATE_LIMIT,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in check-devils-advocate-usage:', error);
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
