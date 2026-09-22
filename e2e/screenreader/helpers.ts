import { expect, type Page } from '@playwright/test';
import type { ScreenReaderPlaywright } from '@guidepup/playwright';
import { TOUR_KEY } from '../paths.ts';

/**
 * VoiceOver und NVDA sagen dasselbe verschieden: «Dashboard, heading level 1»
 * gegen «heading, level 1, Dashboard». Verglichen wird deshalb ohne
 * Satzzeichen und Gross- und Kleinschreibung, und jeder Test nennt nur die
 * Teile, auf die es ankommt — den Namen und die Rolle, nicht die Reihenfolge.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[|¦:;,.'"`\-‐–—·_()[\]{}\\^~…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Enthält die Ansage alle genannten Teile? Ein Teil darf eine Liste von Varianten sein. */
export function says(spoken: string, ...parts: (string | string[])[]): boolean {
  const heard = normalize(spoken);
  return parts.every((part) =>
    (Array.isArray(part) ? part : [part]).some((variant) => heard.includes(normalize(variant))),
  );
}

/** Wie `says`, aber als Prüfung mit der Ansage in der Fehlermeldung. */
export function expectSays(spoken: string, ...parts: (string | string[])[]) {
  expect(says(spoken, ...parts), `Angesagt wurde: «${spoken}»`).toBe(true);
}

/**
 * Wartet, bis der Screenreader etwas angesagt hat, das die Teile enthält.
 *
 * Eine Statusmeldung kommt nach der Handlung, die sie auslöst, und nicht im
 * selben Takt. Geprüft wird die letzte Ansage und das ganze Protokoll: NVDA
 * führt jede Ansage im Protokoll, VoiceOver kennt verlässlich nur die letzte.
 */
export async function expectEventuallySays(
  screenReader: ScreenReaderPlaywright,
  parts: (string | string[])[],
  timeout = 15_000,
) {
  let spoken = '';
  await expect
    .poll(
      async () => {
        const last = await screenReader.lastSpokenPhrase();
        const log = (await screenReader.spokenPhraseLog()).join(' · ');
        spoken = `${last} · ${log}`;
        return says(spoken, ...parts);
      },
      { timeout, message: 'Ansage nicht gehört' },
    )
    .toBe(true)
    .catch((error: unknown) => {
      throw new Error(`${String(error)}\nAngesagt wurde: «${spoken}»`);
    });
}

/**
 * Bewegt den Screenreader, bis er die gesuchte Stelle ansagt. Gibt die Ansage
 * zurück; scheitert nach `max` Schritten mit dem Weg, den er gegangen ist.
 * Zuerst zählt, wo er schon steht — nach `navigateToWebContent()` ist das oft
 * das erste Element der Seite.
 */
export async function moveUntilSays(
  screenReader: ScreenReaderPlaywright,
  move: () => Promise<void>,
  parts: (string | string[])[],
  max = 20,
): Promise<string> {
  const current = await screenReader.lastSpokenPhrase();
  const path: string[] = [current];
  if (says(current, ...parts)) return current;
  for (let step = 0; step < max; step += 1) {
    await move();
    const spoken = await screenReader.lastSpokenPhrase();
    path.push(spoken);
    if (says(spoken, ...parts)) return spoken;
  }
  throw new Error(`Nach ${max} Schritten nicht gefunden. Weg:\n${path.join('\n')}`);
}

/**
 * Startet eine eigene Demo und landet auf dem Dashboard. Der Rundgang gilt als
 * gesehen — sonst läge sein Dialog über allem, und jede Prüfung hörte ihn.
 */
export async function startDemo(page: Page): Promise<string> {
  await page.addInitScript((key) => {
    try {
      window.localStorage.setItem(key, 'done');
    } catch {
      // Ohne Speicher erscheint der Rundgang; dann scheitert der Test sichtbar.
    }
  }, TOUR_KEY);
  await page.goto('/');
  await page.getByRole('button', { name: 'Demo starten' }).click();
  await page.waitForURL(/\/app\/[0-9a-f-]+\/dashboard/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
  const match = /\/app\/([0-9a-f-]+)\//.exec(page.url());
  if (!match?.[1]) throw new Error(`Keine Workspace-ID in ${page.url()}`);
  return match[1];
}
