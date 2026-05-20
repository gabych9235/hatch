const { test } = require('@playwright/test');
const { chromium } = require('playwright');
test('perf tab errors', async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1456, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') errs.push(msg.text().slice(0, 250)); });
  page.on('pageerror', e => errs.push('PAGE ERROR: ' + e.message.slice(0, 300)));
  // Login
  await page.goto('http://localhost:8810/wp-admin/');
  if (page.url().includes('login')) {
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'hatch-test-2026');
    await page.click('#wp-submit');
    await page.waitForURL(/wp-admin/, { timeout: 10000 }).catch(() => {});
  }
  await page.goto('http://localhost:8810/wp-admin/admin.php?page=hatch#performance', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  console.log('=== Console errors ===');
  errs.forEach(e => console.log('  •', e));
  console.log('=== Tab content ===');
  const txt = await page.evaluate(() => {
    const root = document.querySelector('#hatch-root, [class*="hatch"], main');
    return root ? root.innerText.slice(0, 500) : 'NO ROOT FOUND';
  });
  console.log(txt);
  await browser.close();
});
