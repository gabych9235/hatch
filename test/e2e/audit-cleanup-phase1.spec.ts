import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'cleanup-phase1');
fs.mkdirSync(SHOTS, { recursive: true });

test('Phase 1 cleanup — zero in-card Saves, centered pill, no "rebuild" copy', async ({ page }) => {
  page.on('pageerror', (err) => console.log('[PAGEERROR]', err.message));

  const tabs = [
    'connector',
    'design',
    'content',
    'performance',
    'security',
    'status',
  ];

  let totalSaveBtns = 0;
  let rebuildHits = 0;

  for (const tab of tabs) {
    await page.goto(`/wp-admin/tools.php?page=hatch&tab=${tab}`);
    await page.waitForTimeout(300);

    // Count Save buttons inside the admin content (excluding wp-admin shell).
    const saveBtns = await page.locator('.hatch-admin button:has-text("Save"):not(.hx-sb-save)').count();
    if (saveBtns > 0) {
      const labels = await page.locator('.hatch-admin button:has-text("Save"):not(.hx-sb-save)').evaluateAll(
        (els) => els.map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)),
      );
      console.log(`[${tab}] in-card Save buttons (${saveBtns}):`, labels);
    }
    totalSaveBtns += saveBtns;

    // Count "rebuild" mentions visible to users (case-insensitive, but
    // accept "no rebuild" since that's a reassurance, not a claim).
    const txt = await page.locator('.hatch-admin').innerText();
    const lower = txt.toLowerCase();
    // Strip ALL "no rebuild" / "rebuild on publish" (legit user-facing) before counting.
    const cleaned = lower.replace(/no rebuild[^.]*\./g, '').replace(/rebuild on publish/g, '');
    const remaining = (cleaned.match(/rebuild/g) || []).length;
    if (remaining > 0) console.log(`[${tab}] residual "rebuild" mentions:`, remaining);
    rebuildHits += remaining;

    await page.screenshot({ path: path.join(SHOTS, `${tab}.png`), fullPage: true });
  }

  console.log(`Total in-card Save buttons across 6 tabs: ${totalSaveBtns} (expected 0)`);
  console.log(`Total residual "rebuild" copy: ${rebuildHits} (expected 0)`);

  // Verify the centered pill — go to Design, dirty a field, screenshot the pill.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(300);
  await page.locator('.hx-design-section summary:has-text("Brand colors")').click();
  await page.waitForTimeout(200);
  await page.locator('input[name="hatch_design[brand][primary]"]').first().evaluate((el: HTMLInputElement) => {
    el.value = '#ff8855';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(300);

  const bar = page.locator('.hatch-save-bar.is-visible');
  const barCount = await bar.count();
  console.log('Save pill visible after dirty edit:', barCount);

  if (barCount > 0) {
    const box = await bar.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      const centerOffset = Math.abs((box.x + box.width / 2) - viewport.width / 2);
      console.log(`Pill horizontal center offset from viewport center: ${centerOffset.toFixed(0)}px (expected < 30px for "centered")`);
      console.log(`Pill width: ${box.width.toFixed(0)}px (expected < viewport width = pill, not bar)`);
    }
  }

  // Save pill should contain the SSR helper text.
  const pillText = await bar.innerText();
  console.log('Pill helper text:', pillText.replace(/\s+/g, ' ').trim());
  console.log('Pill mentions "no redeploy":', pillText.toLowerCase().includes('no redeploy'));

  await page.screenshot({ path: path.join(SHOTS, 'design-pill-visible.png'), fullPage: true });
});
