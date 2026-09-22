# Fallstudie

**Deutsch** · [English](CASE_STUDY.md)

Tallyroom ist ein Portfolio-Projekt: ein SaaS-Dashboard mit Kundenportal für kleine
Digitalagenturen, seit dem 11.09.2026 live unter <https://tallyroom.adambaranyi.xyz>. Gebaut in
zwei Etappen: die Grundlage vom 09. bis 12.09.2026, die Lücken zum heutigen Standard am 18. und
19.09.2026. Alle Firmen, Personen und Zahlen darin sind erfunden.

Diese Seite erklärt die Entscheidungen — jede aus einer Nutzeraufgabe, nicht aus Geschmack — und
nennt zu jeder den Beleg. Was gemessen wurde, steht mit Zahl da; was nicht gemessen ist, steht
nicht da.

## Die drei Aufgaben

1. **Das Team** will an einem Ort sehen, was mit einem Kunden läuft: Projekte, monatliche
   Serviceverträge, offene Anfragen, Unterlagen.
2. **Der Kunde** will sehen, was ihn betrifft — und nichts davon, was intern besprochen wird.
3. **Der Betreiber** will das Ganze vorführen können, ohne vorher Konten zu verteilen und ohne
   dass ein Besucher die Daten eines anderen sieht.

Alles Weitere folgt aus diesen drei Sätzen.

## Entscheidungen

### Ein getrenntes Portal statt einer gefilterten Oberfläche

Die naheliegende Lösung wäre eine Oberfläche, die je nach Rolle Felder ausblendet. Sie ist auch die
gefährlichste: Ausblenden ist eine Anzeigeentscheidung, und eine vergessene Stelle liefert interne
Daten an den Kunden aus.

Das Kundenportal hat deshalb eine eigene Datenzugriffsschicht, deren Abfragen fest auf Workspace
und Kunde eingeschränkt sind, und eigene DTOs, die interne Felder **gar nicht erst enthalten** —
ein öffentlicher Kommentar hat kein Sichtbarkeitsfeld, weil es nichts zu unterscheiden gibt.

_Beleg:_ 16 Integrationstests allein für diese Trennung, dazu eine rekursive Suche über jede
Portal-Antwort, die anschlägt, sobald eine interne Notiz irgendwo auftaucht. Fremde Objekte
antworten mit **404 statt 403**: ein 403 verrät, dass es das Objekt gibt.

### Freigeben ist eine Handlung

Dokumente sind intern, bis jemand sie freigibt. Kein Standard, der „meistens passt", keine
Sammelfreigabe beim Hochladen. Dasselbe bei Kommentaren: intern oder öffentlich, im Verlauf
sichtbar unterschieden.

_Beleg:_ Im Browser gegengeprüft — dieselbe Anfrage zeigt dem Team einen internen Kommentar, den
die Kundenansicht nicht kennt. Dateien sind ausschliesslich über die autorisierte API erreichbar:
privater Bucket, zufälliger Objektschlüssel, keine öffentliche URL, keine vorsignierten Links.

### Eine Demo je Besucher statt Screenshots

Ein Portfolio-Projekt, das man nur auf Bildern sieht, beweist nichts. „Demo starten" legt einen
eigenen Workspace an: vollständiger Datenbestand, fünf Identitäten zum Umschalten, 60 Minuten
Laufzeit, danach räumt ein Lauf Daten, Sitzungen und Dateien weg. Zwei Besucher sehen einander
nicht.

Grenzen gehören dazu: 30 Kunden, 50 Projekte, 50 Verträge, 100 Anfragen je Demo, fünf Demos je
Adresse und Viertelstunde, höchstens 50 gleichzeitig. Eigene Dateien nimmt die Demo nicht an; für
den Testupload liegt ein Beispieldokument bei.

_Beleg:_ Der Rollenwechsel erneuert die Sitzungs-ID und lädt die Oberfläche vollständig neu; Konten
fremder Demos werden abgewiesen. Einen Impersonation-Endpunkt für gewöhnliche Konten gibt es nicht.

### Eine Kennzahl, deren Regel ausgeschrieben ist

„Monatlicher Vertragswert" klingt eindeutig und ist es nicht. Die Regel steht deshalb im Klartext
in [ARCHITECTURE.md](ARCHITECTURE.md): Ein Vertrag zählt am Stichtag, wenn er bestätigt ist, sein
Beginn nicht in der Zukunft liegt und sein Ende leer oder später ist — das Enddatum ist exklusiv.
Sein Betrag ist die letzte Preisversion vor dem Stichtag. Eine Preisänderung gilt ab ihrem Datum
und lässt vergangene Monate unberührt.

_Beleg:_ Tests prüfen die **Zahl**, nicht die Form der Antwort. Ein Zähler, der überall null zeigte,
kam genau dadurch ans Licht (Diagnose 7).

### Gestaltung wie ein Datenblatt, nicht wie ein Kartenteppich

Richtung: Tinte auf Papier, Kanten statt Schatten, Zahlen in Mono, IBM Plex in drei Schnitten.
Kobalt ist **Datenfarbe** und an genau vier Stellen erlaubt — Diagrammdaten, aktiver
Navigationszustand, Fokusring und der Nebel im Hero der Startseite. Nie auf einem Knopf: die
Hauptaktion trägt Tinte. Ein Token namens `--accent` hätte genau dazu eingeladen, deshalb heisst es
`--data-mark`.

Der erste Entwurf war Violett auf Fastschwarz. Ein Audit gegen die verbreiteten Muster hat ihn als
das benannt, was er war: der KI-Standard in besserer Kleidung. Er ist ersetzt worden, nicht
verteidigt.

![Das Dashboard im heutigen Stand, dunkel: Seitenleiste, Kennzahlband mit monatlichem
Vertragswert, offene Anfragen nach der Seite, bei der sie liegen, Diagramm der letzten sechs
Monate](screenshots/dashboard-dunkel.png)

### Lesbarkeit schlägt Dichte

Das Datenblatt hatte ein Arbeitsband von 11 bis 14 px. Sauber gestuft — und für den Betreiber
schwer zu lesen, besonders in Kopf- und Fusszeile. Seit dem 12.09.2026 gilt: **keine Schrift unter
16 px**, auf keiner Seite und keiner Breite. Den Unterschied tragen jetzt Schnitt, Versalien,
Gewicht und Farbe.

Das ist eine Layoutänderung, keine Stiländerung, und sie hatte Folgen: Listen wechseln zwischen
Tabelle und Karten bei 1024 statt bei 640 Pixeln, weil die schmalste Tabelle 725 Pixel will und bei
768 nur 718 zur Verfügung stehen. Zwei Engine-Eigenheiten kamen dabei ans Licht (Diagnosen 24 und
25).

_Beleg:_ Zwei Prüfungen halten die Regel — `bun run check:font-floor` im Quelltext, in der CI, und
`e2e/font-size.spec.ts` im Browser: jede Seite, jeder Dialog, sechs Breiten, dazu „kein Wort mitten
im Wort gebrochen" und „jedes Formularfeld hat id oder name".

### Bewegung mit Budget

Drei Geschwindigkeiten (90, 160, 260 ms), zwei Kurven aus IBMs Bewegungssystem, genau drei bewegte
Momente. Kein Hochzählen von Zahlen, kein Scroll-Fade, kein Parallax. Der Nebel auf der Startseite
ist ein eigener Shader von 2.9 KB statt einer 155-KB-Bibliothek, läuft nur dort, hält bei
`prefers-reduced-motion` still und hat einen Knopf zum Anhalten (WCAG 2.2.2).

_Beleg:_ Lighthouse gegen die Live-Seite am 22.09.2026, je zwei Läufe: mobil 99 in der Leistung und
100 in den übrigen drei Kategorien, Desktop 100 in allen vier. Die Startseite lädt 137.0 KB
JavaScript (gzip) gegen ein Budget von 142 KB, das die CI prüft; Teamansicht, Portal und
Rechtsseiten kommen erst beim Aufruf dazu.

### Sicherheit als Voreinstellung, nicht als Kapitel

Serverseitige Sitzungen statt Tokens — eine Abmeldung wirkt sofort und serverseitig. Argon2id,
Sitzungsrotation bei Anmeldung und Rollenwechsel, CSRF mit sitzungsgebundenem Token und
Herkunftsprüfung, Rate-Limit auf der Anmeldung. Content Security Policy ohne `unsafe-inline`; die
Produktionsprüfung scheitert bei jedem Verstoss und bei jedem Konsolenfehler.

_Beleg:_ Die Null ist gegengeprüft: ein absichtlich eingeschleustes Inline-Skript, ein Inline-Style
und ein fremdes Bild wurden alle drei erkannt. Einzelheiten in [SECURITY.md](SECURITY.md).

### Betrieb gehört dazu

Der Deploy wird von Hand ausgelöst — eine grüne Pipeline deployt nichts. Das Skript sichert die
Datenbank **vor** der Migration, weil Migrationen nur vorwärts laufen. Jede Nacht um 02:30 sichert
ein Timer Datenbank und Dokumente mit Prüfsumme je Objekt.

_Beleg:_ Die Probe-Wiederherstellung ist am 11.09.2026 auf dem Server tatsächlich gelaufen: 16
Tabellen mit denselben Zeilenzahlen, 18 aktive Dokumente mit Datei, 18 Objekte Prüfsumme für
Prüfsumme gleich. Die Gegenprobe mit einem entfernten Dokument scheitert wie gewollt. Eine
Sicherung, die nie zurückgespielt wurde, ist eine Hoffnung.

## Die zweite Etappe: was ein Käufer erwartet

Nach dem ersten Deploy kam eine Durchsicht mit Quellen statt Bauchgefühl: Was erwartet jemand, der
2026 ein solches Werkzeug kauft — an Sicherheit, an Bedienung, an Umgang mit seinen Daten —, und
was fehlt hier? Was daraus gebaut ist, steht in diesem Kapitel. Die vier offenen Punkte stehen mit
Begründung in [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md).

### Ein Protokoll, das jemand liest

Der wichtigste Befund war keine fehlende Funktion. Seit dem ersten Meilenstein schrieb jedes Modul
jede Änderung in `activity_events` — und nichts las sie. Kein Endpunkt, keine Ansicht. Ein
Protokoll, das niemand lesen kann, beweist niemandem etwas.

Jetzt hat es eine eigene Seite mit Filtern nach Bereich, Zeitraum und Objekt, einen Verlauf an
Kunde, Projekt und Anfrage, einen Auszug als CSV und JSON und eine Aufbewahrung von zwölf Monaten.
Zellen, die mit `=`, `+`, `-` oder `@` beginnen, entschärft der Auszug, damit eine
Tabellenkalkulation sie nicht als Formel ausführt.

Und es ist versiegelt: Jeder Eintrag hasht seinen Inhalt zusammen mit dem Hash seines Vorgängers.
Wer einen Eintrag nachträglich ändert, bricht die Kette an genau dieser Stelle. Eine Kette braucht
dafür zwei Dinge, die man leicht vergisst: eine feste Reihenfolge, die nicht vom Zeitstempel
abhängt, und eine Sperre je Workspace beim Anhängen. Ohne die Sperre lesen zwei gleichzeitige
Schreiber denselben Vorgänger, und die Kette gabelt sich.

_Beleg:_ Ein Integrationstest ändert einen Eintrag direkt in der Datenbank und erwartet, dass die
Prüfung genau diesen meldet. Nach dem Deploy am 19.09.2026 in der Produktion nachgeprüft: 80 von 80
Einträgen versiegelt, dann eine echte Statusänderung — Eintrag 81 hing versiegelt an, die Kette
blieb unversehrt. Die Grenze steht in [SECURITY.md](SECURITY.md): Die Kette macht eine einzelne
Änderung nachweisbar, ersetzt aber keinen schreibgeschützten Speicher — wer Zugang zur Datenbank
hat, kann sie ganz neu schreiben.

### Wer hält auf

Der Status sagt „Wartet auf Kunde". Was er nicht sagt, ist seit wann — und das ist der eigentliche
Befund. Eine Anfrage, die seit elf Tagen beim Kunden liegt, ist etwas anderes als eine von gestern.

Jede offene Anfrage nennt jetzt die Seite, bei der sie liegt, und die Dauer; ab einer Woche steht
die Zeile in der Warnfarbe. Das Dashboard teilt die offenen Anfragen auf: bei uns, beim Kunden, ältester
Vorgang. Im Portal dreht sich die Blickrichtung: Aus „Bei uns seit 38 Tagen" wird „Beim Team seit
38 Tagen".

Der Zeitpunkt kommt aus dem Protokoll, nicht aus einer neuen Spalte. Eine zweite Stelle für
dieselbe Tatsache läuft beim ersten Fehler auseinander.

_Beleg:_ Integrationstests geben den Ball an den Kunden ab und wieder zurück und prüfen, dass die
Wartezeit ab dem letzten Statuswechsel zählt, nicht ab dem Anlegen.

### Wer geht, nimmt seine Daten mit

Zwei Auszüge mit zwei Berechtigungen. Der Owner lädt den ganzen Workspace als ZIP: alle Tabellen
als JSON und CSV, die Dokumente als Dateien, Mitgliedschaften und Protokoll. Für einen einzelnen
Kunden gibt es ein Übergabepaket mit genau dem, was er im Portal sieht — etwa wenn die
Zusammenarbeit endet.

Das Übergabepaket baut auf der Datenschicht des Portals auf, nicht auf einer eigenen Abfrage. So
gilt dieselbe Grenze „nichts Internes", die 16 Tests schon prüfen, statt einer zweiten, die man
erst noch prüfen müsste.

_Beleg:_ Ein Integrationstest öffnet das Archiv und sucht den internen Vermerk; er darf nirgends
vorkommen. Das ZIP-Format ist selbst geschrieben, rund 120 Zeilen ohne Abhängigkeit, und wird im
Test vom echten `unzip` gegengelesen.

### Was sonst dazukam

- **Monatsbericht je Kunde**, aus Bestand und Protokoll gerechnet statt abgelegt. Derselbe Bericht
  steht in Teamansicht und Portal — zwei Fassungen wären zwei Gelegenheiten, verschiedene Zahlen zu
  zeigen. Drucken übernimmt der Browser.
- **Rolle „Nur lesen"**: sieht, was ein Mitglied sieht, und wird an jeder ändernden Route
  serverseitig abgewiesen. Die Oberfläche zeigt ihr keine Knöpfe, die ohnehin scheitern würden.
- **Sortierbare Listen** über die Spaltenköpfe, mit `aria-sort` und dem Zustand in der URL. Eine
  erfundene Sortierung fällt auf die Vorgabe zurück, statt eine leere Liste zu liefern.
- **Seiten zu Barrierefreiheit, Vertrauen und Status**, dazu `security.txt` nach RFC 9116. Die
  Statusseite prüft im Browser des Besuchers und sagt dazu, was nicht überwacht wird: Es gibt keine
  Dauerüberwachung von aussen. Eine grüne Anzeige ohne Messung dahinter wäre Dekoration.

## Was geprüft ist

Gemessen am 22.09.2026:

| Prüfung                                | Ergebnis                                             |
| -------------------------------------- | ---------------------------------------------------- |
| Unit- und Integrationstests            | 276 grün, gegen eine echte PostgreSQL                |
| Playwright über sechs Breiten          | 426 grün, samt axe in hell und dunkel, vier Sprachen |
| WebKit und Firefox, iPhone bis Desktop | 430 grün                                             |
| Produktionsprüfung gegen den Server    | 3 von 3, null CSP-Verstösse, null Konsolenfehler     |
| Lighthouse live                        | mobil 99 · 100 · 100 · 100, Desktop 4 × 100          |
| Erstlast der Startseite                | 137.0 KB gzip gegen ein Budget von 142 KB            |

Alle Verfahren und die bekannten Lücken stehen in [TESTING.md](TESTING.md).

## Wo ich danebenlag

[DIAGNOSTICS.md](DIAGNOSTICS.md) führt 28 Befunde, davon vier als **Fehldiagnose** gekennzeichnet —
dort war meine erste Erklärung falsch. Sie stehen bewusst mit drin, weil eine falsche Fährte teurer
ist als der Fehler selbst. Fünf, die mich etwas gelehrt haben:

- **Ungeschichtetes CSS schlägt jede Utility.** `no-underline` stand an zwanzig Stellen und hat nie
  gewirkt. Dieselbe Falle traf Monate später den Umbruch der Schrift. Wer eine Klasse setzt und
  keine Wirkung sieht, prüft zuerst die Kaskadenschicht, nicht die Spezifität.
- **Eine abgeschnittene Testausgabe.** `| tail -6` zeigte „136 passed", der Bericht 4 rote. Seither
  werden Ergebnisse gezählt, nicht gelesen — und ein Secret-Scan läuft nie durch eine Pipe, deren
  Exit-Code niemand prüft.
- **Ein Überlauf ohne schuldiges Element.** In Safaris Engine zog die Beschriftung einer
  Auswahlliste die Seite auf 429 Pixel, während die Liste selbst 317 breit war. Inhalt kann über
  seinen Kasten hinausragen; die Mindestbreite war die falsche Spur.
- **Ein Zeitstempel, der keiner war.** Drizzle wandelt Zeitstempel nur für Spalten um, die es aus
  dem Schema kennt. Derselbe Zeitstempel aus einem SQL-Ausdruck kam als Zeichenkette zurück, obwohl
  die Typangabe `Date` versprach. Der Typecheck war grün, und jede Statusänderung lieferte 500.
  Eine Typangabe an rohem SQL ist eine Behauptung, keine Prüfung — gefunden haben es die
  Integrationstests, nicht der Compiler.
- **Grün auf einer Breite ist nicht grün.** Zweimal lief die Anfragetabelle bei 1024 Pixeln über:
  einmal um 10 Pixel, weil die neue Wartezeile nicht umbrechen durfte, einmal um 6, weil ein
  Sortierpfeil im Textfluss stand. Lokal hatte ich nur bei 1440 geprüft. Gemeldet hat beides die
  Pipeline über sechs Breiten, bevor es live ging.

## Was bewusst fehlt

Passwort-Reset per E-Mail (ohne Mailversand nicht sauber baubar — der Betreiber setzt Passwörter
mit einem Befehl neu), Zahlungen und Rechnungen, Mehrfaktor-Authentisierung, öffentliche
Selbstregistrierung, weitere Währungen, SAML-SSO und SCIM. Jede dieser Lücken ist eine Entscheidung
mit Begründung, keine Vergesslichkeit. Ausführlicher begründet, samt dem, was stattdessen da ist,
im [README](../README.md#bewusst-nicht-enthalten).

Offen, aber nicht verworfen, sind vier Punkte aus der Durchsicht: Massenauswahl mit Rückgängig,
Benachrichtigungen in der Anwendung, das Löschen von Workspace und Konto und Passkeys als zweiter
Anmeldeweg.

## Was ich mitnehme

Die teuersten Fehler waren nicht die kaputten, sondern die stillen: eine Klasse ohne Wirkung, ein
Test, der nie scheitern konnte, eine Sicherung, die niemand zurückgespielt hat. Jeder davon steht
heute unter einer Prüfung, die anschlägt — das ist der eigentliche Unterschied zwischen „läuft bei
mir" und „läuft".

Die zweite Etappe hat denselben Befund eine Ebene höher gezeigt. Ein Protokoll, das jedes Modul
schreibt und nichts liest, arbeitet nicht falsch. Es beweist nur nie jemandem etwas.
