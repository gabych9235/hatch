import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'design-cleanup');
fs.mkdirSync(SHOTS, { recursive: true });

test('Design tab — open every section, snapshot full page', async ({ page }) => {
  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(400);

  // Header should be centered hero again, not left-aligned.
  const headerLayout = await page.locator('.hx-header').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { dir: cs.flexDirection, align: cs.alignItems, text: cs.textAlign };
  });
  console.log('Header layout (expect column / center / center):', headerLayout);

  // Tab bar should be centered pill (not underline).
  const tabsLayout = await page.locator('.hx-tabs-wrap').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { justify: cs.justifyContent, border: cs.borderBottom };
  });
  console.log('Tab bar layout (expect center / no border-bottom):', tabsLayout);

  await page.screenshot({ path: path.join(SHOTS, 'design-collapsed.png'), fullPage: true });

  // Open every Design section.
  const sections = await page.locator('.hx-design-section summary').all();
  for (const s of sections) await s.click();
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(SHOTS, 'design-all-open.png'), fullPage: true });

  // Field hygiene check: sample input heights — they should all be 36px.
  const inputHeights = await page.locator('.hatch-admin .hx-input, .hatch-admin .hx-select').evaluateAll((els) => {
    const h = els.map((e) => (e as HTMLElement).offsetHeight);
    const uniq = Array.from(new Set(h));
    return { totalInputs: h.length, uniqueHeights: uniq.sort((a, b) => a - b) };
  });
  console.log('Form input height consistency:', inputHeights, '(want totalInputs > 0, uniqueHeights = [36])');

  // Color swatches should be exactly 40px wide.
  const swatchSizes = await page.locator('input[type=color]').evaluateAll((els) =>
    Array.from(new Set(els.map((e) => `${(e as HTMLElement).offsetWidth}x${(e as HTMLElement).offsetHeight}`))),
  );
  console.log('Color swatch sizes (want a single 40x36):', swatchSizes);
});
