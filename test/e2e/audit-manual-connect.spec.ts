import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'audit-shots');
fs.mkdirSync(SHOTS, { recursive: true });

test('walk wizard end-to-end via manual target → dashboard shows connected', async ({ page, request }) => {
  // STEP 1 — Welcome page screenshot.
  await page.goto('/wp-admin/admin.php?page=hatch-setup');
  await page.screenshot({ path: path.join(SHOTS, 'wizard-step1.png'), fullPage: true });

  // STEP 2 — Theme picker. New calm info card should now be present.
  await page.goto('/wp-admin/admin.php?page=hatch-setup&step=2');
  await page.screenshot({ path: path.join(SHOTS, 'wizard-step2-theme.png'), fullPage: true });
  const step2Text = await page.locator('body').innerText();
  console.log('STEP 2 includes "What going headless means":', step2Text.includes('What going headless means'));
  console.log('STEP 2 includes amber warning copy?', step2Text.includes('Heads-up'));

  // Submit theme = blog.
  await page.evaluate(() => {
    const r = document.querySelector('input[name="hatch_theme"][value="blog"]') as HTMLInputElement | null;
    if (r) r.checked = true;
    const f = document.querySelector('form[action*="page=hatch-setup"]') as HTMLFormElement | null;
    if (f) f.submit();
  });
  await page.waitForURL(/step=3/, { timeout: 15000 });

  // STEP 3 — Deploy page. Should NOT have the amber warning, SHOULD have the
  // Local/Manual card.
  await page.screenshot({ path: path.join(SHOTS, 'wizard-step3-deploy.png'), fullPage: true });
  const step3Text = await page.locator('body').innerText();
  console.log('STEP 3 still has amber warning?', step3Text.includes('Heads-up'));
  console.log('STEP 3 has Local/Manual card?', step3Text.includes('Local / Manual'));

  // VPS card now contains both the install one-liner AND a "paste URL" path.
  // There should NOT be a separate Local/Manual card anymore.
  console.log('STEP 3 still has separate "Local / Manual" card?', step3Text.includes('Local / Manual'));
  console.log('STEP 3 VPS card mentions "Localhost"?', step3Text.includes('Localhost'));

  // Open the VPS card and use the paste-URL path inside it.
  await page.locator('details:has-text("VPS / Server / Localhost") summary').click();
  await page.locator('#hatch-manual-url').fill('http://localhost:4321');
  await Promise.all([
    page.waitForURL(/tab=status/, { timeout: 15000 }),
    page.locator('button:has-text("Save & connect")').click(),
  ]);

  // Status tab after manual connect.
  await page.screenshot({ path: path.join(SHOTS, 'status-after-manual.png'), fullPage: true });
  const statusText = await page.locator('body').innerText();
  console.log('STATUS shows "Connected"?', /connected/i.test(statusText));
  console.log('STATUS still shows "Setup not complete"?', statusText.includes('Setup not complete'));

  // Hit the dashboard tab too.
  await page.goto('/wp-admin/admin.php?page=hatch');
  await page.screenshot({ path: path.join(SHOTS, 'dashboard-after-manual.png'), fullPage: true });
  const dashText = await page.locator('body').innerText();
  console.log('DASHBOARD still shows "Setup not complete"?', dashText.includes('Setup not complete'));
  console.log('DASHBOARD still shows "No frontend connected"?', dashText.includes('No frontend connected'));

  // Verify the public WP frontend now 302s to localhost:4321.
  const home = await request.get('http://localhost:8810/', { maxRedirects: 0 });
  console.log('WP frontend HTTP status:', home.status());
  console.log('WP frontend Location header:', home.headers()['location'] || '(none)');
});
