const { test } = require('@playwright/test');
const { chromium } = require('playwright');
test('measure page layout', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1456, height: 900 } });
  await page.goto('http://localhost:4321/sample-page', { waitUntil: 'domcontentloaded' });
  const measurements = await page.evaluate(() => {
    const out = {};
    const vp = window.innerWidth;
    out.viewport = vp;
    const article = document.querySelector('article');
    if (article) {
      const r = article.getBoundingClientRect();
      out.article = { left: r.left, right: r.right, width: r.width, marginLeft: r.left, marginRight: vp - r.right };
    }
    const prose = document.querySelector('.hatch-prose');
    if (prose) {
      const r = prose.getBoundingClientRect();
      out.prose = { left: r.left, right: r.right, width: r.width };
    }
    const h1 = document.querySelector('h1');
    if (h1) {
      const r = h1.getBoundingClientRect();
      out.h1 = { left: r.left, right: r.right, width: r.width };
    }
    const header = document.querySelector('header > div');
    if (header) {
      const r = header.getBoundingClientRect();
      out.header = { left: r.left, right: r.right, width: r.width };
    }
    return out;
  });
  console.log('LAYOUT:', JSON.stringify(measurements, null, 2));
  await browser.close();
});
