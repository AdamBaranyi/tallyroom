import { describe, expect, it } from 'vitest';
import { advisoryLockKey, chainHash, verifyChain, type ChainRow } from './activity-chain.ts';

const workspaceId = '11111111-1111-4111-8111-111111111111';
const actorId = '22222222-2222-4222-8222-222222222222';

function entry(sequence: number, previousHash: string | null, overrides: Partial<ChainRow> = {}) {
  const base = {
    sequence,
    workspaceId,
    actorId,
    action: 'customer.created',
    entityType: 'customer',
    entityId: '33333333-3333-4333-8333-333333333333',
    metadata: { name: 'Alpenblick Studio' },
    createdAt: new Date(`2026-09-1${sequence}T08:00:00.000Z`),
    previousHash,
    ...overrides,
  };
  return { ...base, hash: chainHash(base) } satisfies ChainRow;
}

describe('Hash-Kette des Protokolls', () => {
  it('hängt jeden Eintrag an seinen Vorgänger', () => {
    const first = entry(1, null);
    const second = entry(2, first.hash);

    const report = verifyChain([first, second]);
    expect(report).toEqual({ checked: 2, sealed: 2, unsealed: 0, brokenAt: null });
  });

  it('ist unabhängig von der Reihenfolge der Metadaten-Schlüssel', () => {
    const fields = {
      workspaceId,
      actorId,
      action: 'project.status_changed',
      entityType: 'project',
      entityId: null,
      createdAt: new Date('2026-09-18T10:00:00.000Z'),
      previousHash: null,
    };

    expect(chainHash({ ...fields, metadata: { from: 'active', to: 'completed' } })).toBe(
      chainHash({ ...fields, metadata: { to: 'completed', from: 'active' } }),
    );
  });

  it('erkennt einen nachträglich geänderten Eintrag', () => {
    const first = entry(1, null);
    const second = entry(2, first.hash);
    const tampered = { ...first, metadata: { name: 'Seeblick GmbH' } };

    expect(verifyChain([tampered, second]).brokenAt).toBe(1);
  });

  it('erkennt einen entfernten Eintrag an der gebrochenen Verkettung', () => {
    const first = entry(1, null);
    const second = entry(2, first.hash);
    const third = entry(3, second.hash);

    // Der mittlere Eintrag ist weg: der dritte zeigt ins Leere.
    expect(verifyChain([first, third]).brokenAt).toBe(3);
  });

  it('zählt Einträge von vor der Kette getrennt, statt sie zu bemängeln', () => {
    const old = { ...entry(1, null), hash: null, previousHash: null };
    const first = entry(2, null);

    expect(verifyChain([old, first])).toEqual({
      checked: 2,
      sealed: 1,
      unsealed: 1,
      brokenAt: null,
    });
  });

  it('liefert je Workspace einen festen Sperrschlüssel im bigint-Bereich', () => {
    const key = advisoryLockKey(workspaceId);
    expect(key).toBe(advisoryLockKey(workspaceId));
    expect(key).not.toBe(advisoryLockKey('44444444-4444-4444-8444-444444444444'));
    expect(key).toBeGreaterThanOrEqual(-(2n ** 63n));
    expect(key).toBeLessThan(2n ** 63n);
  });
});
