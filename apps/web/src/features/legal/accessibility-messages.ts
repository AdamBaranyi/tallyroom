import { defineMessages } from '../../i18n/messages.ts';

/**
 * Barrierefreiheitserklärung. Sie sagt, was geprüft ist, womit, und was nicht
 * erreicht wird — eine Erklärung ohne die bekannten Einschränkungen wäre
 * Werbung.
 */
export const accessibilityMessages = defineMessages({
  de: {
    title: 'Barrierefreiheit',
    updated: 'Stand 22.09.2026',
    intro:
      'Diese Erklärung gilt für tallyroom.adambaranyi.xyz, die öffentlichen Seiten, die Teamansicht und das Kundenportal.',
    goal: {
      title: 'Anspruch',
      body: 'Ziel ist WCAG 2.2 Stufe AA. Als Rahmen dient EN 301 549, die europäische Norm hinter dem European Accessibility Act. Tallyroom ist ein Portfolio- und Schulprojekt; eine förmliche Konformitätserklärung ist dies nicht.',
    },
    tested: {
      title: 'Was geprüft ist',
      items: [
        'Automatische Prüfung mit axe auf fünf Seiten, in hell und dunkel, dazu mit offenem Dialog und offener Kommandopalette — bei jeder Änderung in der Pipeline.',
        'Bedienung mit der Tastatur: sichtbarer Fokusring, Fokusfalle im Dialog, Rückgabe des Fokus beim Schliessen, Sprung zum Inhalt.',
        'Sechs Prüfbreiten von 320 bis 1440 Pixeln, ohne waagerechtes Scrollen, ohne Umbruch mitten im Wort.',
        'Keine Schrift unter 16 Pixeln, auf keiner Seite und in keinem Bedienelement; geprüft im Quelltext und im Browser.',
        'Reduzierte Bewegung wird beachtet: die Bewegung im Startbild steht still, Übergänge verkürzen sich.',
        'Bedienelemente sind mindestens 44 Pixel hoch.',
        'Mit echten Screenreadern: VoiceOver unter macOS und NVDA unter Windows prüfen bei jeder Änderung sieben Abläufe — ob eine Meldung angesagt wird, wohin der Fokus springt, ob ein Dialog seinen Namen nennt.',
      ],
    },
    limits: {
      title: 'Bekannte Einschränkungen',
      items: [
        'Die gedämpfteste Textfarbe erreicht im dunklen Erscheinungsbild ein Kontrastverhältnis von 3,7:1. Sie trägt deshalb nur Nebensachen, nie Fliesstext.',
        'Das Diagramm auf dem Dashboard ist visuell; dieselben Zahlen stehen als Tabelle darunter.',
        'Geprüft wurde automatisiert und von Hand, nicht von Menschen mit Behinderung und nicht von einer externen Stelle.',
        'Französisch und Italienisch sind maschinell übersetzt und nicht muttersprachlich geprüft.',
        'In der Kommandopalette sagt VoiceOver, wie viele Treffer es gibt; welcher markiert ist, hört man beim Wandern mit den Pfeiltasten. NVDA sagt beides.',
      ],
    },
    feedback: {
      title: 'Rückmeldung',
      body: 'Wer auf eine Hürde stösst, darf sie melden. Antwort kommt, so schnell es geht; eine Frist wird hier nicht behauptet, weil hinter dem Projekt eine einzelne Person steht.',
    },
  },
  fr: {
    title: 'Accessibilité',
    updated: 'État au 22.09.2026',
    intro:
      "Cette déclaration couvre tallyroom.adambaranyi.xyz : les pages publiques, la vue d'équipe et le portail client.",
    goal: {
      title: 'Objectif',
      body: "L'objectif est WCAG 2.2 niveau AA, avec la norme EN 301 549 comme cadre, celle qui sous-tend l'European Accessibility Act. Tallyroom est un projet de portfolio et d'école ; ceci n'est pas une déclaration formelle de conformité.",
    },
    tested: {
      title: 'Ce qui est vérifié',
      items: [
        'Vérification automatique avec axe sur cinq pages, en clair et en sombre, ainsi qu’avec une boîte de dialogue et la palette de commandes ouvertes — à chaque modification dans le pipeline.',
        'Utilisation au clavier : anneau de focus visible, focus retenu dans les dialogues, focus rendu à la fermeture, lien vers le contenu.',
        'Six largeurs de test de 320 à 1440 pixels, sans défilement horizontal ni coupure au milieu d’un mot.',
        'Aucun texte en dessous de 16 pixels, sur aucune page ni dans aucun élément de commande ; vérifié dans le code et dans le navigateur.',
        'Le réglage « mouvement réduit » est respecté : l’animation de la page d’accueil s’arrête, les transitions raccourcissent.',
        'Les éléments de commande mesurent au moins 44 pixels de haut.',
        'Avec de vrais lecteurs d’écran : VoiceOver sous macOS et NVDA sous Windows vérifient sept parcours à chaque modification — si un message est annoncé, où va le focus, si une boîte de dialogue dit son nom.',
      ],
    },
    limits: {
      title: 'Limites connues',
      items: [
        'La couleur de texte la plus discrète atteint un rapport de contraste de 3,7:1 en mode sombre. Elle ne porte donc que des éléments secondaires, jamais du texte courant.',
        'Le graphique du tableau de bord est visuel ; les mêmes chiffres figurent dans un tableau en dessous.',
        'Les tests sont automatisés et manuels, non menés par des personnes en situation de handicap ni par un organisme externe.',
        "Le français et l'italien sont traduits automatiquement, sans relecture par des locuteurs natifs.",
        'Dans la palette de commandes, VoiceOver annonce le nombre de résultats ; lequel est sélectionné s’entend en naviguant avec les flèches. NVDA annonce les deux.',
      ],
    },
    feedback: {
      title: 'Retour',
      body: "Toute personne qui rencontre un obstacle peut le signaler. La réponse arrive dès que possible ; aucun délai n'est promis ici, car le projet repose sur une seule personne.",
    },
  },
  it: {
    title: 'Accessibilità',
    updated: 'Stato al 22.09.2026',
    intro:
      'Questa dichiarazione vale per tallyroom.adambaranyi.xyz: le pagine pubbliche, la vista del team e il portale clienti.',
    goal: {
      title: 'Obiettivo',
      body: "L'obiettivo è WCAG 2.2 livello AA, con la norma EN 301 549 come riferimento, quella alla base dell'European Accessibility Act. Tallyroom è un progetto di portfolio e di scuola; questa non è una dichiarazione formale di conformità.",
    },
    tested: {
      title: 'Che cosa è verificato',
      items: [
        'Verifica automatica con axe su cinque pagine, in chiaro e in scuro, inoltre con finestra di dialogo e palette dei comandi aperte — a ogni modifica nella pipeline.',
        'Uso da tastiera: anello di focus visibile, focus trattenuto nella finestra di dialogo, focus restituito alla chiusura, salto al contenuto.',
        'Sei larghezze di prova da 320 a 1440 pixel, senza scorrimento orizzontale e senza interruzioni a metà parola.',
        'Nessun testo sotto i 16 pixel, in nessuna pagina e in nessun comando; verificato nel codice e nel browser.',
        'L’impostazione «movimento ridotto» è rispettata: l’animazione della pagina iniziale si ferma, le transizioni si accorciano.',
        'I comandi sono alti almeno 44 pixel.',
        'Con veri screen reader: VoiceOver su macOS e NVDA su Windows verificano sette percorsi a ogni modifica — se un messaggio viene annunciato, dove va il focus, se una finestra di dialogo dice il proprio nome.',
      ],
    },
    limits: {
      title: 'Limiti noti',
      items: [
        'Il colore di testo più tenue raggiunge un rapporto di contrasto di 3,7:1 in modalità scura. Porta quindi solo elementi secondari, mai testo corrente.',
        'Il grafico della dashboard è visivo; gli stessi numeri stanno in una tabella sotto di esso.',
        'Le verifiche sono automatiche e manuali, non svolte da persone con disabilità né da un ente esterno.',
        'Francese e italiano sono tradotti automaticamente, senza revisione madrelingua.',
        'Nella palette dei comandi VoiceOver annuncia quanti risultati ci sono; quale è selezionato si sente spostandosi con le frecce. NVDA annuncia entrambi.',
      ],
    },
    feedback: {
      title: 'Segnalazioni',
      body: 'Chi incontra un ostacolo può segnalarlo. La risposta arriva appena possibile; qui non viene promesso alcun termine, perché dietro il progetto c’è una persona sola.',
    },
  },
  en: {
    title: 'Accessibility',
    updated: 'As of 22.09.2026',
    intro:
      'This statement covers tallyroom.adambaranyi.xyz: the public pages, the team view and the client portal.',
    goal: {
      title: 'What is aimed at',
      body: 'The target is WCAG 2.2 level AA, with EN 301 549 as the frame — the European standard behind the European Accessibility Act. Tallyroom is a portfolio and school project; this is not a formal declaration of conformity.',
    },
    tested: {
      title: 'What is tested',
      items: [
        'Automated checks with axe on five pages, in light and dark, plus with an open dialog and the open command palette — on every change in the pipeline.',
        'Keyboard use: visible focus ring, focus trapped in dialogs, focus returned on close, skip link to the content.',
        'Six test widths from 320 to 1440 pixels, without horizontal scrolling and without breaks inside a word.',
        'No text below 16 pixels, on any page or control; checked in the source and in the browser.',
        'Reduced motion is honoured: the movement on the start page stops, transitions shorten.',
        'Controls are at least 44 pixels high.',
        'With real screen readers: VoiceOver on macOS and NVDA on Windows check seven flows on every change — whether a message is announced, where focus lands, whether a dialog says its name.',
      ],
    },
    limits: {
      title: 'Known limits',
      items: [
        'The most muted text colour reaches a contrast ratio of 3.7:1 in dark mode. It therefore carries side information only, never body text.',
        'The chart on the dashboard is visual; the same figures sit in a table below it.',
        'Testing is automated and manual, not carried out by disabled people or an external body.',
        'French and Italian are machine translated and not reviewed by native speakers.',
        'In the command palette VoiceOver says how many hits there are; which one is marked is heard when moving with the arrow keys. NVDA says both.',
      ],
    },
    feedback: {
      title: 'Feedback',
      body: 'Anyone who runs into a barrier is welcome to report it. An answer comes as soon as possible; no deadline is claimed here, because one person stands behind this project.',
    },
  },
});
