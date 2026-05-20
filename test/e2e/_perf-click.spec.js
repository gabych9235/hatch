const { test } = require('@playwright/test');
const { chromium } = require('playwright');
test('perf toggles clickable', async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1456, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGE ERROR: ' + e.message.slice(0,200)));
  await page.goto('http://localhost:8810/wp-admin/');
  if (page.url().includes('login')) {
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'hatch-test-2026');
    await page.click('#wp-submit');
    await page.waitForURL(/wp-admin/, { timeout: 10000 }).catch(() => {});
  }
  await page.goto('http://localhost:8810/wp-admin/admin.php?page=hatch#performance', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Count interactive elements
  const data = await page.evaluate(() => {
    const toggles = document.querySelectorAll('[role="switch"], button[aria-checked]');
    const buttons = document.querySelectorAll('button');
    const inputs  = document.querySelectorAll('input[type="text"], input[type="search"]');
    const cards   = document.querySelectorAll('[class*="HxCard"]');
    return {
      toggles: toggles.length,
      buttons: buttons.length,
      inputs:  inputs.length,
      cards:   cards.length,
      bodyTxt: document.body.innerText.slice(0, 200),
    };
  });
  console.log('PERF_TAB:', JSON.stringify(data, null, 2));
  if (errs.length) console.log('ERRORS:', errs.join('\n'));
  await browser.close();
});
