'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const FREE_MSG_LIMIT = 3

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

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ── PDF generation (client-side) ───────────────────────────────────────────
type JournalData = { count: number; summary: string | null; themes: string[] }

async function generatePdf(data: AnalysisData, specialistName?: string, specialistSpecialty?: string, journalData?: JournalData) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
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

  const specialistBlock = specialistName
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:20px;">👩‍⚕️</span>
        <div>
          <p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 3px;">Подготовлено для специалиста</p>
          <p style="font-size:13px;font-weight:700;color:#166534;margin:0;">${specialistName}${specialistSpecialty ? ` · ${specialistSpecialty}` : ''}</p>
        </div>
      </div>`
    : ''

  const html = `
    <div style="width:794px;padding:56px 60px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1e293b;box-sizing:border-box;">
      <div style="border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:32px;">
        <p style="font-size:10px;font-weight:700;color:#0d9488;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Metanoia AI</p>
        <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 6px;line-height:1.3;">Подготовка к приёму у специалиста</h1>
        <p style="font-size:12px;color:#94a3b8;margin:0;">${date}</p>
      </div>
      ${specialistBlock}
      ${data.reflection ? `<div style="margin-bottom:22px;padding:18px 20px;background:#eff6ff;border-radius:8px;border-left:4px solid #3b82f6;"><p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">01 · Отражение</p><p style="font-size:13px;line-height:1.75;color:#1e3a5f;margin:0;">${data.reflection}</p></div>` : ''}
      ${data.patterns ? `<div style="margin-bottom:22px;padding:18px 20px;background:#f0fdfa;border-radius:8px;border-left:4px solid #14b8a6;"><p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">02 · Паттерны</p><p style="font-size:13px;line-height:1.75;color:#134e4a;margin:0;">${data.patterns}</p></div>` : ''}
      ${data.hypothesis ? `<div style="margin-bottom:22px;padding:18px 20px;background:#f5f3ff;border-radius:8px;border-left:4px solid #8b5cf6;"><p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">03 · Гипотеза</p><p style="font-size:13px;line-height:1.75;color:#3b0764;font-style:italic;margin:0;">${data.hypothesis}</p></div>` : ''}
      ${specialist ? `<div style="margin-bottom:22px;padding:18px 20px;background:#fffbeb;border-radius:8px;border-left:4px solid #f59e0b;"><p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">04 · Темы для специалиста</p>${specialist}</div>` : ''}
      ${data.support ? `<div style="margin-bottom:32px;padding:18px 20px;background:#0d9488;border-radius:8px;"><p style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.65);letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">05 · Поддержка</p><p style="font-size:13px;line-height:1.75;color:#ffffff;margin:0;">${data.support}</p></div>` : ''}
      ${journalData && journalData.count > 0 ? `
      <div style="margin-bottom:22px;padding:18px 20px;background:#f8fafc;border-radius:8px;border-left:4px solid #64748b;">
        <p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Из дневника за 30 дней · ${journalData.count} записей</p>
        ${journalData.summary ? `<p style="font-size:13px;line-height:1.75;color:#334155;margin:0 0 12px;">${journalData.summary.replace(/\n/g, '<br/>')}</p>` : ''}
        ${journalData.themes.length > 0 ? `
        <div>
          <p style="font-size:11px;font-weight:600;color:#64748b;margin:0 0 8px;">Темы из дневника:</p>
          ${journalData.themes.slice(0, 3).map((t, i) => `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;"><div style="min-width:18px;height:18px;background:#e2e8f0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#64748b;">${i + 1}</div><p style="font-size:12px;line-height:1.5;color:#475569;margin:2px 0 0;flex:1;">${t}</p></div>`).join('')}
        </div>` : ''}
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
    scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
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

const SECTION_ACCENTS: Record<string, string> = {
  '01': '#3b82f6',
  '02': '#0d9488',
  '03': '#8b5cf6',
  '04': '#f59e0b',
}

// ── Section ────────────────────────────────────────────────────────────────
function Section({ badge, title, children }: {
  badge: string; title: string; color?: string; children: React.ReactNode
}) {
  const accent = SECTION_ACCENTS[badge] ?? '#0d9488'
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: '#faf9f7', borderColor: '#ede9e4' }}
    >
      <div className="flex gap-4 p-5" style={{ borderLeft: `3px solid ${accent}` }}>
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
          style={{ background: accent }}
        >
          {parseInt(badge)}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accent }}>
            {title}
          </p>
          {children}
        </div>
      </div>
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

// ── AI Chat component ──────────────────────────────────────────────────────
function AiChat({ analysis }: { analysis: AnalysisData }) {
  // apiMessages — только то что летит в Claude (должно начинаться с user)
  const [apiMessages, setApiMessages] = useState<ChatMessage[]>([])
  // displayMessages — включает приветствие для отображения
  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: 'Есть вопросы по анализу? Я готов разобраться вместе — задавай.',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const userMsgCount = apiMessages.filter((m) => m.role === 'user').length
  const limitReached = userMsgCount >= FREE_MSG_LIMIT

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading || limitReached) return

    const newUserMsg: ChatMessage = { role: 'user', content: text }
    const updatedApi: ChatMessage[] = [...apiMessages, newUserMsg]

    setApiMessages(updatedApi)
    setDisplayMessages((prev) => [...prev, newUserMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedApi,
          analysis: {
            reflection: analysis.reflection,
            patterns: analysis.patterns,
            hypothesis: analysis.hypothesis,
            forSpecialist: analysis.forSpecialist,
            support: analysis.support,
          },
        }),
      })
      const data = await res.json()
      const reply = res.ok && data.reply
        ? data.reply
        : `Ошибка: ${data.detail ?? data.error ?? 'server_error'}`
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      setApiMessages((prev) => [...prev, assistantMsg])
      setDisplayMessages((prev) => [...prev, assistantMsg])
    } catch {
      setDisplayMessages((prev) => [...prev, { role: 'assistant', content: 'Не удалось получить ответ. Попробуй ещё раз.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3.5 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 text-indigo-600 font-semibold text-sm hover:bg-indigo-100 transition flex items-center justify-center gap-2"
      >
        <span>💬</span> Задать вопрос по анализу
      </button>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">Уточняющий диалог</span>
          <span className="text-xs text-slate-400">·</span>
          <span className={`text-xs font-medium ${limitReached ? 'text-red-400' : 'text-slate-400'}`}>
            {limitReached ? 'Лимит исчерпан' : `${FREE_MSG_LIMIT - userMsgCount} из ${FREE_MSG_LIMIT}`}
          </span>
        </div>
        <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-slate-500 text-lg transition">×</button>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 px-4 py-4 max-h-80 overflow-y-auto">
        {displayMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-slate-100 text-slate-800 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-400 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm">
              <span className="animate-pulse">Думаю…</span>
            </div>
          </div>
        )}
        {limitReached && !loading && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-indigo-600 font-medium mb-1">Лимит бесплатных сообщений</p>
            <p className="text-xs text-slate-500">Обновись до Pro для безлимитного диалога</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 px-3 py-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={limitReached ? 'Лимит исчерпан' : 'Задай вопрос…'}
          disabled={limitReached || loading}
          className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading || limitReached}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition"
        >
          →
        </button>
      </div>
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
  const [journalLimitReached, setJournalLimitReached] = useState(false)
  const [specialistName, setSpecialistName] = useState<string | undefined>()
  const [specialistSpecialty, setSpecialistSpecialty] = useState<string | undefined>()

  useEffect(() => {
    if (!id) { router.replace('/checkin'); return }
    const raw = sessionStorage.getItem(`pulse_checkin_${id}`)
    if (raw) setData(JSON.parse(raw))
    else router.replace('/checkin')
  }, [id, router])

  useEffect(() => {
    // Load specialist info if client is linked to one
    async function loadSpecialist() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: link } = await supabase
        .from('specialist_clients')
        .select('specialist_id')
        .eq('client_id', user.id)
        .limit(1)
        .single()

      if (!link) return

      const { data: spec } = await supabase
        .from('specialists')
        .select('name, specialty')
        .eq('id', link.specialist_id)
        .single()

      if (spec) {
        setSpecialistName(spec.name)
        setSpecialistSpecialty(spec.specialty)
      }
    }
    loadSpecialist()
  }, [])

  async function handleDownloadPdf() {
    if (!data) return
    setPdfLoading(true)
    setPdfError(false)
    try {
      let journalData: JournalData | undefined
      try {
        const res = await fetch('/api/analyze-journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period: 30 }),
        })
        if (res.ok) {
          const j = await res.json()
          const { createClient: mkClient } = await import('@/lib/supabase/client')
          const supabase = mkClient()
          const since = new Date(); since.setDate(since.getDate() - 30)
          const { count } = await supabase
            .from('journal_entries')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', since.toISOString())
          journalData = { count: count ?? 0, summary: j.summary, themes: j.themes ?? [] }
        } else if (res.status === 429) {
          const body = await res.json().catch(() => ({}))
          if (body.error === 'limit_reached') setJournalLimitReached(true)
        }
      } catch { /* journal is optional — don't block PDF */ }
      await generatePdf(data, specialistName, specialistSpecialty, journalData)
      try {
        const { createClient: mkClient2 } = await import('@/lib/supabase/client')
        const sb = mkClient2()
        const { data: { user } } = await sb.auth.getUser()
        if (user) await sb.from('pdf_downloads').insert({ user_id: user.id })
      } catch { /* non-blocking */ }
    } catch (err) {
      console.error('PDF error:', err)
      setPdfError(true)
    } finally {
      setPdfLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf9f7' }}>
        <p className="animate-pulse text-sm" style={{ color: '#9ca3af' }}>Загрузка…</p>
      </div>
    )
  }

  if (data.crisis) return <CrisisView onBack={() => router.push('/checkin')} />

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0d9488' }}>Metanoia AI</p>
            <h1 className="text-2xl font-bold mt-0.5" style={{ color: '#1a2535' }}>Твой анализ</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>{dateStr}</p>
          </div>
          <button onClick={() => router.push('/cabinet')}
            className="text-sm transition mt-1 font-medium"
            style={{ color: '#9ca3af' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1a2535')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
          >
            Кабинет →
          </button>
        </div>

        {data.reflection && (
          <Section badge="01" title="Отражение">
            <p className="text-sm leading-relaxed" style={{ color: '#1a2535' }}>{data.reflection}</p>
          </Section>
        )}

        {data.patterns && (
          <Section badge="02" title="Паттерны">
            <p className="text-sm leading-relaxed" style={{ color: '#1a2535' }}>{data.patterns}</p>
          </Section>
        )}

        {data.hypothesis && (
          <Section badge="03" title="Гипотеза">
            <p className="text-sm leading-relaxed italic" style={{ color: '#1a2535' }}>{data.hypothesis}</p>
          </Section>
        )}

        {data.forSpecialist && data.forSpecialist.length > 0 && (
          <Section badge="04" title="Темы для специалиста">
            <ul className="flex flex-col gap-2.5">
              {data.forSpecialist.map((topic, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#1a2535' }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 text-white"
                    style={{ background: '#f59e0b' }}
                  >
                    {i + 1}
                  </span>
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {data.support && (
          <div
            className="rounded-2xl p-5 text-white"
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ opacity: 0.7 }}>
              05 · Поддержка
            </p>
            <p className="text-sm leading-relaxed font-medium">{data.support}</p>
          </div>
        )}

        {/* AI Chat */}
        <AiChat analysis={data} />

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
          {journalLimitReached && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <span className="mt-0.5">⚠️</span>
              <p>
                <span className="font-semibold">Лимит анализа журнала исчерпан</span> — PDF создан без раздела дневника.{' '}
                <a href="/upgrade" className="underline font-semibold hover:text-amber-900">Перейти на Pro</a> для безлимитного доступа.
              </p>
            </div>
          )}
        </div>

        <button onClick={() => router.push('/checkin')}
          className="w-full py-3 rounded-2xl font-medium transition text-sm"
          style={{ border: '1px solid #ede9e4', background: '#ffffff', color: '#64748b' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#faf9f7')}
          onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
        >
          Пройти ещё раз
        </button>

        <p className="text-xs text-center leading-relaxed" style={{ color: '#9ca3af' }}>
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
