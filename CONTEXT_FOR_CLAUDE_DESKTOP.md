# Pulse / Metanoia AI — Полный контекст проекта

Используй этот документ как основу при планировании задач.
Когда пользователь описывает задачу — сначала найди нужные файлы здесь,
предложи точный план с путями файлов и строками, и только потом передавай в Claude Code.

---

## Продукт

**Metanoia AI** (кодовое имя проекта: Pulse) — AI-ассистент подготовки к приёму у психолога.

Позиционирование: *"Подготовься к приёму у психолога за 10 минут"*

Пользователь проходит глубокий AI-опрос (4 блока), получает структурированный анализ в стиле психолога и PDF-документ для первой сессии. Есть портал для специалистов-психологов.

**Продакшн:** https://pulse-health-smoky.vercel.app  
**GitHub:** github.com/romangritsenko25-lab/pulse-health

---

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 16 App Router, TypeScript, Tailwind CSS |
| Auth + DB | Supabase (PostgreSQL + RLS + OAuth) |
| AI | Anthropic Claude API (Sonnet 4.6 — анализ, Haiku 4.5 — чат) |
| Хостинг | Vercel (автодеплой при push в main) |
| Email | Resend |
| PDF | jsPDF + html2canvas (браузерный, без API) |
| Графики | Recharts |
| Платёжка | Paddle (Stripe недоступен из КЗ) |
| Голос | Web Speech Recognition API (встроен в браузер, ru-RU) |
| Storage | Supabase Storage (bucket: `specialist-photos`, public) |

---

## База данных Supabase

**Project ID:** xqmgpcggysnkjyuecxcf  
**Region:** eu-west-1

### Таблицы

```sql
profiles (
  id uuid PRIMARY KEY,         -- = auth.users.id
  email text,
  name text,
  role text,                   -- 'user' | 'specialist' | null
  reminder_time time,
  health_focus text,
  photo_url text,
  specialty text,
  bio text,
  referral_code text UNIQUE,
  referred_by uuid,
  checkin_count int DEFAULT 0
)

checkins (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  wellbeing int,               -- 1-10
  sleep int,
  energy int,
  mood text,
  notes text,
  ai_insight jsonb,            -- {reflection, patterns, hypothesis, forSpecialist[], support}
  deep_data jsonb,             -- весь DeepFormData
  created_at timestamptz
)

subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  status text,                 -- 'active' | 'cancelled' | 'expired'
  plan text,                   -- 'pro' | 'specialist'
  current_period_end timestamptz
)

specialists (
  id uuid PRIMARY KEY,         -- = auth.users.id
  name text NOT NULL,
  specialty text NOT NULL,
  photo_url text,              -- URL в Supabase Storage (bucket: specialist-photos)
  bio text,                    -- описание деятельности (добавлено 13.05.2026)
  referral_code text UNIQUE,
  created_at timestamptz
)

specialist_clients (
  specialist_id uuid,
  client_id uuid,
  created_at timestamptz,
  PRIMARY KEY (specialist_id, client_id)
)

specialist_earnings (
  id uuid PRIMARY KEY,
  specialist_id uuid,
  user_id uuid,
  amount_kzt numeric(10,2),
  status text,                 -- 'pending' | 'confirmed' | 'paid'
  created_at timestamptz
)

journal_entries (
  id uuid PRIMARY KEY,
  user_id uuid,
  content text,
  mood text,
  voice_input bool,
  created_at timestamptz
)

referrals (
  id uuid PRIMARY KEY,
  specialist_id uuid,
  user_id uuid,
  code text,
  status text,                 -- 'registered' | 'converted'
  created_at timestamptz
)
```

**Тестовый Pro-пользователь:**
- user_id: `b1cca88e-1683-4410-b80c-09752805e8a1`
- email: `romangritsenko25@gmail.com`
- plan: `pro`, status: `active`

**Supabase Storage bucket:** `specialist-photos` (public)
- RLS: public read, authenticated upload
- Политики применены через SQL (13.05.2026)

---

## Дизайн-система

### Цветовая палитра (все хардкодятся через style={{}}, не через Tailwind)

| Имя | Hex | Где используется |
|-----|-----|-----------------|
| Teal (основной акцент) | `#0d9488` | кнопки CTA, иконки-метки, бордеры активных элементов |
| Teal light (фон иконок) | `#f0fdfa` | контейнеры иконок в карточках |
| Dark navy (заголовки) | `#1e3a5f` | все h1/h2, заголовки карточек |
| Slate body | `#64748b` | основной текст параграфов |
| Slate muted | `#94a3b8` | подписи, мелкий текст, плейсхолдеры |
| Off-white (фон 1) | `#faf9f7` | секции с тёплым белым фоном |
| Light gray (фон 2) | `#f8fafc` | карточки, альтернативные секции |
| Border | `#e2e8f0` | границы карточек |
| Input border | `#ede9e4` | инпуты форм |
| Gradient (портал специалиста) | `from-teal-600 to-blue-900` | хедер регистрации специалиста, ReferralBanner |

### Компонент-библиотека (переиспользуй эти паттерны)

**Карточка ценности** (ValueCard, login/page.tsx):
```tsx
<div style={{ background: '#f8fafc', borderColor: '#e2e8f0' }} className="border rounded-2xl p-5 flex flex-col gap-2">
  <div style={{ background: '#f0fdfa', borderRadius: '10px', padding: '8px', display: 'inline-flex', width: 'fit-content' }}>
    <span className="text-2xl">{emoji}</span>
  </div>
  <p style={{ color: '#1e3a5f' }} className="font-semibold text-sm">{title}</p>
  <p style={{ color: '#64748b' }} className="text-sm leading-relaxed">{body}</p>
</div>
```

**Chip (выбор варианта)** (login/page.tsx):
```tsx
<button style={selected ? { background: '#0d9488', borderColor: '#0d9488', color: 'white' } : {}}
  className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ...">
```

**Кнопка CTA primary:**
```tsx
<button style={{ background: '#0d9488' }} className="hover:opacity-90 text-white font-semibold py-3.5 rounded-2xl transition text-sm">
```

**Инпут:**
```tsx
<input style={{ background: '#ffffff', border: '1px solid #ede9e4', color: '#1a2535' }}
  className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
  onFocus={e => e.currentTarget.style.borderColor = '#0d9488'}
  onBlur={e => e.currentTarget.style.borderColor = '#ede9e4'} />
```

**Анимации** (определены в login/page.tsx через `<style>`):
- `fade-up` — появление снизу 0.6s
- `fade-up-d1/d2/d3` — с задержкой 0.15/0.30/0.45s
- `pulse-ring` — пульсирующие кольца на hero

---

## Структура файлов

```
pulse/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          ← ЛЕНДИНГ (главная страница)
│   │   └── layout.tsx
│   ├── (app)/                      ← авторизованная зона
│   │   ├── cabinet/
│   │   │   ├── page.tsx            ← сервер-компонент (SSR)
│   │   │   └── CabinetClient.tsx   ← весь UI кабинета (6 вкладок)
│   │   ├── checkin/page.tsx        ← глубокий опрос (4 блока)
│   │   ├── result/page.tsx         ← результат + AI-чат
│   │   ├── upgrade/page.tsx        ← платёжная страница (Paddle)
│   │   ├── specialist/
│   │   │   ├── dashboard/page.tsx  ← дашборд специалиста (бургер-меню)
│   │   │   └── register/page.tsx   ← регистрация специалиста (фото + bio + градиент)
│   │   ├── dashboard/page.tsx      ← (устаревший, используй cabinet)
│   │   └── journal/page.tsx
│   ├── (public)/                   ← без авторизации
│   │   ├── specialists/page.tsx    ← каталог специалистов (реальные данные + ранги)
│   │   ├── for-specialists/page.tsx
│   │   ├── materials/page.tsx
│   │   ├── about/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── analyze/route.ts
│   │   ├── chat/route.ts
│   │   ├── pdf-data/route.ts
│   │   ├── pdf-topics/route.ts
│   │   ├── personal-ai/route.ts
│   │   ├── analyze-journal/route.ts
│   │   ├── activity/route.ts
│   │   ├── trend/route.ts
│   │   ├── conversations/route.ts
│   │   ├── specialists/route.ts    ← GET: реальные + демо специалисты с рангами (service role)
│   │   ├── specialist/register/route.ts  ← POST: создаёт профиль + bio
│   │   ├── webhooks/lemonsqueezy/route.ts
│   │   └── cron/
│   │       ├── daily-nudge/route.ts
│   │       ├── weekly-report/route.ts
│   │       └── winback/route.ts
│   ├── auth/callback/route.ts
│   ├── join/[code]/page.tsx        ← реферальная ссылка специалиста
│   ├── onboarding/page.tsx
│   ├── terms/page.tsx
│   ├── privacy/page.tsx
│   ├── refund/page.tsx
│   ├── page.tsx
│   └── layout.tsx
├── components/
│   ├── Logo.tsx
│   ├── NavBar.tsx                  ← роль-зависимая навигация (specialist → "В кабинет")
│   ├── PersonalAI.tsx
│   ├── CalendarTab.tsx
│   ├── HeroDrop.tsx
│   ├── LoginModal.tsx
│   └── specialist/
│       ├── ReferralBanner.tsx      ← градиентный баннер "зарабатывай"
│       └── EarningsTab.tsx         ← доходы с переключателем KZT/RUB/USD
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── anthropic.ts
│   └── referral-earnings.ts
├── supabase/migrations/
│   └── 20260514000000_specialist_bio_storage.sql  ← bio + storage bucket (применена)
└── CLAUDE.md
```

---

## Ключевые страницы — что делает каждая

### `/login` (app/(auth)/login/page.tsx) — Лендинг
5 секций: Hero → Мини-опрос → Карточки ценности → Психология → Форма входа (Google + email)

### `/checkin` — Глубокий опрос (4 блока)
- Тело / Эмоции / Контекст / Свободный рассказ
- Crisis gate: selfHarm=true → телефоны доверия, анализ не запускать

### `/result` — Результат + AI-чат
- 5 секций: отражение / паттерны / гипотеза / темы для специалиста / поддержка
- AI-чат (3 сообщения бесплатно), PDF

### `/cabinet` — Кабинет пользователя (6 вкладок)
Сегодня / Журнал / Динамика / AI-ассистент / PDF / Календарь

### `/specialist/register` — Регистрация специалиста
- **Хедер:** градиент `from-teal-600 to-blue-900`
- **Фото:** переключатель «С устройства / По ссылке», загрузка в bucket `specialist-photos`
- **Поле bio:** textarea с описанием деятельности
- **Специальности:** Психолог / Психотерапевт / Психиатр / Клинический психолог / Нейропсихолог / Арт-терапевт / Семейный психолог / КПТ-терапевт / Другое

### `/specialist/dashboard` — Дашборд специалиста
- **Хедер:** название + бургер-меню `≡` справа (дропдаун: Мой дашборд / Редактировать / Лендинг)
- **Порядок в табе "Клиенты":** Счётчики (клиенты + опросы) → Реферальная ссылка → Пригласить коллегу
- **Таб "Доходы":** переключатель KZT / RUB / USD (курсы: RUB=0.19, USD=0.002), мин. вывод $30

### `/specialists` — Каталог специалистов (PUBLIC)
- Данные из `/api/specialists` — реальные DB + 11 демо
- **Топ-5** по `client_count` убывающей
- **Все специалисты** с фильтром по специальности
- **Система рангов** (по числу клиентов):
  - 🌱 Новичок (0)
  - ⭐ Практик (1–4)
  - 🏅 Эксперт (5–14)
  - 💎 Наставник (15–29)
  - 🏆 Мастер (30+)
- Каждая карточка: фото/инициалы, ранг-бейдж, прогресс-бар до следующего ранга, кол-во клиентов

---

## API Routes

| Route | Метод | Что делает |
|-------|-------|-----------|
| `/api/analyze` | POST | Claude Sonnet 4.6 → {reflection, patterns, hypothesis, forSpecialist[], support} |
| `/api/chat` | POST | Claude Haiku 4.5, лимит 3 для Free |
| `/api/pdf-data` | GET | Данные для PDF |
| `/api/personal-ai` | POST | AI-ассистент в кабинете |
| `/api/analyze-journal` | POST | AI-анализ журнала |
| `/api/activity` | GET | Активность |
| `/api/trend` | GET | Тренд |
| `/api/specialists` | GET | Список специалистов: real DB + DEMO_SPECIALISTS, sorted by client_count. Использует service role (bypass RLS) |
| `/api/specialist/register` | POST | Создаёт/обновляет профиль специалиста + сохраняет bio |
| `/api/webhooks/lemonsqueezy` | POST | Webhook оплаты |
| `/api/cron/*` | GET | Email-cron (Vercel) |

---

## Демо-специалисты (DEMO_SPECIALISTS в api/specialists/route.ts)

11 вымышленных специалистов, захардкожены в API route. Не в БД.

| Имя | Специальность | Ранг | client_count |
|-----|--------------|------|-------------|
| Александр Попов | Психолог | 🏆 Мастер | 51 |
| Максим Иванов | Арт-терапевт | 🏆 Мастер | 42 |
| Айгерим Бекова | Психолог | 🏆 Мастер | 35 |
| Дмитрий Волков | Психотерапевт | 💎 Наставник | 22 |
| Ольга Мельник | Семейный психолог | 💎 Наставник | 19 |
| Виктор Скляров | КПТ-терапевт | 🏅 Эксперт | 11 |
| Наталья Соколова | Психиатр | 🏅 Эксперт | 8 |
| Азамат Джумабеков | Клинический психолог | ⭐ Практик | 3 |
| Зарина Алиева | Другое (телесно-ориентированный) | ⭐ Практик | 2 |
| Анна Корнева | Нейропсихолог | 🌱 Новичок | 0 |
| Роман Шевченко | Семейный психолог | 🌱 Новичок | 0 |

Фото: `randomuser.me/api/portraits/women/N.jpg` и `men/N.jpg` (стабильные URL).  
Кнопка "Записаться" у демо → `/login` (не в БД, join page показал бы "не найден").

---

## Система рангов (getRank в specialists/page.tsx)

```ts
function getRank(clientCount: number): RankInfo {
  if (n >= 30) → Мастер 🏆 (teal)
  if (n >= 15) → Наставник 💎 (violet)
  if (n >= 5)  → Эксперт 🏅 (blue)
  if (n >= 1)  → Практик ⭐ (amber)
  else         → Новичок 🌱 (slate)
}
```

Прогресс-бар: `(clientCount - rank.current) / (rank.next - rank.current) * 100%`

---

## Валюты в EarningsTab

```ts
const RATES = { KZT: 1, RUB: 0.19, USD: 0.002 }
const MIN_KZT = 15000  // ≈ $30
```

---

## NavBar (components/NavBar.tsx)

Все три роли (public / user / specialist) показывают одинаковые nav-ссылки:
`[Специалисты] [Материалы] [О нас]`

CTA-кнопка:
- Не авторизован → кнопка "Войти" → LoginModal
- `role === 'user'` → "В кабинет" + дропдаун (hover) → кабинет / Выйти
- `role === 'specialist'` → "В кабинет" + дропдаун → /specialist/dashboard / Выйти

---

## Структура AI-анализа (ответ Claude)

```json
{
  "reflection": "Из того что ты описал(а)... [конкретные цифры и слова юзера]",
  "patterns": "Связи между конкретными данными с цифрами",
  "hypothesis": "Мне интересно, не связано ли... [вопрос]",
  "forSpecialist": ["Тема 1 с конкретикой", "Тема 2", "Тема 3", "Тема 4"],
  "support": "Одна тёплая конкретная фраза без клише"
}
```

Crisis mode: `{"crisis": true}` → телефоны доверия (КЗ: 150, РФ: 8-800-2000-122, UA: 7333)

---

## Роли пользователей

| Роль | profiles.role | После логина | Путь |
|------|--------------|-------------|------|
| Новый | null | → /onboarding | Выбирает роль |
| Обычный | 'user' | → /cabinet | Личный кабинет |
| Специалист | 'specialist' | → /specialist/dashboard | Дашборд специалиста |

---

## Тарифные ограничения

- **Free:** 3 чек-ина, 3 вопроса к AI
- **Pro:** безлимит всего
- **Specialist:** всё из Pro + до 50 клиентов
- Проверка: `subscriptions` по `user_id` + `status = 'active'`

---

## Что сделано / что нет

### ✅ Готово (включая 13.05.2026)
- Лендинг с мини-опросом и анимациями
- Глубокий опрос (4 блока, crisis protocol)
- Claude AI анализ (Sonnet 4.6, 5 секций)
- PDF генерация (jsPDF + html2canvas)
- Кабинет пользователя (6 вкладок)
- Google OAuth + email/password
- Onboarding (выбор роли)
- Cron jobs (email)
- **Портал специалиста:**
  - Регистрация: загрузка фото с устройства (Supabase Storage) + поле bio + градиентный хедер
  - Дашборд: бургер-меню, порядок элементов (счётчики → ссылка → коллега), ссылка на лендинг
  - EarningsTab: переключатель KZT/RUB/USD с конвертацией
- **Каталог специалистов:**
  - Реальные данные из Supabase (service role, bypass RLS)
  - Система рангов 5 уровней по числу клиентов
  - 11 демо-специалистов (все 9 специальностей, все 5 рангов, фото randomuser.me)
  - Топ-5 + все специалисты, фильтр по специальности
  - Прогресс-бар до следующего ранга

### ❌ Не готово (следующие задачи)
- **Paywall** после 3 опросов — логика в CLAUDE.md, не подключена
- **Paddle интеграция** — env vars нужно настроить
- **Email подтверждение** при регистрации (Resend настроен, flow не проверен)
- **Страница профиля специалиста** `/join/[code]` — показывает bio (поле добавлено, но join page его не рендерит)
- **AI-диалог** после анализа — лимиты нестабильны

---

## Переменные окружения

```
NEXT_PUBLIC_SUPABASE_URL=https://xqmgpcggysnkjyuecxcf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
RESEND_API_KEY=...
NEXT_PUBLIC_SITE_URL=https://pulse-health-smoky.vercel.app
NEXT_PUBLIC_PADDLE_VENDOR_ID=...
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=...
NEXT_PUBLIC_PADDLE_SPECIALIST_PRICE_ID=...
SUPABASE_SERVICE_ROLE_KEY=...     ← нужен для /api/specialists (bypass RLS)
```

---

## Правила для планирования задач

1. **Один файл — одна задача.** Задачи которые меняют много файлов — разбивай на шаги
2. **Не удалять данные** без явного указания (никаких DROP, TRUNCATE, DELETE без WHERE)
3. **Дизайн:** всегда style={{}}, никогда Tailwind для цветов бренда
4. **Текст:** только русский в UI
5. **Суицидальные мысли:** crisis gate обязателен в любой форме с вопросом о состоянии
6. **После каждой задачи:** `git commit -m "..." && git push`
7. **Для API routes:** `createClient` из `@/lib/supabase/server` (async!)
8. **Для клиентских компонент:** `createClient` из `@/lib/supabase/client`
9. **Для bypass RLS (публичные данные):** `createClient(@supabase/supabase-js, SUPABASE_SERVICE_ROLE_KEY)`

---

## Типичные паттерны кода

### Получить текущего пользователя (API route)
```ts
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Получить текущего пользователя (Client component)
```ts
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Service role клиент (bypass RLS, только в API routes)
```ts
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

### Проверить подписку
```ts
const { data: sub } = await supabase
  .from('subscriptions')
  .select('plan, status')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .maybeSingle()
const isPro = !!sub
```

### Claude API вызов
```ts
import { anthropic } from '@/lib/anthropic'
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',             // для анализа
  // model: 'claude-haiku-4-5-20251001',  // для чата
  max_tokens: 800,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userMessage }],
})
```

### Загрузить файл в Supabase Storage
```ts
const supabase = createClient()  // client-side
const path = `${userId}/${Date.now()}.${ext}`
await supabase.storage.from('specialist-photos').upload(path, file, { upsert: true })
const { data: { publicUrl } } = supabase.storage.from('specialist-photos').getPublicUrl(path)
```
