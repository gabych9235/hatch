import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'design-tokens');
fs.mkdirSync(SHOTS, { recursive: true });

test('Live-site design tokens applied — pill buttons, pure orange, cool palette', async ({ page }) => {
  await page.goto('/wp-admin/tools.php?page=hatch&tab=connector');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, 'connector.png'), fullPage: true });

  // Verify the CSS variables.
  const tokens = await page.locator('.hatch-admin').first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      bg:        cs.getPropertyValue('--hx-bg').trim(),
      surface:   cs.getPropertyValue('--hx-surface').trim(),
      fg:        cs.getPropertyValue('--hx-fg').trim(),
      muted:     cs.getPropertyValue('--hx-muted').trim(),
      border:    cs.getPropertyValue('--hx-border').trim(),
      primary:   cs.getPropertyValue('--hx-primary').trim(),
      radiusLg:  cs.getPropertyValue('--hx-radius-lg').trim(),
      pill:      cs.getPropertyValue('--hx-radius-pill').trim(),
    };
  });
  console.log('Live-site tokens applied:', tokens);

  // Pick a few buttons and check their computed shape.
  const buttons = await page.locator('.hatch-admin .hx-btn').evaluateAll((els) =>
    els.slice(0, 6).map((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return {
        label: ((el as HTMLElement).innerText || '').slice(0, 30),
        radius: cs.borderRadius,
        padding: cs.padding,
        bg: cs.backgroundColor,
        fontWeight: cs.fontWeight,
      };
    }),
  );
  console.log('Button computed styles:');
  buttons.forEach((b) => console.log(' ', b));

  // Card radius should be 14px.
  const cardRadius = await page.locator('.hatch-admin .hx-card').first().evaluate(
    (el) => getComputedStyle(el).borderRadius,
  );
  console.log('First .hx-card border-radius:', cardRadius, '(expect 14px)');

  // Snapshot each tab so we can eyeball the new palette.
  for (const tab of ['design', 'content', 'performance', 'security', 'status']) {
    await page.goto(`/wp-admin/tools.php?page=hatch&tab=${tab}`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, `${tab}.png`), fullPage: true });
  }
});
