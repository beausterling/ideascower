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
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}