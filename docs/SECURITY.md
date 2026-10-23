# Sicherheit

Stand: 11.09.2026, Meilenstein 6. Was hier steht, ist implementiert und geprüft. Was fehlt, steht unter
"Offene Grenzen" — nicht als stillschweigende Lücke.

Keine Aussage in diesem Dokument bedeutet "vollständig sicher", "OWASP-zertifiziert" oder
"Penetrationstest bestanden". Alle Prüfungen laufen lokal und in der Testumgebung dieses Projekts,
nie gegen fremde Systeme.

## Bedrohungsübersicht

**Schützenswert:** Anmeldedaten, Sitzungen, Kundenstammdaten, interne Notizen und Kommentare,
Vertragswerte, hochgeladene Dokumente.

**Akteure:** anonyme Besucher, angemeldete interne Mitglieder (Owner, Member), angemeldete
Kundenbenutzer (Client), Demo-Besucher.

**Vertrauensgrenze:** zwischen Browser und API. Alles, was aus dem Browser kommt — Formularwerte,
IDs in der URL, Header, Cookies — ist unbestätigte Eingabe. Der Server prüft bei jedem Request neu.

**Wichtigste Missbrauchsfälle:**

| Fall                                   | Schutzmassnahme                                                                                       | Geprüft in                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Fremde Daten über manipulierte IDs     | Workspace-Kontext ausschliesslich aus `memberships`; zusammengesetzte Fremdschlüssel in der Datenbank | `tests/integration/tenant-isolation.test.ts`           |
| Konten durchprobieren                  | Gleiche Meldung und gleiche Laufzeit bei unbekannter E-Mail und falschem Passwort; Rate-Limit         | `tenant-isolation.test.ts`, `login-rate-limit.test.ts` |
| Übernahme einer Sitzung                | Sitzungs-ID-Rotation nach Login; Logout zerstört serverseitig; HttpOnly-Cookie                        | `tenant-isolation.test.ts`                             |
| Schreibende Requests von fremder Seite | CSRF-Token an die Sitzung gebunden plus Origin-Prüfung                                                | `tenant-isolation.test.ts`                             |
| Datenabfluss über Fehlermeldungen      | Fehlerantworten ohne SQL, Stacktraces oder Interna; Logs mit Redaction                                | `tenant-isolation.test.ts`                             |

## Umgesetzt

**Anmeldung.** Argon2id mit gesetzten Parametern (19 MiB, 2 Durchgänge, 1 Nebenläufigkeit). Bei
unbekannter E-Mail wird gegen einen Dummy-Hash geprüft, damit die Antwortzeit nicht verrät, welche
Adressen existieren. Fünf Versuche je IP in fünfzehn Minuten, konfigurierbar.

**Sitzungen.** HttpOnly, `SameSite=Lax`, `Secure` unter HTTPS, Speicher in PostgreSQL. Rotation der
Sitzungs-ID nach erfolgreicher Anmeldung gegen Session Fixation. Zwei Stunden Inaktivität, das
Cookie rollt bei Aktivität nach. Abmelden zerstört die Sitzung serverseitig — das alte Cookie wird
danach abgewiesen, nicht nur im Browser gelöscht.

**Passwort ändern.** Nur mit dem bisherigen Passwort als Nachweis, nicht mit der Sitzung allein:
wer einen fremden, offenen Browser erwischt, soll das Konto nicht übernehmen können. Danach enden
alle anderen Sitzungen des Kontos, die eigene bekommt eine neue ID. Ein falsches bisheriges
Passwort antwortet mit 422 und nicht mit 401, weil die Oberfläche bei 401 die Sitzung beendet.
Fünf Versuche je Konto und Viertelstunde, gezählt am Konto statt an der Adresse. In der Demo ist die
Änderung gesperrt. Geprüft in `tests/integration/password-change.test.ts`.

**CSRF.** Zwei Prüfungen für jeden schreibenden Request: ein an die Sitzung gebundenes Token im
Header `X-CSRF-Token`, verglichen in konstanter Zeit, und die Herkunft aus `Origin` beziehungsweise
`Referer` gegen `APP_ORIGIN`. Ein fehlender Origin-Header bei einem schreibenden Request wird
abgewiesen, nicht durchgewinkt.

**Autorisierung.** Standardmässig verweigert. `requireWorkspace` schlägt die Mitgliedschaft
serverseitig nach; ohne sie gibt es 404 statt 403. `requireInternal`, `requireWriter` und
`requireOwner` bauen darauf auf. Versteckte Schaltflächen und schwer zu erratende IDs gelten nicht
als Zugriffskontrolle.

`requireWriter` trennt Lesen von Ändern: die Rolle `viewer` sieht denselben Bestand wie ein
Mitglied und wird an jeder ändernden Route mit 403 abgewiesen. 403 und nicht 404, weil die Sache für
diese Rolle sichtbar ist — ihre Existenz zu leugnen wäre sinnlos. Geprüft in
`tests/integration/viewer-role.test.ts`, einschliesslich der Grenze, dass der vollständige
Datenauszug beim Owner bleibt.

**Protokoll mit Hash-Kette.** Jeder Eintrag im Aktivitätsprotokoll hasht seinen Inhalt zusammen mit
dem Hash seines Vorgängers im selben Workspace (SHA-256, kanonische Form mit sortierten
Metadaten-Schlüsseln). Wer einen Eintrag nachträglich ändert oder entfernt, müsste alle folgenden
Hashes neu rechnen; `GET …/activity/integrity` meldet die erste gebrochene Stelle. Das ersetzt
keinen schreibgeschützten Speicher — mit Datenbankzugang lässt sich die ganze Kette neu schreiben —,
macht eine einzelne Änderung aber nachweisbar. Beim Anhängen hält eine Sperre je Workspace die
Reihenfolge; ohne sie gabelt die Kette bei zwei gleichzeitigen Schreibern. Einträge von vor der
Einführung tragen keinen Hash und werden getrennt gezählt statt als Bruch gemeldet.

**Datenauszug.** Zwei Archive mit zwei Berechtigungen: der vollständige Auszug eines Workspace
gehört dem Owner und enthält interne Notizen, Mitgliedschaften und das Protokoll — Passwort-Hashes
enthält er nicht, ein Test sucht danach. Das Übergabepaket je Kunde entsteht aus der Datenschicht
des Kundenportals, damit dieselbe Grenze gilt wie dort; ein Test öffnet das Archiv und prüft, dass
der interne Vermerk fehlt. Der ZIP-Schreiber ist projekteigen (kein ZIP64, Archiv im
Arbeitsspeicher) und wird im Test von `unzip` gegengelesen.

**Eingaben.** Alle Nutzdaten werden mit Zod validiert, alles SQL läuft parametrisiert über Drizzle.
Umgebungsvariablen werden beim Start einmal geprüft; ein Platzhalter-`SESSION_SECRET` bricht den
Start ab.

**Fehler und Logs.** Antworten haben die Form `{ error: { code, message, requestId } }` ohne
Interna. Ein Request-Log trägt genau Request-ID, Methode, Pfad, Status und Laufzeit. Bis zum
11.09.2026 standen dort alle Header ausser den geschwärzten, also auch die Client-Adresse aus
`X-Forwarded-For`, die Browserkennung und die Query, in der ein Suchbegriff oft ein Kundenname ist.
Die Schwärzung für Cookie-, Authorization- und CSRF-Header sowie Passwortfelder bleibt als zweite
Sicherung bestehen. Caddy schreibt kein Zugriffsprotokoll.

**IP-Adressen.** Gespeichert werden sie nirgends. Das Rate-Limit hält eine Adresse im
Prozessspeicher, solange ihr Zeitfenster läuft, und verwirft sie spätestens eine Minute danach.
Vorher wurde erst ab 5'000 Einträgen aufgeräumt, auf einer ruhigen Seite also nie.

**Geheimnisse.** Nur Platzhalter in `.env.example`, `.env` ist ignoriert.

**Personendaten des Betreibers.** Anschrift und Kontakt für das Impressum stehen nicht im
Repository. Es ist öffentlich, und seine Historie bliebe auch nach einem Umzug. Die Werte liegen
auf dem Server in `infra/.env.production` und kommen erst beim Bauen des Web-Images dazu. Fehlen
sie, bricht der Build ab, statt eine öffentliche Seite mit leerem Impressum zu erzeugen. Gegengeprüft
mit einem Build ohne Angaben.

**Kundenansicht.** Das Portal hat eine eigene Zugriffsschicht. Jede Abfrage dort ist fest auf
einen Workspace und einen Kunden eingeschränkt und liefert nur freigegebene Inhalte — die
Einschränkung ist kein Parameter, den ein Aufrufer mitgibt. Client-DTOs blenden interne Felder
nicht aus, sie führen sie nicht: ein öffentlicher Kommentar hat kein Sichtbarkeitsfeld, weil
interne Kommentare die Servergrenze nie überschreiten. Ein Kundenzugang bekommt auf internen
Routen 404 statt 403 — ein 403 würde bestätigen, dass es den Bereich gibt.

**Dokumente.** Privater Bucket, keine öffentlichen URLs, keine vorsignierten Links. Beim Upload
werden Content-Type, tatsächlicher Dateianfang, Grösse und die Zugehörigkeit von Kunde und Projekt
serverseitig geprüft. Der Objektschlüssel ist zufällig und wird nie aus dem Dateinamen abgeleitet;
der Originalname ist Metadatum und wird von Pfadanteilen und Steuerzeichen befreit. Downloads
laufen über die autorisierte API, antworten als Anhang und tragen eine Richtlinie, die jede
Ausführung im Dokument unterbindet. Löschen nimmt die Sichtbarkeit sofort — auch wenn der
Objektspeicher gerade nicht erreichbar ist.

Der Objektspeicher ist Garage. Ohne Signatur antwortet er mit 403, eine Signatur für eine andere
Region weist er ab, und Website-Zugriff auf den Bucket ist aus. Geprüft beim Wechsel von MinIO am
11.09.2026. Nach aussen ist nur der S3-Port offen, lokal an `127.0.0.1` gebunden. Der RPC-Port
bleibt im Container-Netz.

**Uploads und Löschungen.** Höchstens 30 Dateien je Konto und Viertelstunde. Die Grenze greift
vor dem Einlesen des Inhalts, ein gebremster Upload landet also gar nicht erst im Speicher. Scheitert
eine Löschung am Objektspeicher, steht das Dokument auf `pending_deletion`: für jeden Zugriff sofort
weg. Ein Lauf alle 15 Minuten holt die Datei nach, bis zu 100 je Lauf; scheitert sie wieder, bleibt
der Datensatz für den nächsten stehen. Bis zum 11.09.2026 blieb eine solche Datei für immer liegen.

**Einladungen.** Nur der Hash des Tokens wird gespeichert; der Link erscheint genau einmal beim
Anlegen. Rolle und Kundenbezug hängen an der Einladung, nicht am Request des Beitretenden. Die
Annahme entwertet die Einladung in derselben Transaktion, in der die Mitgliedschaft entsteht. Bei
einem bestehenden Konto muss die angemeldete Identität zur eingeladenen Adresse passen.

**Content Security Policy und Header.** Caddy setzt sie für die Oberfläche:
`default-src 'self'`, Skripte, Styles, Schriften und Verbindungen nur vom eigenen Ursprung, kein
`unsafe-inline`, `object-src 'none'`, `frame-ancestors 'none'`, dazu HSTS, `nosniff`, eine
Referrer-Policy, eine Permissions-Policy ohne Kamera, Mikrofon, Standort und Zahlung, und
`Cross-Origin-Opener-Policy: same-origin`. Möglich ist die strenge Fassung, weil die Schriften vom
eigenen Server kommen und der Build kein Inline-Skript erzeugt. Auch kein `unsafe-eval`: Zod läuft
in der Oberfläche ohne JIT, sonst meldet der Browser bei jedem Laden einen Verstoss
(`public/zod-jitless.js`, DIAGNOSTICS Nummer 17). Die API setzt ihre Header selbst
(helmet), Downloads tragen `default-src 'none'; sandbox`, und Caddy überschreibt dort nichts.
`Server` und `Via` werden entfernt.

**Container.** Nur Caddy veröffentlicht Ports; API, PostgreSQL und Garage sind nur im internen
Netz erreichbar. Das ist mehr als Ordnung: Docker umgeht bei veröffentlichten Ports die Firewall
des Servers. Die API läuft als Benutzer `bun` statt root, mit schreibgeschütztem Dateisystem
(nur `/tmp` beschreibbar), ohne Linux-Capabilities und mit `no-new-privileges`. Caddy behält als
einzige Capability das Binden an Port 80 und 443. Jeder Dienst hat eine Speichergrenze, jedes Log
eine Grössengrenze.

**Sicherungen.** Sie enthalten Passwort-Hashes, Sitzungen und alles, was in der Anwendung steht,
und liegen deshalb nur für root lesbar in `/var/backups/tallyroom` (Ordner `700`, Dateien `600`).
Die Probe-Wiederherstellung läuft in einem internen Docker-Netz ohne Verbindung nach aussen, mit
Passwörtern und Schlüsseln, die sie für jeden Lauf neu erzeugt und danach verwirft. Ablauf und
Befehle in [BETRIEB.md](BETRIEB.md).

**Passwort vergessen.** Ohne Mailversand setzt der Betreiber ein neues Passwort über die
Kommandozeile (`admin:reset-password`). Es entsteht zufällig mit 24 Zeichen, nie als Argument —
sonst stünde es in der Shell-Historie —, und jede Sitzung des Kontos endet.

## Automatische Prüfungen in der CI

Beide laufen bei jedem Push im Job `sicherheit` und zusätzlich jeden Tag ohne Commit im Workflow
`sicherheit-taeglich.yml`. Ein Fehler des Scanners oder ein fehlendes Netz endet rot und zählt
nicht als bestanden.

**Regel seit dem 10.10.2026: Rot heisst handeln, alles andere ist eine Meldung.** Push und Pull
Request blockieren ab „hoch". Der tägliche Lauf wird wegen einer Abhängigkeit nie rot, sondern
führt ein einziges Issue «Sicherheitsmeldungen». Rot bleibt er bei einem Geheimnis und wenn die
Prüfung selbst nicht stattfand. Stufe und Ausnahmen stehen an einer Stelle, in `scripts/audit.sh`,
das beide Läufe aufrufen.

### Täglicher Lauf

Ein Push prüft den Stand von heute. Eine Meldung zu einem Paket entsteht aber auch dann, wenn
niemand etwas ändert. Darum läuft dieselbe Prüfung jeden Tag von selbst, schmal gehalten auf
Secret-Scan und Abhängigkeiten — ein täglicher Lauf über zwanzig Minuten wird abgeschaltet, einer
über zwei Minuten bleibt.

Bis zum 10.10.2026 blockierte er schon ab „moderat". Dann machte eine Welle neuer Meldungen den Lauf
in sieben eigenen Repositories gleichzeitig rot. Ein roter geplanter Lauf schickt jeden Tag eine
E-Mail und hängt ein rotes Kreuz an den letzten Commit auf `main` — wer das Repository ansieht,
sieht das Kreuz, nicht den Grund. Seither sammelt er die Befunde ab „moderat" und meldet sie über
`scripts/sicherheits-meldung.sh` in einem Issue: angelegt beim ersten Fund, ergänzt nur, wenn sich
die Liste der Kennungen ändert, von selbst geschlossen, sobald alles sauber ist. Eine E-Mail je
Änderung statt einer je Tag.

«Sauber» heisst dabei Exit-Code 0 von `bun audit`, nicht «keine Kennung im Bericht»: Ohne Netz endet
`bun audit` mit 1 und einem Text ohne Kennung (geprüft am 10.10.2026 mit einer unerreichbaren
Registry). Eine Fassung, die nur nach Kennungen sucht, schlösse dann das Issue mit «keine Befunde
mehr». So aber bleibt das Issue stehen, und der Lauf endet rot.

Das bestehende Issue findet das Skript über die blosse Liste der offenen Issues, nicht über
`--label` oder `--search`: Beide gehen bei gh über den Suchindex von GitHub (`query IssueSearch`,
sichtbar mit `GH_DEBUG=api`, geprüft am 10.10.2026), der mit Verzögerung nachzieht. Zwei Läufe kurz
hintereinander legten sonst zwei Issues an. Und der Lauf installiert keine Pakete: `bun audit` liest
`package.json` und `bun.lock`, ohne `node_modules` (in einem frischen Checkout geprüft), und der
Checkout legt das Token nicht in `.git/config` ab. In einem Job, der Issues schreiben darf, läuft so
kein Installationscode fremder Pakete.

**Nur das eigene Issue zählt (seit 21.10.2026).** Bis dahin nahm das Skript das neueste offene
Issue mit dem Titel «Sicherheitsmeldungen». Im öffentlichen Repository kann jedes Konto ein solches
Issue eröffnen und seinen Text mit der Markierung des aktuellen Stands füllen; die Markierung ist
ein Hash der öffentlichen Kennungen und lässt sich nachrechnen. Der Lauf hätte dann jede neue Meldung
für bekannt gehalten und geschwiegen — und er ist der einzige Alarm für die Bun-Abhängigkeiten. Die
Lücke kam mit PR #30, der den Label-Filter entfernte, um den Suchindex zu umgehen. Gezählt wird jetzt
nur ein Issue, das der Bot dieses Workflows angelegt hat (`app/github-actions`, so meldet gh ihn, an
den echten Issues dieses Repositorys nachgesehen) **und** das das Label `sicherheit` trägt. Labels
setzen Konten ohne Rechte im Repository nicht, eine Issue-Vorlage, die es setzen könnte, gibt es nicht,
und kein Workflow legt Issues mit fremd bestimmtem Titel an. Gefiltert wird weiterhin erst nach dem
Lesen, ohne Suchindex. Fünf Tests mit fremden Issues halten das fest; ohne die Prüfung des Autors
oder des Labels wird je einer rot, mit der alten Suche nur nach dem Titel alle fünf.

Angesetzt ist der Lauf auf 06:17 UTC. GitHub startet geplante Läufe aber verspätet: Vom 17. bis
30.09.2026 begannen alle vierzehn zwischen 11:07 und 14:05 UTC, also am Mittag in Zürich. Eine
Meldung wird damit am selben Tag bemerkt, nicht am frühen Morgen.

| Punkt          | Stand                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Datei          | `.github/workflows/sicherheit-taeglich.yml`, dazu `workflow_dispatch` für den Lauf von Hand                                         |
| Rot            | gitleaks findet ein Geheimnis, oder `bun audit` endet ohne Kennung (Prüfung fand nicht statt)                                       |
| Abhängigkeiten | ab „moderat" mit den Ausnahmen aus `scripts/audit.sh`, gemeldet im Issue «Sicherheitsmeldungen»                                     |
| Ausnahmen      | namentlich, befristet, begründet — Tabelle unter [Abhängigkeitsscan](#abhängigkeitsscan)                                            |
| Meldung        | Issue mit Label `sicherheit`, Adam zugewiesen; ein roter Lauf meldet sich bei der Person, die die `cron`-Zeile zuletzt geändert hat |
| Rechte         | `contents: read` und `issues: write`, für genau dieses eine Issue                                                                   |
| Geprüft        | `scripts/sicherheit.test.mjs`: beide Skripte im Ablauf, mit `gh` und `bun` als Attrappen                                            |

Zwei Stolperfallen, die hier bewusst behandelt sind:

- **Ein täglich rotes Auge sieht nichts mehr.** Darum meldet der Lauf, statt rot zu werden, und
  bekannte Befunde ohne Fix sind namentlich ausgenommen statt über die Stufe weggeschaltet. Fällt
  ein Befund weg, fällt seine Ausnahme weg.
- **GitHub schaltet geplante Läufe in öffentlichen Repositories nach 60 Tagen ohne Aktivität ab.**
  Die wöchentlich gemergten Update-PRs halten den Zeitplan am Leben.

### Updates von Abhängigkeiten

`.github/dependabot.yml` hält drei Ökosysteme aktuell: Bun wöchentlich (Minor und Patch als ein
Sammel-PR), GitHub Actions und die Basis-Images des Dockerfiles monatlich. Überall sieben Tage
Wartezeit nach der Veröffentlichung (`cooldown`), damit eine kaputte oder gekaperte Fassung nicht
am Tag ihrer Veröffentlichung hier landet; dieselbe Frist gilt lokal über `minimumReleaseAge` in
`bunfig.toml`. Vorabversionen schlägt Dependabot nicht vor, solange keine eingesetzt wird.

Jeder dieser Pull Requests löst den vollen CI-Lauf aus; gemergt wird nur, was grün ist.

**Ausnahme von der Wartezeit** nur für einen Sicherheitsfix in einem Laufzeitpaket, das erreichbar
ist (API, ausgelieferte Oberfläche): dann sofort, befristet in `minimumReleaseAgeExcludes` und hier
mit Datum. Werkzeuge für Build, Lint und Test warten auf den regulären Update-PR. Liegt die behobene
Fassung im erlaubten Bereich, genügt der Eintrag im Lockfile; sonst ein `overrides` auf genau diese
Fassung.

**Brauchbare Security-Updates von Dependabot gibt es hier nur für GitHub Actions.** Für Bun und für Docker
kennt Dependabot nur Version-Updates (GitHub-Dokumentation, geprüft am 30.09.2026), auch wenn im
Repository automatische Security-Updates eingeschaltet sind. Dazu liest GitHubs Abhängigkeitsgraph
nur die `package.json`-Dateien, nicht `bun.lock`: 59 Pakete im Graphen, kein einziges aus zweiter
Hand, `bun.lock` nicht unter den erkannten Manifesten. Eine Meldung zu einem Paket, das nur über ein
anderes hereinkommt, erzeugt deshalb weder einen Alarm noch einen Pull Request. Solche Meldungen
fängt allein der tägliche Lauf mit `bun audit`, der das Lockfile liest — so geschehen am
30.09.2026, siehe [Abhängigkeitsscan](#abhängigkeitsscan).

Für ein direktes Paket kommen doch Alarme und ein Security-PR, beobachtet am 21.10.2026 bei vite in
`apps/web/package.json`: drei Dependabot-Alarme und #36 über das Ökosystem `npm_and_yarn`. Der PR
änderte nur die `package.json`, nicht `bun.lock`, und jede Stufe scheiterte an
`bun install --frozen-lockfile`. Behoben wurde es von Hand samt Lockfile (#39); #36 wurde beim
Merge geschlossen.

Nicht erfasst: die Images in `infra/compose.prod.yml` (postgres, garage). Sie gehören in die
monatliche Routine von Hand auf dem Server.

### Rechte der Workflows

Jeder Workflow schreibt seine Rechte selbst fest, statt sich auf die Einstellung des Repositorys zu
verlassen. Die steht auf «nur lesen» (geprüft am 30.09.2026); `ci.yml` hatte bis dahin als
einziger keinen eigenen Block und lief still mit diesem Standard.

| Workflow                       | Rechte                         | Wozu                                                      |
| ------------------------------ | ------------------------------ | --------------------------------------------------------- |
| `ci.yml`                       | `contents: read`               | Prüfen, bauen, testen                                     |
| `screenreader.yml`             | `contents: read`               | VoiceOver und NVDA                                        |
| `sicherheit-taeglich.yml`      | `issues: write`, sonst lesen   | Secret-Scan, Abhängigkeiten, Issue «Sicherheitsmeldungen» |
| `erinnerung-woechentlich.yml`  | `issues: write`, sonst lesen   | Issue, wenn Update-PRs liegen bleiben                     |
| `erinnerung-monatlich.yml`     | `issues: write`, sonst lesen   | Issue mit den Handgriffen auf dem Server                  |
| `screenreader-wiederholen.yml` | `actions: write`, nichts sonst | startet einen VoiceOver-Job auf gesperrtem Rechner neu    |

`screenreader-wiederholen.yml` läuft über `workflow_run` und damit immer in der Fassung von `main`,
auch wenn der auslösende Lauf aus einem Pull Request kam. Er holt keinen Code, führt nichts aus dem
Pull Request aus und reicht Werte aus dem Ereignis nur über Umgebungsvariablen an die Shell, nie
direkt in den Befehl. Was er darf, ist genau eines: einen gescheiterten Job neu starten — und das
nur nach einem Einrichtungsfehler, einmal, für den neusten Lauf des Zweigs (DIAGNOSTICS Nummer 32).

### Secret-Scan

| Punkt         | Stand                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Werkzeug      | gitleaks 8.30.1, Binärdatei aus dem Release, Prüfsumme im Workflow festgehalten      |
| Umfang        | jeder Commit der Historie (`fetch-depth: 0`), nicht nur der letzte Stand             |
| Konfiguration | Standardregeln, keine eigenen Abschwächungen; Ausnahmen einzeln in `.gitleaksignore` |
| Ergebnis      | 11.09.2026, 83 Commits: 10 Funde, alle 10 einzeln geprüft und falsch                 |
| Gegenprobe    | ein erfundener Schlüssel in einer Wegwerfkopie wird gefunden, der Lauf endet rot     |

Die zehn Funde, jeder mit eigenem Fingerabdruck. Ein neuer Fund an derselben Stelle hätte einen
anderen und schlüge an:

| Fundstelle                                     | Was dort steht                             | Warum kein Geheimnis                                                  |
| ---------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `.env.example:12`                              | `SESSION_SECRET=bitte-ersetzen-…`          | Platzhalter. Die API startet damit nicht, Zod lehnt das Präfix ab     |
| `infra/.env.production.example:11`             | derselbe Platzhalter                       | wie oben                                                              |
| `tests/integration/invitations.test.ts` (5)    | Passwörter wie `Ein-langes-Passwort-2026`  | Konten, die nur in der flüchtigen Testdatenbank eines Laufs entstehen |
| `tests/integration/password-change.test.ts:25` | das Passwort `Ein-neues-Passwort-2026`     | wie oben, ein Konto der flüchtigen Testdatenbank                      |
| `tests/integration/requests.test.ts:40`        | Idempotency-Key `doppelklick-schluessel-1` | schützt nichts, er erkennt einen Doppelklick                          |
| `docs/SECURITY.md:151`                         | diese Tabelle, die das Passwort zitierte   | dasselbe Testpasswort, einmal in der Dokumentation                    |

Nächste Prüfung dieser Ausnahmen: mit dem nächsten Meilenstein, spätestens am 11.12.2026.

### Abhängigkeitsscan

| Punkt       | Stand                                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Werkzeug    | `bun audit` aus Bun 1.3.14, gegen die Advisory-Datenbank der npm-Registry                                                                                                                                    |
| Umfang      | alle Pakete aus `bun.lock`, auch reine Entwicklungswerkzeuge                                                                                                                                                 |
| Blockierend | im Push-Lauf ab „hoch" (`bash scripts/audit.sh high`); der tägliche Lauf blockiert nicht, er meldet ab „moderat" im Issue; ein weiterer Schritt schreibt alle Befunde ungefiltert in die Laufzusammenfassung |
| Ergebnis    | 22.10.2026 nach dem Update auf vite 8.3.4 erneut geprüft: kein Befund ab moderat ausser der esbuild-Ausnahme                                                                                                 |

**Ausnahmen.** Jede steht mit ihrer Kennung in `scripts/audit.sh`, mit demselben «prüfen bis» wie
hier — `scripts/sicherheit.test.mjs` hält beides zusammen. Höchstens einen Monat; danach verlängern
nur mit neuem Grund, sonst entfernen. Die monatliche Erinnerung fragt danach.

| Kennung               | Paket                             | Stufe   | Art                           | Grund                                                                | seit       | prüfen bis |
| --------------------- | --------------------------------- | ------- | ----------------------------- | -------------------------------------------------------------------- | ---------- | ---------- |
| `GHSA-67mh-4wv8-2f99` | esbuild ≤ 0.24.2 über drizzle-kit | moderat | Werkzeug, nur für Migrationen | kein Update; betrifft `serve`, das hier nie startet; in keinem Image | 12.09.2026 | 10.11.2026 |

Die Ausnahme, einzeln bewertet:

- **GHSA-67mh-4wv8-2f99, esbuild ≤ 0.24.2.** Betrifft den eingebauten Entwicklungsserver von
  esbuild (`serve`), über den fremde Seiten Anfragen stellen und Antworten lesen können. Die
  betroffene Fassung 0.18.20 kommt über eine einzige Kette herein: `drizzle-kit` →
  `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils`, ein 2023 eingestelltes Paket. Es lädt dort
  die TypeScript-Konfiguration und ruft kein `serve` auf. **Nicht anwendbar.** Nachweis: Im
  API-Image liegen weder esbuild noch drizzle-kit (`ls node_modules/.bun` im Container, 0 Treffer),
  das Web-Image enthält nur die 15 statischen Dateien des Builds. Vite bringt eigenes esbuild in
  Fassung 0.28 mit und ist nicht betroffen.

  Keine erzwungene Aktualisierung, und zwar mangels Alternative: Ein Update ohne das Paket gibt es
  nicht. Am 12.09.2026 war 0.31.10 die neuste Fassung von `drizzle-kit`; am 10.10.2026 ist es
  0.31.11 vom 21.09., und sie hängt weiterhin an `@esbuild-kit/esm-loader`. Eine Überschreibung
  würde ein totes Paket auf ein sieben Hauptversionen neueres esbuild zwingen, ohne dass hier je
  ein `serve` startet. Der Befund fällt von selbst weg, sobald `drizzle-kit` das Paket loswird; bis
  dahin Neubewertung mit jedem `drizzle-kit`-Update, spätestens am 10.11.2026.

  Die Nummer steht in `scripts/audit.sh` und gilt damit für den Push-Lauf und den täglichen Lauf
  gleich. Sichtbar bleibt der Befund trotzdem: Der Schritt „Alle Befunde zur Ansicht" zeigt ihn
  ungefiltert in der Laufzusammenfassung.

Behoben am 22.10.2026, gemeldet vom täglichen Lauf im Issue #37:

- **GHSA-587h-7wmj-h5pm (hoch), GHSA-698v-4r3x-3vcv und GHSA-r825-w8mm-5pxw (moderat),
  launch-editor bis 2.14.1, in Vite gebündelt.** Die Prüfung, ob eine Datei existiert, lässt sich
  unter Windows umgehen; Argumente an den Editor werden unvollständig maskiert. Betrifft die
  Funktion «im Editor öffnen» des Entwicklungsservers.
- **GHSA-rq7h-c2jc-7f22 und GHSA-vfpm-58rq-9qcg (moderat), Vite 8.3.0 bis 8.3.2.** Der
  Entwicklungsserver liefert unter bestimmten Pfaden Dateien ausserhalb von `server.fs.allow`
  aus, beziehungsweise deren erste vier Bytes über `?vite-wasm-instance`.

Alle fünf betreffen nur den Entwicklungsserver von Vite. Er lauscht ohne `server.host` nur auf
`localhost` (`apps/web/vite.config.ts`) und liegt in keinem Image: Das Web-Image enthält nur die
statischen Dateien des Builds. **Praktisch nicht ausnutzbar, trotzdem behoben**, weil es einen Fix
gibt und der Push-Lauf ab „hoch" blockiert; seit der Meldung vom 20.10.2026 scheiterten daran #36
und #38. Im Lockfile steht jetzt vite 8.3.4 vom 08.10.2026, die Fassung aus dem Dependabot-PR #35
(behoben ist es ab 8.3.3). Mit ihr kommen postcss 8.5.30 vom 12.10. und nanoid 3.3.20 vom 05.10.,
weil vite 8.3.4 postcss ab 8.5.29 verlangt. Alle drei sind älter als die sieben Tage Wartezeit.
Geändert sind nur diese drei Einträge; alles Übrige bleibt bei #35. `bun install --frozen-lockfile`
nimmt den Stand ohne Änderung an, `bash scripts/audit.sh moderate` endet mit 0.

Behoben am 10.10.2026, in der Sicherheitsrunde nach der neuen Regel:

- **GHSA-jqcg-44mw-7w3h (kritisch), proxy-addr bis 2.0.7.** Veröffentlicht am 05.10.2026. Ein
  Vertrauens-Subnetz in IPv4-gemappter IPv6-Schreibweise mit kurzem Präfix, etwa
  `::ffff:10.0.0.0/8`, passt auf jede IPv4-Adresse; Express glaubt dann jedem Absender sein
  `X-Forwarded-For`, und `req.ip` lässt sich fälschen — damit auch Rate-Limits. Laufzeitpaket, bei
  jeder Anfrage an die API im Spiel. **Hier nicht ausnutzbar:** Tallyroom setzt `trust proxy` als
  Zahl von Hops (`TRUST_PROXY_HOPS`, in Produktion 1, laut Zod nur 0 bis 5 einstellbar). Express
  zählt dann Hops und wertet kein Subnetz aus, und die Konfiguration lässt eine Subnetz-Angabe gar
  nicht zu. Nachgestellt am 10.10.2026 mit dem installierten Express und einer Anfrage mit
  gefälschtem `X-Forwarded-For: 6.6.6.6, 7.7.7.7`: Mit 2.0.7 und `::ffff:10.0.0.0/8` lieferte
  `req.ip` die gefälschte `6.6.6.6`, mit 2.0.8 die echte Adresse; die Hop-Zählung von Tallyroom
  ergab mit beiden Fassungen dasselbe. **Trotzdem sofort behoben**, weil Laufzeit: Im Lockfile
  steht jetzt 2.0.8, im Bereich `^2.0.7` von Express, ohne Override. 2.0.8 ist vom 15.09.2026, also
  älter als die Meldung und älter als sieben Tage — eine Ausnahme von der Wartezeit war nicht nötig.
- **GHSA-68fv-2mgg-jv7q (hoch), source-map-js bis 1.2.1.** Eine präparierte indizierte Source Map
  mit unpassenden Abschnittsversätzen blockiert die Ereignisschleife. Werkzeug: Vite, Tailwind und PostCSS
  lesen damit beim Bauen Source Maps aus dem eigenen Quelltext; in keinem Image. Behoben, weil es
  einen Fix gibt und der Push-Lauf ab „hoch" blockiert: Im Lockfile steht 1.2.2 vom 30.09.2026, im
  Bereich `^1.2.1`, ohne Override.

Geändert sind nur diese zwei Einträge im Lockfile. Gegenprobe: `bun install --frozen-lockfile`
nimmt den Stand ohne Änderung an, und nach `--force` lädt die API-Kopie von Express proxy-addr 2.0.8,
Tailwind und PostCSS laden source-map-js 1.2.2.

Behoben am 30.09.2026, gemeldet vom täglichen Lauf:

- **GHSA-qhr7-859c-m2p7 und GHSA-6j4f-fj2g-mc7p (hoch), GHSA-q2hr-2g5m-vwhr (moderat),
  brace-expansion.** Veröffentlicht am 29.09.2026, am Tag darauf vom täglichen Lauf gemeldet; er
  endete rot, wie vorgesehen. Präparierte Muster mit verschachtelten oder unausgeglichenen
  geschweiften Klammern treiben das Aufklappen in eine Rekursion bis zum Stapelüberlauf oder in
  quadratische Laufzeit. Das Paket kommt nur über ESLint herein, als Unterbau von `minimatch` in
  `eslint`, `typescript-eslint` und `eslint-plugin-jsx-a11y`, und zwar in zwei Linien: 5.0.9 und
  1.1.18. Keine Produktivabhängigkeit, und laut `Dockerfile` in keinem ausgelieferten Image: Das
  API-Image installiert mit `--production` nur die Laufzeitpakete der API, das Web-Image enthält
  nur die statischen Dateien des Builds. Die Muster, die ESLint aufklappt, stammen aus der eigenen
  Konfiguration. **Praktisch nicht ausnutzbar, trotzdem behoben**, weil es einen Fix gibt: Im
  Lockfile stehen jetzt 5.0.12 und 1.1.21, die ersten Fassungen, die alle drei Meldungen schliessen.
  Beide sind vom 14.09.2026 und damit älter als die sieben Tage Wartezeit. Geändert sind nur diese
  zwei Einträge; alles Übrige bleibt beim Sammel-PR von Dependabot.

  Einen Dependabot-Alarm gab es dazu nicht, siehe
  [Updates von Abhängigkeiten](#updates-von-abhängigkeiten).

## Offene Grenzen

Ehrlich benannt, weil sie zu späteren Meilensteinen gehören:

- **Rate-Limit** liegt im Prozessspeicher und trägt nur eine API-Instanz.
- **Mehrfaktor-Authentisierung** ist bewusst nicht Teil des Umfangs.
- **Sicherungen** liegen auf demselben Server wie die Anwendung. Eine Kopie ausser Haus fehlt
  noch; sie wird verschlüsselt, bevor sie den Server verlässt.
- **Die Hash-Kette des Protokolls** schützt gegen eine einzelne nachträgliche Änderung, nicht gegen
  jemanden mit Datenbankzugang, der die Kette vollständig neu berechnet. Dagegen hülfe nur ein
  Speicher, der nichts überschreiben lässt, oder ein Anker ausserhalb des Servers.
- **Der Datenauszug entsteht im Arbeitsspeicher.** Für einen Workspace dieser Grössenordnung ist das
  richtig; ab Archiven jenseits einiger hundert Megabyte gehörte er als Strom auf die Platte.
- **Löschen von Workspace und Konto** fehlt noch. Der Auszug steht, das Gegenstück dazu ist offen
  und in `IMPLEMENTATION_STATUS.md` vermerkt.

## Prüfprotokoll

| Datum      | Umfang                                                                                     | Ergebnis               |
| ---------- | ------------------------------------------------------------------------------------------ | ---------------------- |
| 09.09.2026 | Meilenstein 1: Mandantentrennung, Sitzung, CSRF, Fehlerantworten, Rate-Limit               | 28 Tests grün          |
| 09.09.2026 | Meilenstein 4: Kundenansicht, Uploads, Einladungen, Idempotenz                             | 141 Tests grün         |
| 11.09.2026 | Produktionsaufbau lokal: Header, CSP, Demo-Durchgang, Download, Garage                     | 2 von 2 grün           |
| 11.09.2026 | Secret-Scan über 83 Commits, Abhängigkeitsscan über `bun.lock`                             | siehe oben             |
| 30.09.2026 | Täglicher Lauf rot: drei neue Meldungen zu brace-expansion (ESLint-Kette)                  | behoben, oben          |
| 10.10.2026 | proxy-addr (kritisch, Laufzeit, hier nicht ausnutzbar), source-map-js (hoch, Werkzeug)     | behoben, oben          |
| 10.10.2026 | Täglicher Lauf meldet per Issue statt rot; Skripte im Ablauf geprüft                       | 13 Tests grün          |
| 21.10.2026 | Lockvogel-Issue konnte den täglichen Alarm stumm schalten (Prüfung nach security-guidance) | behoben, 18 Tests grün |
| 22.10.2026 | vite 8.3.4: launch-editor (hoch) und vier moderate, alle nur im Entwicklungsserver         | behoben, oben          |
| 23.10.2026 | Tageslauf nach #38 von Hand: schliesst das eigene Issue #37 selbst                         | bestanden              |

Drei Befunde aus Meilenstein 4, alle behoben:

1. Ein zu grosser Upload antwortete mit 500. body-parser wirft einen eigenen Fehlertyp, der ohne
   Zuordnung als Serverfehler durchlief — für etwas, das der Aufrufer falsch gemacht hat.
2. Ein Dokument, dessen Löschung im Speicher fehlschlug, blieb abrufbar. Jetzt ist alles ausser
   `active` für jeden Zugriff verschwunden.
3. Ein Kundenzugang bekam auf dem Einladungsbereich 403 statt 404 und erfuhr damit, dass es ihn
   gibt.

Reproduzieren:

```bash
docker compose -f infra/docker-compose.yml up -d postgres_test
bun --env-file=.env run vitest run
```
