import { defineMessages } from '../../i18n/messages.ts';

/**
 * Die Vertrauensseite. Sie beantwortet die Fragen, die im Einkauf gestellt
 * werden — wo liegen die Daten, wer sieht sie, wie lange bleiben sie, was
 * passiert bei einem Fund —, und sie sagt ebenso klar, was es nicht gibt.
 */
export const trustMessages = defineMessages({
  de: {
    title: 'Vertrauen',
    updated: 'Stand 18.09.2026',
    intro:
      'Was mit den Daten passiert, die in Tallyroom stehen. Kurz, prüfbar und ohne Zusicherung, die nicht eingelöst wird.',
    location: {
      title: 'Wo die Daten liegen',
      body: 'Auf einem eigenen Server bei einem Schweizer Anbieter. Datenbank, Dateispeicher und Anwendung laufen dort zusammen; es gibt keinen weiteren Dienst, der Daten verarbeitet.',
    },
    thirdParties: {
      title: 'Wer sonst beteiligt ist',
      body: 'Nur der Anbieter des Servers, als Unterauftragsverarbeiter. Die Anwendung lädt nichts von Dritten: keine Analyse, keine Kartendienste, keine eingebetteten Schriften. Eine Prüfung in der Pipeline schlägt fehl, sobald eine Anfrage nach aussen dazukommt.',
    },
    retention: {
      title: 'Wie lange etwas bleibt',
      items: [
        'Nächtliche Sicherungen: 14 Tage. Die Sicherung vor einem Deploy: 30 Tage.',
        'Aktivitätsprotokoll: zwölf Monate, danach räumt ein täglicher Lauf auf.',
        'Anmeldung: zwei Stunden ohne Aktivität, spätestens nach zwölf Stunden endet die Sitzung.',
        'Eine Demo samt allen Daten: 60 Minuten, danach wird sie vollständig gelöscht.',
        'Gelöschte Dokumente sind sofort unerreichbar; der Speicher wird nachgezogen, auch wenn ein Versuch scheitert.',
      ],
    },
    protection: {
      title: 'Wie geschützt wird',
      items: [
        'Verschlüsselte Verbindung mit TLS 1.2 und 1.3, HSTS, strenge Content-Security-Policy.',
        'Passwörter als Argon2id-Hash. Sitzungen liegen serverseitig und rotieren bei der Anmeldung.',
        'Dokumente liegen in einem privaten Speicher unter zufälligem Schlüssel und werden nur über die geprüfte Schnittstelle ausgeliefert.',
        'Begrenzungen gegen Missbrauch: Anmeldeversuche, Uploads und Demo-Starts sind je Adresse gedeckelt.',
        'Der Server ist nicht offen zugänglich: keine Anmeldung als root, Fernzugriff nur über einen verschlüsselten Tunnel.',
        'Abhängigkeiten und Container-Bilder werden täglich auf bekannte Lücken geprüft; der Quelltext liegt offen.',
      ],
    },
    missing: {
      title: 'Was es nicht gibt',
      items: [
        'Keine Anmeldung über einen Identitätsdienst und keinen zweiten Faktor. Begründung und geplanter Weg stehen im Repository.',
        'Keine Zertifizierung nach ISO 27001 oder SOC 2. Tallyroom ist ein Portfolioprojekt einer einzelnen Person.',
        'Noch keine Kopie der Sicherungen ausser Haus: fällt der Server aus, sind Anwendung und Sicherung am selben Ort.',
      ],
    },
    report: {
      title: 'Eine Lücke melden',
      body: 'Meldungen sind willkommen, auch anonym. Der Meldeweg steht maschinenlesbar unter /.well-known/security.txt. Antwort kommt, so schnell es geht; hinter dem Projekt steht eine Person.',
      file: 'security.txt ansehen',
    },
    statusLink: 'Zur Statusseite',
  },
  fr: {
    title: 'Confiance',
    updated: 'État au 18.09.2026',
    intro:
      'Ce qui arrive aux données qui se trouvent dans Tallyroom. Court, vérifiable et sans promesse qui ne serait pas tenue.',
    location: {
      title: 'Où sont les données',
      body: "Sur un serveur dédié chez un hébergeur suisse. La base de données, le stockage des fichiers et l'application y fonctionnent ensemble ; aucun autre service ne traite de données.",
    },
    thirdParties: {
      title: 'Qui est impliqué',
      body: "Uniquement l'hébergeur du serveur, comme sous-traitant. L'application ne charge rien de tiers : pas d'analytique, pas de cartes, pas de polices externes. Un test du pipeline échoue dès qu'une requête sortante apparaît.",
    },
    retention: {
      title: 'Durées de conservation',
      items: [
        'Sauvegardes nocturnes : 14 jours. La sauvegarde avant un déploiement : 30 jours.',
        "Journal d'activité : douze mois, ensuite une tâche quotidienne fait le ménage.",
        'Session : deux heures sans activité, et au plus tard douze heures.',
        'Une démo et toutes ses données : 60 minutes, puis suppression complète.',
        'Les documents supprimés deviennent immédiatement inaccessibles ; le stockage suit, même si une tentative échoue.',
      ],
    },
    protection: {
      title: 'Comment les données sont protégées',
      items: [
        'Connexion chiffrée en TLS 1.2 et 1.3, HSTS, politique de sécurité de contenu stricte.',
        'Mots de passe hachés avec Argon2id. Les sessions restent côté serveur et tournent à la connexion.',
        'Les documents sont stockés en privé sous une clé aléatoire et servis uniquement par une interface contrôlée.',
        'Limites contre les abus : tentatives de connexion, téléversements et démarrages de démo sont plafonnés par adresse.',
        "Le serveur n'est pas ouvert : pas de connexion root, accès distant uniquement par tunnel chiffré.",
        'Dépendances et images sont contrôlées chaque jour ; le code source est public.',
      ],
    },
    missing: {
      title: "Ce qui n'existe pas",
      items: [
        "Pas de connexion via un fournisseur d'identité ni de second facteur. La raison et la voie prévue figurent dans le dépôt.",
        "Pas de certification ISO 27001 ou SOC 2. Tallyroom est le projet de portfolio d'une seule personne.",
        "Pas encore de copie des sauvegardes hors site : si le serveur tombe, l'application et la sauvegarde sont au même endroit.",
      ],
    },
    report: {
      title: 'Signaler une faille',
      body: 'Les signalements sont bienvenus, même anonymes. La voie de contact est lisible par machine sous /.well-known/security.txt. La réponse arrive dès que possible ; une seule personne est derrière ce projet.',
      file: 'Voir security.txt',
    },
    statusLink: 'Vers la page de statut',
  },
  it: {
    title: 'Fiducia',
    updated: 'Stato al 18.09.2026',
    intro:
      'Che cosa succede ai dati che stanno in Tallyroom. In breve, verificabile e senza promesse che non vengono mantenute.',
    location: {
      title: 'Dove stanno i dati',
      body: 'Su un server proprio presso un fornitore svizzero. Banca dati, archivio dei file e applicazione girano lì insieme; non c’è nessun altro servizio che tratti dati.',
    },
    thirdParties: {
      title: 'Chi altro è coinvolto',
      body: 'Solo il fornitore del server, come responsabile del trattamento. L’applicazione non carica nulla da terzi: niente analisi, niente mappe, nessun carattere esterno. Una verifica nella pipeline fallisce appena compare una richiesta verso l’esterno.',
    },
    retention: {
      title: 'Quanto a lungo resta',
      items: [
        'Backup notturni: 14 giorni. Il backup prima di un rilascio: 30 giorni.',
        'Registro delle attività: dodici mesi, poi una routine quotidiana fa pulizia.',
        'Sessione: due ore senza attività, al più tardi dopo dodici ore.',
        'Una demo con tutti i suoi dati: 60 minuti, poi viene cancellata del tutto.',
        'I documenti eliminati diventano subito irraggiungibili; l’archivio segue, anche se un tentativo fallisce.',
      ],
    },
    protection: {
      title: 'Come vengono protetti',
      items: [
        'Connessione cifrata con TLS 1.2 e 1.3, HSTS, Content-Security-Policy rigorosa.',
        'Password come hash Argon2id. Le sessioni stanno sul server e ruotano al login.',
        'I documenti stanno in un archivio privato con chiave casuale e passano solo dall’interfaccia controllata.',
        'Limiti contro gli abusi: tentativi di accesso, caricamenti e avvii della demo sono limitati per indirizzo.',
        'Il server non è aperto: nessun accesso come root, accesso remoto solo tramite tunnel cifrato.',
        'Dipendenze e immagini vengono controllate ogni giorno; il codice sorgente è pubblico.',
      ],
    },
    missing: {
      title: 'Che cosa non c’è',
      items: [
        'Nessun accesso tramite un servizio di identità e nessun secondo fattore. Motivo e percorso previsto stanno nel repository.',
        'Nessuna certificazione ISO 27001 o SOC 2. Tallyroom è il progetto di portfolio di una persona sola.',
        'Non c’è ancora una copia dei backup fuori sede: se il server cade, applicazione e backup stanno nello stesso posto.',
      ],
    },
    report: {
      title: 'Segnalare una falla',
      body: 'Le segnalazioni sono benvenute, anche anonime. La via di contatto è leggibile a macchina sotto /.well-known/security.txt. La risposta arriva appena possibile; dietro il progetto c’è una persona sola.',
      file: 'Vedi security.txt',
    },
    statusLink: 'Alla pagina di stato',
  },
  en: {
    title: 'Trust',
    updated: 'As of 18.09.2026',
    intro:
      'What happens to the data that sits in Tallyroom. Short, checkable, and without a promise that is not kept.',
    location: {
      title: 'Where the data sits',
      body: 'On a dedicated server at a Swiss provider. Database, file storage and application run there together; no further service processes any data.',
    },
    thirdParties: {
      title: 'Who else is involved',
      body: 'Only the server provider, as a processor. The application loads nothing from third parties: no analytics, no maps, no embedded fonts. A test in the pipeline fails the moment an outbound request appears.',
    },
    retention: {
      title: 'How long things stay',
      items: [
        'Nightly backups: 14 days. The backup taken before a deploy: 30 days.',
        'Activity log: twelve months, then a daily run clears it out.',
        'Session: two hours without activity, and twelve hours at the latest.',
        'A demo and all its data: 60 minutes, then it is deleted entirely.',
        'Deleted documents are unreachable immediately; storage follows, even when an attempt fails.',
      ],
    },
    protection: {
      title: 'How it is protected',
      items: [
        'Encrypted connection with TLS 1.2 and 1.3, HSTS, a strict content security policy.',
        'Passwords as Argon2id hashes. Sessions live on the server and rotate at login.',
        'Documents sit in private storage under a random key and are only served through the checked interface.',
        'Limits against abuse: login attempts, uploads and demo starts are capped per address.',
        'The server is not openly reachable: no root login, remote access only through an encrypted tunnel.',
        'Dependencies and container images are checked daily; the source code is public.',
      ],
    },
    missing: {
      title: 'What does not exist',
      items: [
        'No login through an identity provider and no second factor. The reasoning and the planned route are in the repository.',
        'No ISO 27001 or SOC 2 certification. Tallyroom is one person’s portfolio project.',
        'No off-site copy of the backups yet: if the server fails, application and backup are in the same place.',
      ],
    },
    report: {
      title: 'Report a weakness',
      body: 'Reports are welcome, anonymous ones too. The contact route is machine readable at /.well-known/security.txt. An answer comes as soon as possible; one person stands behind this project.',
      file: 'View security.txt',
    },
    statusLink: 'To the status page',
  },
});
