import { defineMessages } from '../../i18n/messages.ts';

export const searchMessages = defineMessages({
  de: {
    dialogLabel: 'Springen zu',
    inputLabel: 'Kunde, Projekt, Vertrag oder Anfrage suchen',
    placeholder: 'Kunde, Projekt, Vertrag oder Anfrage',
    resultsLabel: 'Treffer',
    tooShort: (minLength: number) => `Mindestens ${minLength} Zeichen eingeben.`,
    searching: 'Wird gesucht …',
    noResults: (term: string) => `Kein Treffer für „${term}".`,
    /** Für die Statuszeile: wie viele, und welcher gerade markiert ist. */
    announce: (count: number, first: string) =>
      `${count === 1 ? 'Ein Treffer' : `${count} Treffer`}, markiert: ${first}.`,
    keys: {
      select: 'wählen',
      jump: 'springen',
      close: 'schliessen',
      describe:
        'Mit den Pfeiltasten einen Treffer wählen, mit der Eingabetaste hinspringen, mit Escape schliessen.',
    },
    kind: { customer: 'Kunde', project: 'Projekt', contract: 'Vertrag', request: 'Anfrage' },
  },
  fr: {
    dialogLabel: 'Aller à',
    inputLabel: 'Rechercher un client, un projet, un contrat ou une demande',
    placeholder: 'Client, projet, contrat ou demande',
    resultsLabel: 'Résultats',
    tooShort: (minLength: number) =>
      `Saisissez au moins ${minLength} ${minLength < 2 ? 'caractère' : 'caractères'}.`,
    searching: 'Recherche en cours …',
    noResults: (term: string) => `Aucun résultat pour «\u00a0${term}\u00a0».`,
    announce: (count: number, first: string) =>
      `${count === 1 ? 'Un résultat' : `${count} résultats`}, sélectionné\u00a0: ${first}.`,
    keys: {
      select: 'choisir',
      jump: 'aller',
      close: 'fermer',
      describe:
        'Choisissez un résultat avec les flèches, ouvrez-le avec Entrée, fermez avec Échap.',
    },
    kind: { customer: 'Client', project: 'Projet', contract: 'Contrat', request: 'Demande' },
  },
  it: {
    dialogLabel: 'Vai a',
    inputLabel: 'Cerca un cliente, un progetto, un contratto o una richiesta',
    placeholder: 'Cliente, progetto, contratto o richiesta',
    resultsLabel: 'Risultati',
    tooShort: (minLength: number) =>
      `Inserisca almeno ${minLength} ${minLength === 1 ? 'carattere' : 'caratteri'}.`,
    searching: 'Ricerca in corso …',
    noResults: (term: string) => `Nessun risultato per «${term}».`,
    announce: (count: number, first: string) =>
      `${count === 1 ? 'Un risultato' : `${count} risultati`}, selezionato: ${first}.`,
    keys: {
      select: 'seleziona',
      jump: 'vai',
      close: 'chiudi',
      describe: 'Scelga un risultato con le frecce, lo apra con Invio, chiuda con Esc.',
    },
    kind: { customer: 'Cliente', project: 'Progetto', contract: 'Contratto', request: 'Richiesta' },
  },
  en: {
    dialogLabel: 'Jump to',
    inputLabel: 'Search for a customer, project, contract or request',
    placeholder: 'Customer, project, contract or request',
    resultsLabel: 'Results',
    tooShort: (minLength: number) =>
      `Enter at least ${minLength} ${minLength === 1 ? 'character' : 'characters'}.`,
    searching: 'Searching …',
    noResults: (term: string) => `No results for ‘${term}’.`,
    announce: (count: number, first: string) =>
      `${count === 1 ? 'One result' : `${count} results`}, highlighted: ${first}.`,
    keys: {
      select: 'select',
      jump: 'jump',
      close: 'close',
      describe: 'Choose a result with the arrow keys, open it with Enter, close with Escape.',
    },
    kind: { customer: 'Customer', project: 'Project', contract: 'Contract', request: 'Request' },
  },
});
