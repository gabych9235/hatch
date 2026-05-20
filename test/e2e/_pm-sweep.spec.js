const { test, chromium } = require('/Users/adityasharma/Claude/products/Hatch/test/node_modules/@playwright/test');

const THEMES = ['blog','tech','docs','astropaper','astrowind','astronano'];
const PAGES = [
  { path: '/', name: 'home' },
  { path: '/blog', name: 'archive' },
  { path: '/sample-page', name: 'page' },
  { path: '/blog/edge-e-test', name: 'post' },
  { path: '/non-existent-' + Date.now(), name: '404' },
];

test('Visual QA sweep', async ({}) => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const issues = [];

  for (const theme of THEMES) {
    // Set theme via WP REST (admin auth via app password if needed; here using direct option write via WP CLI alternative)
    // We'll just switch via curl to admin... for now, just snap default
    for (const p of PAGES) {
      try {
        const res = await page.goto('http://localhost:4321' + p.path, { waitUntil: 'domcontentloaded', timeout: 8000 });
        const status = res ? res.status() : 0;
        await page.screenshot({ path: `/tmp/hatch-qa/${theme}-${p.name}.png`, fullPage: false });

        // Count borders that touch (potential double-line)
        const doubleBorderCount = await page.evaluate(() => {
          const all = document.querySelectorAll('footer, header, main, article');
          let suspicious = 0;
          all.forEach(el => {
            const cs = getComputedStyle(el);
            if (cs.borderTopWidth !== '0px' && el.firstElementChild) {
              const child = el.firstElementChild;
              const ccs = getComputedStyle(child);
              if (ccs.borderTopWidth !== '0px') suspicious++;
            }
          });
          return suspicious;
        });

        // Check header vs article max-width
        const widths = await page.evaluate(() => {
          const h = document.querySelector('header > div');
          const a = document.querySelector('main, article');
          return {
            headerMaxW: h ? getComputedStyle(h).maxWidth : null,
            articleMaxW: a ? getComputedStyle(a).maxWidth : null,
          };
        });

        issues.push({ theme, page: p.name, status, doubleBorderCount, ...widths });
      } catch (e) {
        issues.push({ theme, page: p.name, error: e.message });
      }
      break; // for now just snap one theme cycle (theme switching requires WP API)
    }
    break;
  }

  console.log(JSON.stringify(issues, null, 2));
  await browser.close();
});
