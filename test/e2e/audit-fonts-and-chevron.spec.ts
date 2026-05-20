import { test, expect } from '@playwright/test';

test('Design tab — fonts, chevron, no duplicate Site Name', async ({ page }) => {
  await page.goto('/wp-admin/tools.php?page=hatch&tab=design');
  await page.waitForTimeout(500);

  // 1. Brand colors section open — no Site Name input.
  await page.locator('.hx-design-section summary:has-text("Brand colors")').click();
  await page.waitForTimeout(200);
  const siteNameField = await page.locator('input[name="hatch_design[brand][name]"]').count();
  console.log('Site name input in Brand section:', siteNameField, '(expect 0)');

  // 2. Help card pointing at WP General Settings.
  const helpCardText = await page.locator('.hx-design-section:has-text("Brand colors") .hx-help').first().innerText();
  console.log('WP General Settings helper present:', helpCardText.includes('WP General Settings'));

  // 3. Typography section: count options in heading-font select.
  await page.locator('.hx-design-section summary:has-text("Typography")').click();
  await page.waitForTimeout(200);
  const fontCount = await page.locator('select[name="hatch_design[brand][font_heading]"] option').count();
  const optgroupCount = await page.locator('select[name="hatch_design[brand][font_heading]"] optgroup').count();
  console.log('Heading-font options:', fontCount, '(expect > 100)');
  console.log('Heading-font optgroups:', optgroupCount, '(expect 5)');

  // 4. Live font preview — closed select's font-family should match value.
  const selectFontFamily = await page.locator('select[name="hatch_design[brand][font_heading]"]').evaluate(
    (el) => (el as HTMLElement).style.fontFamily,
  );
  console.log('Heading-font select inline font-family:', selectFontFamily);

  // 5. Change heading font and verify the JS reapplies.
  await page.selectOption('select[name="hatch_design[brand][font_heading]"]', 'Playfair Display');
  await page.waitForTimeout(300);
  const after = await page.locator('select[name="hatch_design[brand][font_heading]"]').evaluate(
    (el) => (el as HTMLElement).style.fontFamily,
  );
  console.log('After switch to Playfair Display:', after);

  // 6. Chevron on summary.
  const chevronVisible = await page.locator('.hx-design-section summary').first().evaluate((el) => {
    const before = getComputedStyle(el, '::before');
    return { width: before.width, height: before.height, transform: before.transform };
  });
  console.log('Summary chevron:', chevronVisible, '(width/height > 0 = chevron rendered)');
});
