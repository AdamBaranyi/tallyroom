import { Link } from 'react-router';
import { useMessages } from '../../i18n/messages.ts';
import { LegalPage, LegalSection } from './LegalPage.tsx';
import { trustMessages } from './trust-messages.ts';

/**
 * Die Vertrauensseite. Einkauf und Datenschutz fragen dasselbe, und die
 * Antworten standen bisher verstreut in der Datenschutzerklärung, im
 * Repository und in der Betriebsdoku — also nirgends für jemanden, der das
 * Produkt zum ersten Mal ansieht.
 */
export function TrustPage() {
  const m = useMessages(trustMessages);

  return (
    <LegalPage title={m.title} path="/vertrauen">
      <p className="text-body text-muted">{m.updated}</p>
      <p className="text-body">{m.intro}</p>

      <LegalSection title={m.location.title}>
        <p>{m.location.body}</p>
      </LegalSection>

      <LegalSection title={m.thirdParties.title}>
        <p>{m.thirdParties.body}</p>
      </LegalSection>

      <LegalSection title={m.retention.title}>
        <List items={m.retention.items} />
      </LegalSection>

      <LegalSection title={m.protection.title}>
        <List items={m.protection.items} />
      </LegalSection>

      <LegalSection title={m.missing.title}>
        <List items={m.missing.items} />
      </LegalSection>

      <LegalSection title={m.report.title}>
        <p>{m.report.body}</p>
        {/* Kein React-Router-Link: die Datei liegt neben der Anwendung, nicht in ihr. */}
        <a href="/.well-known/security.txt" className="self-start underline underline-offset-2">
          {m.report.file}
        </a>
        <Link to="/status" className="self-start underline underline-offset-2">
          {m.statusLink}
        </Link>
      </LegalSection>
    </LegalPage>
  );
}

function List({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
