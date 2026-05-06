CREATE TABLE IF NOT EXISTS pdf_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  specialist_id uuid REFERENCES specialists(id) ON DELETE SET NULL
);

ALTER TABLE pdf_downloads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pdf_downloads' AND policyname = 'Users manage own pdf_downloads'
  ) THEN
    CREATE POLICY "Users manage own pdf_downloads"
      ON pdf_downloads FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
