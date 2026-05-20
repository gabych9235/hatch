const { test } = require('@playwright/test');
const { chromium } = require('playwright');
test('sidebar bug', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1456, height: 900 } });

  // 1) Page check
  await page.goto('http://localhost:4321/sample-page?bust=' + Date.now(), { waitUntil: 'domcontentloaded' });
  const pageData = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    const article = document.querySelector('article');
    const prose = document.querySelector('.hatch-prose');
    const grid = document.querySelector('[class*="grid-cols"]');
    return {
      hasAside: !!aside,
      asideVisible: aside ? aside.offsetParent !== null : false,
      asideWidth: aside ? aside.getBoundingClientRect().width : 0,
      articleWidth: article ? article.getBoundingClientRect().width : 0,
      proseWidth: prose ? prose.getBoundingClientRect().width : 0,
      gridClass: grid ? grid.className.match(/grid-cols-[^\s]+|lg:grid-cols-[^\s]+/g) : null,
      hasGrid: !!grid,
      viewport: window.innerWidth,
    };
  });
  console.log('PAGE:', JSON.stringify(pageData, null, 2));

  // 2) Post check (with sidebar=none)
  await page.goto('http://localhost:4321/blog/edge-e-test?bust=' + Date.now(), { waitUntil: 'domcontentloaded' });
  const postData = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    const article = document.querySelector('article');
    const prose = document.querySelector('.hatch-prose');
    const grid = document.querySelector('[class*="grid-cols"]');
    return {
      hasAside: !!aside,
      asideVisible: aside ? aside.offsetParent !== null : false,
      asideWidth: aside ? aside.getBoundingClientRect().width : 0,
      articleWidth: article ? article.getBoundingClientRect().width : 0,
      proseWidth: prose ? prose.getBoundingClientRect().width : 0,
      gridClass: grid ? grid.className.match(/grid-cols-[^\s]+|lg:grid-cols-[^\s]+/g) : null,
    };
  });
  console.log('POST:', JSON.stringify(postData, null, 2));

  await browser.close();
});
