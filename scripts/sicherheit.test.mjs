import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Die beiden Skripte des täglichen Sicherheitslaufs, im Ablauf geprüft statt im
 * Text: `gh` und `bun` sind Attrappen vorn im PATH (scripts/attrappen/). Ein
 * ungültiges GH_TOKEN und ein erfundenes Repository sorgen dafür, dass ein
 * falsch aufgelöster Pfad nie das echte gh mit echten Rechten erreicht.
 */
const SKRIPTE = dirname(fileURLToPath(import.meta.url));
const ATTRAPPEN = join(SKRIPTE, 'attrappen');

const KOPF = 'bun audit v1.3.14 (0d9b296a)\n';
const PROXY_ADDR = `proxy-addr  >=1.1.0 <2.0.8
  workspace:@tallyroom/api › express
  critical: proxy-addr vulnerable to IP spoofing via IPv4-mapped IPv6 trust subnet - https://github.com/advisories/GHSA-jqcg-44mw-7w3h
`;
const SOURCE_MAP = `source-map-js  >=1.0.0 <1.2.2
  workspace:@tallyroom/web › vite
  high: source-map-js allows event-loop denial of service through indexed source-map section offsets - https://github.com/advisories/GHSA-68fv-2mgg-jv7q
`;
const EIN_BEFUND = `${KOPF}${PROXY_ADDR}\n1 vulnerabilities (1 critical)\n`;
const ZWEI_BEFUNDE = `${KOPF}${PROXY_ADDR}\n${SOURCE_MAP}\n2 vulnerabilities (1 critical, 1 high)\n`;
const SAUBER = KOPF;
const OHNE_NETZ = `${KOPF}ConnectionRefused: audit request failed\n`;

/** @type {string} */
let dir;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sicherheit-'));
});

afterEach(() => {
  // Ein Aufruf, den die Attrappe nicht kennt, hiesse: Skript und Attrappe sind
  // auseinandergelaufen, und der Test prüft etwas anderes als die CI.
  expect(
    existsSync(join(dir, 'unbekannt.log')) ? readFileSync(join(dir, 'unbekannt.log'), 'utf8') : '',
  ).toBe('');
  rmSync(dir, { recursive: true, force: true });
});

/**
 * @param {string} skript
 * @param {string[]} args
 */
function lauf(skript, args) {
  return spawnSync('bash', [join(SKRIPTE, skript), ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${ATTRAPPEN}:${process.env.PATH}`,
      ATTRAPPE_DIR: dir,
      GH_TOKEN: 'attrappe-ohne-rechte',
      GH_REPO: 'attrappe/gibt-es-nicht',
    },
  });
}

/**
 * Ein Lauf des Meldeskripts mit diesem Bericht und diesem Exit-Code von audit.sh.
 * @param {string} bericht
 * @param {number} status
 */
function melde(bericht, status) {
  writeFileSync(join(dir, 'audit.txt'), bericht);
  return lauf('sicherheits-meldung.sh', ['audit.txt', String(status)]);
}

/** Die Issues der Attrappe, nach Nummer. */
function issues() {
  const wurzel = join(dir, 'issues');
  if (!existsSync(wurzel)) return [];
  return readdirSync(wurzel)
    .map(Number)
    .sort((a, b) => a - b)
    .map((nummer) => {
      const lies = (/** @type {string} */ datei) =>
        readFileSync(join(wurzel, String(nummer), datei), 'utf8');
      return {
        nummer,
        titel: lies('title'),
        autor: lies('author'),
        zustand: lies('state'),
        label: lies('labels').trim(),
        zuweisung: lies('assignee'),
        text: lies('body'),
        kommentare: lies('comments'),
      };
    });
}

/** Die gh-Befehle in der Reihenfolge der Aufrufe, etwa «issue list». */
function aufrufe() {
  const log = join(dir, 'aufrufe.log');
  return existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : [];
}

/**
 * Ein Lockvogel: Im öffentlichen Repo kann jedes Konto ein Issue mit demselben
 * Titel eröffnen und dessen Text jederzeit ändern, auch mit der Markierung des
 * aktuellen Stands. Labels setzen kann es nicht, und es ist nicht der Bot.
 * @param {number} nummer
 * @param {string} text
 * @param {{ autor?: string, labels?: string[] }} [herkunft]
 */
function lockvogel(nummer, text, { autor = 'angreifer', labels = [] } = {}) {
  const ordner = join(dir, 'issues', String(nummer));
  mkdirSync(ordner, { recursive: true });
  writeFileSync(join(ordner, 'title'), 'Sicherheitsmeldungen');
  writeFileSync(join(ordner, 'author'), autor);
  writeFileSync(join(ordner, 'labels'), labels.map((label) => `${label}\n`).join(''));
  writeFileSync(join(ordner, 'assignee'), '');
  writeFileSync(join(ordner, 'body'), text);
  writeFileSync(join(ordner, 'state'), 'open');
  writeFileSync(join(ordner, 'comments'), '');
}

/** Die Markierung zu EIN_BEFUND, so wie sie jeder aus der öffentlichen Kennung nachrechnet. */
const STAND_PROXY_ADDR = createHash('sha256')
  .update('GHSA-jqcg-44mw-7w3h')
  .digest('hex')
  .slice(0, 12);

describe('sicherheits-meldung.sh', () => {
  it('legt beim ersten Fund ein Issue an, mit Label, Zuweisung und Kennung', () => {
    const ergebnis = melde(EIN_BEFUND, 1);

    expect(ergebnis.status, ergebnis.stderr).toBe(0);
    const [issue] = issues();
    expect(issues()).toHaveLength(1);
    expect(issue).toMatchObject({
      titel: 'Sicherheitsmeldungen',
      zustand: 'open',
      label: 'sicherheit',
      zuweisung: 'AdamBaranyi',
    });
    expect(issue?.text).toContain('GHSA-jqcg-44mw-7w3h');
    expect(issue?.text).toMatch(/<!-- stand:[0-9a-f]{12} -->/);
  });

  it('meldet denselben Befund kein zweites Mal', () => {
    melde(EIN_BEFUND, 1);
    const vorher = issues()[0]?.text;
    const zweiter = melde(EIN_BEFUND, 1);

    expect(zweiter.status, zweiter.stderr).toBe(0);
    expect(issues()).toHaveLength(1);
    expect(issues()[0]?.text).toBe(vorher);
    expect(issues()[0]?.kommentare).toBe('');
    expect(aufrufe()).not.toContain('issue edit');
    expect(aufrufe()).not.toContain('issue comment');
  });

  it('ergänzt das Issue mit einem Kommentar, wenn sich die Kennungen ändern', () => {
    melde(EIN_BEFUND, 1);
    const ergebnis = melde(ZWEI_BEFUNDE, 1);

    expect(ergebnis.status, ergebnis.stderr).toBe(0);
    expect(issues()).toHaveLength(1);
    const [issue] = issues();
    expect(issue?.text).toContain('GHSA-68fv-2mgg-jv7q');
    expect(issue?.kommentare).toContain('Geänderte Befunde');
    expect(issue?.kommentare).toContain('GHSA-68fv-2mgg-jv7q');
  });

  it('schliesst das Issue, sobald der Lauf sauber ist', () => {
    melde(EIN_BEFUND, 1);
    const ergebnis = melde(SAUBER, 0);

    expect(ergebnis.status, ergebnis.stderr).toBe(0);
    expect(issues()[0]?.zustand).toBe('closed');
    expect(issues()[0]?.kommentare).toContain('keine Befunde mehr');
  });

  it('fasst bei einem sauberen Lauf ohne offenes Issue nichts an', () => {
    const ergebnis = melde(SAUBER, 0);

    expect(ergebnis.status, ergebnis.stderr).toBe(0);
    expect(issues()).toHaveLength(0);
    expect(aufrufe()).toEqual(['issue list']);
  });

  it('legt nach dem Schliessen beim nächsten Fund ein neues Issue an', () => {
    melde(EIN_BEFUND, 1);
    melde(SAUBER, 0);
    const ergebnis = melde(EIN_BEFUND, 1);

    expect(ergebnis.status, ergebnis.stderr).toBe(0);
    expect(issues().map((issue) => issue.zustand)).toEqual(['closed', 'open']);
  });

  it('endet rot und lässt das Issue stehen, wenn die Prüfung nicht stattfand', () => {
    melde(EIN_BEFUND, 1);
    const ergebnis = melde(OHNE_NETZ, 1);

    expect(ergebnis.status).toBe(1);
    expect(ergebnis.stdout).toContain('Prüfung fand nicht statt');
    expect(issues()[0]?.zustand).toBe('open');
    expect(issues()[0]?.kommentare).toBe('');
  });

  it('endet rot statt neu zu melden, wenn gh das Issue nicht lesen kann', () => {
    melde(EIN_BEFUND, 1);
    writeFileSync(join(dir, 'fehler_bei'), 'issue view');
    const ergebnis = melde(ZWEI_BEFUNDE, 1);

    expect(ergebnis.status).not.toBe(0);
    expect(aufrufe()).not.toContain('issue edit');
    expect(aufrufe()).not.toContain('issue comment');
  });

  it('bricht ab, wenn der Bericht fehlt, ohne gh anzufassen', () => {
    const ergebnis = lauf('sicherheits-meldung.sh', ['fehlt.txt', '1']);

    expect(ergebnis.status).toBe(2);
    expect(aufrufe()).toEqual([]);
  });

  it('übergeht ein fremdes Issue mit gleichem Titel und passender Markierung', () => {
    const markierung = `<!-- stand:${STAND_PROXY_ADDR} -->`;
    lockvogel(9, markierung);

    const ergebnis = melde(EIN_BEFUND, 1);

    expect(ergebnis.status, ergebnis.stderr).toBe(0);
    const eigenes = issues().find((issue) => issue.nummer !== 9);
    // Sonst prüfte der Fall nichts: Der Lockvogel trägt genau die Markierung des Skripts.
    expect(eigenes?.text).toContain(markierung);
    expect(eigenes).toMatchObject({ autor: 'app/github-actions', label: 'sicherheit' });
    expect(issues().find((issue) => issue.nummer === 9)).toMatchObject({
      text: markierung,
      kommentare: '',
      zustand: 'open',
    });
  });

  it('bleibt neben einem neueren fremden Issue beim eigenen', () => {
    melde(EIN_BEFUND, 1);
    lockvogel(2, 'Alles in Ordnung, hier nichts melden.');

    const ergebnis = melde(ZWEI_BEFUNDE, 1);

    expect(ergebnis.status, ergebnis.stderr).toBe(0);
    const [eigenes, fremdes] = issues();
    expect(eigenes?.text).toContain('GHSA-68fv-2mgg-jv7q');
    expect(eigenes?.kommentare).toContain('Geänderte Befunde');
    expect(fremdes).toMatchObject({
      text: 'Alles in Ordnung, hier nichts melden.',
      kommentare: '',
      zustand: 'open',
    });
  });

  it('lässt ein fremdes Issue in Ruhe, wenn der Lauf sauber ist', () => {
    lockvogel(4, 'irgendein Text');

    const ergebnis = melde(SAUBER, 0);

    expect(ergebnis.status, ergebnis.stderr).toBe(0);
    expect(issues()).toEqual([
      expect.objectContaining({ nummer: 4, zustand: 'open', kommentare: '' }),
    ]);
    expect(aufrufe()).toEqual(['issue list']);
  });

  /*
   * Jede der beiden Prüfungen hält einen Fremden schon allein ab. Die zwei Fälle
   * hier fängt nur je eine: ein Issue mit Label, aber nicht vom Bot — ein
   * Mitwirkender mit Schreibrechten —, und eines vom Bot ohne Label, etwa aus einer
   * anderen Automatisierung, die Titel aus fremder Eingabe übernimmt.
   */
  it('zählt ein Issue mit Label, aber nicht vom Bot, nicht', () => {
    lockvogel(5, `<!-- stand:${STAND_PROXY_ADDR} -->`, {
      autor: 'mitwirkender',
      labels: ['sicherheit'],
    });

    melde(EIN_BEFUND, 1);

    expect(issues()).toHaveLength(2);
    expect(issues().find((issue) => issue.nummer === 5)?.kommentare).toBe('');
  });

  it('zählt ein Issue vom Bot ohne Label nicht', () => {
    lockvogel(6, `<!-- stand:${STAND_PROXY_ADDR} -->`, { autor: 'app/github-actions' });

    melde(EIN_BEFUND, 1);

    expect(issues()).toHaveLength(2);
    expect(issues().find((issue) => issue.nummer === 6)?.kommentare).toBe('');
  });
});

describe('audit.sh', () => {
  /** Die Argumente des einen bun-Aufrufs. */
  function bunAufruf() {
    return readFileSync(join(dir, 'bun-aufrufe.log'), 'utf8').trim();
  }

  it('gibt Stufe und Ausnahme an bun audit weiter', () => {
    const ergebnis = lauf('audit.sh', ['moderate']);

    expect(ergebnis.status, ergebnis.stderr).toBe(0);
    expect(bunAufruf()).toBe('audit --audit-level=moderate --ignore GHSA-67mh-4wv8-2f99');
  });

  it('prüft ohne Angabe ab high', () => {
    lauf('audit.sh', []);

    expect(bunAufruf()).toBe('audit --audit-level=high --ignore GHSA-67mh-4wv8-2f99');
  });

  it('reicht einen Befund als Exit-Code durch', () => {
    writeFileSync(join(dir, 'exit'), '1');

    expect(lauf('audit.sh', ['high']).status).toBe(1);
  });

  it('führt jede Ausnahme mit demselben «prüfen bis» in der Tabelle von docs/SECURITY.md', () => {
    const skript = readFileSync(join(SKRIPTE, 'audit.sh'), 'utf8');
    const zeilen = readFileSync(join(SKRIPTE, '..', 'docs', 'SECURITY.md'), 'utf8').split('\n');
    const ausnahmen = [
      ...skript.matchAll(/^\s*--ignore (GHSA-[\w-]+).*prüfen bis (\d{2}\.\d{2}\.\d{4})/gm),
    ];

    // Ohne Treffer prüfte die Schleife nichts — etwa wenn der Kommentar anders lautet.
    expect(ausnahmen.length).toBeGreaterThan(0);
    for (const [, kennung, bis] of ausnahmen) {
      const zeile = zeilen.find((z) => z.startsWith('|') && z.includes(`\`${kennung}\``));
      expect(zeile, `${kennung} fehlt in der Ausnahmetabelle von docs/SECURITY.md`).toBeDefined();
      expect(zeile?.split('|').at(-2)?.trim()).toBe(bis);
    }
  });
});
