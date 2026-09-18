import { useMessages } from '../../i18n/messages.ts';
import { accessibilityMessages } from './accessibility-messages.ts';
import { LegalPage, LegalSection } from './LegalPage.tsx';
import { OPERATOR } from './operator.ts';

/**
 * Die Barrierefreiheitserklärung steht bewusst neben Impressum und
 * Datenschutz: sie ist dieselbe Art Aussage — was zugesichert wird, was
 * geprüft ist, und wo es hakt.
 */
export function AccessibilityPage() {
  const m = useMessages(accessibilityMessages);

  return (
    <LegalPage title={m.title} path="/barrierefreiheit">
      <p className="text-body text-muted">{m.updated}</p>
      <p className="text-body">{m.intro}</p>

      <LegalSection title={m.goal.title}>
        <p>{m.goal.body}</p>
      </LegalSection>

      <LegalSection title={m.tested.title}>
        <List items={m.tested.items} />
      </LegalSection>

      <LegalSection title={m.limits.title}>
        <List items={m.limits.items} />
      </LegalSection>

      <LegalSection title={m.feedback.title}>
        <p>{m.feedback.body}</p>
        {OPERATOR.email && (
          <a href={`mailto:${OPERATOR.email}`} className="self-start underline underline-offset-2">
            {OPERATOR.email}
          </a>
        )}
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
