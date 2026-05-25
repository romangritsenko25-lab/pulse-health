const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pulse-health-smoky.vercel.app'

export function emailHtml(opts: {
  title: string
  subtitle?: string
  body: string
  ctaText: string
  ctaUrl: string
  userId?: string
}): string {
  const { title, subtitle, body, ctaText, ctaUrl, userId } = opts
  const unsubscribeLink = userId
    ? `<a href="${SITE_URL}/api/unsubscribe?uid=${encodeURIComponent(userId)}" style="color:#94a3b8;text-decoration:underline;">Отписаться</a>`
    : ''

  return `<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="padding:28px 32px 20px;">
      <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#2563eb;letter-spacing:4px;text-transform:uppercase;">METANOIA AI</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#1e293b;letter-spacing:-0.3px;">${title}</h1>
      ${subtitle ? `<p style="margin:6px 0 0;font-size:14px;color:#64748b;">${subtitle}</p>` : ''}
    </div>
    <div style="height:1px;background:#e2e8f0;margin:0 32px;"></div>
    <div style="padding:24px 32px;">
      ${body}
    </div>
    <div style="padding:0 32px 28px;">
      <a href="${ctaUrl}" style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 24px;border-radius:12px;">${ctaText}</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:16px;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">Metanoia AI · Не является медицинским заключением</p>
      ${unsubscribeLink ? `<p style="margin:0;font-size:11px;white-space:nowrap;">${unsubscribeLink}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}
