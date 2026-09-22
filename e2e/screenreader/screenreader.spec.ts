import { screenReaderTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { expectEventuallySays, expectSays, moveUntilSays, startDemo } from './helpers.ts';

/**
 * Was ein Mensch mit Screenreader hört — mit echtem VoiceOver auf macOS und
 * echtem NVDA unter Windows. Jede Prüfung gilt einer Stelle, die axe nicht
 * beurteilen kann: ob eine Meldung angesagt wird, wohin der Fokus geht, ob ein
 * Dialog seinen Namen nennt.
 *
 * Die Rollen sagt der Screenreader in seiner eigenen Sprache an, auf den
 * Rechnern von GitHub englisch; die Namen kommen aus der Oberfläche, deutsch.
 */

test.describe('Startseite', () => {
  test('nennt die Hauptüberschrift und den Zustand des Pausenknopfs', async ({
    page,
    screenReader,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await screenReader.navigateToWebContent();

    await moveUntilSays(screenReader, () => screenReader.nextHeading(), [
      'Kundenübersicht und Kundenportal für kleine Agenturen',
      'heading',
    ]);

    const pause = page.getByRole('button', { name: 'Bewegung anhalten' });
    const fokus = await screenReader.capture(() => pause.focus());
    expectSays(fokus.spokenPhrase, 'Bewegung anhalten', 'button');

    const gedrueckt = await screenReader.capture(() => pause.press('Space'));
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    // «on» wäre als Variante zu kurz: es steckt schon in «button».
    expectSays(gedrueckt.spokenPhrase, ['pressed', 'selected', 'gedrückt']);
  });
});

test.describe('Anmeldung', () => {
  test('führt bei leerem Formular zum Feld und sagt den Fehler', async ({ page, screenReader }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Anmelden', level: 1 })).toBeVisible();
    await screenReader.navigateToWebContent();

    const senden = page.getByRole('button', { name: 'Anmelden' });
    await screenReader.capture(() => senden.click(), { capture: true });

    await expect(page.getByLabel('E-Mail')).toBeFocused();
    await expectEventuallySays(screenReader, ['E-Mail', 'invalid', 'E-Mail ist erforderlich']);
  });

  test('sagt falsche Zugangsdaten an, ohne dass der Fokus springt', async ({
    page,
    screenReader,
  }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Anmelden', level: 1 })).toBeVisible();
    await screenReader.navigateToWebContent();

    await page.getByLabel('E-Mail').fill('niemand@tallyroom.test');
    await page.getByLabel('Passwort').fill('falsches-passwort-2026');
    await screenReader.capture(() => page.getByRole('button', { name: 'Anmelden' }).click(), {
      capture: true,
    });

    await expect(page.getByRole('alert')).toHaveText('E-Mail oder Passwort ist falsch.');
    await expectEventuallySays(screenReader, ['E-Mail oder Passwort ist falsch']);
  });
});

test.describe('Teamansicht', () => {
  test('beginnt mit dem Sprunglink und nennt die Hauptüberschrift', async ({
    page,
    screenReader,
  }) => {
    await startDemo(page);
    await screenReader.navigateToWebContent();

    // Über die Navigation des Screenreaders, nicht über Tab: In Safari erreicht
    // Tab Links nur, wenn das in den Einstellungen eingeschaltet ist.
    await moveUntilSays(
      screenReader,
      () => screenReader.next(),
      ['Zum Inhalt springen', 'link'],
      5,
    );

    await moveUntilSays(screenReader, () => screenReader.nextHeading(), ['Dashboard', 'heading']);
  });

  test('sagt das Ergebnis der Kettenprüfung an', async ({ page, screenReader }) => {
    const workspaceId = await startDemo(page);
    await page.goto(`/app/${workspaceId}/activity`);
    const pruefen = page.getByRole('button', { name: 'Kette prüfen' });
    await expect(pruefen).toBeVisible();
    await screenReader.navigateToWebContent();

    await screenReader.capture(
      async () => {
        await pruefen.click();
        await expect(page.getByText(/Kette unversehrt/)).toBeVisible();
      },
      { capture: true },
    );

    await expectEventuallySays(screenReader, ['Kette unversehrt']);
  });

  test('öffnet den Dialog mit Namen und gibt den Fokus beim Schliessen zurück', async ({
    page,
    screenReader,
  }) => {
    const workspaceId = await startDemo(page);
    await page.goto(`/app/${workspaceId}/customers`);
    const anlegen = page.getByRole('button', { name: 'Kunde anlegen' });
    await expect(anlegen).toBeVisible();
    await screenReader.navigateToWebContent();

    // Per Tastatur ausgelöst, wie mit Screenreader: Safari setzt den Fokus bei
    // einem Mausklick nicht auf den Knopf, und ohne Fokus gäbe es nichts, wohin
    // der Dialog ihn zurückgeben könnte.
    await anlegen.focus();
    const offen = await screenReader.capture(() => page.keyboard.press('Enter'), {
      capture: true,
    });
    await expect(page.getByRole('dialog', { name: 'Kunde anlegen' })).toBeVisible();
    expectSays(offen.spokenPhrase, 'Kunde anlegen', 'dialog');

    const zu = await screenReader.capture(() => page.keyboard.press('Escape'), {
      capture: true,
    });
    await expect(anlegen).toBeFocused();
    expectSays(zu.spokenPhrase, 'Kunde anlegen', 'button');
  });

  test('nennt das Suchfeld der Kommandopalette und den markierten Treffer', async ({
    page,
    screenReader,
  }) => {
    await startDemo(page);
    const oeffnen = page.getByRole('button', { name: /Springen zu/ });
    await expect(oeffnen).toBeVisible();
    await screenReader.navigateToWebContent();

    const offen = await screenReader.capture(() => oeffnen.click(), { capture: true });
    const feld = page.getByRole('combobox', {
      name: 'Kunde, Projekt, Vertrag oder Anfrage suchen',
    });
    await expect(feld).toBeFocused();
    expectSays(offen.spokenPhrase, 'Kunde, Projekt, Vertrag oder Anfrage suchen');

    await feld.fill('Alpenblick');
    await expect(page.getByRole('option').first()).toBeVisible();
    await screenReader.capture(() => page.keyboard.press('ArrowDown'), { capture: true });

    await expectEventuallySays(screenReader, ['Alpenblick']);
  });
});
