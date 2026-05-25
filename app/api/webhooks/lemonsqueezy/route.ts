import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { recordReferralEarning } from '@/lib/referral-earnings'
import { Resend } from 'resend'
import { emailHtml } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pulse-health-smoky.vercel.app'

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

        // Send Pro confirmation email
        const { data: prof } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('id', userId)
          .single()
        if (prof?.email) {
          const firstName = prof.name?.split(' ')[0] ?? 'друг'
          resend.emails.send({
            from: 'Metanoia AI <noreply@metanoia.ai>',
            to: prof.email,
            subject: 'Pro-план активирован — добро пожаловать',
            html: emailHtml({
              title: 'Pro активирован',
              subtitle: `Добро пожаловать, ${firstName}`,
              body: `
                <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
                  Твой Pro-план активирован. Теперь тебе доступны все возможности Metanoia AI.
                </p>
                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="color:#2563eb;font-size:16px;font-weight:700;">✓</span>
                    <p style="margin:0;font-size:14px;color:#475569;">Ежедневный чек-ин без ограничений</p>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="color:#2563eb;font-size:16px;font-weight:700;">✓</span>
                    <p style="margin:0;font-size:14px;color:#475569;">PDF-документ для специалиста</p>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="color:#2563eb;font-size:16px;font-weight:700;">✓</span>
                    <p style="margin:0;font-size:14px;color:#475569;">AI-ассистент без лимита сообщений</p>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="color:#2563eb;font-size:16px;font-weight:700;">✓</span>
                    <p style="margin:0;font-size:14px;color:#475569;">Журнал и история анализов</p>
                  </div>
                </div>`,
              ctaText: 'Открыть кабинет',
              ctaUrl: `${SITE_URL}/cabinet`,
              userId,
            }),
          }).catch(console.error)
        }
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
