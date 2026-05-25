import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { recordReferralEarning } from '@/lib/referral-earnings'
import { sendProConfirmationEmail } from '@/lib/send-pro-email'

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature') ?? ''
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? ''

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const eventName: string = event.meta?.event_name ?? ''

  switch (eventName) {
    case 'order_created':
    case 'subscription_created': {
      const userId: string = event.meta?.custom_data?.user_id ?? ''
      if (userId) {
        const supabase = await createClient()
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          status: 'active',
          plan: 'pro',
          current_period_end: event.data?.attributes?.ends_at ?? null,
        }, { onConflict: 'user_id' })
        await recordReferralEarning(userId)
        await sendProConfirmationEmail(userId)
      }
      console.log(`[LemonSqueezy] New subscription for user ${userId}`)
      break
    }

    case 'subscription_cancelled': {
      const userId: string = event.meta?.custom_data?.user_id ?? ''
      if (userId) {
        const supabase = await createClient()
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          status: 'cancelled',
          plan: 'free',
        }, { onConflict: 'user_id' })
      }
      console.log(`[LemonSqueezy] Subscription cancelled for user ${userId}`)
      break
    }

    default:
      console.log(`[LemonSqueezy] Unhandled event: ${eventName}`)
  }

  return NextResponse.json({ received: true })
}
