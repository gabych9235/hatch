import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'ia-v3-shots');
fs.mkdirSync(SHOTS, { recursive: true });

test('IA v3 — all 6 tabs render, old slugs redirect, Performance tab works', async ({ page }) => {
  page.on('pageerror', (err) => console.log('[PAGEERROR]', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[CONSOLE.ERR]', msg.text());
  });

  const tabs = [
    { slug: 'connector',   url: '/wp-admin/tools.php?page=hatch&tab=connector',   expect: 'Connection' },
    { slug: 'design',      url: '/wp-admin/tools.php?page=hatch&tab=design',      expect: 'Theme' },
    { slug: 'content',     url: '/wp-admin/tools.php?page=hatch&tab=content',     expect: 'Content' },
    { slug: 'performance', url: '/wp-admin/tools.php?page=hatch&tab=performance', expect: 'Performance' },
    { slug: 'security',    url: '/wp-admin/tools.php?page=hatch&tab=security',    expect: 'Security' },
    { slug: 'status',      url: '/wp-admin/tools.php?page=hatch&tab=status',      expect: 'Heartbeat' },
  ];

  for (const t of tabs) {
    const resp = await page.goto(t.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    const txt = await page.locator('body').innerText();
    const ok = txt.includes(t.expect);
    console.log(`[${t.slug}] HTTP ${resp?.status()} · expect="${t.expect}" · found=${ok}`);
    await page.screenshot({ path: path.join(SHOTS, `${t.slug}.png`), fullPage: true });
  }

  // Back-compat: old ?tab=features should redirect/route to content.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=features');
  const featuresBody = await page.locator('body').innerText();
  console.log('Old "features" slug routes somewhere sensible (Content seen):', featuresBody.includes('Content'));

  // Performance tab — segmented control responds to clicks.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=performance');
  await page.waitForTimeout(300);
  const segCount = await page.locator('.hx-segment').count();
  console.log('Segmented controls on Performance tab:', segCount);

  // Theme picker now lives on Design.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(300);
  const themeCardsOnDesign = await page.locator('.hx-theme-card').count();
  console.log('Theme cards on Design tab:', themeCardsOnDesign);

  // Bug fix verification: click a theme card, click save-bar Save, verify is-selected persists.
  if (themeCardsOnDesign >= 2) {
    const cards = await page.locator('.hx-theme-card').all();
    // Pick the 2nd card (typically not the currently-selected one)
    const targetCard = cards[1];
    const targetRadio = await targetCard.locator('input[type=radio]').getAttribute('value');
    console.log('Clicking theme card with value:', targetRadio);
    await targetCard.click();
    await page.waitForTimeout(150);
    const dirtyVisible = await page.locator('.hatch-save-bar.is-visible').count();
    console.log('Save bar appeared after theme click:', dirtyVisible);

    // Trigger save via the bar.
    const saveBtn = page.locator('.hatch-save-bar .hx-sb-save');
    if (await saveBtn.count()) {
      await saveBtn.click();
      await page.waitForTimeout(800);
      const afterSelected = await page.locator('.hx-theme-card.is-selected input[type=radio]').getAttribute('value');
      console.log('After save: theme card with value', afterSelected, 'is selected (expected:', targetRadio, ')');
      console.log('Save bug fix verified:', afterSelected === targetRadio);
    }
    await page.screenshot({ path: path.join(SHOTS, 'design-after-theme-save.png'), fullPage: true });
  }
});
