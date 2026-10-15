import { expect, test, type Page } from '@playwright/test';
import {
  demoWorkspaceId,
  expectNoHorizontalOverflow,
  expectReadableText,
  warteAufSchriften,
} from './helpers.ts';

/** «seit heute», «seit 1 Tag», «44 Tage» … als Zahl. */
function tage(text: string | null): number {
  if (/heute/.test(text ?? '')) return 0;
  const zahl = /(\d+) Tag/.exec(text ?? '')?.[1];
  if (zahl === undefined) throw new Error(`Keine Tageszahl in «${text}»`);
  return Number(zahl);
}

/** Was «Wer ist am Zug» über die offenen Anfragen sagt. */
async function lage(page: Page) {
  const abschnitt = page.getByRole('region', { name: 'Wer ist am Zug' });
  const zahl = async (name: RegExp) =>
    Number(/\d+/.exec((await abschnitt.getByRole('link', { name }).textContent()) ?? '')?.[0]);
  const text = (await abschnitt.textContent()) ?? '';
  return {
    offen: (await zahl(/Bei uns/)) + (await zahl(/Beim Kunden/)),
    aeltester: tage(/Ältester Vorgang\s*(\d+ Tage?)/.exec(text)?.[1] ?? null),
  };
}

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
    // Nur offene Anfragen: eine erledigte wartet auf niemanden und hat darum
    // keine Zeile. Ohne Filter entschied der Zufall, was oben steht — alle
    // Demo-Anfragen tragen denselben Änderungszeitpunkt, bei Gleichstand
    // ordnet die ID, und die ist in jeder Demo eine andere.
    await page.goto(`/app/${workspaceId}/requests?waitingOn=team`);
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

test.describe('Am längsten offen', () => {
  test('das Dashboard nennt die Anfragen, die es zählt', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/dashboard`);
    await warteAufSchriften(page);

    const { offen, aeltester } = await lage(page);
    expect(offen, 'Die Demo hat offene Anfragen').toBeGreaterThan(0);

    // Kein Satz darf behaupten, es gebe keine, während die Zahlen welche zählen.
    await expect(page.getByText(/Keine offene Anfrage|sobald es Anfragen gibt/)).toHaveCount(0);

    const liste = page.getByRole('region', { name: 'Am längsten offen' });
    const eintraege = liste.locator('a[href*="/requests/"]').filter({ visible: true });
    await expect(eintraege).toHaveCount(Math.min(5, offen));

    // Zuoberst steht der Vorgang, dessen Alter «Ältester Vorgang» nennt.
    const wartezeilen = liste.getByText(/(Bei uns|Beim Kunden) seit/).filter({ visible: true });
    await expect(wartezeilen).toHaveCount(Math.min(5, offen));
    expect(tage(await wartezeilen.first().textContent())).toBe(aeltester);

    await expectNoHorizontalOverflow(page);
    await expectReadableText(page);
  });

  test('ein Eintrag öffnet seine Anfrage', async ({ page }) => {
    await page.goto(`/app/${demoWorkspaceId()}/dashboard`);
    await warteAufSchriften(page);

    const eintrag = page
      .getByRole('region', { name: 'Am längsten offen' })
      .locator('a[href*="/requests/"]')
      .filter({ visible: true })
      .first();
    const ziel = await eintrag.getAttribute('href');
    const text = (await eintrag.textContent()) ?? '';
    await eintrag.click();

    await expect(page).toHaveURL(ziel ?? 'kein Ziel');
    // Die Überschrift der Anfrage ist ihr Betreff, und der steht im Eintrag.
    // Abgefragt, bis die Detailseite steht: vorher heisst sie noch «Dashboard».
    const ueberschrift = page.getByRole('heading', { level: 1 });
    await expect
      .poll(async () => text.includes((await ueberschrift.textContent()) ?? '—'), {
        message: `Überschrift der Anfrage steht im Eintrag «${text}»`,
      })
      .toBe(true);
  });

  for (const [sprache, titel, alteNotiz] of [
    ['fr', 'Ouvertes depuis le plus longtemps', "dès qu'il y en aura"],
    ['it', 'Aperte da più tempo', 'non appena ce ne saranno'],
    ['en', 'Longest open', 'once there are any'],
  ] as const) {
    test(`die Liste spricht ${sprache}`, async ({ page, viewport }) => {
      test.skip(viewport?.width !== 1440, 'Die Übersetzung ändert keine Anordnung.');
      await page.addInitScript((locale) => {
        window.localStorage.setItem('tallyroom.locale', locale);
      }, sprache);
      await page.goto(`/app/${demoWorkspaceId()}/dashboard`);

      const liste = page.getByRole('region', { name: titel });
      await expect(
        liste.locator('a[href*="/requests/"]').filter({ visible: true }),
      ).not.toHaveCount(0);
      await expect(page.getByText(alteNotiz)).toHaveCount(0);
    });
  }
});
