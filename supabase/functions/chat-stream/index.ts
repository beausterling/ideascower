import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getGeminiClient, MODEL_CONFIG } from "../_shared/gemini.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { message, history, sessionId } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: 'No message provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Save user message
    await supabaseClient.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      message_text: message,
      session_id: sessionId || null,
    });

    // Call Gemini API
    const ai = getGeminiClient();
    const chat = ai.chats.create({
      model: MODEL_CONFIG.REASONING_MODEL,
      history: history || [],
      config: {
        thinkingConfig: { thinkingBudget: MODEL_CONFIG.THINKING_BUDGET },
        systemInstruction: "You are 'The Liquidator', a cynical AI business consultant who assumes every user idea is doomed to fail. Your tone is dry, sarcastic, and technically precise."
      }
    });

    const streamResult = await chat.sendMessageStream({ message });

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = "";

        try {
          for await (const chunk of streamResult) {
            if (chunk.text) {
              fullResponse += chunk.text;
              const data = `data: ${JSON.stringify({ text: chunk.text })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }

          // Save model response
          if (fullResponse) {
            await supabaseClient.from('chat_messages').insert({
              user_id: user.id,
              role: 'model',
              message_text: fullResponse,
              session_id: sessionId || null,
            });
          }

          // Send completion signal
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
