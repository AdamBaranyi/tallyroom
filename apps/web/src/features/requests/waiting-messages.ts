import { defineMessages } from '../../i18n/messages.ts';

/**
 * Wer am Zug ist, in zwei Blickrichtungen. Die Teamansicht sagt «bei uns»
 * und «beim Kunden», das Portal sagt dieselbe Lage aus Sicht des Kunden:
 * «bei Ihnen» und «bei uns». Beides aus einer Datei, damit die zwei Seiten
 * nicht auseinanderlaufen.
 */
export const waitingMessages = defineMessages({
  de: {
    team: { team: 'Bei uns', client: 'Beim Kunden' },
    client: { team: 'Beim Team', client: 'Bei Ihnen' },
    since: (days: number) =>
      days === 0 ? 'seit heute' : days === 1 ? 'seit 1 Tag' : `seit ${days} Tagen`,
    label: 'Wer ist am Zug',
    filter: { all: 'Alle', team: 'Bei uns', client: 'Beim Kunden' },
    holdingUp: (count: number) =>
      count === 1 ? 'Eine Anfrage wartet auf Sie.' : `${count} Anfragen warten auf Sie.`,
    holdingUpDetail: 'Solange sie offen bleiben, geht es dort nicht weiter.',
  },
  fr: {
    team: { team: 'Chez nous', client: 'Chez le client' },
    client: { team: "Chez l'équipe", client: 'Chez vous' },
    since: (days: number) =>
      days === 0 ? "depuis aujourd'hui" : days === 1 ? 'depuis 1 jour' : `depuis ${days} jours`,
    label: 'Qui doit agir',
    filter: { all: 'Tout', team: 'Chez nous', client: 'Chez le client' },
    holdingUp: (count: number) =>
      count === 1 ? 'Une demande vous attend.' : `${count} demandes vous attendent.`,
    holdingUpDetail: "Tant qu'elles restent ouvertes, rien n'avance de ce côté.",
  },
  it: {
    team: { team: 'Da noi', client: 'Dal cliente' },
    client: { team: 'Dal team', client: 'Da lei' },
    since: (days: number) =>
      days === 0 ? 'da oggi' : days === 1 ? 'da 1 giorno' : `da ${days} giorni`,
    label: 'Chi deve agire',
    filter: { all: 'Tutto', team: 'Da noi', client: 'Dal cliente' },
    holdingUp: (count: number) =>
      count === 1
        ? 'Una richiesta attende una sua risposta.'
        : `${count} richieste attendono una sua risposta.`,
    holdingUpDetail: 'Finché restano aperte, lì non si va avanti.',
  },
  en: {
    team: { team: 'With us', client: 'With the customer' },
    client: { team: 'With the team', client: 'With you' },
    since: (days: number) =>
      days === 0 ? 'since today' : days === 1 ? 'for 1 day' : `for ${days} days`,
    label: 'Whose turn it is',
    filter: { all: 'All', team: 'With us', client: 'With the customer' },
    holdingUp: (count: number) =>
      count === 1 ? 'One request is waiting for you.' : `${count} requests are waiting for you.`,
    holdingUpDetail: 'While they stay open, nothing moves on them.',
  },
});
