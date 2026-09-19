import { defineMessages } from '../../i18n/messages.ts';

/**
 * Die Statusseite. Sie behauptet keine Überwachung, die es nicht gibt: die
 * Prüfung läuft im Browser der Besucherin, jetzt gerade, und was sonst
 * überwacht wird, steht daneben.
 */
export const statusMessages = defineMessages({
  de: {
    title: 'Status',
    intro:
      'Ob die Anwendung gerade antwortet, wird beim Öffnen dieser Seite geprüft — in Ihrem Browser, nicht aus einem Bericht von gestern.',
    checking: 'Wird geprüft …',
    up: 'Anwendung und Datenbank antworten.',
    down: 'Die Anwendung antwortet nicht. Möglicherweise läuft gerade eine Wartung.',
    checkedAt: (time: string) => `Geprüft um ${time}`,
    recheck: 'Erneut prüfen',
    watched: {
      title: 'Was überwacht wird',
      items: [
        'Jeder Dienst meldet dem Container-System, ob er gesund ist; ein kranker Dienst wird neu gestartet.',
        'Die nächtliche Sicherung schreibt ihr Ergebnis auf den Server. Beim Anmelden steht dort, ob sie durchlief.',
        'Abhängigkeiten und Container-Bilder werden täglich geprüft, Updates mit Wartezeit eingespielt.',
      ],
    },
    notWatched: {
      title: 'Was nicht überwacht wird',
      items: [
        'Keine Dauerüberwachung von aussen: fällt die Seite nachts aus, merkt es niemand automatisch.',
        'Keine Meldung aufs Telefon, weder bei einem Ausfall noch bei einer gescheiterten Sicherung.',
        'Kein zugesichertes Zeitfenster für die Wiederherstellung. Tallyroom ist ein Portfolioprojekt.',
      ],
    },
    incidents: {
      title: 'Störungen',
      none: 'Seit dem Start am 11.09.2026 ist keine Störung eingetragen.',
      note: 'Eingetragen wird von Hand, im Quelltext. Was hier fehlt, kann trotzdem passiert sein.',
    },
  },
  fr: {
    title: 'Statut',
    intro:
      "La disponibilité est vérifiée à l'ouverture de cette page — dans votre navigateur, et non d'après un rapport d'hier.",
    checking: 'Vérification …',
    up: "L'application et la base de données répondent.",
    down: "L'application ne répond pas. Une maintenance est peut-être en cours.",
    checkedAt: (time: string) => `Vérifié à ${time}`,
    recheck: 'Vérifier à nouveau',
    watched: {
      title: 'Ce qui est surveillé',
      items: [
        "Chaque service indique au système de conteneurs s'il est sain ; un service malade est redémarré.",
        'La sauvegarde nocturne écrit son résultat sur le serveur. À la connexion, on voit si elle est passée.',
        'Dépendances et images sont contrôlées chaque jour, les mises à jour appliquées après un délai.',
      ],
    },
    notWatched: {
      title: "Ce qui n'est pas surveillé",
      items: [
        "Pas de surveillance externe permanente : une panne nocturne n'alerte personne automatiquement.",
        'Pas de notification sur téléphone, ni pour une panne ni pour une sauvegarde échouée.',
        'Aucun délai de rétablissement garanti. Tallyroom est un projet de portfolio.',
      ],
    },
    incidents: {
      title: 'Incidents',
      none: 'Depuis le lancement du 11.09.2026, aucun incident enregistré.',
      note: "L'enregistrement est manuel, dans le code source. Ce qui manque ici a pu arriver quand même.",
    },
  },
  it: {
    title: 'Stato',
    intro:
      'Se l’applicazione risponde viene verificato all’apertura di questa pagina — nel suo browser, non da un rapporto di ieri.',
    checking: 'Verifica in corso …',
    up: 'Applicazione e banca dati rispondono.',
    down: 'L’applicazione non risponde. Forse è in corso una manutenzione.',
    checkedAt: (time: string) => `Verificato alle ${time}`,
    recheck: 'Verifica di nuovo',
    watched: {
      title: 'Che cosa viene sorvegliato',
      items: [
        'Ogni servizio segnala al sistema dei container se è sano; un servizio malato viene riavviato.',
        'Il backup notturno scrive il suo esito sul server. Al login si vede se è andato a buon fine.',
        'Dipendenze e immagini vengono controllate ogni giorno, gli aggiornamenti applicati dopo un’attesa.',
      ],
    },
    notWatched: {
      title: 'Che cosa non viene sorvegliato',
      items: [
        'Nessuna sorveglianza continua dall’esterno: un guasto di notte non avvisa nessuno in automatico.',
        'Nessuna notifica sul telefono, né per un guasto né per un backup fallito.',
        'Nessun tempo di ripristino garantito. Tallyroom è un progetto di portfolio.',
      ],
    },
    incidents: {
      title: 'Disservizi',
      none: 'Dall’avvio dell’11.09.2026 non è registrato alcun disservizio.',
      note: 'La registrazione è manuale, nel codice sorgente. Ciò che manca qui può essere successo lo stesso.',
    },
  },
  en: {
    title: 'Status',
    intro:
      'Whether the application answers right now is checked when this page opens — in your browser, not from yesterday’s report.',
    checking: 'Checking …',
    up: 'Application and database are answering.',
    down: 'The application is not answering. Maintenance may be running.',
    checkedAt: (time: string) => `Checked at ${time}`,
    recheck: 'Check again',
    watched: {
      title: 'What is watched',
      items: [
        'Every service tells the container system whether it is healthy; an unhealthy one is restarted.',
        'The nightly backup writes its result on the server. Logging in shows whether it ran.',
        'Dependencies and container images are checked daily, updates applied after a waiting period.',
      ],
    },
    notWatched: {
      title: 'What is not watched',
      items: [
        'No continuous external monitoring: if the site goes down at night, nobody is told automatically.',
        'No notification to a phone, neither for an outage nor for a failed backup.',
        'No promised time to recovery. Tallyroom is a portfolio project.',
      ],
    },
    incidents: {
      title: 'Incidents',
      none: 'Since the launch on 11.09.2026, no incident has been recorded.',
      note: 'Recording is manual, in the source code. What is missing here may still have happened.',
    },
  },
});
