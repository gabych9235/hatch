const { test } = require('@playwright/test');
const { chromium } = require('playwright');
test('post sidebar check', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1456, height: 900 } });
  await page.goto('http://localhost:4321/blog/edge-e-test?t=' + Date.now(), { waitUntil: 'domcontentloaded' });
  const data = await page.evaluate(() => {
    const main = document.querySelector('article, main');
    const prose = document.querySelector('.hatch-prose');
    const aside = document.querySelector('aside');
    const grid = document.querySelector('[class*="grid-cols"]');
    return {
      hasAside: !!aside,
      asideVisible: aside ? (aside.getBoundingClientRect().width > 0 && aside.offsetParent !== null) : false,
      gridClass: grid ? grid.className.match(/grid-cols-[^\s]+|lg:grid-cols-[^\s]+/g) : null,
      prose: prose ? { left: prose.getBoundingClientRect().left, width: prose.getBoundingClientRect().width } : null,
      main: main ? { left: main.getBoundingClientRect().left, width: main.getBoundingClientRect().width } : null,
      viewport: window.innerWidth,
    };
  });
  console.log('POST_LAYOUT:', JSON.stringify(data, null, 2));
  await browser.close();
});
