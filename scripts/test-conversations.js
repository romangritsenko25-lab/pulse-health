const { chromium } = require('playwright')

async function test() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ storageState: 'scripts/session.json' })
  const page = await context.newPage()

  console.log('=== Test: Conversation History ===\n')

  // 1. Open cabinet
  await page.goto('https://pulse-health-smoky.vercel.app/cabinet')
  console.log('1. Cabinet URL:', page.url())

  // 2. Check conversations API
  const convRes = await fetch('https://pulse-health-smoky.vercel.app/api/conversations', {
    headers: { Cookie: (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ') }
  })
  const convData = await convRes.json()
  console.log('2. GET /api/conversations status:', convRes.status)
  console.log('   Conversations count:', Array.isArray(convData) ? convData.length : 'error', convData.error || '')

  // 3. Wait for PersonalAI to load
  try {
    await page.waitForSelector('text=Твой ассистент', { timeout: 10000 })
    console.log('3. PersonalAI loaded: OK')
  } catch {
    console.log('3. PersonalAI: NOT found on page (check CabinetClient tab)')
  }

  // 4. Check history button exists
  const historyBtn = await page.$('text=История')
  console.log('4. История button:', historyBtn ? 'FOUND' : 'NOT FOUND')

  // 5. Check новый button exists
  const newBtn = await page.$('text=Новый')
  console.log('5. Новый button:', newBtn ? 'FOUND' : 'NOT FOUND')

  // 6. Send test message via API directly
  const cookies = (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ')
  const msgRes = await fetch('https://pulse-health-smoky.vercel.app/api/personal-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookies },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Тест: автоматическая проверка сохранения чата' }] }),
  })
  const msgData = await msgRes.json()
  console.log('\n6. POST /api/personal-ai status:', msgRes.status)
  console.log('   conversation_id:', msgData.conversation_id ?? 'MISSING')
  console.log('   text (first 60):', msgData.text?.slice(0, 60) ?? 'MISSING')
  console.log('   used/limit:', msgData.used, '/', msgData.limit)

  if (msgData.conversation_id) {
    // 7. Load conversation messages
    const loadRes = await fetch(`https://pulse-health-smoky.vercel.app/api/conversations/${msgData.conversation_id}`, {
      headers: { Cookie: cookies }
    })
    const loadData = await loadRes.json()
    console.log('\n7. GET /api/conversations/[id] status:', loadRes.status)
    console.log('   Messages in DB:', Array.isArray(loadData) ? loadData.length : 'error')
    if (Array.isArray(loadData)) {
      loadData.forEach(m => console.log(`   [${m.role}]: ${m.content.slice(0, 50)}...`))
    }

    // 8. Check updated conversations list
    const convRes2 = await fetch('https://pulse-health-smoky.vercel.app/api/conversations', {
      headers: { Cookie: cookies }
    })
    const convData2 = await convRes2.json()
    console.log('\n8. Conversations after message:', Array.isArray(convData2) ? convData2.length : 'error')
    if (Array.isArray(convData2) && convData2.length > 0) {
      console.log('   Latest:', convData2[0].title, '|', convData2[0].updated_at)
    }

    // 9. Delete test conversation
    const delRes = await fetch(`https://pulse-health-smoky.vercel.app/api/conversations/${msgData.conversation_id}`, {
      method: 'DELETE',
      headers: { Cookie: cookies }
    })
    const delData = await delRes.json()
    console.log('\n9. DELETE conversation:', delRes.status, delData.success ? 'OK' : JSON.stringify(delData))
  }

  console.log('\n=== DONE ===')
  await browser.close()
}

test().catch(err => { console.error(err); process.exit(1) })
