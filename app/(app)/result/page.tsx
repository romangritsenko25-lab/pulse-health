'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────
interface AnalysisData {
  id: string
  crisis?: boolean
  reflection?: string
  patterns?: string
  hypothesis?: string
  forSpecialist?: string[]
  support?: string
}

// ── PDF generation (client-side, no server needed) ─────────────────────────
async function generatePdf(data: AnalysisData) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  const date = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const specialist = (data.forSpecialist ?? [])
    .map((t, i) => `
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
        <div style="min-width:22px;height:22px;background:#fde68a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#92400e;padding-top:3px;text-align:center;">${i + 1}</div>
        <p style="font-size:13px;line-height:1.6;color:#78350f;margin:2px 0 0;flex:1;">${t}</p>
      </div>`)
    .join('')

  const html = `
    <div style="width:794px;padding:56px 60px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1e293b;box-sizing:border-box;">

      <div style="border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:32px;">
        <p style="font-size:10px;font-weight:700;color:#6366f1;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Metanoia AI</p>
        <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 6px;line-height:1.3;">Подготовка к приёму у специалиста</h1>
        <p style="font-size:12px;color:#94a3b8;margin:0;">${date}</p>
      </div>

      ${data.reflection ? `
      <div style="margin-bottom:22px;padding:18px 20px;background:#eff6ff;border-radius:8px;border-left:4px solid #3b82f6;">
        <p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">01 · Отражение</p>
        <p style="font-size:13px;line-height:1.75;color:#1e3a5f;margin:0;">${data.reflection}</p>
      </div>` : ''}

      ${data.patterns ? `
      <div style="margin-bottom:22px;padding:18px 20px;background:#f0fdfa;border-radius:8px;border-left:4px solid #14b8a6;">
        <p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">02 · Паттерны</p>
        <p style="font-size:13px;line-height:1.75;color:#134e4a;margin:0;">${data.patterns}</p>
      </div>` : ''}

      ${data.hypothesis ? `
      <div style="margin-bottom:22px;padding:18px 20px;background:#f5f3ff;border-radius:8px;border-left:4px solid #8b5cf6;">
        <p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">03 · Гипотеза</p>
        <p style="font-size:13px;line-height:1.75;color:#3b0764;font-style:italic;margin:0;">${data.hypothesis}</p>
      </div>` : ''}

      ${specialist ? `
      <div style="margin-bottom:22px;padding:18px 20px;background:#fffbeb;border-radius:8px;border-left:4px solid #f59e0b;">
        <p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">04 · Темы для специалиста</p>
        ${specialist}
      </div>` : ''}

      ${data.support ? `
      <div style="margin-bottom:32px;padding:18px 20px;background:#6366f1;border-radius:8px;">
        <p style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.65);letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">05 · Поддержка</p>
        <p style="font-size:13px;line-height:1.75;color:#ffffff;margin:0;">${data.support}</p>
      </div>` : ''}

      <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
        <p style="font-size:10px;color:#94a3b8;line-height:1.6;margin:0;">Составлено AI-ассистентом Metanoia AI. Не является медицинским заключением и не заменяет консультацию специалиста.</p>
      </div>
    </div>`

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;'
  wrapper.innerHTML = html
  document.body.appendChild(wrapper)

  const canvas = await html2canvas(wrapper.firstElementChild as HTMLElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })
  document.body.removeChild(wrapper)

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgH = (canvas.height * pageW) / canvas.width

  let remaining = imgH
  let yPos = 0
  pdf.addImage(imgData, 'PNG', 0, yPos, pageW, imgH)
  remaining -= pageH

  while (remaining > 0) {
    yPos -= pageH
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, yPos, pageW, imgH)
    remaining -= pageH
  }

  pdf.save(`metanoia-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Section component ──────────────────────────────────────────────────────
function Section({
  badge, title, color, children,
}: {
  badge: string; title: string; color: string; children: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl border p-5 ${color}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-widest opacity-60">{badge}</span>
        <span className="text-xs opacity-40">·</span>
        <span className="text-sm font-semibold opacity-80">{title}</span>
      </div>
      {children}
    </div>
  )
}

// ── Crisis screen ──────────────────────────────────────────────────────────
function CrisisView({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto px-4 py-10">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold text-red-700 mb-3">Ты не один(а)</h2>
        <p className="text-slate-700 text-sm leading-relaxed mb-5">
          Я вижу, что тебе сейчас очень тяжело. Пожалуйста, позвони на линию поддержки — это бесплатно и анонимно.
        </p>
        <div className="flex flex-col gap-3">
          {[
            { number: '150', label: 'Казахстан', href: 'tel:150' },
            { number: '8-800-2000-122', label: 'Россия', href: 'tel:88002000122' },
            { number: '7333', label: 'Украина', href: 'tel:7333' },
          ].map((r) => (
            <a key={r.number} href={r.href}
              className="flex items-center gap-3 bg-white border border-red-100 rounded-xl px-4 py-3 text-red-700 font-semibold hover:bg-red-50 transition">
              <span className="text-xl">📞</span>
              <div>
                <div className="font-bold text-sm">{r.number}</div>
                <div className="text-xs text-slate-500">{r.label} — бесплатно, круглосуточно</div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <button onClick={onBack} className="text-slate-400 text-sm text-center hover:text-slate-600 transition">
        ← Вернуться
      </button>
    </div>
  )
}

// ── Main content ───────────────────────────────────────────────────────────
function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [data, setData] = useState<AnalysisData | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(false)

  useEffect(() => {
    if (!id) { router.replace('/checkin'); return }
    const raw = sessionStorage.getItem(`pulse_checkin_${id}`)
    if (raw) setData(JSON.parse(raw))
    else router.replace('/checkin')
  }, [id, router])

  async function handleDownloadPdf() {
    if (!data) return
    setPdfLoading(true)
    setPdfError(false)
    try {
      await generatePdf(data)
    } catch (err) {
      console.error('PDF error:', err)
      setPdfError(true)
    } finally {
      setPdfLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse text-sm">Загрузка…</p>
      </div>
    )
  }

  if (data.crisis) return <CrisisView onBack={() => router.push('/checkin')} />

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Metanoia AI</p>
            <h1 className="text-2xl font-bold text-slate-800 mt-0.5">Твой анализ</h1>
            <p className="text-slate-400 text-sm mt-0.5">{dateStr}</p>
          </div>
          <button onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-slate-600 text-sm transition mt-1">
            Дашборд →
          </button>
        </div>

        {/* Reflection */}
        {data.reflection && (
          <Section badge="01" title="Отражение" color="bg-blue-50 border-blue-100 text-blue-900">
            <p className="text-sm leading-relaxed">{data.reflection}</p>
          </Section>
        )}

        {/* Patterns */}
        {data.patterns && (
          <Section badge="02" title="Паттерны" color="bg-teal-50 border-teal-100 text-teal-900">
            <p className="text-sm leading-relaxed">{data.patterns}</p>
          </Section>
        )}

        {/* Hypothesis */}
        {data.hypothesis && (
          <Section badge="03" title="Гипотеза" color="bg-violet-50 border-violet-100 text-violet-900">
            <p className="text-sm leading-relaxed italic">{data.hypothesis}</p>
          </Section>
        )}

        {/* For Specialist */}
        {data.forSpecialist && data.forSpecialist.length > 0 && (
          <Section badge="04" title="Темы для специалиста" color="bg-amber-50 border-amber-100 text-amber-900">
            <ul className="flex flex-col gap-2">
              {data.forSpecialist.map((topic, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Support */}
        {data.support && (
          <div className="bg-indigo-600 rounded-2xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">05 · Поддержка</p>
            <p className="text-sm leading-relaxed font-medium">{data.support}</p>
          </div>
        )}

        {/* PDF Download */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
          <div>
            <p className="font-semibold text-slate-800 text-sm">Скачать PDF для приёма</p>
            <p className="text-slate-400 text-xs mt-0.5">Покажи специалисту — сэкономит время на объяснения</p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            {pdfLoading
              ? <><span className="animate-spin inline-block">⏳</span> Генерируем…</>
              : '↓ Скачать PDF'}
          </button>
          {pdfError && (
            <p className="text-red-500 text-xs text-center">Не удалось создать PDF. Попробуй ещё раз.</p>
          )}
        </div>

        <button onClick={() => router.push('/checkin')}
          className="w-full py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition text-sm">
          Пройти ещё раз
        </button>

        <p className="text-slate-300 text-xs text-center leading-relaxed">
          Составлено AI-ассистентом Metanoia AI.<br />
          Не является медицинским заключением.
        </p>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse text-sm">Загрузка…</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}
