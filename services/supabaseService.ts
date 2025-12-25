export { supabase } from "../lib/supabaseClient";
import { supabase } from "../lib/supabaseClient";
import { BadIdea, Profile, RoastedIdea } from "../types";

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
 * Fetches a "Bad Idea of the Day" by issue number.
 * Queries the daily_ideas table by issue_number (source of truth).
 * Returns the idea along with its date for display.
 */
export const getDailyBadIdeaByIssue = async (issueNumber: number): Promise<BadIdea & { date: string }> => {
  try {
    const { data, error } = await supabase
      .from('daily_ideas')
      .select('*')
      .eq('issue_number', issueNumber)
      .single();

    if (error) {
      console.error(`Database error:`, error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error(`No idea found for issue #${issueNumber}`);
    }

    return {
      title: data.title,
      pitch: data.pitch,
      fatalFlaw: data.fatal_flaw,
      verdict: data.verdict,
      date: data.date,
    };
  } catch (error) {
    console.error("Error fetching daily idea:", error instanceof Error ? error.message : String(error));
    return {
      title: "Error 404: Idea Not Found",
      pitch: "A service that promises to find ideas but fails due to API errors.",
      fatalFlaw: "Reliability is key.",
      verdict: "Try refreshing.",
      date: new Date().toISOString().split('T')[0],
    };
  }
};

/**
 * Gets the current (latest) issue number from the database.
 */
export const getCurrentIssueNumber = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('daily_ideas')
      .select('issue_number')
      .order('issue_number', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('Error fetching current issue:', error);
      return 1;
    }

    return data.issue_number;
  } catch (error) {
    console.error('Error fetching current issue:', error);
    return 1;
  }
};

/**
 * Roasts a user's idea via Supabase edge function.
 * Optionally saves the roast to the user's history.
 */
export const roastUserIdea = async (
  idea: string,
  options?: { save?: boolean; isPublic?: boolean }
): Promise<{ roast: string; savedId?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('roast-idea', {
      body: {
        idea,
        save: options?.save ?? false,
        isPublic: options?.isPublic ?? false,
      },
    });

    if (error) {
      throw error;
    }

    return {
      roast: data.roast || "The idea was so bad I was left speechless.",
      savedId: data.savedId,
    };
  } catch (error) {
    console.error("Error roasting idea:", error instanceof Error ? error.message : String(error));
    return { roast: "My roasting circuits are overheated. Try again later." };
  }
};

/**
 * Fetches all available idea dates from the database.
 * Returns an array of date strings in YYYY-MM-DD format.
 */
export const getAvailableIdeaDates = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('daily_ideas')
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
    const url = `${SUPABASE_URL}/functions/v1/chat-stream`;
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
      .from('daily_ideas')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Get paginated ideas
    const { data, error } = await supabase
      .from('daily_ideas')
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

/**
 * Fetches a user's profile by their user ID.
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

/**
 * Updates a user's display name.
 */
export const updateDisplayName = async (userId: string, displayName: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating display name:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating display name:', error);
    return false;
  }
};

/**
 * Fetches all roasted ideas for a user, sorted by newest first.
 */
export const getUserRoastedIdeas = async (userId: string): Promise<RoastedIdea[]> => {
  try {
    const { data, error } = await supabase
      .from('roasted_ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching roasted ideas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching roasted ideas:', error);
    return [];
  }
};

/**
 * Toggles the public/private visibility of a roasted idea.
 */
export const toggleRoastedIdeaVisibility = async (ideaId: string, isPublic: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('roasted_ideas')
      .update({ is_public: isPublic })
      .eq('id', ideaId);

    if (error) {
      console.error('Error toggling roasted idea visibility:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error toggling roasted idea visibility:', error);
    return false;
  }
};

/**
 * Deletes a roasted idea.
 */
export const deleteRoastedIdea = async (ideaId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('roasted_ideas')
      .delete()
      .eq('id', ideaId);

    if (error) {
      console.error('Error deleting roasted idea:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting roasted idea:', error);
    return false;
  }
};
