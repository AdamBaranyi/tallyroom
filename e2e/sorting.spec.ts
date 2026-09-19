import { expect, test } from '@playwright/test';
import { demoWorkspaceId, warteAufSchriften } from './helpers.ts';

/** Die Tabellen stehen erst ab 1024 Pixeln; darunter sind es Karten. */
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, 'Nur dort, wo es eine Tabelle gibt.');

test.describe('Sortieren', () => {
  test('ordnet die Kundenliste nach Namen um und sagt es Screenreadern', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/customers`);
    await warteAufSchriften(page);

    const spalte = page.getByRole('columnheader', { name: 'Name' });
    await expect(spalte).toHaveAttribute('aria-sort', 'ascending');

    const ersterAufsteigend = await page.locator('tbody tr').first().innerText();

    await spalte.getByRole('button').click();
    await expect(page).toHaveURL(/direction=desc/);
    await expect(spalte).toHaveAttribute('aria-sort', 'descending');

    const ersterAbsteigend = await page.locator('tbody tr').first().innerText();
    expect(ersterAbsteigend).not.toBe(ersterAufsteigend);
  });

  test('behält die Sortierung im Link', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/customers?sort=activeProjectCount&direction=desc`);
    await warteAufSchriften(page);

    const spalte = page.getByRole('columnheader', { name: /Laufende/ });
    await expect(spalte).toHaveAttribute('aria-sort', 'descending');
  });

  test('fällt bei erfundener Sortierung auf die Vorgabe zurück', async ({ page }) => {
    const workspaceId = demoWorkspaceId();
    await page.goto(`/app/${workspaceId}/customers?sort=gibtesnicht`);
    await warteAufSchriften(page);

    // Keine leere Liste, keine Fehlermeldung: die Vorgabe greift.
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  test('sortiert auch Projekte, Verträge und Anfragen', async ({ page }) => {
    const workspaceId = demoWorkspaceId();

    for (const [bereich, spalte] of [
      ['projects', 'Projekt'],
      ['contracts', 'Bezeichnung'],
      ['requests', 'Betreff'],
    ] as const) {
      await page.goto(`/app/${workspaceId}/${bereich}`);
      await warteAufSchriften(page);

      const kopf = page.getByRole('columnheader', { name: spalte });
      await kopf.getByRole('button').click();
      await expect(page).toHaveURL(/sort=/);
      await expect(kopf).toHaveAttribute('aria-sort', /ascending|descending/);
    }
  });
});
