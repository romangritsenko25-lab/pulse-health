const { chromium } = require('playwright')

async function saveSession() {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  await page.goto('https://pulse-health-smoky.vercel.app')

  console.log('Залогинься через Google в открывшемся браузере...')

  // Ждём пока URL станет не /login и не на google.com
  await page.waitForURL(
    url => {
      const href = url.toString()
      return (
        href.startsWith('https://pulse-health-smoky.vercel.app/') &&
        !href.includes('/login') &&
        !href.includes('/auth/')
      )
    },
    { timeout: 120000 }
  )

  console.log('Залогинен! URL:', page.url())
  console.log('Сохраняю сессию...')

  await context.storageState({ path: 'scripts/session.json' })
  console.log('Сессия сохранена в scripts/session.json')

  await browser.close()
}

saveSession()
