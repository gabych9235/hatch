import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
const SHOTS = path.join(__dirname, '..', 'test-results', 'toggle-fix');
fs.mkdirSync(SHOTS, { recursive: true });

test('Toggle fix — black-on-white, label-left toggle-right, no glass anywhere', async ({ page }) => {
  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(400);
  await page.locator('.hx-design-section summary:has-text("Page templates")').click();
  await page.waitForTimeout(300);

  // Toggle ON state — track color should be near-black (--hx-fg), not WP green.
  const onTrack = await page.locator('.hx-toggle-row .hx-switch input:checked + .hx-switch-track').first().evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  console.log('Toggle ON track bg:', onTrack, '(expect rgb(10, 10, 10) or near-black)');

  // Layout — row, label left, toggle right.
  const layout = await page.locator('.hx-toggle-row').first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { flexDir: cs.flexDirection, justify: cs.justifyContent };
  });
  console.log('Toggle row layout (expect row + space-between):', layout);

  // Confirm no backdrop-filter / blur anywhere on the visible page.
  const blurred = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter((el) => {
        const cs = getComputedStyle(el);
        return cs.backdropFilter !== 'none' || cs.webkitBackdropFilter !== 'none';
      }).length;
  });
  console.log('Elements with backdrop-filter (expect 0):', blurred);

  await page.screenshot({ path: path.join(SHOTS, 'design-toggles-fixed.png'), fullPage: true });
});
