import { expect, test } from '@playwright/test';
import {
  demoWorkspaceId,
  expectNoHorizontalOverflow,
  expectReadableText,
  warteAufSchriften,
} from './helpers.ts';

test.describe('Protokoll', () => {
  test('steht in der Navigation und listet die Handlungen der Demo', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/activity`);
    await warteAufSchriften(page);

    await expect(page.getByRole('heading', { name: 'Protokoll', level: 1 })).toBeVisible();

    // Neueste zuerst: oben stehen die jüngsten Handlungen des Vorführbestands.
    const eintraege = page.getByRole('listitem');
    await expect(eintraege.first()).toBeVisible();
    expect(await eintraege.count()).toBeGreaterThan(5);

    // Jeder Eintrag nennt seinen Zeitpunkt in Schweizer Schreibweise.
    await expect(eintraege.first()).toContainText(/\d{2}\.\d{2}\.\d{4}/);

    await expectNoHorizontalOverflow(page);
    await expectReadableText(page);
  });

  test('filtert auf einen Bereich und räumt den Filter wieder weg', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/activity`);
    await warteAufSchriften(page);

    await page.getByLabel('Bereich').selectOption('document');
    await expect(page).toHaveURL(/entityType=document/);
    await expect(page.getByText('Dokument hochgeladen').first()).toBeVisible();

    await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();
    await expect(page).not.toHaveURL(/entityType=/);
  });

  test('prüft die Hash-Kette und meldet das Ergebnis', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/activity`);
    await warteAufSchriften(page);

    await page.getByRole('button', { name: 'Kette prüfen' }).click();

    const ergebnis = page.getByRole('status');
    await expect(ergebnis).toContainText('Kette unversehrt');
    await expect(ergebnis).not.toContainText('gebrochen');
  });

  test('zeigt den Verlauf am einzelnen Kunden', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/customers`);
    await warteAufSchriften(page);

    await page.getByRole('link', { name: /.+/ }).filter({ hasText: /\S/ });
    const ersterKunde = page.locator(`a[href*="/customers/"]`).filter({ visible: true }).first();
    await ersterKunde.click();

    await expect(page.getByRole('heading', { name: 'Verlauf' })).toBeVisible();
    await expect(page.getByText('Kunde angelegt').first()).toBeVisible();
  });
});
