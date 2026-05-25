'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const ARTICLE_IMAGES: Record<string, string> = {
  'kak-podgotovitsya-k-psihologu':
    'https://images.unsplash.com/photo-1666362755385-1856fca1a330?w=600&h=300&fit=crop&q=80',
  '7-priznakov-chto-pora-k-psihologu':
    'https://images.unsplash.com/photo-1710322144652-bcea73280334?w=600&h=300&fit=crop&q=80',
  'chto-takoe-aleksitimiya':
    'https://images.unsplash.com/photo-1768036479363-0810baba6613?w=600&h=300&fit=crop&q=80',
  'kpt-prostymi-slovami':
    'https://images.unsplash.com/photo-1764990189201-8025ff64d981?w=600&h=300&fit=crop&q=80',
  'trevoga-ili-stress':
    'https://images.unsplash.com/photo-1727773458292-9da4284a4d3e?w=600&h=300&fit=crop&q=80',
  'pochemu-lyudi-otkladyvayut-psiholog':
    'https://images.unsplash.com/photo-1777877714035-57392b1c99c4?w=600&h=300&fit=crop&q=80',
}
const ARTICLE_IMAGES_FALLBACK = [
  'https://images.unsplash.com/photo-1633876841461-772d2b0b0e39?w=600&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1727773458292-9da4284a4d3e?w=600&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1764990189201-8025ff64d981?w=600&h=300&fit=crop&q=80',
]

const BOOKS = [
  {
    id: '1',
    title: 'Тело помнит всё',
    author: 'Бессел ван дер Колк',
    description: 'Основополагающая книга о психотравме: как она формирует тело и разум и как вернуть себе жизнь через движение, отношения и осознанность.',
    summary: 'Психиатр с 30-летним опытом объясняет почему травматический опыт буквально записывается в теле. Тревога, хроническое напряжение, необъяснимые боли — часто это следы прошлого которые разум забыл а тело помнит. Книга показывает путь от выживания к исцелению через понимание связи тела и психики.',
    insights: '1. Тело хранит травму даже когда разум её "забыл" — телесные симптомы это язык непрожитого опыта. 2. Традиционная терапия разговорами работает не для всех — иногда нужно работать через тело. 3. Исцеление возможно в любом возрасте — мозг остаётся пластичным всю жизнь.',
    for_whom: 'Тем кто переживал травму, хроническое напряжение или необъяснимые телесные симптомы',
    cover_url: 'https://cdn.litres.ru/pub/c/cover_415/51388931.webp',
    affiliateUrl: 'https://uuwgc.com/g/98opilri1id05b13986f8dc560e4ad/?erid=2bL9aMPo2e49hMef4phyQCpjJF&ulp=https%3A%2F%2Fwww.litres.ru%2Fbook%2Fbessel-van-der-kolk%2Ftelo-pomnit-vse-kakuu-rol-psihologicheskaya-travma-ig-51388931%2F',
    category: 'trauma',
  },
  {
    id: '2',
    title: 'Эмоциональный интеллект',
    author: 'Дэниэл Гоулман',
    description: 'Классический труд о том почему IQ — не главное. Гоулман показывает как самосознание, саморегуляция, мотивация, эмпатия и социальные навыки определяют успех в жизни и отношениях.',
    summary: 'Дэниэл Гоулман ввёл понятие эмоционального интеллекта в массовую культуру. Книга объясняет почему люди с высоким IQ нередко проигрывают тем у кого высокий EQ. Умение понимать свои и чужие эмоции, управлять импульсами и строить отношения — навыки которые можно развить в любом возрасте.',
    insights: '1. Эмоциональный интеллект не врождён — это набор навыков которые можно тренировать как мышцу. 2. Осознанность своих эмоций это фундамент: нельзя управлять тем чего не замечаешь. 3. Эмпатия это не слабость а ключевой навык для глубоких отношений и эффективного общения.',
    for_whom: 'Тем кто хочет лучше понимать свои реакции и строить более близкие отношения',
    cover_url: 'https://cdn.litres.ru/pub/c/cover_415/5024477.webp',
    affiliateUrl: 'https://uuwgc.com/g/98opilri1id05b13986f8dc560e4ad/?erid=2bL9aMPo2e49hMef4phyQCpjJF&ulp=https%3A%2F%2Fwww.litres.ru%2Fbook%2Fdeniel-goulman%2Femocionalnyy-intellekt-pochemu-on-mozhet-znachit-bolshe-che-5024477%2F',
    category: 'neuroscience',
  },
  {
    id: '3',
    title: 'Осознанность. Как обрести гармонию в нашем безумном мире',
    author: 'Марк Уильямс, Дэнни Пенман',
    description: 'Научно обоснованная восьминедельная программа снижения стресса на основе MBCT. Клинически проверенный метод выхода из круга тревоги и хронической усталости.',
    summary: 'Профессор Оксфорда Марк Уильямс и доктор Дэнни Пенман создали доступную программу осознанности на основе когнитивной терапии. Это не духовная практика — это клинически проверенный метод снижения тревоги и предотвращения рецидивов депрессии. Книга включает восемь недельных программ с медитациями.',
    insights: '1. Осознанность — это не отключение мыслей а умение их замечать не вовлекаясь. 2. Блуждающий ум источник большинства тревог: 47% времени мы думаем не о том что делаем. 3. Регулярная практика буквально меняет структуру мозга — уменьшает миндалину и укрепляет префронтальную кору.',
    for_whom: 'Тем кто страдает от хронической тревоги, стресса или повторяющейся депрессии',
    cover_url: 'https://cdn.litres.ru/pub/c/cover_415/7265037.webp',
    affiliateUrl: 'https://uuwgc.com/g/98opilri1id05b13986f8dc560e4ad/?erid=2bL9aMPo2e49hMef4phyQCpjJF&ulp=https%3A%2F%2Fwww.litres.ru%2Fbook%2Fmark-uilyams%2Fosoznannost-kak-obresti-garmoniu-v-nashem-bezumnom-mire-7265037%2F',
    category: 'neuroscience',
  },
  {
    id: '4',
    title: 'Когнитивная терапия, ориентированная на восстановление',
    author: 'Аарон Т. Бек',
    description: 'Обновлённый подход к КПТ от основателя метода. Как помочь людям строить полноценную жизнь через работу с ценностями, целями и личными устремлениями.',
    summary: 'Аарон Т. Бек в поздних работах расширил КПТ за рамки симптомов. Терапия, ориентированная на восстановление, фокусируется не на устранении болезни а на том чтобы помочь человеку жить той жизнью которую он хочет. Подход интегрирует ценности, смыслы и личные цели пациента.',
    insights: '1. Выздоровление — это не просто отсутствие симптомов а возможность жить полноценной жизнью. 2. Ценности и цели пациента — центр терапевтического процесса, не диагноз. 3. КПТ работает даже при тяжёлых хронических расстройствах если фокус сместить на восстановление а не на симптомы.',
    for_whom: 'Тем кто хочет глубже понять когнитивную терапию и её применение в работе с серьёзными состояниями',
    cover_url: 'https://cdn.litres.ru/pub/c/cover_415/70875497.webp',
    affiliateUrl: 'https://uuwgc.com/g/98opilri1id05b13986f8dc560e4ad/?erid=2bL9aMPo2e49hMef4phyQCpjJF&ulp=https%3A%2F%2Fwww.litres.ru%2Fbook%2Faaron-brinen%2Fkognitivnaya-terapiya-orientirovannaya-na-vosstanovlenie-70875497%2F',
    category: 'cbt',
  },
  {
    id: '5',
    title: 'Ловушка счастья. Перестаем переживать — начинаем жить',
    author: 'Расс Харрис',
    description: 'Практическое введение в терапию принятия и ответственности (ACT). Почему погоня за счастьем делает нас несчастными и как жить полноценно принимая неприятные мысли.',
    summary: 'Клинический психолог Расс Харрис объясняет парадокс: чем сильнее мы стремимся к счастью и избегаем болезненных переживаний, тем больше страдаем. На основе ACT книга предлагает конкретные инструменты — разделение с мыслями, принятие чувств, действия в соответствии с ценностями.',
    insights: '1. Нормальный человеческий разум склонен к тревоге и негативу — это эволюционная защита, не патология. 2. Борьба с неприятными мыслями усиливает их — принятие освобождает. 3. Счастье побочный эффект жизни по ценностям, а не цель к которой нужно стремиться напрямую.',
    for_whom: 'Тем кто устал воевать с тревогой и хочет практические инструменты для психологической гибкости',
    cover_url: 'https://cdn.litres.ru/pub/c/cover_415/7204942.webp',
    affiliateUrl: 'https://uuwgc.com/g/98opilri1id05b13986f8dc560e4ad/?erid=2bL9aMPo2e49hMef4phyQCpjJF&ulp=https%3A%2F%2Fwww.litres.ru%2Fbook%2Fherris-rass%2Flovushka-schastya-perestaem-perezhivat-nachinaem-zhit-7204942%2F',
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
    cover_url: 'https://cdn.litres.ru/pub/c/cover_415/9523534.webp',
    affiliateUrl: 'https://uuwgc.com/g/98opilri1id05b13986f8dc560e4ad/?erid=2bL9aMPo2e49hMef4phyQCpjJF&ulp=https%3A%2F%2Fwww.litres.ru%2Fbook%2Fberri-k-uaynhold%2Fbegstvo-ot-blizosti-izbavlenie-vashih-otnosheniy-ot-kontr-9523534%2F',
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
    cover_url: 'https://cdn.litres.ru/pub/c/cover_415/31256662.webp',
    affiliateUrl: 'https://uuwgc.com/g/98opilri1id05b13986f8dc560e4ad/?erid=2bL9aMPo2e49hMef4phyQCpjJF&ulp=https%3A%2F%2Fwww.litres.ru%2Fbook%2Fdonna-nakazava%2Foskolki-detskih-travm-pochemu-my-boleem-i-kak-eto-ostanovit-31256662%2F',
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
    cover_url: 'https://cdn.litres.ru/pub/c/cover_415/69036151.webp',
    affiliateUrl: 'https://uuwgc.com/g/98opilri1id05b13986f8dc560e4ad/?erid=2bL9aMPo2e49hMef4phyQCpjJF&ulp=https%3A%2F%2Fwww.litres.ru%2Fbook%2Fwhitney-goodman%2Ftoksichnyy-pozitiv-kak-perestat-podavlyat-negativnye-emoci-69036151%2F',
    category: 'self',
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

type Video = {
  id: string
  title: string
  channel: string
  description: string | null
  youtube_id: string
  category: string
  duration: string | null
}

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  category: string
  reading_time: number
}

function BookCover({ title, coverUrl }: { title: string; coverUrl?: string | null }) {
  if (coverUrl) {
    return (
      <div className="w-full aspect-[2/3] rounded-xl overflow-hidden">
        <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div className="w-full aspect-[2/3] bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
      <span className="text-white text-4xl font-bold">{title[0]}</span>
    </div>
  )
}

export default function MaterialsClient() {
  const [tab, setTab] = useState<Tab>('books')
  const [selected, setSelected] = useState<Book | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [dbArticles, setDbArticles] = useState<Article[]>([])
  const [dbVideos, setDbVideos] = useState<Video[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, content, category, reading_time')
      .eq('published', true)
      .order('created_at')
      .then(({ data }) => { if (data) setDbArticles(data) })
    supabase
      .from('videos')
      .select('*')
      .order('created_at')
      .then(({ data }) => { if (data) setDbVideos(data) })
  }, [])

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'books', label: 'Книги', count: BOOKS.length },
    { id: 'videos', label: 'Видео', count: dbVideos.length },
    { id: 'articles', label: 'Статьи', count: dbArticles.length || ARTICLES.length },
  ]

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="py-14 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Материалы</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Библиотека самопознания
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Книги, видео и статьи — чтобы лучше понять себя.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-14 z-40 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    tab === t.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
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
                    <p className="text-blue-600 text-xs">{book.author}</p>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 flex-1">
                      {book.description}
                    </p>
                    <button
                      onClick={() => setSelected(book)}
                      className="mt-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-xl transition"
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
              {dbVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 cursor-pointer hover:shadow-md transition"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="relative aspect-video bg-slate-900">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-blue-600 font-medium mb-1">{video.channel}</p>
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-1">{video.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{video.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ARTICLES */}
          {tab === 'articles' && (
            <div className="flex flex-col gap-5 max-w-2xl">
              {(dbArticles.length > 0 ? dbArticles : ARTICLES).map((article, idx) => {
                const slug = 'slug' in article ? (article as Article).slug : ''
                const imgUrl = ARTICLE_IMAGES[slug] ?? ARTICLE_IMAGES_FALLBACK[idx % ARTICLE_IMAGES_FALLBACK.length]
                return (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle({
                      id: article.id,
                      title: article.title,
                      slug,
                      excerpt: article.excerpt ?? null,
                      content: 'content' in article ? (article as Article).content : null,
                      category: article.category,
                      reading_time: 'reading_time' in article
                        ? (article as Article).reading_time
                        : parseInt(String((article as typeof ARTICLES[0]).readTime)),
                    })}
                    className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition text-left w-full"
                  >
                    {/* Image */}
                    <div className="w-full h-48 overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {/* Text */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                          {article.category}
                        </span>
                        <span className="text-slate-300 text-xs">
                          {'reading_time' in article ? `${article.reading_time} мин` : (article as typeof ARTICLES[0]).readTime}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-base mb-1.5 leading-snug">{article.title}</p>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{article.excerpt}</p>
                      <span className="text-blue-600 text-xs font-semibold mt-3 inline-block">Читать →</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Article Bottom Sheet */}
      {selectedArticle && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setSelectedArticle(null)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[92vh] flex flex-col animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <span className="text-sm text-slate-400">{selectedArticle.reading_time} мин чтения</span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition text-slate-500 text-lg leading-none"
              >×</button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 pb-12">
              <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
                {selectedArticle.title}
              </h1>
              <p className="text-[15px] text-slate-500 mb-6 leading-relaxed">
                {selectedArticle.excerpt}
              </p>

              {selectedArticle.content ? (
                <div>
                  {selectedArticle.content.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={i} className="text-xl font-bold text-slate-900 mt-7 mb-3">
                          {line.replace('## ', '')}
                        </h2>
                      )
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <p key={i} className="font-semibold text-slate-800 mt-4 mb-1">
                          {line.replace(/\*\*/g, '')}
                        </p>
                      )
                    }
                    if (line.trim() === '') return null
                    return (
                      <p key={i} className="text-[17px] text-slate-700 leading-relaxed mb-3">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[17px] text-slate-700 leading-relaxed">{selectedArticle.excerpt}</p>
              )}

              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-sm text-slate-500 mb-4">
                  Хочешь разобраться в своём состоянии перед встречей со специалистом?
                </p>
                <a
                  href="/checkin"
                  className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-center py-3 rounded-xl font-medium transition"
                >
                  Пройти чек-ин за 10 минут →
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CTA */}
      <section className="py-14 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 60%, #06b6d4 100%)' }}>
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Готов сделать первый шаг?</h2>
          <p className="text-white/80 text-sm mb-6">3 AI-анализа бесплатно — без карты.</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-white rounded-2xl font-semibold text-sm hover:opacity-90 transition shadow-md"
            style={{ color: '#2563eb' }}
          >
            Попробовать бесплатно →
          </a>
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
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition text-xl leading-none"
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="flex gap-4 mb-5">
              <div className="w-24 flex-shrink-0">
                <BookCover title={selected.title} coverUrl={selected.cover_url} />
              </div>
              <div className="flex flex-col justify-center gap-1">
                <p className="font-bold text-slate-900 text-base leading-snug">{selected.title}</p>
                <p className="text-blue-600 text-sm">{selected.author}</p>
                <p className="text-slate-400 text-xs mt-1">{selected.for_whom}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">О чём книга</p>
              <p className="text-slate-700 text-sm leading-relaxed">{selected.summary}</p>
            </div>

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

            <a
              href={selected.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Купить книгу →
            </a>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <div>
                <p className="text-xs text-blue-600 font-medium">{selectedVideo.channel}</p>
                <h3 className="font-semibold text-slate-900">{selectedVideo.title}</h3>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl w-8 h-8 flex items-center justify-center flex-shrink-0"
              >×</button>
            </div>
            <div className="aspect-video bg-slate-900">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtube_id}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 leading-relaxed">{selectedVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
