import { defineConfig, devices } from '@playwright/test';
import { screenReaderConfig } from '@guidepup/playwright';

/**
 * Prüfung mit echten Screenreadern: VoiceOver auf macOS, NVDA auf Windows,
 * gesteuert über Guidepup. axe liest das Markup; hier wird gehört, was ein
 * Mensch mit Screenreader tatsächlich angesagt bekommt.
 *
 * Läuft nur in der CI (`.github/workflows/screenreader.yml`): VoiceOver lässt
 * sich erst fernsteuern, wenn die Systemeinstellungen dafür geöffnet sind,
 * und das geschieht auf den Rechnern von GitHub, nicht auf einem Arbeitsplatz.
 *
 * Ein Screenreader läuft nur einmal je Rechner und nur mit sichtbarem
 * Browser, deshalb ein Arbeiter und kein Headless-Modus. VoiceOver gehört zu
 * Safaris Engine, NVDA wird mit Firefox geprüft — so, wie Guidepup die beiden
 * Paare unterstützt.
 */
export default defineConfig({
  ...screenReaderConfig,
  testDir: './e2e/screenreader',
  timeout: 5 * 60 * 1000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 2 : 0,
  reportSlowTests: null,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    ...screenReaderConfig.use,
    baseURL: 'http://localhost:5173',
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'voiceover', use: { ...devices['Desktop Safari'], headless: false } },
    { name: 'nvda', use: { ...devices['Desktop Firefox'], headless: false } },
  ],
  webServer: [
    {
      command: 'bun e2e/screenreader/server.ts',
      url: 'http://localhost:4000/api/v1/health/ready',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'bun run --filter @tallyroom/web dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
