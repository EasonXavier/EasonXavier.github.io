const { expect, test } = require('@playwright/test');

test('renders the portal in the selected preview preset', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle("Eason's Tools");
  await expect(page.locator('.tool-grid')).toBeVisible();
  await expect(page.locator('.release-meta-header')).toContainText('v1.4.0');
  await expect(page.locator('a[href="/DataSpectrum/"]')).toContainText('DataSpectrum');
});
