import type { Metadata } from 'next'
import MaterialsClient from './MaterialsClient'

export const metadata: Metadata = {
  title: 'Материалы — Metanoia AI',
  description: 'Книги, видео и статьи для самопознания — библиотека Metanoia AI.',
}

export default function MaterialsPage() {
  return <MaterialsClient />
}
