const { expect, test } = require('@playwright/test');

test('renders portal 1.5.1 with canonical repository routes', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle("Eason's Tools");
  await expect(page.locator('.tool-grid')).toBeVisible();
  await expect(page.locator('.release-meta-header')).toContainText('v1.5.1');
  await expect(page.locator('.section-heading')).toContainText('3 个可用 · 1 个开发中');

  const qrCard = page.locator('a[href="/single-device-dftfa/"]');
  await expect(qrCard.locator('.card-version')).toHaveAttribute(
    'title',
    'single-device-dftfa main · v1.5.1',
  );

  const foodCard = page.locator('a[href="/what-to-eat-today/"]');
  await expect(foodCard.locator('.card-version')).toHaveAttribute(
    'title',
    'what-to-eat-today main · v1.2.0',
  );

  const dataCard = page.locator('a[href="/data-spectrum/"]');
  await expect(dataCard).toContainText('DataSpectrum');
  await expect(dataCard.locator('.card-version')).toHaveAttribute(
    'title',
    'data-spectrum main · v0.4.1',
  );

  const lancelotCard = page.locator('a[href="/lancelot-gamepal-ui-playground/"]');
  await expect(lancelotCard).toContainText('朗世乐');
  await expect(lancelotCard).toContainText('移动 UI 与性能试验场');
  await expect(lancelotCard).toContainText('开发中');
  await expect(lancelotCard).toContainText('v0.1.0');
  await expect(lancelotCard).toContainText('进入试验场');
});
