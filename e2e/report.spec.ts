import { expect, test, type Page } from '@playwright/test';
import {
  demoWorkspaceId,
  expectNoHorizontalOverflow,
  expectReadableText,
  warteAufSchriften,
} from './helpers.ts';

/** Vom Kunden aus zum Bericht, ohne die Kunden-ID zu kennen. */
async function reportPath(page: Page): Promise<string> {
  await page.goto(`/app/${demoWorkspaceId()}/customers`);
  await warteAufSchriften(page);
  const href = await page.locator('a[href*="/customers/"]').first().getAttribute('href');
  return `${href ?? ''}/report`;
}

test.describe('Monatsbericht', () => {
  test('steht beim Kunden und zeigt den letzten abgeschlossenen Monat', async ({ page }) => {
    await page.goto(await reportPath(page));
    await warteAufSchriften(page);

    await expect(page.getByRole('heading', { name: 'Monatsbericht', level: 1 })).toBeVisible();
    await expect(page.getByText('Erstellt am')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Laufende Projekte' })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await expectReadableText(page);
  });

  test('wechselt den Monat über die URL', async ({ page }) => {
    const pfad = await reportPath(page);
    await page.goto(`${pfad}?month=2026-08`);
    await warteAufSchriften(page);

    await expect(page.getByText(/August 2026/)).toBeVisible();
  });

  test('sagt, woher die Zahlen kommen', async ({ page }) => {
    await page.goto(await reportPath(page));
    await warteAufSchriften(page);

    await expect(page.getByText(/aus dem laufenden Bestand und dem Protokoll/)).toBeVisible();
  });
});
