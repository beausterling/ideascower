export interface BadIdea {
  title: string;
  pitch: string;
  fatalFlaw: string;
  verdict: string;
}

export interface RoastResult {
  analysis: string;
  score: number; // 0-10, where 0 is terrible (success for this app)
}

export enum AppSection {
  DAILY_DOOM = 'DAILY_DOOM',
  ROAST_LAB = 'ROAST_LAB',
  PROFILE = 'PROFILE',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoastedIdea {
  id: string;
  user_id: string;
  idea_text: string;
  roast_result: string;
  is_public: boolean;
  created_at: string;
}