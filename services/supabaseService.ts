import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface DailyIdea {
  id: string;
  date: string;
  issue_number: number;
  title: string;
  pitch: string;
  fatal_flaw: string;
  verdict: string;
  created_at: string;
}

export interface Roast {
  id: string;
  user_id: string;
  idea_text: string;
  roast_result: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'model';
  message_text: string;
  session_id?: string;
  created_at: string;
}

// Daily Ideas
export const getDailyIdea = async (targetDate: Date): Promise<DailyIdea> => {
  const dateStr = targetDate.toISOString().split('T')[0];

  // Call Edge Function to get or generate idea
  const { data, error } = await supabase.functions.invoke('generate-daily-idea', {
    body: { targetDate: dateStr },
  });

  if (error) throw error;
  return data as DailyIdea;
};

export const getIdeaArchive = async (limit = 30, offset = 0) => {
  const { data, error, count } = await supabase
    .from('daily_ideas')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { ideas: data as DailyIdea[], total: count || 0 };
};

// Roasts (requires auth)
export const roastIdea = async (idea: string): Promise<string> => {
  // Call Edge Function to roast idea
  const { data, error } = await supabase.functions.invoke('roast-idea', {
    body: { idea },
  });

  if (error) throw error;
  return data.roast;
};

export const getUserRoasts = async () => {
  const { data, error } = await supabase
    .from('roasts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Roast[];
};

// Chat (requires auth)
export const getChatHistory = async (sessionId?: string) => {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ChatMessage[];
};

// Chat streaming via Edge Function
export const sendChatMessageStream = async (
  history: any[],
  message: string,
  sessionId: string
) => {
  const session = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session?.access_token}`,
      },
      body: JSON.stringify({ message, history, sessionId }),
    }
  );

  return response;
};

export const saveChatMessage = async (
  role: 'user' | 'model',
  messageText: string,
  sessionId?: string
) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to save chat messages');
  }

  const { error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: user.id,
      role,
      message_text: messageText,
      session_id: sessionId || null,
    });

  if (error) throw error;
};

// Auth helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};
