'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Чек-ин', href: '/login' },
  { label: 'Журнал', href: '/journal' },
  { label: 'Специалисты', href: '/specialists' },
  { label: 'Материалы', href: '/materials' },
  { label: 'О нас', href: '/about' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/login"
          className="flex items-center gap-2 shrink-0"
          onClick={() => setOpen(false)}
        >
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">Metanoia AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href || (l.href !== '/login' && pathname.startsWith(l.href))
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden md:inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            Войти
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Меню"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition"
            >
              Войти
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
