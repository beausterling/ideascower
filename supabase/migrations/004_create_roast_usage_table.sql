-- Create roast_usage table to track rate limiting
-- Each row represents one roast used by a user

CREATE TABLE roast_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries by user and time
CREATE INDEX idx_roast_usage_user_id ON roast_usage(user_id);
CREATE INDEX idx_roast_usage_created_at ON roast_usage(created_at DESC);

-- Composite index for the common query pattern: user's roasts in last 24h
CREATE INDEX idx_roast_usage_user_time ON roast_usage(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE roast_usage ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users can view own usage" ON roast_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Only the service role can insert (edge function will handle this)
-- No INSERT policy for users - prevents client-side manipulation
