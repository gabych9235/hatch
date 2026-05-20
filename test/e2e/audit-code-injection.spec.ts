import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'code-injection-shots');
fs.mkdirSync(SHOTS, { recursive: true });

test('code injection — backend save → REST exposes → Astro renders in head/body slots', async ({ page, request }) => {
  page.on('pageerror', (err) => console.log('[PAGEERROR]', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[CONSOLE.ERR]', msg.text());
  });

  // 1. Content tab loads with the Code Injection panel.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=content');
  await page.waitForTimeout(300);
  const txt = await page.locator('body').innerText();
  console.log('Content tab shows "Code injection":', txt.includes('Code injection'));
  console.log('Content tab shows GA4 field:', txt.includes('Google Analytics 4'));
  console.log('Content tab shows GTM field:', txt.includes('Google Tag Manager'));
  console.log('Content tab shows Plausible field:', txt.includes('Plausible'));
  console.log('Content tab shows Meta Pixel field:', txt.includes('Meta'));
  console.log('Content tab shows <head> slot:', txt.includes('inside head'));
  console.log('Content tab shows <body> slot:', txt.includes('right after opening body tag'));
  console.log('Content tab shows </body> slot:', txt.includes('before closing body tag'));
  await page.screenshot({ path: path.join(SHOTS, 'content-tab-code-injection.png'), fullPage: true });

  // 2. REST endpoint is public.
  const restGet = await request.get('http://localhost:8810/wp-json/hatch/v1/code-snippets');
  console.log('REST /code-snippets unauthenticated:', restGet.status());
  expect(restGet.status()).toBe(200);
  const body = await restGet.json();
  console.log('REST keys:', Object.keys(body).sort().join(', '));
  expect(body).toHaveProperty('ga4_id');
  expect(body).toHaveProperty('gtm_id');
  expect(body).toHaveProperty('plausible_domain');
  expect(body).toHaveProperty('pixel_id');
  expect(body).toHaveProperty('head');
  expect(body).toHaveProperty('body_start');
  expect(body).toHaveProperty('body_end');

  // 3. Fill the GA4 ID via the admin form, save via the sticky bar.
  await page.locator('input[name="hatch_code[ga4_id]"]').fill('G-PLAYWRIGHT1');
  await page.waitForTimeout(200);
  const dirty = await page.locator('.hatch-save-bar.is-visible').count();
  console.log('Save bar visible after edit:', dirty);
  await page.locator('.hatch-save-bar .hx-sb-save').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SHOTS, 'after-save-ga4.png'), fullPage: true });

  // 4. REST should now report the saved ID.
  const restAfter = await request.get('http://localhost:8810/wp-json/hatch/v1/code-snippets');
  const bodyAfter = await restAfter.json();
  console.log('Saved GA4 ID via admin form:', bodyAfter.ga4_id);
  expect(bodyAfter.ga4_id).toBe('G-PLAYWRIGHT1');

  // 5. Astro frontend should render the auto-generated GA4 snippet.
  const frontResp = await request.get('http://localhost:4321/');
  const front = await frontResp.text();
  const hasGa4    = front.includes('G-PLAYWRIGHT1');
  const hasGtagJs = front.includes('googletagmanager.com/gtag/js');
  console.log('Astro head contains GA4 ID:', hasGa4);
  console.log('Astro head contains gtag bootstrap:', hasGtagJs);
  expect(hasGa4).toBe(true);
  expect(hasGtagJs).toBe(true);

  // 6. Cleanup — wipe the canary.
  await page.locator('input[name="hatch_code[ga4_id]"]').fill('');
  await page.waitForTimeout(200);
  await page.locator('.hatch-save-bar .hx-sb-save').click();
  await page.waitForTimeout(500);

  // 7. Astro frontend still serves home OK (no regression from middleware).
  const home = await request.get('http://localhost:4321/');
  console.log('Astro home HTTP:', home.status());
  expect(home.status()).toBe(200);
});
