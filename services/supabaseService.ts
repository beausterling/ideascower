export { supabase } from "../lib/supabaseClient";
import { supabase } from "../lib/supabaseClient";
import { BadIdea } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Interface for daily idea archive items
 */
export interface DailyIdea {
  id: string;
  issue_number: number;
  date: string;
  title: string;
  pitch: string;
  fatal_flaw: string;
  verdict: string;
}

/**
 * Fetches a "Bad Idea of the Day" for a specific date.
 * Calls the Supabase edge function which retrieves from DB or generates on-demand.
 */
export const getDailyBadIdea = async (targetDate?: Date): Promise<BadIdea> => {
  try {
    const dateObj = targetDate || new Date();
    const dateString = dateObj.toISOString().split('T')[0];

    // Construct URL with query parameter for GET request
    const url = `${SUPABASE_URL}/functions/v1/get-idea?date=${dateString}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Edge function error (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();

    return {
      title: result.title,
      pitch: result.pitch,
      fatalFlaw: result.fatalFlaw,
      verdict: result.verdict,
    };
  } catch (error) {
    console.error("Error fetching daily idea:", error instanceof Error ? error.message : String(error));
    return {
      title: "Error 404: Idea Not Found",
      pitch: "A service that promises to find ideas but fails due to API errors.",
      fatalFlaw: "Reliability is key.",
      verdict: "Try refreshing."
    };
  }
};

/**
 * Roasts a user's idea via Supabase edge function.
 */
export const roastUserIdea = async (idea: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('roast-idea', {
      body: { idea },
    });

    if (error) {
      throw error;
    }

    return data.roast || "The idea was so bad I was left speechless.";
  } catch (error) {
    console.error("Error roasting idea:", error instanceof Error ? error.message : String(error));
    return "My roasting circuits are overheated. Try again later.";
  }
};

/**
 * Fetches all available idea dates from the database.
 * Returns an array of date strings in YYYY-MM-DD format.
 */
export const getAvailableIdeaDates = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('date')
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    return data?.map(row => row.date) || [];
  } catch (error) {
    console.error("Error fetching available dates:", error instanceof Error ? error.message : String(error));
    return [];
  }
};

/**
 * Sends a chat message and returns a stream of responses via Supabase edge function.
 */
export const sendChatMessage = async (history: any[], message: string) => {
  try {
    const url = `${SUPABASE_URL}/functions/v1/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history, message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Return an async generator that reads from the SSE stream
    return {
      [Symbol.asyncIterator]: async function* () {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);

                if (data === '[DONE]') {
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    yield { text: parsed.text };
                  } else if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                } catch (e) {
                  // Skip invalid JSON
                  continue;
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    };
  } catch (error) {
    console.error("Error in chat:", error instanceof Error ? error.message : String(error));
    throw error;
  }
};

/**
 * Fetches paginated archive of daily ideas from the database.
 * Returns ideas sorted by date (newest first) with pagination support.
 */
export const getIdeaArchive = async (
  limit: number,
  offset: number
): Promise<{ ideas: DailyIdea[]; total: number }> => {
  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('ideas')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Get paginated ideas
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Map database fields to DailyIdea interface
    const ideas: DailyIdea[] = (data || []).map((row, index) => ({
      id: row.id,
      issue_number: offset + index + 1, // Calculate issue number based on position
      date: row.date,
      title: row.title,
      pitch: row.pitch,
      fatal_flaw: row.fatal_flaw,
      verdict: row.verdict,
    }));

    return { ideas, total: count || 0 };
  } catch (error) {
    console.error('Error fetching idea archive:', error);
    return { ideas: [], total: 0 };
  }
};
