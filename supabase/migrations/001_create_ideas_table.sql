-- Create the ideas table to store daily generated ideas
CREATE TABLE IF NOT EXISTS ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  seed INTEGER NOT NULL,
  title TEXT NOT NULL,
  pitch TEXT NOT NULL,
  fatal_flaw TEXT NOT NULL,
  verdict TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on date for faster lookups
CREATE INDEX IF NOT EXISTS idx_ideas_date ON ideas(date DESC);

-- Enable Row Level Security
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON ideas
  FOR SELECT
  USING (true);

-- Create policy to allow service role to insert/update
CREATE POLICY "Allow service role to insert" ON ideas
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role to update" ON ideas
  FOR UPDATE
  USING (true);
