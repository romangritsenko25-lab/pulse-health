'use client'

import { useState } from 'react'

const BOOKS = [
  {
    id: '1',
    title: 'Тело помнит всё',
    author: 'Бессел ван дер Колк',
    description: 'Основополагающая книга о психотравме: как она формирует тело и разум и как вернуть себе жизнь через движение, отношения и осознанность.',
    cover: null,
    affiliateUrl: '#',
    category: 'trauma',
  },
  {
    id: '2',
    title: 'Почему я чувствую то, что ты чувствуешь',
    author: 'Йоахим Бауэр',
    description: 'Нейробиология эмпатии и зеркальных нейронов. Почему мы резонируем с другими людьми и как это влияет на наши отношения.',
    cover: null,
    affiliateUrl: '#',
    category: 'neuroscience',
  },
  {
    id: '3',
    title: 'Разум и мозг',
    author: 'Дэниэл Сигел',
    description: 'Как работает интеграция мозга, откуда берётся осознанность и как нейронаука объясняет связь между телом, умом и отношениями.',
    cover: null,
    affiliateUrl: '#',
    category: 'neuroscience',
  },
  {
    id: '4',
    title: 'Когнитивная терапия депрессии',
    author: 'Аарон Бек',
    description: 'Классический труд основателя КПТ. Как негативные автоматические мысли поддерживают депрессию и как работает когнитивная реструктуризация.',
    cover: null,
    affiliateUrl: '#',
    category: 'cbt',
  },
  {
    id: '5',
    title: 'Принятие и ответственность',
    author: 'Стивен Хайес',
    description: 'Терапия принятия и ответственности (ACT): как научиться жить с болезненными мыслями и чувствами, не позволяя им управлять жизнью.',
    cover: null,
    affiliateUrl: '#',
    category: 'act',
  },
  {
    id: '6',
    title: 'Бегство от близости',
    author: 'Берри Уайнхолд',
    description: 'Избегающая привязанность, страх близости и созависимость. Как паттерны раннего детства влияют на взрослые отношения.',
    cover: null,
    affiliateUrl: '#',
    category: 'relationships',
  },
  {
    id: '7',
    title: 'Осколки детских травм',
    author: 'Донна Джексон Наказава',
    description: 'Как неблагоприятный детский опыт влияет на здоровье и психику во взрослой жизни. Путь к исцелению через понимание ACE-исследований.',
    cover: null,
    affiliateUrl: '#',
    category: 'trauma',
  },
  {
    id: '8',
    title: 'Токсичный позитив',
    author: 'Уитни Гудман',
    description: 'Почему постоянные призывы «будь позитивным» вредят, как признать болезненные чувства нормальными и перестать себя за них стыдить.',
    cover: null,
    affiliateUrl: '#',
    category: 'self',
  },
]

const VIDEOS = [
  {
    id: '1',
    title: 'Как справляться с тревожностью: техники из КПТ',
    channel: 'Психология для жизни',
    description: 'Объяснение механизмов тревоги и практические упражнения когнитивно-поведенческой терапии для ежедневного применения.',
    videoUrl: 'https://www.youtube.com/results?search_query=тревожность+кпт+техники',
    category: 'anxiety',
  },
  {
    id: '2',
    title: 'Первая сессия у психолога: чего ожидать',
    channel: 'Metanoia AI',
    description: 'Развенчиваем мифы о психотерапии и объясняем, как проходит первая встреча со специалистом и как к ней подготовиться.',
    videoUrl: 'https://www.youtube.com/results?search_query=первая+сессия+психолог+что+ожидать',
    category: 'therapy',
  },
  {
    id: '3',
    title: 'Что такое КПТ: когнитивно-поведенческая терапия за 10 минут',
    channel: 'Наука о разуме',
    description: 'Простое и понятное объяснение КПТ: как мысли влияют на эмоции и поведение, и почему это один из самых исследованных методов терапии.',
    videoUrl: 'https://www.youtube.com/results?search_query=когнитивно+поведенческая+терапия+объяснение',
    category: 'cbt',
  },
  {
    id: '4',
    title: 'Как работает психотерапия: нейробиология изменений',
    channel: 'Психотерапия на практике',
    description: 'Что происходит в мозге во время терапии, почему для изменений нужно время и как разговор со специалистом меняет нейронные связи.',
    videoUrl: 'https://www.youtube.com/results?search_query=как+работает+психотерапия+нейробиология',
    category: 'therapy',
  },
  {
    id: '5',
    title: 'Психосоматика: когда тело говорит за эмоции',
    channel: 'Тело и разум',
    description: 'Связь между психологическим состоянием и физическими симптомами. Как стресс и подавленные эмоции проявляются в теле.',
    videoUrl: 'https://www.youtube.com/results?search_query=психосоматика+тело+эмоции',
    category: 'psychosomatics',
  },
]

const ARTICLES = [
  {
    id: '1',
    title: 'Что такое алекситимия и почему вам сложно называть свои чувства',
    category: 'Самопознание',
    readTime: '5 мин',
    excerpt: 'Около 10% людей в той или иной мере испытывают трудности с распознаванием и называнием своих эмоций. Это называется алекситимия — и это не патология, а особенность.',
  },
  {
    id: '2',
    title: 'Привязанность: четыре стиля и как они влияют на ваши отношения',
    category: 'Отношения',
    readTime: '7 мин',
    excerpt: 'Надёжная, тревожная, избегающая и дезорганизованная привязанность — паттерны которые формируются в детстве и определяют то, как мы строим близость во взрослой жизни.',
  },
  {
    id: '3',
    title: 'Окно толерантности: почему мы то взрываемся, то замираем',
    category: 'Нейропсихология',
    readTime: '6 мин',
    excerpt: 'Концепция Дэниела Сигела объясняет зону оптимального возбуждения нервной системы и почему в стрессе мы выходим в гипер- или гипоактивацию.',
  },
  {
    id: '4',
    title: 'Как подготовиться к первой сессии у психолога',
    category: 'Практика',
    readTime: '4 мин',
    excerpt: 'Что взять с собой, как сформулировать запрос и что делать если первый специалист не подошёл. Практическое руководство для тех, кто впервые идёт на терапию.',
  },
]

type Tab = 'books' | 'videos' | 'articles'

function BookCover({ title }: { title: string }) {
  const colors = ['bg-teal-100', 'bg-purple-100', 'bg-teal-100', 'bg-rose-100', 'bg-amber-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100']
  const idx = title.charCodeAt(0) % colors.length
  return (
    <div className={`${colors[idx]} rounded-xl w-full aspect-[2/3] flex items-end p-3`}>
      <span className="text-2xl">📖</span>
    </div>
  )
}

export default function MaterialsPage() {
  const [tab, setTab] = useState<Tab>('books')

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'books', label: 'Книги', count: BOOKS.length },
    { id: 'videos', label: 'Видео и подкасты', count: VIDEOS.length },
    { id: 'articles', label: 'Статьи', count: ARTICLES.length },
  ]

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="py-14 px-4 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">Материалы</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Библиотека знаний
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Книги, видео и статьи, которые помогут лучше понять себя и подготовиться к работе со специалистом.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-14 z-40 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    tab === t.id ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-10 px-4">
        <div className="max-w-5xl mx-auto">
          {/* BOOKS */}
          {tab === 'books' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {BOOKS.map((book) => (
                <div key={book.id} className="flex flex-col gap-3">
                  <BookCover title={book.title} />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{book.title}</p>
                    <p className="text-teal-600 text-xs">{book.author}</p>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 flex-1">
                      {book.description}
                    </p>
                    <a
                      href={book.affiliateUrl}
                      className="mt-1 inline-flex items-center justify-center px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-600 text-xs font-semibold rounded-xl transition"
                    >
                      Читать →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIDEOS */}
          {tab === 'videos' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {VIDEOS.map((video) => (
                <div
                  key={video.id}
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-teal-200 hover:shadow-sm transition flex flex-col"
                >
                  {/* Thumbnail placeholder */}
                  <div className="bg-slate-100 aspect-video flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      <span className="text-xs">Видео</span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{video.title}</p>
                    <p className="text-teal-600 text-xs">{video.channel}</p>
                    <p className="text-slate-400 text-xs leading-relaxed flex-1">{video.description}</p>
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-2 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-600 text-xs font-semibold rounded-xl transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      Смотреть
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ARTICLES */}
          {tab === 'articles' && (
            <div className="flex flex-col gap-4 max-w-2xl">
              {ARTICLES.map((article) => (
                <div
                  key={article.id}
                  className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-teal-200 hover:shadow-sm transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-teal-50 text-teal-600 font-semibold px-2 py-0.5 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-slate-300 text-xs">{article.readTime}</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mb-2 leading-snug">{article.title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{article.excerpt}</p>
                  <p className="text-teal-600 text-xs font-semibold mt-3">Читать статью →</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
