'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LoginModal from './LoginModal'

const PUBLIC_LINKS = [
  { label: 'Специалисты', href: '/specialists' },
  { label: 'Материалы', href: '/materials' },
  { label: 'О нас', href: '/about' },
]

const USER_LINKS = [
  { label: 'Специалисты', href: '/specialists' },
  { label: 'Материалы', href: '/materials' },
  { label: 'О нас', href: '/about' },
]

const SPECIALIST_LINKS = [
  { label: 'Дашборд', href: '/specialist/dashboard' },
  { label: 'Специалисты', href: '/specialists' },
  { label: 'Материалы', href: '/materials' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).maybeSingle()
      setRole(profile?.role ?? 'guest')
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navLinks = role === 'user' ? USER_LINKS : role === 'specialist' ? SPECIALIST_LINKS : PUBLIC_LINKS
  const ctaHref = role === 'user' ? '/cabinet' : role === 'specialist' ? '/specialist/dashboard' : null
  const ctaLabel = role === 'user' ? 'В кабинет' : role === 'specialist' ? 'Дашборд' : 'Войти'

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/login"
          className="flex items-center gap-2 shrink-0"
          onClick={() => setOpen(false)}
        >
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="20" cy="20" r="20" fill="#0d9488"/>
            <path d="M8 28 L8 10 L20 20 L32 10 L32 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold text-slate-900 text-[15px] tracking-tight leading-none">
            metanoia<span className="text-teal-600 text-[9px] font-bold align-super ml-0.5">AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href || (l.href !== '/login' && pathname.startsWith(l.href))
                  ? 'text-teal-600 bg-teal-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {ctaHref ? (
            <div className="relative hidden md:block">
              <button
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
                onClick={() => window.location.href = ctaHref}
                className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                {ctaLabel}
              </button>
              {showDropdown && (
                <div
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                  className="absolute right-0 top-full pt-1 z-50"
                >
                  <div className="bg-white border border-slate-100 rounded-xl shadow-lg py-1 min-w-[180px]">
                    <Link href={ctaHref} className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition">
                      Перейти в кабинет
                    </Link>
                    <div className="my-1 border-t border-slate-50" />
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition">
                      Выйти из аккаунта
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)}
              className="hidden md:inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition shadow-sm">
              Войти
            </button>
          )}
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
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
            {ctaHref ? (
              <>
                <Link href={ctaHref} onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition">
                  {ctaLabel}
                </Link>
                <button onClick={() => { setOpen(false); handleSignOut() }}
                  className="text-center text-xs text-slate-400 hover:text-slate-600 py-1.5 transition">
                  Выйти из аккаунта
                </button>
              </>
            ) : (
              <button onClick={() => { setOpen(false); setShowLogin(true) }}
                className="mt-2 flex items-center justify-center w-full px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition">
                Войти
              </button>
            )}
          </div>
        </div>
      )}
    </header>

    {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
  </>
  )
}
