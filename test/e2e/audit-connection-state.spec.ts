import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'audit-shots');
fs.mkdirSync(SHOTS, { recursive: true });

const TABS = [
  { slug: 'setup',     url: '/wp-admin/admin.php?page=hatch-setup' },
  { slug: 'dashboard', url: '/wp-admin/admin.php?page=hatch' },
  { slug: 'connector', url: '/wp-admin/tools.php?page=hatch&tab=connector' },
  { slug: 'status',    url: '/wp-admin/tools.php?page=hatch&tab=status' },
  { slug: 'settings',  url: '/wp-admin/tools.php?page=hatch&tab=settings' },
];

for (const tab of TABS) {
  test(`audit ${tab.slug}`, async ({ page }) => {
    page.on('pageerror', (err) => console.log(`[${tab.slug}] PAGEERROR:`, err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`[${tab.slug}] CONSOLE.ERR:`, msg.text());
    });

    const resp = await page.goto(tab.url, { waitUntil: 'domcontentloaded' });
    console.log(`[${tab.slug}] HTTP ${resp?.status()}`);

    await page.screenshot({ path: path.join(SHOTS, `${tab.slug}.png`), fullPage: true });

    // Extract every visible piece of text that mentions connection state.
    const hits = await page.evaluate(() => {
      const out: { text: string; classes: string }[] = [];
      const wanted = /(connect|not connected|disconnect|setup|incomplete|deploy|pending|live|fail|error|warning)/i;
      document.querySelectorAll('body *').forEach((el) => {
        const t = (el.textContent || '').trim();
        if (t && t.length < 220 && wanted.test(t) && el.children.length === 0) {
          out.push({ text: t, classes: (el as HTMLElement).className || '' });
        }
      });
      return out.slice(0, 30);
    });
    console.log(`[${tab.slug}] STATUS-RELATED TEXT (${hits.length}):`);
    hits.forEach((h, i) => console.log(`  ${i + 1}. ${h.text}`));
  });
}
