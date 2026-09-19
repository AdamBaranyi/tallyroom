import { inCurrentLocale } from '@tallyroom/contracts';

/**
 * Die Datei, die im Archiv zuoberst liegt. Ein Auszug ohne Erklärung ist ein
 * Ordner voller Dateien; mit ihr ist er eine Übergabe.
 */
export function readmeText(kind: 'workspace' | 'handover', name: string): string {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  if (kind === 'handover') {
    return `${inCurrentLocale({
      de: `Übergabepaket für ${name}`,
      fr: `Dossier de remise pour ${name}`,
      it: `Pacchetto di consegna per ${name}`,
      en: `Handover package for ${name}`,
    })}
${now} UTC

${inCurrentLocale({
  de: `Inhalt: alles, was im Kundenportal freigegeben ist — Projekte mit ihren
Meilensteinen, bestätigte Verträge, Anfragen samt öffentlichen Kommentaren und
die freigegebenen Dokumente als Dateien.

Nicht enthalten: interne Notizen, interne Kommentare und Dokumente, die nie
freigegeben wurden. Diese Grenze ist dieselbe wie im Portal; das Paket benutzt
dieselbe Datenschicht.`,
  fr: `Contenu : tout ce qui est publié dans le portail client — projets et
jalons, contrats confirmés, demandes avec leurs commentaires publics et les
documents publiés, sous forme de fichiers.

Non inclus : notes internes, commentaires internes et documents jamais publiés.
La limite est celle du portail ; ce dossier utilise la même couche de données.`,
  it: `Contenuto: tutto ciò che è pubblicato nel portale clienti — progetti con i
loro traguardi, contratti confermati, richieste con i commenti pubblici e i
documenti pubblicati come file.

Non incluso: note interne, commenti interni e documenti mai pubblicati. Il
limite è quello del portale; il pacchetto usa lo stesso strato di dati.`,
  en: `Contents: everything released in the client portal — projects with their
milestones, confirmed contracts, requests with their public comments, and the
released documents as files.

Not included: internal notes, internal comments and documents that were never
released. That boundary is the portal's own; this package uses the same data
layer.`,
})}

daten.json · ${inCurrentLocale({
      de: 'alle Angaben in einer Datei, mit den technischen Feldnamen',
      fr: 'toutes les données dans un fichier, avec les noms de champs techniques',
      it: 'tutti i dati in un file, con i nomi tecnici dei campi',
      en: 'all data in one file, with the technical field names',
    })}
tabellen/*.csv · ${inCurrentLocale({
      de: 'dieselben Angaben je Tabelle, für Excel und Numbers',
      fr: 'les mêmes données par table, pour Excel et Numbers',
      it: 'gli stessi dati per tabella, per Excel e Numbers',
      en: 'the same data per table, for Excel and Numbers',
    })}
dokumente/ · ${inCurrentLocale({
      de: 'die Dateien selbst, unverändert',
      fr: 'les fichiers eux-mêmes, inchangés',
      it: 'i file stessi, invariati',
      en: 'the files themselves, unchanged',
    })}
`;
  }

  return `${inCurrentLocale({
    de: `Datenauszug aus Tallyroom · ${name}`,
    fr: `Export de données Tallyroom · ${name}`,
    it: `Estrazione dati da Tallyroom · ${name}`,
    en: `Data export from Tallyroom · ${name}`,
  })}
${now} UTC

${inCurrentLocale({
  de: `Inhalt: der vollständige Bestand dieses Workspace — Kunden, Projekte,
Meilensteine, Verträge mit Preisversionen, Anfragen mit allen Kommentaren,
Dokumente samt Dateien, Mitgliedschaften und das Aktivitätsprotokoll.

Interne Notizen und interne Kommentare sind enthalten: dies ist der Auszug für
den Betreiber, nicht das Paket für einen Kunden. Passwörter sind nicht
enthalten und verlassen die Datenbank nie.`,
  fr: `Contenu : l'ensemble des données de cet espace — clients, projets, jalons,
contrats et versions tarifaires, demandes avec tous les commentaires, documents
et fichiers, adhésions et journal d'activité.

Les notes et commentaires internes sont inclus : ceci est l'export destiné à
l'exploitant, pas le dossier destiné à un client. Les mots de passe ne sont pas
inclus et ne quittent jamais la base.`,
  it: `Contenuto: l'intero patrimonio di questa area di lavoro — clienti, progetti,
traguardi, contratti con le versioni di prezzo, richieste con tutti i commenti,
documenti e file, adesioni e registro delle attività.

Note e commenti interni sono inclusi: questa è l'estrazione per il gestore, non
il pacchetto per un cliente. Le password non sono incluse e non lasciano mai la
banca dati.`,
  en: `Contents: the complete holdings of this workspace — customers, projects,
milestones, contracts with their rate versions, requests with all comments,
documents including files, memberships and the activity log.

Internal notes and internal comments are included: this is the operator's
export, not the package for a customer. Passwords are not included and never
leave the database.`,
})}

daten.json · ${inCurrentLocale({
    de: 'alle Angaben in einer Datei, mit den technischen Feldnamen',
    fr: 'toutes les données dans un fichier, avec les noms de champs techniques',
    it: 'tutti i dati in un file, con i nomi tecnici dei campi',
    en: 'all data in one file, with the technical field names',
  })}
tabellen/*.csv · ${inCurrentLocale({
    de: 'dieselben Angaben je Tabelle, für Excel und Numbers',
    fr: 'les mêmes données par table, pour Excel et Numbers',
    it: 'gli stessi dati per tabella, per Excel e Numbers',
    en: 'the same data per table, for Excel and Numbers',
  })}
dokumente/ · ${inCurrentLocale({
    de: 'die Dateien selbst, unverändert',
    fr: 'les fichiers eux-mêmes, inchangés',
    it: 'i file stessi, invariati',
    en: 'the files themselves, unchanged',
  })}
`;
}
