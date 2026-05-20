const { test } = require('@playwright/test');
const { chromium } = require('playwright');
test('security tab', async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1456, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0,300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0,200)); });
  await page.goto('http://localhost:8810/wp-admin/');
  if (page.url().includes('login')) {
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'hatch-test-2026');
    await page.click('#wp-submit');
    await page.waitForURL(/wp-admin/, { timeout: 10000 }).catch(() => {});
  }
  await page.goto('http://localhost:8810/wp-admin/admin.php?page=hatch#security', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const data = await page.evaluate(() => ({
    toggles: document.querySelectorAll('[role="switch"]').length,
    inputs: document.querySelectorAll('#hatch-root input[type="text"], #hatch-root input[type="number"]').length,
    selects: document.querySelectorAll('#hatch-root select').length,
    chips: document.querySelectorAll('#hatch-root [role="radio"]').length,
    txt: (document.body.innerText.match(/Spam protection|REST API|XML-RPC|Custom login|Brute-force|Application/g) || []).length,
  }));
  console.log('SECURITY:', JSON.stringify(data));
  if (errs.length) console.log('ERRORS:', errs.join('\n'));
  await browser.close();
});
