import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { OutboxEntry, discard, enqueue, listOutbox, newClientRef, retry, syncOutbox } from './outbox';
import type { Sale } from '../features/sales/types';

const entry = (n: number, o: Partial<OutboxEntry> = {}): OutboxEntry => ({
    clientRef: `ref-${n}`, storeId: 's1', provisionalReceipt: `OFF-000${n}`, total: n, status: 'pending',
    createdAt: new Date(2026, 10, 10, 9, n).toISOString(),
    body: { clientRef: `ref-${n}`, soldAt: new Date(2026, 10, 10, 9, n).toISOString(), items: [{ productId: 'p', quantity: 1 }], payments: [{ method: 'cash', amount: n }] },
    ...o,
});
const sale = (ref: string) => ({ id: ref, receiptNumber: `R-${ref}` }) as unknown as Sale;
const httpError = (statusCode: number, message = 'nope') => ({ statusCode, message: { message } });
const networkError = () => Object.assign(new Error('Network Error'), { isAxiosError: true, code: 'ERR_NETWORK' });

beforeEach(async () => { for (const e of await listOutbox('s1')) await discard(e.clientRef); });

describe('sale outbox', () => {
    it('keeps queued sales oldest first and only for the right store', async () => {
        await enqueue(entry(2)); await enqueue(entry(1)); await enqueue(entry(3, { storeId: 'other' }));
        expect((await listOutbox('s1')).map(e => e.clientRef)).toEqual(['ref-1', 'ref-2']);
    });

    it('sends everything in order and empties the queue', async () => {
        await enqueue(entry(1)); await enqueue(entry(2));
        const sent: string[] = [];
        const r = await syncOutbox('s1', async (b) => { sent.push(b.clientRef); return sale(b.clientRef); });
        expect(sent).toEqual(['ref-1', 'ref-2']);
        expect(r.synced).toHaveLength(2);
        expect(await listOutbox('s1')).toHaveLength(0);
    });

    it('stops on a network error and keeps that sale and the rest for next time', async () => {
        await enqueue(entry(1)); await enqueue(entry(2)); await enqueue(entry(3));
        let calls = 0;
        const r = await syncOutbox('s1', async (b) => { calls++; if (b.clientRef === 'ref-2') throw networkError(); return sale(b.clientRef); });
        expect(calls).toBe(2);
        expect(r.stopped).toBe('offline');
        expect((await listOutbox('s1')).map(e => e.clientRef)).toEqual(['ref-2', 'ref-3']);
    });

    it('marks a sale the server rejects as needing attention and carries on with the others', async () => {
        await enqueue(entry(1)); await enqueue(entry(2));
        const r = await syncOutbox('s1', async (b) => { if (b.clientRef === 'ref-1') throw httpError(409, 'Open the till before selling'); return sale(b.clientRef); });
        expect(r.failed).toBe(1);
        expect(r.synced).toHaveLength(1);
        const left = await listOutbox('s1');
        expect(left).toHaveLength(1);
        expect(left[0]).toMatchObject({ clientRef: 'ref-1', status: 'failed', error: 'Open the till before selling' });
    });

    it('does not resend failed sales until retried', async () => {
        await enqueue(entry(1, { status: 'failed', error: 'x' }));
        let calls = 0;
        await syncOutbox('s1', async (b) => { calls++; return sale(b.clientRef); });
        expect(calls).toBe(0);
        await retry('ref-1');
        await syncOutbox('s1', async (b) => { calls++; return sale(b.clientRef); });
        expect(calls).toBe(1);
        expect(await listOutbox('s1')).toHaveLength(0);
    });

    it('treats server errors as "try again later", not as a rejected sale', async () => {
        await enqueue(entry(1));
        const r = await syncOutbox('s1', async () => { throw httpError(503); });
        expect(r.stopped).toBe('server');
        expect((await listOutbox('s1'))[0].status).toBe('pending');
    });

    it('never runs two syncs at once', async () => {
        await enqueue(entry(1));
        let calls = 0;
        const slow = async (b: OutboxEntry['body']) => { calls++; await new Promise(r => setTimeout(r, 30)); return sale(b.clientRef); };
        await Promise.all([syncOutbox('s1', slow), syncOutbox('s1', slow)]);
        expect(calls).toBe(1);
    });

    it('makes unique client refs', () => {
        expect(new Set(Array.from({ length: 50 }, newClientRef)).size).toBe(50);
    });
});
