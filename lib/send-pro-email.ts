import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { emailHtml } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pulse-health-smoky.vercel.app'

export async function sendProConfirmationEmail(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data: prof } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .single()

  if (!prof?.email) return

  const firstName = prof.name?.split(' ')[0] ?? 'друг'

  await resend.emails.send({
    from: 'Metanoia AI <hello@metanoia.ai>',
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
