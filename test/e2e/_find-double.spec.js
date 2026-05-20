const { test } = require('/Users/adityasharma/Claude/products/Hatch/test/node_modules/@playwright/test');
test('find double borders', async ({}) => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
  const offenders = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.borderTopWidth !== '0px' && el.firstElementChild) {
        const child = el.firstElementChild;
        const ccs = getComputedStyle(child);
        if (ccs.borderTopWidth !== '0px' && cs.borderTopColor === ccs.borderTopColor) {
          out.push({ parent: el.tagName + '.' + el.className.split(' ').slice(0,2).join('.'), child: child.tagName + '.' + (child.className||'').split(' ').slice(0,2).join('.') });
        }
      }
    });
    return out;
  });
  console.log(JSON.stringify(offenders, null, 2));
  await browser.close();
});
