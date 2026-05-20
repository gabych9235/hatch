const { test } = require('@playwright/test');
const { chromium } = require('playwright');
test('page full width', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1456, height: 900 } });
  await page.goto('http://localhost:4321/sample-page?b=' + Date.now(), { waitUntil: 'domcontentloaded' });
  const data = await page.evaluate(() => {
    const a = document.querySelector('article');
    const p = document.querySelector('.hatch-prose');
    return { vp: window.innerWidth, articleW: a?.getBoundingClientRect().width, articleLeft: a?.getBoundingClientRect().left, proseW: p?.getBoundingClientRect().width };
  });
  console.log('PAGE_FULLWIDTH:', JSON.stringify(data));
  await browser.close();
});
