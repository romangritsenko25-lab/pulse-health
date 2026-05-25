import type { Metadata } from 'next'
import GuideClient from './GuideClient'

export const metadata: Metadata = {
  title: 'Гид — Metanoia AI',
  description: 'Как работает Metanoia AI: чек-ин, AI-анализ, журнал, динамика и PDF для специалиста. Ответы на частые вопросы.',
}

export default function GuidePage() {
  return <GuideClient />
}
