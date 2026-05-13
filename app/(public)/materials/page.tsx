'use client'

import { useState } from 'react'

const BOOKS = [
  {
    id: '1',
    title: 'Тело помнит всё',
    author: 'Бессел ван дер Колк',
    description: 'Основополагающая книга о психотравме: как она формирует тело и разум и как вернуть себе жизнь через движение, отношения и осознанность.',
    summary: 'Психиатр с 30-летним опытом объясняет почему травматический опыт буквально записывается в теле. Тревога, хроническое напряжение, необъяснимые боли — часто это следы прошлого которые разум забыл а тело помнит. Книга показывает путь от выживания к исцелению через понимание связи тела и психики.',
    insights: '1. Тело хранит травму даже когда разум её "забыл" — телесные симптомы это язык непрожитого опыта. 2. Традиционная терапия разговорами работает не для всех — иногда нужно работать через тело. 3. Исцеление возможно в любом возрасте — мозг остаётся пластичным всю жизнь.',
    for_whom: 'Тем кто переживал травму, хроническое напряжение или необъяснимые телесные симптомы',
    cover_url: null,
    affiliateUrl: '#',
    category: 'trauma',
  },
  {
    id: '2',
    title: 'Почему я чувствую то, что ты чувствуешь',
    author: 'Йоахим Бауэр',
    description: 'Нейробиология эмпатии и зеркальных нейронов. Почему мы резонируем с другими людьми и как это влияет на наши отношения.',
    summary: 'Нейробиолог объясняет как работает эмпатия на уровне мозга. Зеркальные нейроны буквально позволяют нам чувствовать то что чувствуют другие. Книга объясняет почему одни люди эмоционально истощаются в отношениях а другие нет — и как найти баланс между чуткостью и защитой себя.',
    insights: '1. Эмпатия это не мягкость характера а нейробиологический механизм — его можно понять и регулировать. 2. Эмоциональное истощение в отношениях часто связано с гиперактивными зеркальными нейронами. 3. Границы это не эгоизм а необходимое условие здоровой эмпатии.',
    for_whom: 'Тем кто чувствует чужую боль острее своей и эмоционально истощается от общения',
    cover_url: null,
    affiliateUrl: '#',
    category: 'neuroscience',
  },
  {
    id: '3',
    title: 'Разум и мозг',
    author: 'Дэниэл Сигел',
    description: 'Как работает интеграция мозга, откуда берётся осознанность и как нейронаука объясняет связь между телом, умом и отношениями.',
    summary: 'Нейропсихиатр Дэниел Сигел — создатель концепции "окна толерантности" — объясняет как устроен мозг простым языком. Почему мы теряем контроль над эмоциями, как формируются паттерны поведения и как осознанность буквально меняет структуру мозга.',
    insights: '1. Окно толерантности — есть зона оптимального возбуждения где мы функционируем лучше всего. Выход за её пределы — тревога или апатия. 2. Отношения в детстве формируют нейронные связи которые определяют как мы реагируем на стресс во взрослом возрасте. 3. Осознанность это не просто практика — это тренировка префронтальной коры.',
    for_whom: 'Всем кто хочет понять как работает психика и почему мы реагируем так а не иначе',
    cover_url: null,
    affiliateUrl: '#',
    category: 'neuroscience',
  },
  {
    id: '4',
    title: 'Когнитивная терапия депрессии',
    author: 'Аарон Бек',
    description: 'Классический труд основателя КПТ. Как негативные автоматические мысли поддерживают депрессию и как работает когнитивная реструктуризация.',
    summary: 'Аарон Бек — основатель когнитивно-поведенческой терапии — показывает как негативные автоматические мысли создают и поддерживают депрессию. Книга не просто теория — это практическое руководство с техниками которые используют психологи по всему миру.',
    insights: '1. Депрессия это не слабость характера а искажённые паттерны мышления которые можно изменить. 2. Автоматические мысли возникают мгновенно и кажутся абсолютной правдой — но их можно научиться замечать и оспаривать. 3. КПТ работает не хуже антидепрессантов при лёгкой и умеренной депрессии.',
    for_whom: 'Тем кто переживает депрессию или тревогу и хочет понять механизм своего состояния',
    cover_url: null,
    affiliateUrl: '#',
    category: 'cbt',
  },
  {
    id: '5',
    title: 'Принятие и ответственность',
    author: 'Стивен Хайес',
    description: 'Терапия принятия и ответственности (ACT): как научиться жить с болезненными мыслями и чувствами, не позволяя им управлять жизнью.',
    summary: 'Стивен Хайес создал терапию принятия и ответственности (ACT) после собственного панического расстройства. Главная идея: борьба с неприятными мыслями и чувствами только усиливает их. Принятие — не смирение, а освобождение сил для того что действительно важно.',
    insights: '1. Попытки избавиться от тревоги часто её усиливают — принятие работает лучше борьбы. 2. Психологическая гибкость важнее позитивного мышления — можно чувствовать тревогу и всё равно действовать. 3. Ценности важнее целей — когда знаешь что важно, боль перестаёт управлять жизнью.',
    for_whom: 'Тем кто устал бороться со своими мыслями и хочет жить несмотря на внутренний дискомфорт',
    cover_url: null,
    affiliateUrl: '#',
    category: 'act',
  },
  {
    id: '6',
    title: 'Бегство от близости',
    author: 'Берри Уайнхолд',
    description: 'Избегающая привязанность, страх близости и созависимость. Как паттерны раннего детства влияют на взрослые отношения.',
    summary: 'Книга о созависимости и контрзависимости — двух сторонах одной проблемы с близостью. Одни люди растворяются в отношениях теряя себя, другие избегают близости боясь поглощения. Авторы показывают корни этих паттернов и путь к зрелым отношениям.',
    insights: '1. Страх близости и страх одиночества — две стороны одной травмы привязанности. 2. Контрзависимость (избегание близости) часто выглядит как сила и независимость — но это та же рана что и созависимость. 3. Здоровые отношения начинаются с отношений с собой.',
    for_whom: 'Тем кто замечает повторяющиеся паттерны в отношениях и хочет понять их корни',
    cover_url: null,
    affiliateUrl: '#',
    category: 'relationships',
  },
  {
    id: '7',
    title: 'Осколки детских травм',
    author: 'Донна Джексон Наказава',
    description: 'Как неблагоприятный детский опыт влияет на здоровье и психику во взрослой жизни. Путь к исцелению через понимание ACE-исследований.',
    summary: 'Журналист и пациент в одном лице — Донна Наказава исследует науку о том как неблагоприятный детский опыт (ACE) буквально меняет биологию человека. Хронические болезни, тревожность, депрессия — часто имеют корни в детстве. Но книга не о жертвах — о том как исцелиться.',
    insights: '1. Неблагоприятный детский опыт статистически увеличивает риск физических болезней во взрослом возрасте — тело и психика неразделимы. 2. Нейропластичность мозга означает что исцеление возможно в любом возрасте. 3. Осознание связи между прошлым и настоящим — первый шаг к изменениям.',
    for_whom: 'Тем кто подозревает что детский опыт влияет на их здоровье и самочувствие сегодня',
    cover_url: null,
    affiliateUrl: '#',
    category: 'trauma',
  },
  {
    id: '8',
    title: 'Токсичный позитив',
    author: 'Уитни Гудман',
    description: 'Почему постоянные призывы «будь позитивным» вредят, как признать болезненные чувства нормальными и перестать себя за них стыдить.',
    summary: 'Психотерапевт Уитни Гудман объясняет как культура позитивного мышления мешает нам реально справляться с трудностями. "Всё будет хорошо", "думай о хорошем", "у других хуже" — эти фразы обесценивают реальный опыт и мешают исцелению.',
    insights: '1. Токсичный позитив это отрицание реальных чувств под видом оптимизма — он изолирует и обесценивает. 2. Валидация чувств ("это действительно тяжело") исцеляет лучше чем позитивные установки. 3. Можно принимать трудную реальность и при этом двигаться вперёд — это не пессимизм а честность.',
    for_whom: 'Тем кто устал притворяться что всё хорошо и хочет разрешить себе чувствовать',
    cover_url: null,
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
type Book = typeof BOOKS[0]

function BookCover({ title, coverUrl }: { title: string; coverUrl?: string | null }) {
  if (coverUrl) {
    return (
      <div className="w-full aspect-[2/3] rounded-xl overflow-hidden">
        <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
      </div>
    )
  }
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
  const [selected, setSelected] = useState<Book | null>(null)

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
                  <BookCover title={book.title} coverUrl={book.cover_url} />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{book.title}</p>
                    <p className="text-teal-600 text-xs">{book.author}</p>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 flex-1">
                      {book.description}
                    </p>
                    <button
                      onClick={() => setSelected(book)}
                      className="mt-1 inline-flex items-center justify-center px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-600 text-xs font-semibold rounded-xl transition"
                    >
                      Читать →
                    </button>
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

      {/* Book Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-w-lg w-full bg-white rounded-2xl p-6 overflow-y-auto max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition text-xl leading-none"
              aria-label="Закрыть"
            >
              ×
            </button>

            {/* Cover + title + author */}
            <div className="flex gap-4 mb-5">
              <div className="w-24 flex-shrink-0">
                <BookCover title={selected.title} coverUrl={selected.cover_url} />
              </div>
              <div className="flex flex-col justify-center gap-1">
                <p className="font-bold text-slate-900 text-base leading-snug">{selected.title}</p>
                <p className="text-teal-600 text-sm">{selected.author}</p>
                <p className="text-slate-400 text-xs mt-1">{selected.for_whom}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">О чём книга</p>
              <p className="text-slate-700 text-sm leading-relaxed">{selected.summary}</p>
            </div>

            {/* Insights */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Главные идеи</p>
              <ul className="flex flex-col gap-2">
                {selected.insights.split(/(?=\d+\.)/).filter(Boolean).map((insight, i) => (
                  <li key={i} className="text-slate-700 text-sm leading-relaxed">
                    {insight.trim()}
                  </li>
                ))}
              </ul>
            </div>

            {/* Buy button */}
            <a
              href={selected.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Купить книгу →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
