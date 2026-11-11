import { ChangeEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { FileUp, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { handleApiError } from '../../api/handleApiError';
import { ProductsAPI } from '../../features/products/productsAPI';
import type { ImportResult, ImportRowResult } from '../../features/products/types';
import { csvRecords } from '../../utils/csv';

const MAX_ROWS = 5000;

const ACTION_STYLE: Record<ImportRowResult['action'], string> = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    unchanged: 'bg-gray-100 text-gray-600',
    error: 'bg-red-100 text-red-700',
};
const ACTION_LABEL: Record<ImportRowResult['action'], string> = { create: 'New', update: 'Update', unchanged: 'No change', error: 'Error' };

interface Props {
    isOpen: boolean;
    storeId: string;
    onClose: () => void;
    onImported: () => void;
}

/** Choose a CSV, see exactly what will happen (nothing is saved yet), then import. */
export function ImportProductsModal({ isOpen, storeId, onClose, onImported }: Props) {
    const [fileName, setFileName] = useState('');
    const [rows, setRows] = useState<Record<string, string>[]>([]);
    const [preview, setPreview] = useState<ImportResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [filter, setFilter] = useState<'all' | 'problems'>('all');

    const reset = () => { setFileName(''); setRows([]); setPreview(null); setFilter('all'); };
    const close = () => { reset(); onClose(); };

    const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        reset();
        const { headers, records } = csvRecords(await file.text());
        if (!headers.some(h => h.toLowerCase().replace(/[^a-z]/g, '') === 'barcode')) {
            toast.error('The file needs a "barcode" column. Download the template to see the layout.');
            return;
        }
        if (!records.length) { toast.error('The file has no product rows'); return; }
        if (records.length > MAX_ROWS) { toast.error(`At most ${MAX_ROWS} rows per import; split the file`); return; }
        setFileName(file.name);
        setRows(records);
        setBusy(true);
        try {
            const r = await ProductsAPI.importRows(storeId, records, true);
            setPreview(r);
            if (r.summary.error) setFilter('problems');
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setBusy(false);
        }
    };

    const runImport = async () => {
        setBusy(true);
        try {
            const r = await ProductsAPI.importRows(storeId, rows, false);
            toast.success(`Imported: ${r.summary.create} new, ${r.summary.update} updated${r.summary.error ? `, ${r.summary.error} skipped` : ''}`);
            onImported();
            close();
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setBusy(false);
        }
    };

    const toApply = preview ? preview.summary.create + preview.summary.update : 0;
    const shown = preview?.rows.filter(r => filter === 'all' || r.action === 'error' || r.warnings.length) ?? [];

    return (
        <Modal isOpen={isOpen} onClose={close} title="Import products" size="xl"
            description="Rows are matched on the main barcode: a new barcode adds a product, a known one updates the filled-in cells. Blank cells are left as they are.">
            <div className="space-y-4">
                <label className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50">
                    <FileUp className="w-6 h-6 text-gray-500" />
                    <span className="text-gray-700">{fileName ? <>File: <b>{fileName}</b> ({rows.length} rows). Choose another</> : 'Choose a CSV file'}</span>
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} aria-label="Choose a CSV file" />
                </label>

                {busy && !preview && <p className="text-sm text-gray-600">Checking the file…</p>}

                {preview && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            <div className="rounded-lg bg-green-50 p-3"><div className="text-2xl font-bold text-green-700">{preview.summary.create}</div>new products</div>
                            <div className="rounded-lg bg-blue-50 p-3"><div className="text-2xl font-bold text-blue-700">{preview.summary.update}</div>to update</div>
                            <div className="rounded-lg bg-gray-50 p-3"><div className="text-2xl font-bold text-gray-700">{preview.summary.unchanged}</div>no change</div>
                            <div className="rounded-lg bg-red-50 p-3"><div className="text-2xl font-bold text-red-700">{preview.summary.error}</div>with errors (skipped)</div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-600">Show:</span>
                            <button className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`} onClick={() => setFilter('all')}>All rows</button>
                            <button className={`px-2 py-1 rounded ${filter === 'problems' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`} onClick={() => setFilter('problems')}>Errors and warnings</button>
                        </div>
                        <div className="max-h-80 overflow-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr className="text-left text-gray-600">
                                        <th className="px-3 py-2">Line</th><th className="px-3 py-2">Barcode</th><th className="px-3 py-2">Product</th>
                                        <th className="px-3 py-2">Result</th><th className="px-3 py-2">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shown.map(r => (
                                        <tr key={r.line} className="border-t border-gray-100 align-top">
                                            <td className="px-3 py-2 text-gray-500">{r.line}</td>
                                            <td className="px-3 py-2 font-mono">{r.barcode || '—'}</td>
                                            <td className="px-3 py-2">{r.name ?? '—'}</td>
                                            <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_STYLE[r.action]}`}>{ACTION_LABEL[r.action]}</span></td>
                                            <td className="px-3 py-2 space-y-0.5">
                                                {r.errors.map(e => <div key={e} className="flex gap-1 text-red-700"><XCircle className="w-4 h-4 shrink-0" />{e}</div>)}
                                                {r.warnings.map(w => <div key={w} className="flex gap-1 text-amber-700"><AlertTriangle className="w-4 h-4 shrink-0" />{w}</div>)}
                                                {r.action === 'update' && <div className="text-gray-600">Changes: {r.changes.join(', ')}</div>}
                                            </td>
                                        </tr>
                                    ))}
                                    {!shown.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500"><CheckCircle2 className="w-5 h-5 inline mr-1 text-green-600" />No problems found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <Button variant="outline" onClick={close}>Cancel</Button>
                    <Button onClick={runImport} isLoading={busy && !!preview} disabled={!preview || toApply === 0}>
                        {toApply ? `Import ${toApply} product${toApply > 1 ? 's' : ''}` : 'Nothing to import'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
