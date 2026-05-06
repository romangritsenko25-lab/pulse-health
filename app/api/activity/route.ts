import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function toLocalDate(iso: string): string {
  return iso.slice(0, 10)
}

function toTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const month = req.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
    const [year, mon] = month.split('-').map(Number)
    const from = `${month}-01`
    const lastDay = new Date(year, mon, 0).getDate()
    const to = `${month}-${String(lastDay).padStart(2, '0')}T23:59:59`

    const admin = adminClient()

    const [
      { data: checkins },
      { data: journals },
      { data: convs },
      { data: pdfs },
    ] = await Promise.all([
      admin
        .from('checkins')
        .select('id, created_at, wellbeing, mood')
        .eq('user_id', user.id)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false }),
      admin
        .from('journal_entries')
        .select('id, created_at, content')
        .eq('user_id', user.id)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false }),
      admin
        .from('ai_conversations')
        .select('id, created_at, updated_at, title')
        .eq('user_id', user.id)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false }),
      admin
        .from('pdf_downloads')
        .select('id, created_at')
        .eq('user_id', user.id)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false }),
    ])

    // Count messages per conversation
    const convIds = (convs ?? []).map((c) => c.id)
    let msgCounts: Record<string, number> = {}
    if (convIds.length > 0) {
      const { data: msgs } = await admin
        .from('ai_messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
      if (msgs) {
        for (const m of msgs) {
          msgCounts[m.conversation_id] = (msgCounts[m.conversation_id] ?? 0) + 1
        }
      }
    }

    // Group by date
    const result: Record<string, {
      checkin?: { time: string; wellbeing: number | null; mood: string | null; id: string }
      journal?: { time: string; preview: string; id: string }
      ai?: { time: string; title: string; messages: number; id: string }
      pdf?: { time: string; id: string }
    }> = {}

    function ensure(date: string) {
      if (!result[date]) result[date] = {}
    }

    for (const c of checkins ?? []) {
      const d = toLocalDate(c.created_at)
      ensure(d)
      if (!result[d].checkin) {
        result[d].checkin = { time: toTime(c.created_at), wellbeing: c.wellbeing, mood: c.mood, id: c.id }
      }
    }

    for (const j of journals ?? []) {
      const d = toLocalDate(j.created_at)
      ensure(d)
      if (!result[d].journal) {
        result[d].journal = { time: toTime(j.created_at), preview: (j.content ?? '').slice(0, 80), id: j.id }
      }
    }

    for (const conv of convs ?? []) {
      const d = toLocalDate(conv.created_at)
      ensure(d)
      if (!result[d].ai) {
        result[d].ai = {
          time: toTime(conv.created_at),
          title: conv.title ?? 'AI-диалог',
          messages: msgCounts[conv.id] ?? 0,
          id: conv.id,
        }
      }
    }

    for (const p of pdfs ?? []) {
      const d = toLocalDate(p.created_at)
      ensure(d)
      if (!result[d].pdf) {
        result[d].pdf = { time: toTime(p.created_at), id: p.id }
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/activity error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
