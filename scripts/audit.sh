#!/usr/bin/env bash
# Prüft die Abhängigkeiten. Aufruf: bash scripts/audit.sh high|moderate
#
# Eine Stelle für Stufe und Ausnahmen: ci.yml ruft es mit «high» und blockiert,
# der tägliche Lauf mit «moderate» und meldet nur (scripts/sicherheits-meldung.sh).
# Der Exit-Code ist der von bun audit: 0 heisst sauber ab dieser Stufe, alles
# andere heisst Befund oder eine Prüfung, die nicht stattfand.
#
# Jede Ausnahme steht hier mit Kennung und ist in docs/SECURITY.md begründet
# (Paket, Stufe, Laufzeit oder Werkzeug, Grund, Datum, prüfen bis).
set -euo pipefail
stufe="${1:-high}"
ausnahmen=(
  --ignore GHSA-67mh-4wv8-2f99 # esbuild über drizzle-kit, nur Entwicklungsserver, kein Update – prüfen bis 10.11.2026
)
# Die Form mit «+» hält auch eine leere Liste aus: Bash vor 4.4 bricht sonst mit
# «unbound variable» ab, und ein Repo ohne Ausnahmen übernimmt diese Datei wörtlich.
bun audit --audit-level="$stufe" ${ausnahmen[@]+"${ausnahmen[@]}"}
