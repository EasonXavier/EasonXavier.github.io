const { expect, test } = require('@playwright/test');

test('renders the portal in the selected preview preset', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle("Eason's Tools");
  await expect(page.locator('.tool-grid')).toBeVisible();
  await expect(page.locator('.release-meta-header')).toContainText('v1.5.0');
  await expect(page.locator('.section-heading')).toContainText('3 个可用 · 1 个开发中');
  await expect(page.locator('a[href="/DataSpectrum/"]')).toContainText('DataSpectrum');

  const lancelotCard = page.locator('a[href="/lancelot-gamepal-ui-playground/"]');
  await expect(lancelotCard).toContainText('朗世乐');
  await expect(lancelotCard).toContainText('移动 UI 与性能试验场');
  await expect(lancelotCard).toContainText('开发中');
  await expect(lancelotCard).toContainText('v0.1.0');
  await expect(lancelotCard).toContainText('进入试验场');
});
