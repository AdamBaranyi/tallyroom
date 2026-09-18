import { expect, test } from '@playwright/test';
import {
  demoWorkspaceId,
  expectNoHorizontalOverflow,
  expectReadableText,
  warteAufSchriften,
} from './helpers.ts';

test.describe('Wer ist am Zug', () => {
  test('das Dashboard teilt die offenen Anfragen auf beide Seiten auf', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/dashboard`);
    await warteAufSchriften(page);

    const abschnitt = page.getByRole('region', { name: 'Wer ist am Zug' });
    await expect(abschnitt).toBeVisible();
    await expect(abschnitt.getByRole('link', { name: /Bei uns/ })).toBeVisible();
    await expect(abschnitt.getByRole('link', { name: /Beim Kunden/ })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await expectReadableText(page);
  });

  test('der Sprung vom Dashboard filtert die Liste auf die Kundenseite', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/dashboard`);
    await warteAufSchriften(page);

    await page
      .getByRole('region', { name: 'Wer ist am Zug' })
      .getByRole('link', { name: /Beim Kunden/ })
      .click();

    await expect(page).toHaveURL(/waitingOn=client/);
    await expect(page.getByRole('heading', { name: 'Anfragen', level: 1 })).toBeVisible();

    // Jede gezeigte Anfrage liegt beim Kunden, keine bei uns. Nur sichtbare
    // Treffer zählen: Karten- und Tabellenfassung stehen beide im Baum, je
    // nach Breite ist eine davon ausgeblendet.
    await expect(
      page
        .getByText(/Beim Kunden seit/)
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await expect(page.getByText(/Bei uns seit/).filter({ visible: true })).toHaveCount(0);
  });

  test('die Anfrage selbst sagt, wer am Zug ist und seit wann', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/requests`);
    await warteAufSchriften(page);

    await page.locator('a[href*="/requests/"]').filter({ visible: true }).first().click();

    await expect(
      page
        .getByText(/(Bei uns|Beim Kunden) seit/)
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
  });
});
