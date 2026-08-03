import { expect, test } from '@playwright/test';

/**
 * Завершает загрузочный экран, закрывает стартовую модалку и ждёт настоящую
 * инициализацию canvas. Это защищает entry point от ошибок, которые DOM-stub
 * Vitest не способен воспроизвести.
 */
async function openGame(page: import('@playwright/test').Page): Promise<void> {
  // Достаточно DOM: загрузка опциональных спрайтов не должна блокировать smoke.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#loadingScreen').click();
  await expect(page.locator('#loadingScreen')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#board')).toBeVisible();
}

test('загружает игру и открывает визуальный редактор сценария', async ({ page }) => {
  await openGame(page);

  await page.locator('#btnEditor').click();
  await expect(page.locator('#editorBar')).toBeVisible();

  // data-tool не зависит от локализованной подписи кнопки.
  await page.locator('#editorActions button[data-tool="scenario"]').click();
  await expect(page.locator('#mTitle')).toHaveText(/Scenario Step Editor|Редактор шагов сценария/);
  await expect(page.locator('.scenario-editor-form')).toBeVisible();
  await expect(page.locator('#mActions button')).toHaveCount(5);

  const steps = page.locator('.scenario-editor-steps button');
  await expect(steps).toHaveCount(1);
  await page.locator('#mActions button').nth(0).click();
  await expect(steps).toHaveCount(2);
  await page.locator('#mActions button').nth(2).click();
  await expect(steps).toHaveCount(1);
});
