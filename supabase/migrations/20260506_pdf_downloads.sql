CREATE TABLE IF NOT EXISTS pdf_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pdf_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own downloads" ON pdf_downloads
FOR ALL USING (auth.uid() = user_id);
