const { test } = require('@playwright/test');
const { chromium } = require('playwright');
test('page sidebar perception', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1456, height: 900 } });
  await page.goto('http://localhost:4321/sample-page?b=' + Date.now(), { waitUntil: 'domcontentloaded' });
  const data = await page.evaluate(() => {
    const article = document.querySelector('article');
    const prose = document.querySelector('.hatch-prose');
    const header = document.querySelector('header');
    const body = document.body;
    const h1 = document.querySelector('h1');
    return {
      viewport: window.innerWidth,
      bodyW: body ? body.getBoundingClientRect().width : 0,
      headerW: header ? header.getBoundingClientRect().width : 0,
      articleW: article ? article.getBoundingClientRect().width : 0,
      articleLeft: article ? article.getBoundingClientRect().left : 0,
      articleRight: article ? article.getBoundingClientRect().right : 0,
      proseW: prose ? prose.getBoundingClientRect().width : 0,
      proseLeft: prose ? prose.getBoundingClientRect().left : 0,
      proseRight: prose ? prose.getBoundingClientRect().right : 0,
      h1W: h1 ? h1.getBoundingClientRect().width : 0,
      h1Left: h1 ? h1.getBoundingClientRect().left : 0,
      h1Right: h1 ? h1.getBoundingClientRect().right : 0,
      // Any aside or fixed-width container?
      hasAside: !!document.querySelector('aside'),
      asideCount: document.querySelectorAll('aside').length,
      // Inspect ALL ancestors of prose for max-width
      proseChain: (() => {
        const out = [];
        let el = prose;
        while (el && el !== body && out.length < 8) {
          const cs = getComputedStyle(el);
          out.push({
            tag: el.tagName,
            cls: (el.className || '').toString().slice(0, 60),
            maxW: cs.maxWidth,
            w: el.getBoundingClientRect().width.toFixed(0),
            paddingLR: `${cs.paddingLeft}/${cs.paddingRight}`,
          });
          el = el.parentElement;
        }
        return out;
      })(),
    };
  });
  console.log('LAYOUT:', JSON.stringify(data, null, 2));
  await browser.close();
});
