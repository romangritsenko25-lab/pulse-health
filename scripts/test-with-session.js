const { chromium } = require('playwright')

async function test() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    storageState: 'scripts/session.json',
  })
  const page = await context.newPage()

  // Проверь, что сессия работает — открой защищённую страницу
  await page.goto('https://pulse-health-smoky.vercel.app/cabinet')
  console.log('Cabinet URL:', page.url())

  // Теперь дёрни API
  const response = await page.goto(
    'https://pulse-health-smoky.vercel.app/api/personal-ai'
  )
  const body = await page.textContent('body')
  console.log('API status:', response.status())
  console.log('API response:', body)

  // Выведи все cookies для диагностики
  const cookies = await context.cookies()
  const authCookies = cookies.filter(c => c.name.includes('auth') || c.name.includes('sb-'))
  console.log('Auth cookies found:', authCookies.length)
  authCookies.forEach(c => console.log(' -', c.name, '| httpOnly:', c.httpOnly, '| domain:', c.domain))

  await browser.close()
}

test()
