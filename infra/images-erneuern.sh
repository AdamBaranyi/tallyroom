#!/bin/bash
# Images erneuern, einmal im Monat von Hand:
#
#   sudo /opt/tallyroom/infra/images-erneuern.sh
#
# Warum es das braucht: Der Server pflegt sich selbst (unattended-upgrades),
# Container tun das nicht. Was in einem Container läuft, ist eingefroren auf
# den Tag, an dem sein Image gezogen wurde — inklusive der Systembibliotheken
# darin.
#
# Und eine Nummer wie postgres:18.1-alpine ist kein fester Stand: Wird im
# Alpine darunter eine Lücke geschlossen, baut der Hersteller dasselbe Image
# neu, unter derselben Nummer. Wer nur auf neue Nummern wartet, bekommt das
# nie mit. Darum `pull` für die fremden Images und `build --pull` für die
# eigenen — ohne --pull nimmt Docker die Basis-Images, die schon auf der
# Platte liegen, und der Neubau wäre wirkungslos.
#
# Neue Nummern (bun, caddy) meldet Dependabot als Pull Request; dieses Skript
# deckt den anderen Fall ab.
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE="infra/.env.production"
BACKUP_DIR="/var/backups/tallyroom"

if [ "$(id -u)" -ne 0 ]; then
  echo "Als root ausführen: sudo $0" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "$ENV_FILE fehlt. Zuerst infra/deploy.sh laufen lassen, das legt sie an." >&2
  exit 1
fi

compose() {
  docker compose -f infra/compose.prod.yml --env-file "$ENV_FILE" "$@"
}

echo "== Fremde Images neu ziehen (postgres, garage)"
compose pull postgres garage

echo "== Eigene Images mit frischen Basis-Images neu bauen"
compose build --pull --quiet

# Vor dem Austausch, nicht danach: Läuft beim Hochfahren etwas schief, ist der
# Rückweg sonst nur die nächtliche Sicherung von heute früh.
echo "== Datenbank sichern"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
backup="$BACKUP_DIR/vor-images-$(date +%Y%m%d-%H%M%S).sql.gz"
compose up -d --wait postgres
# bash statt sh wegen pipefail: in `pg_dump | gzip` zählte sonst nur gzip, und
# ein gescheiterter Dump ergäbe eine leere Sicherung (siehe deploy.sh).
compose exec -T postgres pg_dump -U tallyroom -d tallyroom | gzip >"$backup"
chmod 600 "$backup"
echo "   $backup ($(du -h "$backup" | cut -f1))"

echo "== Austauschen"
compose up -d --wait

echo "== Aufräumen"
docker image prune --force >/dev/null
docker builder prune --force --filter until=168h >/dev/null

echo "== Stand"
compose ps --format '{{.Service}}: {{.Status}}'
