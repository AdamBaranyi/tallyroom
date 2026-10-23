import { expect, test, type Page } from '@playwright/test';
import { demoWorkspaceId, warteAufSchriften } from './helpers.ts';

/**
 * Zählt, wie viele Bedienelemente ausserhalb des Dialogs sich noch fokussieren
 * lassen.
 *
 * Das ist die belastbare Prüfung der Fokusfalle. Zwanzigmal Tab zu drücken und
 * zu schauen, wo man landet, sagt hier wenig: der Headless-Shell hat keine
 * Browserleiste, an die der Fokus hinter dem letzten Element wandern könnte,
 * und `document.activeElement` fällt dann auf `body` zurück — das sieht nach
 * einem Leck aus, ist aber keins. `focus()` direkt aufzurufen und zu prüfen,
 * ob es gewirkt hat, hängt an keiner Umgebung.
 */
async function fokussierbarerHintergrund(
  page: Page,
): Promise<{ gesamt: number; erreicht: number }> {
  return page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]');
    const hintergrund = [...document.querySelectorAll('a, button, input, select, textarea')].filter(
      (el) => !dialog?.contains(el),
    );
    let erreicht = 0;
    for (const el of hintergrund) {
      (el as HTMLElement).focus();
      if (document.activeElement === el) erreicht += 1;
    }
    return { gesamt: hintergrund.length, erreicht };
  });
}

async function fokusImDialog(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]');
    const aktiv = document.activeElement;
    // `body` heisst „nirgends" und nicht „im Hintergrund"; siehe oben.
    return Boolean(dialog && aktiv && (dialog.contains(aktiv) || aktiv === document.body));
  });
}

test.describe('Fokus und Tastatur', () => {
  test('der Dialog sperrt den Hintergrund aus', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/customers`);
    await warteAufSchriften(page);

    // Ohne eine Eingabe hat das Dokument im Headless-Betrieb keinen Fokus,
    // und dann setzt `focus()` nichts — das sähe wie eine gesperrte Seite aus.
    await page.getByRole('heading', { name: 'Kunden' }).click();

    const vorher = await fokussierbarerHintergrund(page);
    expect(vorher.erreicht, 'ohne Dialog muss die Seite bedienbar sein').toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Kunde anlegen' }).first().click();
    await expect(page.locator('dialog[open]')).toBeVisible();

    const waehrend = await fokussierbarerHintergrund(page);
    expect(waehrend.gesamt, 'der Hintergrund ist noch da').toBeGreaterThan(0);
    expect(
      waehrend.erreicht,
      `${waehrend.erreicht} von ${waehrend.gesamt} Elementen hinter dem Dialog waren erreichbar`,
    ).toBe(0);
  });

  test('der Dialog gibt den Fokus an seinen Auslöser zurück', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/customers`);
    await warteAufSchriften(page);

    // Per Tastatur geöffnet: für sie ist die Rückgabe da. Safari fokussiert
    // einen Knopf bei einem Mausklick gar nicht erst, dann gibt es nichts,
    // wohin der Fokus zurückkehren könnte (DIAGNOSTICS Nummer 22).
    const ausloeser = page.getByRole('button', { name: 'Kunde anlegen' }).first();
    await ausloeser.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('dialog[open]')).toBeVisible();
    expect(await fokusImDialog(page)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);

    // Sonst beginnt die Tastaturbedienung nach jedem Dialog wieder ganz oben.
    await expect(ausloeser).toBeFocused();
  });

  test('die Kommandopalette sperrt den Hintergrund und gibt den Fokus zurück', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/dashboard`);
    await warteAufSchriften(page);

    const ausloeser = page.getByRole('button', { name: /Suche öffnen/i });
    await ausloeser.focus();
    await page.keyboard.press('Enter');

    const eingabe = page.getByRole('dialog').getByRole('combobox');
    await expect(eingabe).toBeFocused();

    await eingabe.fill('berg');
    await expect(page.getByRole('option').first()).toBeVisible();

    const waehrend = await fokussierbarerHintergrund(page);
    expect(waehrend.erreicht).toBe(0);

    await eingabe.focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(ausloeser).toBeFocused();
  });

  test('die Palette springt mit der Tastatur an den markierten Treffer', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/dashboard`);
    await warteAufSchriften(page);

    await page.getByRole('button', { name: /Suche öffnen/i }).click();
    const eingabe = page.getByRole('dialog').getByRole('combobox');
    await eingabe.fill('berg');

    const treffer = page.getByRole('option');
    await expect(treffer.first()).toBeVisible();
    await expect(treffer.first()).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowDown');
    await expect(treffer.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(treffer.first()).toHaveAttribute('aria-selected', 'false');

    // Der Titel steht in der mittleren Spalte des Treffers, zwischen Art und
    // Untertitel.
    const zweiterTitel = ((await treffer.nth(1).locator('span').nth(1).textContent()) ?? '').trim();
    await page.keyboard.press('Enter');

    await page.waitForURL(/\/app\/[0-9a-f-]+\/(customers|projects|contracts|requests)\/[0-9a-f-]+/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(zweiterTitel);
  });

  test('die Sprungmarke führt zum Inhalt', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/dashboard`);
    await warteAufSchriften(page);

    const marke = page.getByRole('link', { name: 'Zum Inhalt springen' });
    await marke.focus();
    // Sie steht ausserhalb des Bildes, bis sie den Fokus bekommt.
    await expect(marke).toBeInViewport();

    await marke.press('Enter');
    expect(new URL(page.url()).hash).toBe('#inhalt');
  });

  test('jedes Bedienelement zeigt einen sichtbaren Fokusring', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/customers`);
    await warteAufSchriften(page);

    const suchfeld = page.getByRole('searchbox', { name: 'Kunden durchsuchen' });
    await suchfeld.focus();

    const ring = await suchfeld.evaluate((el) => {
      const stil = getComputedStyle(el);
      return { style: stil.outlineStyle, width: Number.parseFloat(stil.outlineWidth) };
    });

    // Der Ring ist die einzige Fokusanzeige der Anwendung. Er war einmal mit
    // outline-none abgeschaltet und durch einen Rahmenwechsel in Tinte
    // ersetzt — auf einem Rahmen aus Tinte unsichtbar.
    expect(ring.style).not.toBe('none');
    expect(ring.width).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Anmeldung', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /*
   * Ein Knopf, der beim Absenden `disabled` wird, verliert den Fokus: Chromium,
   * Firefox und WebKit schieben ihn dann auf `body` (nachgemessen 22.10.2026).
   * Wer mit Tastatur oder Screenreader arbeitet, steht danach nirgends, und NVDA
   * sagte unter Firefox 157 das Dokument statt der Fehlermeldung an. Der
   * Screenreader-Test hiess schon «ohne dass der Fokus springt», prüfte es aber
   * nicht. Hier wird es geprüft: während der Prüfung und danach.
   */
  test('der Fokus bleibt beim Absenden auf dem Knopf, und ein zweites Enter sendet nichts', async ({
    page,
  }) => {
    let anfragen = 0;
    let freigeben: () => void = () => {};
    const gehalten = new Promise<void>((weiter) => (freigeben = weiter));
    await page.route('**/auth/login', async (route) => {
      anfragen += 1;
      await gehalten;
      await route.continue();
    });

    await page.goto('/login');
    await warteAufSchriften(page);
    await page.getByLabel('E-Mail').fill('niemand@tallyroom.test');
    await page.getByLabel('Passwort').fill('falsches-passwort-2026');

    const knopf = page.locator('form button[type="submit"]');
    await knopf.focus();
    await page.keyboard.press('Enter');

    // Gesperrt heisst hier `aria-disabled`, nicht `disabled`: Beides meldet der
    // Knopf als nicht verfügbar, aber nur `disabled` wirft den Fokus hinaus.
    await expect(knopf).toHaveText('Wird geprüft …');
    await expect(knopf).toBeDisabled();
    await expect(knopf).toBeFocused();

    await page.keyboard.press('Enter');
    freigeben();

    // Sechs Breiten sind sechs Versuche. Das Anmelde-Limit lässt fünf je
    // Viertelstunde und Adresse zu; seine Meldung kommt im selben Bereich.
    await expect(page.getByRole('alert')).toHaveText(
      /^(E-Mail oder Passwort ist falsch\.|Zu viele Versuche\. Bitte später erneut probieren\.)$/,
    );
    await expect(knopf).toHaveText('Anmelden');
    await expect(knopf).toBeFocused();
    expect(anfragen, 'das zweite Enter während der Prüfung darf nichts senden').toBe(1);
  });

  /*
   * Eine Meldung, die mit ihrem Behälter erscheint, sagt ein Screenreader nicht
   * zuverlässig an (DIAGNOSTICS 29). Der Alarmbereich steht darum schon vor der
   * ersten Meldung leer im Dokument.
   */
  test('der Alarmbereich steht schon vor der ersten Meldung', async ({ page }) => {
    await page.goto('/login');
    await warteAufSchriften(page);

    await expect(page.getByRole('alert')).toHaveCount(1);
    await expect(page.getByRole('alert')).toHaveText('');
  });
});
