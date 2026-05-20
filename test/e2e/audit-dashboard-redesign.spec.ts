import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'redesign-shots');
fs.mkdirSync(SHOTS, { recursive: true });

test('snapshot every Hatch admin tab + sticky save bar + toast', async ({ page }) => {
  page.on('pageerror', (err) => console.log('[PAGEERROR]', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[CONSOLE.ERR]', msg.text());
  });

  const tabs = [
    { slug: 'connector',    url: '/wp-admin/tools.php?page=hatch&tab=connector' },
    { slug: 'status',       url: '/wp-admin/tools.php?page=hatch&tab=status' },
    { slug: 'design',       url: '/wp-admin/tools.php?page=hatch&tab=design' },
    { slug: 'features',     url: '/wp-admin/tools.php?page=hatch&tab=features' },
    { slug: 'integrations', url: '/wp-admin/tools.php?page=hatch&tab=integrations' },
    { slug: 'security',     url: '/wp-admin/tools.php?page=hatch&tab=security' },
    { slug: 'dashboard',    url: '/wp-admin/admin.php?page=hatch' },
    { slug: 'setup-step1',  url: '/wp-admin/admin.php?page=hatch-setup' },
    { slug: 'setup-step2',  url: '/wp-admin/admin.php?page=hatch-setup&step=2' },
    { slug: 'setup-step3',  url: '/wp-admin/admin.php?page=hatch-setup&step=3' },
  ];

  for (const tab of tabs) {
    const resp = await page.goto(tab.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    console.log(`[${tab.slug}] HTTP ${resp?.status()}`);
    await page.screenshot({ path: path.join(SHOTS, `${tab.slug}.png`), fullPage: true });
  }

  // Verify pulse dot in the Connection tab nav.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=status');
  const pulseInTab = await page.locator('.hx-tab.is-active .hx-pulse, .hx-tab .hx-pulse').count();
  console.log('Pulse dots in tab bar:', pulseInTab);

  // Verify the unified Heartbeat card on Status.
  const hb = await page.locator('.hx-card:has-text("Heartbeat")').count();
  console.log('Heartbeat card on Status tab:', hb);

  // Force a "dirty" form to test the sticky save bar appears.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(400);
  const firstInput = page.locator('form[action*="admin-post.php"] input[type="text"], form[action*="admin-post.php"] textarea').first();
  if (await firstInput.count()) {
    await firstInput.fill('dirty-value-' + Date.now());
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, 'design-dirty-savebar.png'), fullPage: true });
    const bar = await page.locator('.hatch-save-bar.is-visible').count();
    console.log('Sticky save bar visible after dirty edit:', bar);
  } else {
    console.log('No text inputs found on design tab to test dirty state');
  }

  // Trigger a toast directly via window.hatchToast and screenshot it.
  await page.evaluate(() => (window as any).hatchToast({ title: 'Test toast', message: 'This is what saves feel like.' }));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SHOTS, 'design-toast-visible.png'), fullPage: true });
});
