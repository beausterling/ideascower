import { roastUserIdea } from "../_shared/gemini.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
    console.log(`Roasting idea: ${idea.substring(0, 50)}...`);
    const roast = await roastUserIdea(idea);

    let savedId: string | undefined;

    // If save is requested, try to save the roasted idea
    if (save) {
      // Get user from Authorization header
      const authHeader = req.headers.get('Authorization');

      if (authHeader) {
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

        if (user && !userError) {
          // Use service role client to insert (bypasses RLS for insert)
          const supabaseServiceClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          );

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
        } else {
          console.log('User not authenticated, skipping save');
        }
      }
    }

    return new Response(
      JSON.stringify({
        roast: roast,
        savedId: savedId,
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
