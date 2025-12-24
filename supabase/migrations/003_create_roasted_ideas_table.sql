-- Create roasted_ideas table to store user's roasted ideas
CREATE TABLE IF NOT EXISTS roasted_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_text TEXT NOT NULL,
  roast_result TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE roasted_ideas ENABLE ROW LEVEL SECURITY;

-- Users can read their own roasted ideas
CREATE POLICY "Users can read own roasted ideas" ON roasted_ideas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can read public roasted ideas
CREATE POLICY "Public can read public roasted ideas" ON roasted_ideas
  FOR SELECT
  USING (is_public = true);

-- Users can insert their own roasted ideas
CREATE POLICY "Users can insert own roasted ideas" ON roasted_ideas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own roasted ideas (for toggling public/private)
CREATE POLICY "Users can update own roasted ideas" ON roasted_ideas
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own roasted ideas
CREATE POLICY "Users can delete own roasted ideas" ON roasted_ideas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_roasted_ideas_user_id ON roasted_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_roasted_ideas_created_at ON roasted_ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roasted_ideas_is_public ON roasted_ideas(is_public) WHERE is_public = true;
