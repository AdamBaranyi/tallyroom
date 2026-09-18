import { z } from 'zod';
import { WAITING_SIDES } from './service-request.ts';

/** Monat im Format JJJJ-MM. Der Bericht kennt nur ganze Monate. */
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
  error: 'Monat im Format JJJJ-MM',
});

export const reportQuerySchema = z.object({
  month: monthSchema.optional(),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;

export const monthlyReportSchema = z.object({
  month: z.string(),
  customerName: z.string(),
  generatedAt: z.string(),
  /** Erledigte Meilensteine freigegebener Projekte, in diesem Monat. */
  milestonesCompleted: z.array(
    z.object({ title: z.string(), projectName: z.string(), date: z.string() }),
  ),
  requestsOpened: z.number().int(),
  requestsResolved: z.number().int(),
  /** Was am Monatsende noch offen war, mit der Seite, bei der es liegt. */
  openRequests: z.array(
    z.object({
      subject: z.string(),
      waitingOn: z.enum(WAITING_SIDES).nullable(),
      waitingSince: z.string(),
    }),
  ),
  documentsShared: z.array(z.object({ name: z.string(), date: z.string() })),
  activeProjects: z.array(
    z.object({
      name: z.string(),
      milestonesDone: z.number().int(),
      milestoneCount: z.number().int(),
    }),
  ),
  /** Vertraglich vereinbarter Monatswert am Monatsende, in Rappen. */
  monthlyContractValueMinor: z.number().int(),
  /** Anzahl bestätigter, freigegebener Verträge, die in den Wert zählen. */
  contractCount: z.number().int(),
});

export type MonthlyReport = z.infer<typeof monthlyReportSchema>;

/** Der Monat, über den berichtet wird: standardmässig der letzte abgeschlossene. */
export function previousMonth(today: string): string {
  const [year, month] = today.split('-').map(Number) as [number, number];
  const shifted = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  return `${shifted.year}-${String(shifted.month).padStart(2, '0')}`;
}

export function monthRange(month: string): { first: string; last: string } {
  const [year, index] = month.split('-').map(Number) as [number, number];
  const lastDay = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return { first: `${month}-01`, last: `${month}-${String(lastDay).padStart(2, '0')}` };
}
