import { expect, test, type Page } from '@playwright/test';

/**
 * Der Nebel auf der Startseite. Ohne Anmeldung, damit «/» die Startseite
 * zeigt und nicht aufs Dashboard weiterleitet.
 */
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Zählt jedes Bild, das der Nebel zeichnet.
 *
 * Früher verglich der Test zwei Aufnahmen der Leinwand. Auf dem iPhone ist
 * der Hero höher als der Bildschirm; die Aufnahme scrollt, danach liegt der
 * Zeiger auf «Anmelden», und dessen Darstellung wechselte zwischen beiden
 * Bildern. Der Test meldete Bewegung, obwohl der Nebel stand — Diagnose 28 in
 * `docs/DIAGNOSTICS.md`. Ohne Zeichenaufruf ändert sich eine WebGL-Fläche
 * nicht; das ist die Messung.
 */
async function countFogFrames(page: Page) {
  await page.addInitScript(() => {
    const zaehler = window as unknown as { __fogFrames: number };
    zaehler.__fogFrames = 0;
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const original = proto.drawArrays;
      proto.drawArrays = function (this: WebGLRenderingContext, ...args) {
        zaehler.__fogFrames += 1;
        return original.apply(this, args);
      } as typeof original;
    }
  });
}

async function openLanding(page: Page) {
  await page.goto('/');
  // Aufgeblendet heisst: die Blende ist durch, nicht nur begonnen.
  await page.waitForFunction(() => {
    const fog = document.querySelector('canvas[data-fog]');
    return fog !== null && getComputedStyle(fog).opacity === '1';
  });
}

/** Zeichnet der Nebel in einer knappen Sekunde ein neues Bild? */
async function fogMoves(page: Page): Promise<boolean> {
  const frames = () =>
    page.evaluate(() => (window as unknown as { __fogFrames: number }).__fogFrames);
  // Ein Bild, das beim Anhalten schon unterwegs war, zählt nicht als Bewegung.
  await page.waitForTimeout(300);
  const first = await frames();
  await page.waitForTimeout(700);
  return (await frames()) > first;
}

test.beforeEach(async ({ page }) => {
  await countFogFrames(page);
});

test.describe('Nebel auf der Startseite', () => {
  test('blendet hinter dem Text auf, die Überschrift wartet nicht darauf', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('canvas[data-fog]')).toHaveClass(/opacity-100/);
    await expect(page.locator('canvas[data-fog]')).toHaveAttribute('aria-hidden', 'true');
    // Der Nebel liegt hinter dem Inhalt; der Knopf darüber bleibt bedienbar.
    await expect(page.getByRole('button', { name: 'Demo starten' })).toBeEnabled();
  });

  test('«Bewegung anhalten» hält ihn wirklich an, auch nach dem Neuladen', async ({ page }) => {
    await openLanding(page);
    expect(await fogMoves(page)).toBe(true);

    const toggle = page.getByRole('button', { name: 'Bewegung anhalten' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await fogMoves(page)).toBe(false);

    await openLanding(page);
    await expect(page.getByRole('button', { name: 'Bewegung anhalten' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await fogMoves(page)).toBe(false);
  });
});

test.describe('Nebel bei reduzierter Bewegung', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('steht still und braucht dann keinen Knopf', async ({ page }) => {
    await openLanding(page);
    await expect(page.getByRole('button', { name: 'Bewegung anhalten' })).toHaveCount(0);
    expect(await fogMoves(page)).toBe(false);
  });
});
