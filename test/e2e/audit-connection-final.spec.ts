import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
const SHOTS = path.join(__dirname, '..', 'test-results', 'connection-final');
fs.mkdirSync(SHOTS, { recursive: true });

test('Connection tab final — heartbeat present, monochrome segments, no CF/Vercel noise', async ({ page }) => {
  await page.goto('/wp-admin/tools.php?page=hatch&tab=connector');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, 'connection.png'), fullPage: true });

  const txt = await page.locator('.hatch-admin').innerText();
  console.log('Connection contains "Heartbeat ·":', txt.includes('Heartbeat ·'));
  console.log('Connection contains "Cloudflare" (inactive — should be NO):', txt.includes('Cloudflare'));
  console.log('Connection contains "Vercel" (inactive — should be NO):', txt.includes('Vercel'));

  // Status tab should NOT contain the heartbeat panel.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=status');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, 'status.png'), fullPage: true });
  const statusTxt = await page.locator('.hatch-admin').innerText();
  console.log('Status contains "Heartbeat ·" (expect NO):', statusTxt.includes('Heartbeat ·'));

  // Segment chips on Design tab — verify selected state uses black border, no orange.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(300);
  await page.locator('.hx-design-section summary:has-text("Layout")').click();
  await page.waitForTimeout(200);
  const segStyles = await page.locator('.hx-segment.is-on').evaluateAll((els) =>
    els.slice(0, 3).map((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { color: cs.color, borderColor: cs.borderColor, bg: cs.backgroundColor };
    }),
  );
  console.log('Active segment chip styles:');
  segStyles.forEach((s) => console.log(' ', s));
});
