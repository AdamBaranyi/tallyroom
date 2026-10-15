import { useId } from 'react';
import { Link } from 'react-router';
import type { OldestOpenRequest } from '@tallyroom/contracts';
import { Card, CardHeader } from '../../components/base/Card.tsx';
import {
  CardItem,
  CardList,
  Cell,
  DataTable,
  Row,
  TableHead,
  Th,
} from '../../components/base/DataTable.tsx';
import { RecordLink } from '../../components/base/RecordLink.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { WaitingLine } from '../requests/WaitingLine.tsx';
import { requestMessages } from '../requests/messages.ts';
import { dashboardMessages } from './messages.ts';

interface Props {
  requests: OldestOpenRequest[];
  /** Pfadwurzel des Workspace. */
  base: string;
}

/**
 * Die offenen Anfragen, die am längsten liegen.
 *
 * «Ältester Vorgang» darüber nennt eine Dauer, aber keinen Vorgang. Diese
 * Karte nennt ihn und öffnet ihn. An ihrer Stelle stand bis zum 15.10.2026
 * ein Platzhalter aus der Zeit vor den Anfragen. Er sagte auch dann
 * «sobald es Anfragen gibt», wenn darüber offene gezählt waren, in der Demo
 * zwölf.
 */
export function OldestRequests({ requests, base }: Props) {
  const m = useMessages(dashboardMessages);
  const columns = useMessages(requestMessages).rows;
  const titleId = useId();
  const path = `${base}/requests`;

  return (
    <section aria-labelledby={titleId}>
      <Card>
        <CardHeader
          id={titleId}
          title={m.oldest.title}
          action={
            <Link
              to={path}
              className="-my-2 inline-flex min-h-11 items-center px-1 text-body font-medium"
            >
              {m.oldest.allRequests}
            </Link>
          }
        />

        {requests.length === 0 ? (
          <p className="px-4 pb-5 text-body text-muted sm:px-5">{m.waiting.noneOpen}</p>
        ) : (
          <>
            <CardList>
              {requests.map((request) => (
                <CardItem key={request.id}>
                  <Link
                    to={`${path}/${request.id}`}
                    className="flex flex-col gap-2 px-4 py-4 text-ink hover:bg-raised"
                  >
                    <span className="font-medium">{request.subject}</span>
                    <span className="text-body text-muted">{request.customerName}</span>
                    <WaitingLine
                      waitingOn={request.waitingOn}
                      waitingSince={request.waitingSince}
                    />
                  </Link>
                </CardItem>
              ))}
            </CardList>

            <DataTable>
              <TableHead>
                <Th>{columns.subject}</Th>
                <Th>{columns.customer}</Th>
                <Th>{m.waiting.label}</Th>
              </TableHead>
              <tbody>
                {requests.map((request) => (
                  <Row key={request.id}>
                    <Cell lead>
                      <RecordLink to={`${path}/${request.id}`} title={request.subject} />
                    </Cell>
                    <Cell>{request.customerName}</Cell>
                    <Cell>
                      <WaitingLine
                        waitingOn={request.waitingOn}
                        waitingSince={request.waitingSince}
                      />
                    </Cell>
                  </Row>
                ))}
              </tbody>
            </DataTable>
          </>
        )}
      </Card>
    </section>
  );
}
