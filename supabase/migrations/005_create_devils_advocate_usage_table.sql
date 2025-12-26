-- Create devils_advocate_usage table to track rate limiting for Devil's Advocate chat
-- Each row represents one message sent by a user (limit: 5 per 24 hours)

CREATE TABLE devils_advocate_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries by user and time
CREATE INDEX idx_devils_advocate_usage_user_id ON devils_advocate_usage(user_id);
CREATE INDEX idx_devils_advocate_usage_created_at ON devils_advocate_usage(created_at DESC);

-- Composite index for the common query pattern: user's messages in last 24h
CREATE INDEX idx_devils_advocate_usage_user_time ON devils_advocate_usage(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE devils_advocate_usage ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users can view own devils advocate usage" ON devils_advocate_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Only the service role can insert (edge function will handle this)
-- No INSERT policy for users - prevents client-side manipulation
