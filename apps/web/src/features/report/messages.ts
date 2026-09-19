import { defineMessages } from '../../i18n/messages.ts';

/** Texte des Monatsberichts, gleich für Teamansicht und Portal. */
export const reportMessages = defineMessages({
  de: {
    title: 'Monatsbericht',
    lead: (customer: string, month: string) => `${customer} · ${month}`,
    generated: (moment: string) => `Erstellt am ${moment}`,
    source:
      'Alle Angaben stammen aus dem laufenden Bestand und dem Protokoll. Nichts ist von Hand eingetragen.',
    month: 'Monat',
    print: 'Drucken oder als PDF sichern',
    loading: 'Bericht wird erstellt …',
    loadFailed: 'Der Bericht konnte nicht geladen werden.',
    sections: {
      done: 'Erledigt in diesem Monat',
      requests: 'Anfragen',
      open: 'Offen, Stand heute',
      documents: 'Freigegebene Dokumente',
      projects: 'Laufende Projekte',
      contracts: 'Vereinbarter Monatswert',
    },
    counts: {
      opened: 'eröffnet',
      resolved: 'erledigt',
      contracts: (count: number) =>
        count === 1
          ? 'CHF · aus 1 bestätigten Vertrag'
          : `CHF · aus ${count} bestätigten Verträgen`,
      milestones: (done: number, total: number) => `${done} von ${total} Meilensteinen`,
      milestonesDone: 'abgeschlossene Meilensteine',
    },
    empty: {
      done: 'In diesem Monat wurde kein Meilenstein abgeschlossen.',
      open: 'Nichts offen.',
      documents: 'In diesem Monat wurde kein Dokument freigegeben.',
      projects: 'Keine laufenden Projekte.',
    },
  },
  fr: {
    title: 'Rapport mensuel',
    lead: (customer: string, month: string) => `${customer} · ${month}`,
    generated: (moment: string) => `Établi le ${moment}`,
    source:
      'Toutes les données proviennent du contenu actuel et du journal. Rien n’est saisi à la main.',
    month: 'Mois',
    print: 'Imprimer ou enregistrer en PDF',
    loading: 'Établissement du rapport …',
    loadFailed: "Le rapport n'a pas pu être chargé.",
    sections: {
      done: 'Terminé ce mois-ci',
      requests: 'Demandes',
      open: 'Ouvert, à ce jour',
      documents: 'Documents partagés',
      projects: 'Projets en cours',
      contracts: 'Valeur mensuelle convenue',
    },
    counts: {
      opened: 'ouvertes',
      resolved: 'résolues',
      contracts: (count: number) =>
        count === 1 ? "CHF · d'un contrat confirmé" : `CHF · de ${count} contrats confirmés`,
      milestones: (done: number, total: number) => `${done} jalons sur ${total}`,
      milestonesDone: 'jalons terminés',
    },
    empty: {
      done: 'Aucun jalon terminé ce mois-ci.',
      open: 'Rien en suspens.',
      documents: 'Aucun document partagé ce mois-ci.',
      projects: 'Aucun projet en cours.',
    },
  },
  it: {
    title: 'Rapporto mensile',
    lead: (customer: string, month: string) => `${customer} · ${month}`,
    generated: (moment: string) => `Creato il ${moment}`,
    source:
      'Tutti i dati provengono dal contenuto attuale e dal registro. Nulla è inserito a mano.',
    month: 'Mese',
    print: 'Stampa o salva in PDF',
    loading: 'Creazione del rapporto …',
    loadFailed: 'Non è stato possibile caricare il rapporto.',
    sections: {
      done: 'Completato questo mese',
      requests: 'Richieste',
      open: 'Aperto, a oggi',
      documents: 'Documenti condivisi',
      projects: 'Progetti in corso',
      contracts: 'Valore mensile concordato',
    },
    counts: {
      opened: 'aperte',
      resolved: 'risolte',
      contracts: (count: number) =>
        count === 1 ? 'CHF · da 1 contratto confermato' : `CHF · da ${count} contratti confermati`,
      milestones: (done: number, total: number) => `${done} traguardi su ${total}`,
      milestonesDone: 'traguardi completati',
    },
    empty: {
      done: 'Questo mese non è stato completato alcun traguardo.',
      open: 'Nulla in sospeso.',
      documents: 'Questo mese non è stato condiviso alcun documento.',
      projects: 'Nessun progetto in corso.',
    },
  },
  en: {
    title: 'Monthly report',
    lead: (customer: string, month: string) => `${customer} · ${month}`,
    generated: (moment: string) => `Created on ${moment}`,
    source:
      'Every figure comes from the live data and the activity log. Nothing is entered by hand.',
    month: 'Month',
    print: 'Print or save as PDF',
    loading: 'Building the report …',
    loadFailed: 'The report could not be loaded.',
    sections: {
      done: 'Completed this month',
      requests: 'Requests',
      open: 'Open, as of today',
      documents: 'Shared documents',
      projects: 'Running projects',
      contracts: 'Agreed monthly value',
    },
    counts: {
      opened: 'opened',
      resolved: 'resolved',
      contracts: (count: number) =>
        count === 1 ? 'CHF · from 1 confirmed contract' : `CHF · from ${count} confirmed contracts`,
      milestones: (done: number, total: number) => `${done} of ${total} milestones`,
      milestonesDone: 'milestones completed',
    },
    empty: {
      done: 'No milestone was completed this month.',
      open: 'Nothing open.',
      documents: 'No document was shared this month.',
      projects: 'No running projects.',
    },
  },
});
