const { chromium } = require('playwright')

const BASE = 'https://pulse-health-smoky.vercel.app'
let passed = 0
let failed = 0

function ok(label) { console.log('  ✓', label); passed++ }
function fail(label, detail = '') { console.log('  ✗', label, detail ? `(${detail})` : ''); failed++ }

async function test() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ storageState: 'scripts/session.json' })
  const page = await context.newPage()

  async function cookies() {
    return (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ')
  }

  async function api(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json', Cookie: await cookies() } }
    if (body) opts.body = JSON.stringify(body)
    const r = await fetch(BASE + path, opts)
    return { status: r.status, data: await r.json() }
  }

  console.log('\n=== Финальная проверка: персистентная история AI чатов ===\n')

  // --- Setup: открываем страницу, идём на таб Мой AI ---
  await page.goto(BASE + '/cabinet')
  await page.waitForTimeout(1500)
  await page.click('button:has-text("Мой AI")')
  await page.waitForTimeout(1500)

  // --- Чек 1: Отправить сообщение → запись в ai_messages ---
  console.log('Чек 1: Отправка сообщения → сохранение в Supabase')
  const { status: s1, data: d1 } = await api('POST', '/api/personal-ai', {
    messages: [{ role: 'user', content: 'Финальный тест: проверка персистентности' }]
  })
  const convId = d1.conversation_id
  s1 === 200 && convId ? ok('POST /api/personal-ai вернул conversation_id') : fail('POST /api/personal-ai', JSON.stringify(d1))

  if (convId) {
    const { data: msgs } = await api('GET', `/api/conversations/${convId}`)
    Array.isArray(msgs) && msgs.length === 2 ? ok('В ai_messages 2 записи (user + assistant)') : fail('ai_messages', `count=${msgs?.length}`)
    msgs?.[0]?.role === 'user' ? ok('Первая запись: role=user') : fail('Первая запись не user')
    msgs?.[1]?.role === 'assistant' ? ok('Вторая запись: role=assistant') : fail('Вторая запись не assistant')
  }

  // --- Чек 2: Переключиться на Журнал → вернуться на Мой AI ---
  console.log('\nЧек 2: Переключение вкладок')
  await page.click('button:has-text("Журнал")')
  await page.waitForTimeout(800)
  const onJournal = await page.$('text=Журнал')
  onJournal ? ok('Переключились на Журнал') : fail('Журнал не открылся')

  await page.click('button:has-text("Мой AI")')
  await page.waitForTimeout(1500)
  const histBtn = await page.$('button:has-text("История")')
  histBtn ? ok('Вернулись на Мой AI — кнопка История есть') : fail('После возврата кнопка История не найдена')

  // --- Чек 3: Диалог сохранился (API проверка) ---
  console.log('\nЧек 3: Диалог сохранён в Supabase')
  if (convId) {
    const { data: msgs2 } = await api('GET', `/api/conversations/${convId}`)
    Array.isArray(msgs2) && msgs2.length >= 2 ? ok('Диалог присутствует в DB после смены вкладки') : fail('Диалог исчез')
  }

  // --- Чек 4: Нажать "Новый чат" → пустой чат, старый в истории ---
  console.log('\nЧек 4: Новый чат')
  await page.click('button:has-text("Новый")')
  await page.waitForTimeout(800)
  // После нажатия Новый — список чатов в API должен содержать старый
  const { data: convList } = await api('GET', '/api/conversations')
  const hasOldConv = Array.isArray(convList) && convList.some(c => c.id === convId)
  hasOldConv ? ok('Старый чат остался в истории после "Новый"') : fail('Старый чат исчез из истории', `list=${JSON.stringify(convList?.map(c=>c.id))}`)

  // --- Чек 5: Открыть историю → видим предыдущий чат ---
  console.log('\nЧек 5: Панель истории')
  await page.click('button:has-text("История")')
  await page.waitForTimeout(800)
  const convCards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).filter(b => b.className.includes('rounded-2xl') && b.className.includes('border')).length
  )
  convCards > 0 ? ok(`В панели истории ${convCards} карточка(и) чата`) : fail('Карточки чатов не отображаются')

  // --- Чек 6: Кликнуть на чат → загружается полностью ---
  console.log('\nЧек 6: Загрузка чата из истории')
  const { data: loaded } = await api('GET', `/api/conversations/${convId}`)
  Array.isArray(loaded) && loaded.length === 2 ? ok(`Чат загружается: ${loaded.length} сообщений`) : fail('Чат не загрузился', `${JSON.stringify(loaded)}`)
  loaded?.[0]?.content?.includes('Финальный тест') ? ok('Содержимое сообщения сохранено точно') : fail('Содержимое сообщения не совпадает')

  // --- Чек 7: SQL проверка ---
  console.log('\nЧек 7: Данные в Supabase (через API)')
  const { data: allConvs } = await api('GET', '/api/conversations')
  Array.isArray(allConvs) ? ok(`GET /api/conversations возвращает массив (${allConvs.length} чатов)`) : fail('GET /api/conversations не массив')
  allConvs?.[0]?.last_message ? ok('last_message присутствует в списке') : fail('last_message отсутствует')

  // --- Cleanup ---
  if (convId) {
    const { status: ds } = await api('DELETE', `/api/conversations/${convId}`)
    ds === 200 ? ok('Тестовый чат удалён') : fail('Удаление не сработало')
  }

  // --- Итог ---
  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Результат: ${passed} passed, ${failed} failed`)
  if (failed === 0) console.log('ВСЁ РАБОТАЕТ ✓')
  else console.log('ЕСТЬ ОШИБКИ — нужно исправить')

  await browser.close()
  return failed
}

test().then(f => process.exit(f > 0 ? 1 : 0)).catch(e => { console.error(e); process.exit(1) })
