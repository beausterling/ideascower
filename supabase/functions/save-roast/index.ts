import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Save a roast to user's history without re-roasting (doesn't count against rate limit)
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

    // Parse request body
    const { idea, roast, isPublic } = await req.json();

    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: idea is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!roast || typeof roast !== 'string' || roast.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: roast is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Use service role client for database operations
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Save the roast
    const { data: insertedData, error: insertError } = await supabaseServiceClient
      .from('roasted_ideas')
      .insert({
        user_id: user.id,
        idea_text: idea.trim(),
        roast_result: roast.trim(),
        is_public: isPublic ?? false,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error saving roasted idea:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save roast' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({
        savedId: insertedData.id,
        success: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in save-roast:', error);
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
