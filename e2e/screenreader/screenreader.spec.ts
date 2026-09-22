import { screenReaderTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import {
  expectEventuallySays,
  expectSays,
  expectSaysNot,
  moveUntilSays,
  says,
  startDemo,
} from './helpers.ts';

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
  /*
   * Ohne Sprung über die Überschriften: Vor dem Start drückt Guidepup unter
   * NVDA einmal Tab, und auf der Startseite ist das erste Bedienelement die
   * Sprachauswahl. NVDA steht danach im Fokusmodus, und die Taste für die
   * nächste Überschrift ginge an die Auswahlliste. Die Überschriften prüft der
   * Test der Teamansicht; hier zählt der Knopf, den WCAG 2.2.2 verlangt.
   */
  test('nennt den Pausenknopf mit Namen, Rolle und Zustand', async ({ page, screenReader }) => {
    await page.goto('/');
    const pause = page.getByRole('button', { name: 'Bewegung anhalten' });
    await expect(pause).toBeVisible();
    await screenReader.navigateToWebContent();

    const vorher = await screenReader.capture(() => pause.focus(), { capture: true });
    expectSays(vorher.spokenPhrase, 'Bewegung anhalten', 'button');

    await pause.press('Space');
    await expect(pause).toHaveAttribute('aria-pressed', 'true');

    // Den Wechsel selbst sagte VoiceOver nicht an. Geprüft wird darum, was ein
    // Mensch hört, der wieder auf den Knopf kommt: der Zustand steht dabei.
    await page.getByRole('button', { name: 'Demo starten' }).focus();
    const nachher = await screenReader.capture(() => pause.focus(), { capture: true });
    expectSays(nachher.spokenPhrase, 'Bewegung anhalten', ['pressed', 'selected']);
    expectSaysNot(nachher.spokenPhrase, 'not pressed', 'not selected');
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
        await expect(page.getByRole('status')).toContainText('Kette unversehrt');
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

  test('sagt die Treffer der Kommandopalette an und folgt den Pfeilen', async ({
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
    expectSays(
      offen.spokenPhrase,
      'Kunde, Projekt, Vertrag oder Anfrage suchen',
      'Mit den Pfeiltasten einen Treffer wählen',
    );
    // «↵» las NVDA als «downwards arrow corner leftwards» vor. Nicht auf «arrow»
    // prüfen: VoiceOver nennt in seinen eigenen Hinweisen Tasten beim Namen.
    expectSaysNot(offen.spokenPhrase, 'corner leftwards');

    // «Web» trifft in der Demo vier Einträge; so gibt es einen zweiten, zu dem
    // der Pfeil wandern kann. Die Eingabe steht in `capture`: Guidepup hört nur
    // während seiner eigenen Befehle zu, eine Statusmeldung danach ginge verloren.
    const treffer = page.getByRole('option');
    const gesucht = await screenReader.capture(
      async () => {
        await feld.fill('Web');
        await expect(treffer.nth(1)).toBeVisible();
        await expect(page.getByRole('dialog').getByRole('status')).toContainText('Treffer');
      },
      { capture: true },
    );
    const anzahl = await treffer.count();
    const zweiter = await treffer.nth(1).locator('span').nth(1).textContent();

    // Dass es Treffer gibt, sagen beide — NVDA über die Statuszeile («4 Treffer,
    // markiert: …»), VoiceOver über seine eigene Liste («expanded list Treffer
    // 4 items»). Welcher markiert ist, sagt VoiceOver dabei nicht; das ist seine
    // Grenze, nicht die des Markups (DIAGNOSTICS Nummer 29).
    expectSays(gesucht.spokenPhrase, [`${anzahl} Treffer`, `${anzahl} items`]);

    const pfeil = await screenReader.capture(
      async () => {
        await page.keyboard.press('ArrowDown');
        await expect(feld).toHaveAttribute('aria-activedescendant', 'palette-treffer-1');
      },
      { capture: true },
    );
    // Beim Wandern müssen es beide sagen: Sonst wüsste niemand, wo er steht.
    // Geprüft wird auch danach noch: Einmal sagte NVDA im Fenster der Aufnahme
    // erst den vorher markierten Treffer an und den neuen kurz darauf.
    if (!says(pfeil.spokenPhrase, zweiter ?? '')) {
      await expectEventuallySays(screenReader, [zweiter ?? '']);
    }
  });
});
