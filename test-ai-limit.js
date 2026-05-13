const { chromium } = require('playwright')

async function test() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  // Открой API endpoint
  await page.goto('https://pulse-health-smoky.vercel.app/api/personal-ai')
  const body = await page.textContent('body')
  console.log('API response:', body)

  await browser.close()
}

test()
