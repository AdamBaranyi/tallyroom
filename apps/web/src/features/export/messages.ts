import { defineMessages } from '../../i18n/messages.ts';

/** Texte für den Datenauszug und das Übergabepaket. */
export const exportMessages = defineMessages({
  de: {
    title: 'Daten mitnehmen',
    lead: 'Alles, was in diesem Workspace steht, als ZIP — offene Formate, ohne Werkzeug lesbar.',
    contents:
      'Enthalten sind daten.json, eine CSV je Tabelle und die Dokumente als Dateien. Interne Notizen sind dabei: das ist der Auszug des Betreibers.',
    download: 'Alles herunterladen',
    ownerOnly: 'Nur der Owner kann den vollständigen Auszug herunterladen.',
    handover: {
      title: 'Übergabepaket',
      lead: 'Alles, was dieser Kunde im Portal sieht, als ZIP zum Weitergeben.',
      note: 'Ohne interne Notizen und interne Kommentare — dieselbe Grenze wie im Portal.',
      download: 'Übergabepaket herunterladen',
    },
  },
  fr: {
    title: 'Emporter ses données',
    lead: 'Tout ce que contient cet espace, en ZIP — formats ouverts, lisibles sans outil.',
    contents:
      'Le fichier contient daten.json, un CSV par table et les documents. Les notes internes en font partie : ceci est l’export de l’exploitant.',
    download: 'Tout télécharger',
    ownerOnly: "Seul le propriétaire peut télécharger l'export complet.",
    handover: {
      title: 'Dossier de remise',
      lead: 'Tout ce que ce client voit dans le portail, en ZIP, prêt à transmettre.',
      note: 'Sans notes ni commentaires internes — la limite est celle du portail.',
      download: 'Télécharger le dossier',
    },
  },
  it: {
    title: 'Portare via i dati',
    lead: 'Tutto ciò che sta in questa area di lavoro, in ZIP — formati aperti, leggibili senza strumenti.',
    contents:
      'Contiene daten.json, un CSV per tabella e i documenti come file. Le note interne sono incluse: è l’estrazione del gestore.',
    download: 'Scarica tutto',
    ownerOnly: 'Solo il proprietario può scaricare l’estrazione completa.',
    handover: {
      title: 'Pacchetto di consegna',
      lead: 'Tutto ciò che questo cliente vede nel portale, in ZIP, pronto da consegnare.',
      note: 'Senza note e commenti interni — lo stesso limite del portale.',
      download: 'Scarica il pacchetto',
    },
  },
  en: {
    title: 'Take your data',
    lead: 'Everything in this workspace as a ZIP — open formats, readable without a tool.',
    contents:
      'It holds daten.json, one CSV per table and the documents as files. Internal notes are included: this is the operator’s export.',
    download: 'Download everything',
    ownerOnly: 'Only the owner can download the full export.',
    handover: {
      title: 'Handover package',
      lead: 'Everything this customer sees in the portal, as a ZIP to hand over.',
      note: 'Without internal notes and internal comments — the portal’s own boundary.',
      download: 'Download handover package',
    },
  },
});
