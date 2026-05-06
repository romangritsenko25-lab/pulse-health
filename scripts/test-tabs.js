const { chromium } = require('playwright')

async function check() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ storageState: 'scripts/session.json' })
  const page = await context.newPage()

  await page.goto('https://pulse-health-smoky.vercel.app/cabinet')
  await page.waitForTimeout(2000)

  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(e => e.textContent.trim()).filter(Boolean)
  )
  console.log('Buttons:', JSON.stringify(btns))

  // Try clicking "Мой AI" or similar tab
  const aiTab = btns.find(b => b.includes('AI') || b.includes('Ассистент') || b.includes('Чат'))
  if (aiTab) {
    console.log('Found AI tab:', aiTab)
    await page.click(`button:has-text("${aiTab}")`)
    await page.waitForTimeout(1500)
    const btns2 = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).map(e => e.textContent.trim()).filter(Boolean)
    )
    console.log('Buttons after click:', JSON.stringify(btns2))
    const hasHistory = btns2.some(b => b.includes('История'))
    const hasNew = btns2.some(b => b.includes('Новый') || b.includes('Новый чат'))
    console.log('История button:', hasHistory ? 'FOUND' : 'NOT FOUND')
    console.log('Новый button:', hasNew ? 'FOUND' : 'NOT FOUND')
  } else {
    console.log('No AI tab found, checking all text...')
    const text = await page.evaluate(() => document.body.innerText.slice(0, 500))
    console.log('Page text:', text)
  }

  await browser.close()
}

check().catch(e => { console.error(e); process.exit(1) })
