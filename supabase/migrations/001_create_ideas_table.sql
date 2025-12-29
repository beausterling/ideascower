-- Create the daily_ideas table to store daily generated ideas
CREATE TABLE IF NOT EXISTS daily_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_number SERIAL NOT NULL UNIQUE,
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  pitch TEXT NOT NULL,
  fatal_flaw TEXT NOT NULL,
  verdict TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on date for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_ideas_date ON daily_ideas(date DESC);

-- Create index on issue_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_ideas_issue_number ON daily_ideas(issue_number DESC);

-- Enable Row Level Security
ALTER TABLE daily_ideas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON daily_ideas
  FOR SELECT
  USING (true);

-- Create policy to allow service role to insert/update
CREATE POLICY "Allow service role to insert" ON daily_ideas
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role to update" ON daily_ideas
  FOR UPDATE
  USING (true);
