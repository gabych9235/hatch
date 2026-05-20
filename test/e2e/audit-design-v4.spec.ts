import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'design-v4-shots');
fs.mkdirSync(SHOTS, { recursive: true });

test('Design tab v4 — Elementor-style sections, all collapsed, no in-card Save', async ({ page }) => {
  page.on('pageerror', (err) => console.log('[PAGEERROR]', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[CONSOLE.ERR]', msg.text());
  });

  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SHOTS, 'design-v4-default.png'), fullPage: true });

  const txt = await page.locator('body').innerText();

  // All 6 sections present in the labels (collapsed but visible).
  const sectionsPresent = [
    ['Brand colors',         txt.includes('Brand colors')],
    ['Typography',           txt.includes('Typography')],
    ['Layout',               txt.includes('Layout')],
    ['Buttons',              txt.includes('Buttons')],
    ['Borders & shadows',    txt.includes('Borders & shadows')],
    ['Breakpoints',          txt.includes('Breakpoints')],
    ['Site identity',        txt.includes('Site identity')],
    ['Page templates',       txt.includes('Page templates')],
  ];
  for (const [name, present] of sectionsPresent) console.log(`Section "${name}":`, present);

  // Verify all <details> sections in the Design form start CLOSED.
  const detailsState = await page.locator('.hx-design-section').evaluateAll((els) =>
    els.map((el) => ({ open: (el as HTMLDetailsElement).open, label: el.querySelector('summary span')?.textContent?.trim() }))
  );
  console.log('Details open state:');
  detailsState.forEach((s) => console.log(` - ${s.label}: open=${s.open}`));
  const anyOpen = detailsState.filter((d) => d.open).length;
  console.log(`Any sections open by default: ${anyOpen} (expected 0)`);

  // Verify the in-card Save button is GONE.
  const inCardSaveBtns = await page.locator('#hx-design-visual button.is-primary').count();
  console.log('In-card Save buttons inside design form:', inCardSaveBtns, '(expected 0)');

  // Open the Brand colors section and verify it has 7 color slots now.
  await page.locator('.hx-design-section summary:has-text("Brand colors")').click();
  await page.waitForTimeout(200);
  const colorInputs = await page.locator('input[type=color][name^="hatch_design[brand]"]').count();
  console.log('Brand color inputs after expand:', colorInputs, '(expected 7: primary/secondary/accent/bg/fg/muted/border)');
  await page.screenshot({ path: path.join(SHOTS, 'design-v4-brand-open.png'), fullPage: true });

  // Open Typography and verify per-level rows exist.
  await page.locator('.hx-design-section summary:has-text("Typography")').click();
  await page.waitForTimeout(200);
  const typeLevels = await page.locator('input[name^="hatch_design[typography]"][name$="[size]"]').count();
  console.log('Per-level typography rows:', typeLevels, '(expected 8: h1-h6 + body + small)');
  await page.screenshot({ path: path.join(SHOTS, 'design-v4-typography-open.png'), fullPage: true });

  // Open Buttons and verify the three variants render.
  await page.locator('.hx-design-section summary:has-text("Buttons")').click();
  await page.waitForTimeout(200);
  const buttonVariants = await page.locator('input[name^="hatch_design[buttons][primary]"], input[name^="hatch_design[buttons][secondary]"], input[name^="hatch_design[buttons][ghost]"]').count();
  console.log('Button variant fields (sum across 3 variants):', buttonVariants);
  await page.screenshot({ path: path.join(SHOTS, 'design-v4-buttons-open.png'), fullPage: true });

  // Edit a button field and verify the sticky save bar appears.
  await page.locator('input[name="hatch_design[buttons][primary][radius]"]').fill('12');
  await page.waitForTimeout(200);
  const saveBarVisible = await page.locator('.hatch-save-bar.is-visible').count();
  console.log('Sticky save bar visible after edit:', saveBarVisible);

  // Save via the sticky bar.
  await page.locator('.hatch-save-bar .hx-sb-save').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SHOTS, 'design-v4-after-save.png'), fullPage: true });
});
