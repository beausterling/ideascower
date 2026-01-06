import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGeminiClient, MODEL_CONFIG, DEVILS_ADVOCATE_SYSTEM_PROMPT } from "../_shared/gemini.ts";

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
        auth: {
          autoRefreshToken: false,
          persistSession: false,
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

    // Check rate limit
    const twentyFourHoursAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const { data: usageData, error: usageError } = await supabaseServiceClient
      .from('devils_advocate_usage')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true });

    if (usageError) {
      console.error('Error checking usage:', usageError);
      // Continue anyway - don't block on usage check errors
    }

    const usageCount = usageData?.length ?? 0;
    const remaining = Math.max(0, RATE_LIMIT - usageCount);

    // Calculate reset time
    let resetAt: string | null = null;
    if (usageData && usageData.length > 0) {
      const oldestMessage = new Date(usageData[0].created_at);
      resetAt = new Date(oldestMessage.getTime() + RATE_LIMIT_WINDOW_MS).toISOString();
    }

    // Check if rate limited
    if (remaining <= 0) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. You can send 5 messages per day.',
          code: 'RATE_LIMITED',
          remaining: 0,
          resetAt,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    // Parse request body
    const { message, history } = await req.json();
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'No message provided' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Record usage BEFORE making the AI call to prevent race conditions
    const { error: insertError } = await supabaseServiceClient
      .from('devils_advocate_usage')
      .insert({ user_id: user.id });

    if (insertError) {
      console.error('Error recording usage:', insertError);
      // Continue anyway - don't fail the request if we can't record
    }

    // Call Gemini API with streaming
    const ai = getGeminiClient();
    const chat = ai.chats.create({
      model: MODEL_CONFIG.REASONING_MODEL,
      history: history || [],
      config: {
        thinkingConfig: { thinkingBudget: MODEL_CONFIG.THINKING_BUDGET },
        maxOutputTokens: MODEL_CONFIG.DEVILS_ADVOCATE_MAX_TOKENS,
        systemInstruction: DEVILS_ADVOCATE_SYSTEM_PROMPT
      }
    });

    const streamResult = await chat.sendMessageStream({ message });

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of streamResult) {
            if (chunk.text) {
              const data = `data: ${JSON.stringify({ text: chunk.text })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }

          // Send usage info with completion signal
          const newRemaining = remaining - 1;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            remaining: newRemaining,
            resetAt: resetAt || new Date(Date.now() + RATE_LIMIT_WINDOW_MS).toISOString()
          })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
