import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const [{ data: specialists }, { data: clientLinks }] = await Promise.all([
    adminSupabase
      .from('specialists')
      .select('id, name, specialty, photo_url, bio, referral_code'),
    adminSupabase
      .from('specialist_clients')
      .select('specialist_id'),
  ])

  const countMap = new Map<string, number>()
  for (const link of clientLinks ?? []) {
    countMap.set(link.specialist_id, (countMap.get(link.specialist_id) ?? 0) + 1)
  }

  const result = (specialists ?? [])
    .map((s) => ({ ...s, client_count: countMap.get(s.id) ?? 0 }))
    .sort((a, b) => b.client_count - a.client_count)

  return NextResponse.json(result)
}
