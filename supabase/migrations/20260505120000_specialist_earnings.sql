CREATE TABLE specialist_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  amount_kzt NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_type TEXT CHECK (commission_type IN ('percent', 'fixed')) DEFAULT 'percent',
  commission_value NUMERIC(5,2) DEFAULT 20,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'paid')) DEFAULT 'pending',
  triggered_by TEXT DEFAULT 'pro_upgrade',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE specialist_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists see own earnings"
ON specialist_earnings FOR SELECT
USING (auth.uid() = specialist_id);
