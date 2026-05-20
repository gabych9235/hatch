const { test } = require('@playwright/test');
const { chromium } = require('playwright');
test('page width verify', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1456, height: 900 } });
  await page.goto('http://localhost:4321/sample-page?t=' + Date.now(), { waitUntil: 'domcontentloaded' });
  const data = await page.evaluate(() => {
    const prose = document.querySelector('.hatch-prose');
    const article = document.querySelector('article');
    return {
      proseWidth: prose ? prose.getBoundingClientRect().width : null,
      articleWidth: article ? article.getBoundingClientRect().width : null,
      viewport: window.innerWidth,
    };
  });
  console.log('WIDTH:', JSON.stringify(data));
  await browser.close();
});
