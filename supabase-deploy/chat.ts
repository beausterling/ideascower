import { GoogleGenAI } from "npm:@google/genai@1.33.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });
const REASONING_MODEL = "gemini-3-pro-preview";
const THINKING_BUDGET = 32768;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { history, message } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request: message is required and must be a non-empty string'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const chat = ai.chats.create({
      model: REASONING_MODEL,
      config: {
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
        systemInstruction: "You are 'The Liquidator', a cynical AI business consultant who assumes every user idea is doomed to fail. Your tone is dry, sarcastic, and technically precise."
      }
    });

    if (history && Array.isArray(history) && history.length > 0) {
      chat.history = history;
    }

    console.log(`Chat message: ${message.substring(0, 50)}...`);
    const streamResult = await chat.sendMessageStream({ message });

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

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
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
    console.error('Error in chat:', error);
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
