-- Run in Supabase SQL Editor
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT,
  voice_input BOOLEAN DEFAULT false,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal" ON journal_entries
FOR ALL USING (auth.uid() = user_id);
