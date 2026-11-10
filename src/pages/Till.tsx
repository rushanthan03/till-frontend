import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Delete, Lock, Minus, PauseCircle, PlayCircle, Plus, Printer, ScanBarcode, Search, ShieldAlert, Tag, Trash2, Undo2, XCircle, CheckCircle2, Percent, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { PaymentModal } from '../components/till/PaymentModal';
import { AgeCheckModal } from '../components/till/AgeCheckModal';
import { WeightModal } from '../components/till/WeightModal';
import { HeldSalesModal, HeldSale } from '../components/till/HeldSalesModal';
import { PriceCheckModal } from '../components/till/PriceCheckModal';
import { ReceiptView } from '../components/till/ReceiptView';
import { OpenTillScreen } from '../components/till/OpenTillScreen';
import { XReportModal } from '../components/till/XReportModal';
import { CloseTillModal } from '../components/till/CloseTillModal';
import { RefundModal } from '../components/till/RefundModal';
import { CashMovementModal } from '../components/till/CashMovementModal';
import { DiscountModal } from '../components/till/DiscountModal';
import { ManagerPinModal } from '../components/till/ManagerPinModal';
import { Approval } from '../features/approvals/approvalsAPI';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { BasketLine, LineAdjustment, addToBasket, basketTotals, calcLine, hasAdjustments, highestAge, needsAgeCheck, round3, unitPriceOf } from '../utils/basket';
import { ProductsAPI } from '../features/products/productsAPI';
import { SalesAPI } from '../features/sales/salesAPI';
import { ShiftsAPI } from '../features/shifts/shiftsAPI';
import { UserRole } from '../utils/constants';
import type { DepartmentCount, Product } from '../features/products/types';
import type { PaymentInput, Sale } from '../features/sales/types';
import type { CashMovementType, Shift } from '../features/shifts/types';

const heldKey = (storeId: string) => `till.heldSales.${storeId}`;

const readHeld = (storeId: string): HeldSale[] => {
    try {
        const raw = localStorage.getItem(heldKey(storeId));
        return raw ? (JSON.parse(raw) as HeldSale[]) : [];
    } catch {
        return [];
    }
};
const writeHeld = (storeId: string, held: HeldSale[]) => {
    try { localStorage.setItem(heldKey(storeId), JSON.stringify(held)); } catch { /* storage unavailable: held sales just won't persist */ }
};

const KEYPAD = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0'];

export const Till = () => {
    const { user } = useAuth();
    const storeId =
        localStorage.getItem('selectedRestaurantId') || user?.restaurantId || user?.restaurant?.id || '';
    const storeName = user?.restaurant?.name || 'Store';
    const a = user?.restaurant?.address;
    const storeAddress = a ? [a.lane, a.city, a.district].filter(Boolean).join(', ') : undefined;

    const [basket, setBasket] = useState<BasketLine[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [ageVerified, setAgeVerified] = useState(false);
    const [input, setInput] = useState('');
    const [pendingQty, setPendingQty] = useState<number | null>(null);
    const [results, setResults] = useState<Product[]>([]);
    const [departments, setDepartments] = useState<DepartmentCount[]>([]);
    const [activeDept, setActiveDept] = useState<string>('');
    const [deptProducts, setDeptProducts] = useState<Product[]>([]);

    // modal state
    const [ageCheck, setAgeCheck] = useState<{ product: Product; qty: number } | null>(null);
    const [weighing, setWeighing] = useState<Product | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [showHeld, setShowHeld] = useState(false);
    const [showPriceCheck, setShowPriceCheck] = useState(false);
    const [confirmVoidSale, setConfirmVoidSale] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    // till session (shift): undefined = still loading, null = till is closed
    const [shift, setShift] = useState<Shift | null | undefined>(undefined);
    const [openingTill, setOpeningTill] = useState(false);
    const [showXReport, setShowXReport] = useState(false);
    const [showClose, setShowClose] = useState(false);
    const [showRefund, setShowRefund] = useState(false);
    const [showCash, setShowCash] = useState(false);
    const [savingCash, setSavingCash] = useState(false);
    // discounts / price overrides: a cashier needs a manager PIN, managers and admins approve themselves
    const [discountIndex, setDiscountIndex] = useState<number | null>(null);
    const [pinRequest, setPinRequest] = useState<{ summary: string; then: (a: Approval) => void } | null>(null);
    const [approval, setApproval] = useState<{ token: string; name: string; expiresAt: number } | null>(null);
    const [held, setHeld] = useState<HeldSale[]>(() => (storeId ? readHeld(storeId) : []));

    const inputRef = useRef<HTMLInputElement>(null);
    const totals = useMemo(() => basketTotals(basket), [basket]);
    const modalOpen = !!(showCash || discountIndex !== null || pinRequest || showXReport || showClose || showRefund || ageCheck || weighing || showPayment || showHeld || showPriceCheck || confirmVoidSale || completedSale);

    // Keep the scan box focused so a barcode scanner (which "types" the code + Enter) always lands in it.
    useEffect(() => { if (!modalOpen) inputRef.current?.focus(); }, [modalOpen, basket.length]);

    const loadShift = useCallback(() => {
        if (!storeId) return;
        ShiftsAPI.current(storeId).then(setShift).catch((e) => { setShift(null); toast.error(handleApiError(e)); });
    }, [storeId]);
    useEffect(() => { loadShift(); }, [loadShift]);

    const openTill = async (openingFloat: number, note?: string) => {
        setOpeningTill(true);
        try {
            setShift(await ShiftsAPI.open(storeId, { openingFloat, note }));
            toast.success('Till opened');
        } catch (error) {
            toast.error(handleApiError(error));
            loadShift();
        } finally {
            setOpeningTill(false);
        }
    };

    useEffect(() => {
        if (!storeId) return;
        ProductsAPI.departments(storeId).then(setDepartments).catch((e) => toast.error(handleApiError(e)));
    }, [storeId]);

    useEffect(() => {
        if (!storeId || !activeDept) { setDeptProducts([]); return; }
        ProductsAPI.list({ storeId, department: activeDept, status: 'active', limit: 60 })
            .then(r => setDeptProducts(r.data))
            .catch((e) => toast.error(handleApiError(e)));
    }, [storeId, activeDept]);

    // live name search while typing text (numeric input is treated as a barcode)
    useEffect(() => {
        const term = input.trim();
        if (!storeId || term.length < 2 || /^[\d.]+$/.test(term)) { setResults([]); return; }
        const t = setTimeout(() => {
            ProductsAPI.list({ storeId, search: term, status: 'active', limit: 8 })
                .then(r => setResults(r.data))
                .catch(() => setResults([]));
        }, 250);
        return () => clearTimeout(t);
    }, [input, storeId]);

    /** Core entry point for every way of adding a product. */
    const addProduct = useCallback((product: Product, qty = 1) => {
        if (!product.isActive) { toast.error(`${product.name} is not available`); return; }
        if (product.unitType === 'weight') { setWeighing(product); return; }
        if (product.ageRestriction > 0 && !ageVerified) { setAgeCheck({ product, qty }); return; }
        setBasket(prev => addToBasket(prev, product, qty));
        setSelected(null);
    }, [ageVerified]);

    const takeQty = () => { const q = pendingQty ?? 1; setPendingQty(null); return q; };

    const submitCode = async (e?: FormEvent) => {
        e?.preventDefault();
        const code = input.trim();
        if (!code) return;
        // Typed text with one search hit: add it directly.
        if (!/^[\d.-]+$/.test(code) && results.length === 1) {
            addProduct(results[0], takeQty()); setInput(''); setResults([]); return;
        }
        // Clear straight away so a fast scanner's next code never gets appended to this one
        // while the lookup is still in flight.
        const qty = takeQty();
        const hadSeveralMatches = results.length > 1;
        setInput(''); setResults([]);
        try {
            const product = await ProductsAPI.byBarcode(code, storeId);
            addProduct(product, qty);
        } catch (error) {
            if (hadSeveralMatches) { setInput(code); toast.info('Pick a product from the list'); return; }
            toast.error(handleApiError(error));
        }
    };

    const pressKey = (k: string) => setInput(prev => (k === '.' && prev.includes('.') ? prev : prev + k));

    const setMultiplier = () => {
        const n = Number(input);
        if (Number.isInteger(n) && n > 0 && n < 1000) { setPendingQty(n); setInput(''); }
        else toast.error('Type a whole-number quantity first, then press ×');
    };

    const changeQty = (index: number, delta: number) => {
        setBasket(prev => prev.flatMap((l, i) => {
            if (i !== index) return [l];
            const q = round3(l.quantity + delta);
            return q > 0 ? [{ ...l, quantity: q }] : [];
        }));
    };

    const voidLine = () => {
        if (selected === null) { toast.info('Select a line first'); return; }
        setBasket(prev => prev.filter((_, i) => i !== selected));
        setSelected(null);
    };

    const clearSale = () => {
        setBasket([]); setSelected(null); setApproval(null); setAgeVerified(false); setInput(''); setPendingQty(null); setResults([]);
    };

    const holdSale = () => {
        if (!basket.length) return;
        const next: HeldSale[] = [
            ...held,
            { ref: `HOLD-${String(held.length + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`, heldAt: new Date().toISOString(), lines: basket, ageVerified, total: totals.total },
        ];
        setHeld(next); writeHeld(storeId, next);
        toast.success('Sale held');
        clearSale();
    };

    const recall = (h: HeldSale) => {
        if (basket.length) { toast.error('Hold or void the current sale first'); return; }
        setBasket(h.lines); setAgeVerified(h.ageVerified);
        const next = held.filter(x => x.ref !== h.ref);
        setHeld(next); writeHeld(storeId, next);
        setShowHeld(false);
    };

    const deleteHeld = (h: HeldSale) => {
        const next = held.filter(x => x.ref !== h.ref);
        setHeld(next); writeHeld(storeId, next);
    };

    const isManager = [UserRole.MANAGER, UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN].includes(user?.role as UserRole);
    const approvalValid = !!approval && approval.expiresAt > Date.now();

    /** Runs `then` once a manager has approved (immediately when the signed-in user is a manager). */
    const withApproval = (summary: string, then: (a: Approval | null) => void) => {
        if (isManager) { then(null); return; }
        setPinRequest({ summary, then });
    };

    const applyDiscount = (index: number, adjustment: LineAdjustment) => {
        const line = basket[index];
        const label = adjustment.kind === 'percent' ? `${adjustment.value}% off ${line.product.name}` : `${line.product.name} at ${money(adjustment.value)}`;
        withApproval(label, (a) => {
            if (a) setApproval({ token: a.approvalToken, name: a.approver.name, expiresAt: Date.now() + a.expiresInSeconds * 1000 - 5000 });
            // a discounted quantity is split off so the rest of the line keeps its price
            setBasket(prev => prev.map((l, i) => (i === index ? { ...l, adjustment } : l)));
            setDiscountIndex(null);
            toast.success('Discount applied');
        });
    };

    const removeDiscount = (index: number) => {
        setBasket(prev => {
            const without = prev.map((l, i) => (i === index ? { ...l, adjustment: undefined } : l));
            const line = without[index];
            const twin = without.findIndex((l, i) => i !== index && l.product.id === line.product.id && !l.adjustment);
            if (twin === -1) return without;
            return without.flatMap((l, i) => (i === twin ? [{ ...l, quantity: round3(l.quantity + line.quantity) }] : i === index ? [] : [l]));
        });
        setDiscountIndex(null);
    };

    const recordMovement = (m: { type: CashMovementType; amount?: number; reason: string }) => {
        const send = async (token?: string) => {
            setSavingCash(true);
            try {
                await ShiftsAPI.addMovement(storeId, { ...m, approvalToken: token });
                toast.success(m.type === 'no_sale' ? 'No sale recorded' : 'Cash movement recorded');
                setShowCash(false);
            } catch (error) {
                toast.error(handleApiError(error));
            } finally {
                setSavingCash(false);
            }
        };
        if (m.type === 'paid_out' && !isManager) {
            setPinRequest({ summary: `paid out of ${money(m.amount ?? 0)} (${m.reason})`, then: (a) => { void send(a.approvalToken); } });
            return;
        }
        void send();
    };

    const startPayment = () => {
        if (hasAdjustments(basket) && !isManager && !approvalValid) {
            setPinRequest({
                summary: 'the discounts on this sale',
                then: (a) => { setApproval({ token: a.approvalToken, name: a.approver.name, expiresAt: Date.now() + a.expiresInSeconds * 1000 - 5000 }); setShowPayment(true); },
            });
            return;
        }
        setShowPayment(true);
    };

    const completeSale = async (payments: PaymentInput[]) => {
        setSubmitting(true);
        try {
            const sale = await SalesAPI.create(storeId, {
                items: basket.map(l => ({
                    productId: l.product.id,
                    quantity: l.quantity,
                    ...(l.adjustment
                        ? { [l.adjustment.kind === 'percent' ? 'discountPercent' : 'priceOverride']: l.adjustment.value, reason: l.adjustment.reason }
                        : {}),
                })),
                payments,
                ageVerified: needsAgeCheck(basket) ? ageVerified : undefined,
                approvalToken: hasAdjustments(basket) && !isManager ? approval?.token : undefined,
            });
            setShowPayment(false);
            setCompletedSale(sale);
            clearSale();
        } catch (error) {
            toast.error(handleApiError(error));
            // e.g. the till session was closed elsewhere: re-check so the screen matches reality
            loadShift();
        } finally {
            setSubmitting(false);
        }
    };

    if (!storeId) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-600">
                <ScanBarcode className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="font-semibold text-gray-900">No store selected</p>
                <p className="text-sm mt-1">Pick a store from the outlet switcher to open the till.</p>
            </div>
        );
    }

    const restrictedAge = highestAge(basket);
    const canRefund = isManager;

    if (shift === undefined) {
        return <div className="p-10 text-center text-gray-500" role="status">Loading till…</div>;
    }
    if (shift === null) {
        return <OpenTillScreen cashierName={user?.name ?? 'Cashier'} storeName={storeName} isSubmitting={openingTill} onOpen={openTill} />;
    }

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:h-[calc(100vh-7rem)]">
            {/* LEFT: scan, basket, totals, actions */}
            <section className="flex flex-col gap-3 min-h-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                    <span>
                        <b className="text-gray-900">{storeName}</b> · Cashier: {user?.name ?? '—'}
                        <span className="ml-2 text-xs text-green-700">● Open since {new Date(shift.openedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · float {money(shift.openingFloat)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                        {pendingQty && (
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">Next item × {pendingQty}</span>
                        )}
                        <button type="button" onClick={() => setShowCash(true)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700"><Wallet className="w-4 h-4" />Cash</button>
                        <button type="button" onClick={() => setShowXReport(true)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700"><BarChart3 className="w-4 h-4" />X report</button>
                        {canRefund && <button type="button" onClick={() => setShowRefund(true)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700"><Undo2 className="w-4 h-4" />Refund</button>}
                        <button type="button" onClick={() => setShowClose(true)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700"><Lock className="w-4 h-4" />Close till</button>
                    </span>
                </div>

                <form onSubmit={submitCode} className="relative flex gap-2">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} aria-label="Scan barcode or search product"
                            placeholder="Scan barcode or type product name…" autoComplete="off"
                            className="w-full pl-11 pr-4 py-3.5 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-600" />
                        {results.length > 1 && (
                            <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                                {results.map(p => (
                                    <li key={p.id}>
                                        <button type="button" onClick={() => { addProduct(p, takeQty()); setInput(''); setResults([]); }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50">
                                            <span><span className="font-medium text-gray-900">{p.name}</span> <span className="text-xs text-gray-500">{p.barcode}</span></span>
                                            <span className="font-semibold">{money(p.price)}{p.unitType === 'weight' ? '/kg' : ''}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <Button type="submit" size="lg">Add</Button>
                </form>

                <div className="flex-1 min-h-[240px] overflow-y-auto bg-white rounded-xl border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10 text-left text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-3 py-2">Product</th>
                                <th className="px-3 py-2 text-center">Qty</th>
                                <th className="px-3 py-2 text-right">Unit</th>
                                <th className="px-3 py-2 text-right">VAT</th>
                                <th className="px-3 py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {basket.length === 0 && (
                                <tr><td colSpan={5} className="px-3 py-16 text-center text-gray-400">
                                    <ScanBarcode className="w-10 h-10 mx-auto mb-2" />Scan an item to start a sale
                                </td></tr>
                            )}
                            {basket.map((l, i) => {
                                const unit = unitPriceOf(l);
                                const amt = calcLine(unit, l.quantity, l.product.vatRate);
                                const weighed = l.product.unitType === 'weight';
                                return (
                                    <tr key={`${l.product.id}-${i}`} onClick={() => setSelected(i)} aria-selected={selected === i}
                                        className={`cursor-pointer ${selected === i ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                        <td className="px-3 py-2.5">
                                            <div className="font-medium text-gray-900 flex items-center gap-1.5">
                                                {l.product.name}
                                                {l.product.ageRestriction > 0 && <span title={`${l.product.ageRestriction}+ only`} className="inline-flex items-center gap-0.5 text-xs text-amber-700"><ShieldAlert className="w-3.5 h-3.5" />{l.product.ageRestriction}+</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">{l.product.barcode}</div>
                                            {l.adjustment && <div className="text-xs text-green-700">Discount: {l.adjustment.kind === 'percent' ? `${l.adjustment.value}% off` : 'price override'} · {l.adjustment.reason}</div>}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center justify-center gap-1">
                                                {!weighed && <button type="button" aria-label={`Decrease ${l.product.name}`} onClick={(e) => { e.stopPropagation(); changeQty(i, -1); }} className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-100"><Minus className="w-3.5 h-3.5" /></button>}
                                                <span className="min-w-[3.5rem] text-center font-semibold">{weighed ? `${l.quantity.toFixed(3)} kg` : l.quantity}</span>
                                                {!weighed && <button type="button" aria-label={`Increase ${l.product.name}`} onClick={(e) => { e.stopPropagation(); changeQty(i, 1); }} className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-100"><Plus className="w-3.5 h-3.5" /></button>}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-gray-600">
                                            {l.adjustment && <span className="block text-xs text-gray-400 line-through">{money(l.product.price)}</span>}
                                            {money(unit)}{weighed ? '/kg' : ''}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-gray-500">{l.product.vatRate}%</td>
                                        <td className="px-3 py-2.5 text-right font-semibold">{money(amt.lineTotal)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="rounded-xl bg-gray-900 text-white px-5 py-4 flex items-end justify-between gap-4">
                    <div className="text-sm text-gray-300 space-y-0.5">
                        <div>Items: <b className="text-white">{totals.itemCount}</b></div>
                        <div>Subtotal (ex VAT): {money(totals.netTotal)}</div>
                        <div>VAT: {money(totals.vatTotal)}</div>
                        {totals.discountTotal > 0 && <div className="text-green-400">Discounts: −{money(totals.discountTotal)}</div>}
                    </div>
                    <div className="text-right">
                        <div className="text-xs uppercase tracking-wider text-gray-400">Total</div>
                        <div className="text-5xl font-extrabold tabular-nums" aria-live="polite">{money(totals.total)}</div>
                    </div>
                </div>

                {restrictedAge > 0 && (
                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${ageVerified ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
                        {ageVerified ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                        {ageVerified ? `Age verified (${restrictedAge}+)` : `Age check needed (${restrictedAge}+)`}
                    </div>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                    <Button variant="outline" onClick={holdSale} disabled={!basket.length}><PauseCircle className="w-4 h-4 mr-1.5" />Hold</Button>
                    <Button variant="outline" onClick={() => setShowHeld(true)}><PlayCircle className="w-4 h-4 mr-1.5" />Recall{held.length ? ` (${held.length})` : ''}</Button>
                    <Button variant="outline" onClick={voidLine} disabled={selected === null}><XCircle className="w-4 h-4 mr-1.5" />Void line</Button>
                    <Button variant="outline" onClick={() => setDiscountIndex(selected)} disabled={selected === null}><Percent className="w-4 h-4 mr-1.5" />Discount</Button>
                    <Button variant="outline" onClick={() => setConfirmVoidSale(true)} disabled={!basket.length}><Trash2 className="w-4 h-4 mr-1.5" />Void sale</Button>
                    <Button variant="outline" onClick={() => setShowPriceCheck(true)}><Tag className="w-4 h-4 mr-1.5" />Price check</Button>
                    <Button size="lg" onClick={startPayment} disabled={!basket.length} className="!text-lg">Pay {basket.length ? money(totals.total) : ''}</Button>
                </div>
            </section>

            {/* RIGHT: keypad + quick products */}
            <aside className="flex flex-col gap-3 min-h-0">
                <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="grid grid-cols-3 gap-2">
                        {KEYPAD.map(k => (
                            <button key={k} type="button" onClick={() => pressKey(k)} className={`py-3 text-xl font-semibold rounded-lg border border-gray-300 hover:bg-gray-100 active:bg-gray-200 ${k === '0' ? 'col-span-1' : ''}`}>{k}</button>
                        ))}
                        <button type="button" aria-label="Backspace" onClick={() => setInput(p => p.slice(0, -1))} className="py-3 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center"><Delete className="w-5 h-5" /></button>
                        <button type="button" onClick={setMultiplier} className="py-3 text-lg font-semibold rounded-lg bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100" title="Type a quantity, press ×, then scan the item">× Qty</button>
                        <button type="button" onClick={() => { setInput(''); setPendingQty(null); }} className="py-3 font-semibold rounded-lg border border-gray-300 hover:bg-gray-100">Clear</button>
                        <button type="button" onClick={() => submitCode()} className="py-3 font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700">Enter</button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-3 flex-1 min-h-[220px] flex flex-col">
                    <div className="flex flex-wrap gap-1.5 pb-2 border-b border-gray-100 max-h-28 overflow-y-auto">
                        {departments.map(d => (
                            <button key={d.department} type="button" onClick={() => setActiveDept(activeDept === d.department ? '' : d.department)}
                                className={`px-3 py-1.5 text-sm rounded-full border ${activeDept === d.department ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                                {d.department}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 overflow-y-auto content-start">
                        {!activeDept && <p className="col-span-2 text-sm text-gray-400 text-center py-8">Choose a department for quick-pick items</p>}
                        {deptProducts.map(p => (
                            <button key={p.id} type="button" onClick={() => addProduct(p, takeQty())}
                                className="text-left rounded-lg border border-gray-200 p-2.5 hover:border-blue-500 hover:bg-blue-50">
                                <div className="text-sm font-medium text-gray-900 line-clamp-2">{p.name}</div>
                                <div className="text-sm font-bold mt-0.5">{money(p.price)}{p.unitType === 'weight' ? '/kg' : ''}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* MODALS */}
            {ageCheck && (
                <AgeCheckModal
                    product={ageCheck.product}
                    onVerified={() => { setAgeVerified(true); setBasket(prev => addToBasket(prev, ageCheck.product, ageCheck.qty)); setAgeCheck(null); }}
                    onRefuse={() => { setAgeCheck(null); toast.info('Item not added'); }}
                />
            )}
            {weighing && (
                <WeightModal
                    product={weighing}
                    onCancel={() => setWeighing(null)}
                    onConfirm={(kg) => {
                        const p = weighing; setWeighing(null);
                        if (p.ageRestriction > 0 && !ageVerified) setAgeCheck({ product: p, qty: kg });
                        else setBasket(prev => addToBasket(prev, p, kg));
                    }}
                />
            )}
            {showCash && <CashMovementModal submitting={savingCash} onSubmit={recordMovement} onClose={() => setShowCash(false)} />}
            {discountIndex !== null && basket[discountIndex] && (
                <DiscountModal
                    line={basket[discountIndex]}
                    onApply={(adj) => applyDiscount(discountIndex, adj)}
                    onRemove={basket[discountIndex].adjustment ? () => removeDiscount(discountIndex) : undefined}
                    onClose={() => setDiscountIndex(null)}
                />
            )}
            {pinRequest && (
                <ManagerPinModal
                    storeId={storeId}
                    summary={pinRequest.summary}
                    onClose={() => setPinRequest(null)}
                    onApproved={(a) => { const req = pinRequest; setPinRequest(null); req.then(a); }}
                />
            )}
            {showXReport && <XReportModal storeId={storeId} storeName={storeName} onClose={() => setShowXReport(false)} />}
            {showRefund && <RefundModal storeId={storeId} storeName={storeName} onClose={() => setShowRefund(false)} />}
            {showClose && (
                <CloseTillModal
                    storeId={storeId}
                    storeName={storeName}
                    heldCount={held.length}
                    basketHasItems={basket.length > 0}
                    onCancel={() => setShowClose(false)}
                    onClosed={() => { setShowClose(false); setShift(null); }}
                />
            )}
            {showPayment && <PaymentModal total={totals.total} isSubmitting={submitting} onClose={() => setShowPayment(false)} onComplete={completeSale} />}
            {showHeld && <HeldSalesModal held={held} onRecall={recall} onDelete={deleteHeld} onClose={() => setShowHeld(false)} />}
            {showPriceCheck && <PriceCheckModal storeId={storeId} onAdd={(p) => addProduct(p, 1)} onClose={() => setShowPriceCheck(false)} />}

            <Modal isOpen={confirmVoidSale} onClose={() => setConfirmVoidSale(false)} title="Void entire sale?" size="sm">
                <p className="text-gray-700">This removes all {totals.itemCount} items ({money(totals.total)}) from the basket.</p>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setConfirmVoidSale(false)}>Keep sale</Button>
                    <Button variant="danger" onClick={() => { clearSale(); setConfirmVoidSale(false); }}>Void sale</Button>
                </div>
            </Modal>

            {completedSale && (
                <Modal isOpen onClose={() => setCompletedSale(null)} title="Sale complete" size="md">
                    <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-700 font-semibold"><CheckCircle2 className="w-6 h-6" />Paid in full</div>
                            <div className="text-5xl font-extrabold tabular-nums">{money(completedSale.total)}</div>
                            {completedSale.changeDue > 0 && (
                                <div className="rounded-xl bg-amber-400 text-gray-900 px-4 py-3 flex items-end justify-between">
                                    <span className="font-semibold">Change due</span>
                                    <span className="text-3xl font-extrabold">{money(completedSale.changeDue)}</span>
                                </div>
                            )}
                            <div className="text-sm text-gray-600">Receipt {completedSale.receiptNumber}</div>
                            <div className="flex flex-col gap-2 pt-2">
                                <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print receipt</Button>
                                <Button size="lg" onClick={() => setCompletedSale(null)}>New sale</Button>
                            </div>
                        </div>
                        <ReceiptView sale={completedSale} storeName={storeName} storeAddress={storeAddress} />
                    </div>
                </Modal>
            )}
        </div>
    );
};
