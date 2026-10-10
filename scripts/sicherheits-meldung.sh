#!/usr/bin/env bash
# Hält genau ein Issue «Sicherheitsmeldungen» aus dem Bericht des täglichen Laufs:
# anlegen beim ersten Fund, ergänzen nur bei geänderter Kennungsliste, schliessen,
# sobald die Prüfung sauber ist. Eine E-Mail je Änderung, keine je Tag.
#
# Aufruf: bash scripts/sicherheits-meldung.sh <bericht> <exit-code von audit.sh>
# Braucht GH_TOKEN (issues: write) und GH_REPO.
#
# Sauber heisst Exit-Code 0, nicht «keine Kennung im Bericht»: Ohne Netz endet
# bun audit mit 1 und einem Text ohne Kennung. Dann bleibt das Issue, wie es ist,
# und der Lauf endet rot — eine Prüfung, die nicht stattfand, ist kein sauberer Tag.
set -euo pipefail
bericht="${1:?Aufruf: sicherheits-meldung.sh <bericht> <exit-code>}"
status="${2:?Aufruf: sicherheits-meldung.sh <bericht> <exit-code>}"
titel="Sicherheitsmeldungen"
label="sicherheit"
zuweisung="${ZUWEISUNG:-AdamBaranyi}"
heute=$(date -u +%F)

if [ ! -f "$bericht" ]; then
  echo "Bericht $bericht fehlt." >&2
  exit 2
fi

ids=$(grep -o -E 'GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}' "$bericht" | sort -u || true)

if [ "$status" != 0 ] && [ -z "$ids" ]; then
  echo "::error title=Prüfung fand nicht statt::bun audit endete mit $status ohne eine Kennung. Das Issue bleibt unverändert."
  cat "$bericht"
  exit 1
fi

# Ohne --search und ohne --label: Beide gehen über den Suchindex von GitHub
# («query IssueSearch», sichtbar mit GH_DEBUG=api), der mit Verzögerung nachzieht;
# zwei Läufe kurz hintereinander legten sonst zwei Issues an. Die blosse Liste
# liest direkt («query IssueList»), der Titel wird hier verglichen.
nummer=$(gh issue list --state open --limit 200 --json number,title \
  --jq "[.[] | select(.title == \"$titel\")][0].number // empty")

if [ "$status" = 0 ]; then
  if [ -n "$nummer" ]; then
    gh issue close "$nummer" --comment "Der tägliche Lauf vom $heute findet keine Befunde mehr."
  fi
  exit 0
fi

stand=$(printf '%s' "$ids" | sha256sum | cut -c1-12)
koerper=$(printf '<!-- stand:%s -->\nStand %s, Prüfung ab moderat mit den Ausnahmen aus scripts/audit.sh:\n\n```\n%s\n```\n\nRegel: high und critical mit Fix sofort (Laufzeit) oder mit dem nächsten Update-PR (Werkzeuge); moderate beim nächsten Update-PR; ohne Fix namentlich und befristet ausnehmen (docs/SECURITY.md).' "$stand" "$heute" "$(cat "$bericht")")

if [ -z "$nummer" ]; then
  gh label create "$label" --color B60205 --description "Befunde des täglichen Sicherheitslaufs" 2>/dev/null || true
  gh issue create --title "$titel" --label "$label" --assignee "$zuweisung" --body "$koerper"
  exit 0
fi

# In eine Variable statt direkt in «grep -q»: Mit pipefail kann grep, das nach dem
# ersten Treffer endet, gh einen Abbruch bescheren — dann sähe jeder Tag wie eine
# Änderung aus.
bisher=$(gh issue view "$nummer" --json body --jq .body)
case "$bisher" in
  *"stand:$stand"*)
    echo "Befunde unverändert seit dem letzten Lauf, keine neue Meldung."
    ;;
  *)
    gh issue edit "$nummer" --body "$koerper"
    gh issue comment "$nummer" --body "$(printf 'Geänderte Befunde am %s:\n\n```\n%s\n```' "$heute" "$(cat "$bericht")")"
    ;;
esac
