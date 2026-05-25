import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const successHtml = `<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:420px;margin:40px auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 32px;text-align:center;">
    <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#2563eb;letter-spacing:4px;text-transform:uppercase;">METANOIA AI</p>
    <h1 style="margin:12px 0;font-size:22px;font-weight:700;color:#1e293b;">Вы отписаны</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">Уведомления по email отключены. Вы всегда можете включить их обратно в настройках профиля.</p>
    <a href="/" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:12px;">На главную</a>
  </div>
</body>
</html>`

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) {
    return new NextResponse('Bad request', { status: 400 })
  }

  const supabase = adminClient()
  await supabase
    .from('profiles')
    .update({ email_unsubscribed: true })
    .eq('id', uid)

  return new NextResponse(successHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
