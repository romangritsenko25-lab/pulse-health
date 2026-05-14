'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
interface DayActivity {
  checkin?: { time: string; wellbeing: number | null; mood: string | null; id: string }
  journal?: { time: string; preview: string; id: string }
  ai?: { time: string; title: string; messages: number; id: string }
  pdf?: { time: string; id: string }
}
type ActivityMap = Record<string, DayActivity>

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function toMonthStr(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

function countActivity(day: DayActivity | undefined): number {
  if (!day) return 0
  return [day.checkin, day.journal, day.ai, day.pdf].filter(Boolean).length
}

// ── Activity dot color ─────────────────────────────────────────────────────
function dotColor(count: number): string {
  if (count >= 3) return '#0d9488'
  if (count === 2) return '#2dd4bf'
  return '#99f6e4'
}

// ── Icons ──────────────────────────────────────────────────────────────────
function CheckinIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="#16a34a" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function AIIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="#2563eb" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
function JournalIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="#7c3aed" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}
function PDFIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="#ea580c" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

// ── Mini calendar ──────────────────────────────────────────────────────────
function MiniCalendar({
  year, month, selected, activity, onSelect, onPrev, onNext,
}: {
  year: number; month: number; selected: string
  activity: ActivityMap
  onSelect: (d: string) => void
  onPrev: () => void; onNext: () => void
}) {
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const firstDay = new Date(year, month, 1).getDay()
  // Monday-based: 0=Mon..6=Sun
  const offset = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<{ day: number | null }> = []
  for (let i = 0; i < offset; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d })

  return (
    <div className="w-full" style={{ minWidth: 200, maxWidth: 220 }}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-slate-800">
          {MONTHS_RU[month]} {year}
        </span>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-semibold text-slate-400 py-1">{w}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => {
          if (!cell.day) return <div key={i} />
          const dateStr = toDateStr(year, month, cell.day)
          const cnt = countActivity(activity[dateStr])
          const isSelected = dateStr === selected
          const isToday = dateStr === todayStr

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`flex flex-col items-center justify-center rounded-xl py-1 transition ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : isToday
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="text-xs leading-none">{cell.day}</span>
              {cnt > 0 ? (
                <span
                  className="mt-0.5 rounded-full"
                  style={{
                    width: 5, height: 5,
                    background: isSelected ? 'rgba(255,255,255,0.8)' : dotColor(cnt),
                  }}
                />
              ) : (
                <span style={{ width: 5, height: 5 }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Day detail ─────────────────────────────────────────────────────────────
function DayDetail({ dateStr, activity }: { dateStr: string; activity: ActivityMap }) {
  const day = activity[dateStr]
  const [y, m, d] = dateStr.split('-').map(Number)
  const label = `${d} ${MONTHS_GENITIVE[m - 1]} ${y}`
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
  const isToday = dateStr === todayStr

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-base font-bold text-slate-800 mb-4">{label}</h3>

      {!day ? (
        <div className="flex flex-col gap-3">
          <p className="text-slate-400 text-sm">В этот день не было активности</p>
          {isToday && (
            <a
              href="/checkin"
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 text-sm font-semibold transition"
            >
              Пройти чек-ин сегодня →
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Checkin */}
          {day.checkin && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckinIcon />
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Чек-ин</span>
                <span className="ml-auto text-xs text-slate-400">{day.checkin.time}</span>
              </div>
              <p className="text-sm text-slate-700">
                Самочувствие {day.checkin.wellbeing ?? '—'}/10
                {day.checkin.mood ? ` · ${day.checkin.mood}` : ''}
              </p>
              <a
                href={`/result?id=${day.checkin.id}`}
                className="mt-2 inline-flex text-green-700 hover:text-green-600 text-xs font-semibold transition"
              >
                Открыть анализ →
              </a>
            </div>
          )}

          {/* AI conversation */}
          {day.ai && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AIIcon />
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">AI-диалог</span>
                <span className="ml-auto text-xs text-slate-400">{day.ai.time}</span>
              </div>
              <p className="text-sm text-slate-700 line-clamp-1">&ldquo;{day.ai.title}&rdquo;</p>
              {day.ai.messages > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">{day.ai.messages} сообщений</p>
              )}
              <a
                href={`/cabinet?tab=ai&conv=${day.ai.id}`}
                className="mt-2 inline-flex text-blue-700 hover:text-blue-600 text-xs font-semibold transition"
              >
                Открыть чат →
              </a>
            </div>
          )}

          {/* Journal */}
          {day.journal && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <JournalIcon />
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Дневник</span>
                <span className="ml-auto text-xs text-slate-400">{day.journal.time}</span>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 italic">
                &ldquo;{day.journal.preview}{day.journal.preview.length >= 80 ? '…' : ''}&rdquo;
              </p>
              <a
                href="/cabinet?tab=journal"
                className="mt-2 inline-flex text-purple-700 hover:text-purple-600 text-xs font-semibold transition"
              >
                Читать →
              </a>
            </div>
          )}

          {/* PDF */}
          {day.pdf && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <PDFIcon />
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">PDF</span>
                <span className="ml-auto text-xs text-slate-400">{day.pdf.time}</span>
              </div>
              <p className="text-sm text-slate-700">PDF скачан · Подготовка к приёму</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function CalendarTab() {
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState(todayStr)
  const [activity, setActivity] = useState<ActivityMap>({})
  const [loading, setLoading] = useState(true)

  const loadMonth = useCallback(async (y: number, m: number) => {
    setLoading(true)
    try {
      const monthStr = toMonthStr(y, m)
      const res = await fetch(`/api/activity?month=${monthStr}`)
      if (res.ok) {
        const data = await res.json() as ActivityMap
        setActivity((prev) => ({ ...prev, ...data }))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMonth(year, month)
  }, [year, month, loadMonth])

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-slate-900">Календарь</h2>

      {/* Layout: side by side on md+, stacked on mobile */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: mini calendar */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 md:self-start">
          <MiniCalendar
            year={year}
            month={month}
            selected={selected}
            activity={activity}
            onSelect={setSelected}
            onPrev={prevMonth}
            onNext={nextMonth}
          />
        </div>

        {/* Right: day detail */}
        <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-5 min-h-[180px]">
          {loading ? (
            <p className="text-slate-400 text-sm animate-pulse">Загрузка…</p>
          ) : (
            <DayDetail dateStr={selected} activity={activity} />
          )}
        </div>
      </div>
    </div>
  )
}
