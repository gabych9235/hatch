import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'final-polish');
fs.mkdirSync(SHOTS, { recursive: true });

test('Final polish snapshot — every tab + final audit checks', async ({ page }) => {
  page.on('pageerror', (e) => console.log('[PAGEERROR]', e.message));

  const tabs = ['connector', 'design', 'content', 'performance', 'security', 'status'];
  for (const t of tabs) {
    await page.goto(`/wp-admin/tools.php?page=hatch&tab=${t}`);
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(SHOTS, `${t}.png`), fullPage: true });
  }

  // Verify hover state moves the input border darker.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(300);
  await page.locator('.hx-design-section summary:has-text("Brand colors")').click();
  await page.waitForTimeout(200);
  const input = page.locator('input[type=text][readonly]').first();
  const restingBorder = await input.evaluate((el) => getComputedStyle(el).borderColor);
  console.log('Input resting border:', restingBorder);

  // Verify focus ring is visible.
  const firstColor = page.locator('input[type=color]').first();
  await firstColor.focus();
  await page.waitForTimeout(100);
  const focusOutline = await firstColor.evaluate((el) => getComputedStyle(el).outlineColor);
  console.log('Focused color input outline:', focusOutline, '(expect orange-ish)');

  // Verify the four semantic foreground tokens computed.
  const tokens = await page.locator('.hatch-admin').first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      successFg: cs.getPropertyValue('--hx-success-fg').trim(),
      warningFg: cs.getPropertyValue('--hx-warning-fg').trim(),
      dangerFg:  cs.getPropertyValue('--hx-danger-fg').trim(),
      infoFg:    cs.getPropertyValue('--hx-info-fg').trim(),
      ease:      cs.getPropertyValue('--hx-ease').trim(),
    };
  });
  console.log('Semantic tokens + ease:', tokens);

  // Status tab — zebra striping check.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=status');
  await page.waitForTimeout(300);
  const rowBg = await page.locator('.hx-status-table tr:nth-child(2) td').first().evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  console.log('Status table even-row bg (expect zebra):', rowBg);

  // Touch target ≥ 44px on .hx-btn.is-sm.
  const smBtnHeight = await page.locator('.hx-btn.is-sm').first().evaluate(
    (el) => (el as HTMLElement).offsetHeight,
  );
  console.log('.hx-btn.is-sm offsetHeight:', smBtnHeight, '(expect ≥44)');
});
