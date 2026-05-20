import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS = path.join(__dirname, '..', 'test-results', 'phase1-4-21');
fs.mkdirSync(SHOTS, { recursive: true });

test('1.4 / 1.5 / 1.6 / 2.1 — controls + collapse + spacing + connector refactor', async ({ page }) => {
  page.on('pageerror', (err) => console.log('[PAGEERROR]', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[CONSOLE.ERR]', msg.text());
  });

  // 1.4 Yes/No → toggle on Design Page Templates section
  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(300);
  await page.locator('.hx-design-section summary:has-text("Page templates")').click();
  await page.waitForTimeout(200);
  const archiveExcerptToggle = await page.locator('input[type=checkbox][name="hatch_design[templates][archive_excerpt]"]').count();
  const notFoundSearchToggle = await page.locator('input[type=checkbox][name="hatch_design[templates][not_found_search]"]').count();
  const oldArchiveExcerptRadios = await page.locator('input[type=radio][name="hatch_design[templates][archive_excerpt]"]').count();
  console.log('Archive-excerpt is now toggle (checkbox):', archiveExcerptToggle, '(expect 1)');
  console.log('Not-found-search is now toggle (checkbox):', notFoundSearchToggle, '(expect 1)');
  console.log('Old archive_excerpt radios still present:', oldArchiveExcerptRadios, '(expect 0)');

  // 1.4 segment-chip rendering: density/roundness now use .hx-segment class
  await page.locator('.hx-design-section summary:has-text("Layout")').click();
  await page.waitForTimeout(200);
  const segmentChipsInLayout = await page.locator('.hx-segment').count();
  console.log('Segment-chips visible inside Layout section:', segmentChipsInLayout);
  await page.screenshot({ path: path.join(SHOTS, 'design-toggles-segments.png'), fullPage: true });

  // 1.5 All <details> closed by default — visit each tab and count any open ones.
  let totalOpenByDefault = 0;
  for (const tab of ['connector', 'design', 'content', 'performance', 'security', 'status']) {
    await page.goto(`/wp-admin/tools.php?page=hatch&tab=${tab}`);
    await page.waitForTimeout(250);
    const detailsState = await page.locator('details').evaluateAll((els) =>
      els.map((el) => ({ open: (el as HTMLDetailsElement).open })),
    );
    const open = detailsState.filter((d) => d.open).length;
    if (open > 0) console.log(`[${tab}] details open by default:`, open);
    totalOpenByDefault += open;
  }
  console.log(`Total details open across all tabs: ${totalOpenByDefault} (expect 0)`);

  // 2.1 Connector tab — three previously always-open cards should now be collapsed details.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=connector');
  await page.waitForTimeout(300);
  const fcDetails = await page.locator('details:has-text("Frontend credentials")').count();
  const whDetails = await page.locator('details:has-text("Where to host")').count();
  const ctDetails = await page.locator('details:has-text("Hatch Companion theme")').count();
  console.log('Connector "Frontend credentials" is a <details>:', fcDetails);
  console.log('Connector "Where to host" is a <details>:', whDetails);
  console.log('Connector "Hatch Companion theme" is a <details>:', ctDetails);
  await page.screenshot({ path: path.join(SHOTS, 'connector-collapsed.png'), fullPage: true });

  // Open Frontend credentials and verify content is reachable.
  if (fcDetails) {
    await page.locator('details:has-text("Frontend credentials") summary').click();
    await page.waitForTimeout(200);
    const envBlock = await page.locator('#hatch-env-block').count();
    console.log('Env block textarea reachable after expand:', envBlock);
  }

  // 1.6 Padding sanity — sample a few hx-card paddings to confirm scale.
  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(300);
  const padSamples = await page.locator('.hx-card').evaluateAll((els) =>
    els.slice(0, 5).map((el) => getComputedStyle(el).padding),
  );
  console.log('Sample of .hx-card paddings (Design tab):', padSamples);
});
