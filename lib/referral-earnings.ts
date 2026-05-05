import { createClient } from '@/lib/supabase/server'

export async function recordReferralEarning(userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: referral } = await supabase
    .from('referrals')
    .select('id, specialist_id')
    .eq('user_id', userId)
    .single()

  if (!referral) return

  await supabase.from('specialist_earnings').insert({
    specialist_id: referral.specialist_id,
    user_id: userId,
    referral_id: referral.id,
    amount_kzt: 0,
    commission_type: 'percent',
    commission_value: 20,
    status: 'pending',
    triggered_by: 'pro_upgrade',
  })
}
