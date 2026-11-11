import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Delete, Lock, Minus, PauseCircle, PlayCircle, Plus, Printer, ScanBarcode, Search, ShieldAlert, Tag, Trash2, Undo2, XCircle, CheckCircle2, Percent, Wallet, UserRound, Clock, X as XIcon } from 'lucide-react';
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
import { hardware, isDesktop } from '../hardware/hardware';
import { cacheShift, cachedShift, currentPromos, departmentProducts, listDepartments, lookupBarcode, searchProducts, syncCatalogue } from '../offline/catalogue';
import { isNetworkError, isOnline, markOffline, useConnectivity } from '../offline/connectivity';
import { OutboxEntry, enqueue, listOutbox, newClientRef, nextProvisionalNumber, onOutboxChange, syncOutbox } from '../offline/outbox';
import { AttendanceAPI, TimeEntry } from '../features/attendance/attendanceAPI';
import { OfflineBanner } from '../components/till/OfflineBanner';
import { SyncProblemsModal } from '../components/till/SyncProblemsModal';
import { buildReceiptPayload } from '../utils/receiptPayload';
import { CustomerModal } from '../components/till/CustomerModal';
import type { Customer } from '../features/customers/customersAPI';
import type { Promotion } from '../features/promotions/types';
import { CashMovementModal } from '../components/till/CashMovementModal';
import { DiscountModal } from '../components/till/DiscountModal';
import { ManagerPinModal } from '../components/till/ManagerPinModal';
import { Approval } from '../features/approvals/approvalsAPI';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../api/handleApiError';
import { money } from '../utils/money';
import { BasketLine, LineAdjustment, addToBasket, basketTotals, lineAmounts, hasAdjustments, highestAge, needsAgeCheck, round2, round3, unitPriceOf } from '../utils/basket';
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

    // running offers (applied automatically) and the loyalty customer on this sale
    const [promos, setPromos] = useState<Promotion[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [showCustomer, setShowCustomer] = useState(false);

    // clock in / out
    const [clock, setClock] = useState<TimeEntry | null>(null);
    useEffect(() => {
        if (!storeId || !isOnline()) return;
        const auto = (() => { try { return sessionStorage.getItem('till.clockInOnLogin') === '1'; } catch { return false; } })();
        try { sessionStorage.removeItem('till.clockInOnLogin'); } catch { /* ignore */ }
        (auto ? AttendanceAPI.clockIn(storeId) : AttendanceAPI.status(storeId)).then(setClock).catch(() => undefined);
    }, [storeId]);
    const toggleClock = async () => {
        try {
            if (clock) { await AttendanceAPI.clockOut(storeId); setClock(null); toast.success('Clocked out'); }
            else { setClock(await AttendanceAPI.clockIn(storeId)); toast.success('Clocked in'); }
        } catch (e) { toast.error(handleApiError(e)); }
    };

    // offline mode: sales made while the server can't be reached wait in the outbox and sync later
    const { online, forced } = useConnectivity();
    const [outbox, setOutbox] = useState<OutboxEntry[]>([]);
    const [showSyncProblems, setShowSyncProblems] = useState(false);
    const pendingCount = outbox.filter(e => e.status === 'pending').length;
    const failedCount = outbox.filter(e => e.status === 'failed').length;

    // modal state
    const [ageCheck, setAgeCheck] = useState<{ product: Product; qty: number } | null>(null);
    const [weighing, setWeighing] = useState<Product | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [showHeld, setShowHeld] = useState(false);
    const [showPriceCheck, setShowPriceCheck] = useState(false);
    const [confirmVoidSale, setConfirmVoidSale] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [completedOffline, setCompletedOffline] = useState(false);
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
    const totals = useMemo(() => basketTotals(basket, promos), [basket, promos]);
    const modalOpen = !!(showSyncProblems || showCustomer || showCash || discountIndex !== null || pinRequest || showXReport || showClose || showRefund || ageCheck || weighing || showPayment || showHeld || showPriceCheck || confirmVoidSale || completedSale);

    // Keep the scan box focused so a barcode scanner (which "types" the code + Enter) always lands in it.
    useEffect(() => { if (!modalOpen) inputRef.current?.focus(); }, [modalOpen, basket.length]);

    const loadShift = useCallback(() => {
        if (!storeId) return;
        const fromCache = async () => { const s = user?.id ? await cachedShift(storeId, user.id) : null; setShift(s); };
        if (!online) { void fromCache(); return; }
        ShiftsAPI.current(storeId)
            .then((s) => { setShift(s); if (user?.id) void cacheShift(storeId, user.id, s); })
            .catch((e) => {
                // server unreachable: carry on with the till session we last knew about
                if (isNetworkError(e)) { markOffline(); void fromCache(); return; }
                setShift(null); toast.error(handleApiError(e));
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeId, user?.id]);
    useEffect(() => { loadShift(); }, [loadShift, online]);

    // keep a local copy of the catalogue so the till can keep selling when the server can't be reached
    useEffect(() => {
        if (storeId && online) syncCatalogue(storeId).then((n) => { if (n) currentPromos(storeId).then(setPromos).catch(() => undefined); }).catch(() => undefined);
    }, [storeId, online]);

    const refreshOutbox = useCallback(() => { if (storeId) listOutbox(storeId).then(setOutbox).catch(() => undefined); }, [storeId]);
    useEffect(() => { refreshOutbox(); return onOutboxChange(refreshOutbox); }, [refreshOutbox]);

    // back online with sales waiting: send them
    useEffect(() => {
        if (!storeId || !online || pendingCount === 0) return;
        syncOutbox(storeId, (body) => SalesAPI.create(storeId, body)).then((r) => {
            if (r.synced.length) toast.success(`${r.synced.length} offline sale${r.synced.length > 1 ? 's' : ''} synced`);
            if (r.failed) toast.error(`${r.failed} offline sale${r.failed > 1 ? 's need' : ' needs'} attention`);
        }).catch(() => undefined);
    }, [storeId, online, pendingCount]);

    const openTill = async (openingFloat: number, note?: string) => {
        setOpeningTill(true);
        try {
            const opened = await ShiftsAPI.open(storeId, { openingFloat, note });
            setShift(opened);
            if (user?.id) void cacheShift(storeId, user.id, opened);
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
        listDepartments(storeId).then(setDepartments).catch((e) => toast.error(handleApiError(e)));
    }, [storeId]);

    useEffect(() => {
        if (!storeId) return;
        currentPromos(storeId).then(setPromos).catch(() => setPromos([]));
    }, [storeId]);

    useEffect(() => {
        if (!storeId || !activeDept) { setDeptProducts([]); return; }
        departmentProducts(storeId, activeDept, 60)
            .then(setDeptProducts)
            .catch((e) => toast.error(handleApiError(e)));
    }, [storeId, activeDept]);

    // live name search while typing text (numeric input is treated as a barcode)
    useEffect(() => {
        const term = input.trim();
        if (!storeId || term.length < 2 || /^[\d.]+$/.test(term)) { setResults([]); return; }
        const t = setTimeout(() => {
            searchProducts(storeId, term, 8)
                .then(setResults)
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
            const product = await lookupBarcode(storeId, code);
            // A multipack or case barcode adds that many units.
            const pack = product.scanQuantity && product.scanQuantity > 1 ? product.scanQuantity : 1;
            if (pack > 1) toast.info(`${product.scanLabel || `Pack of ${pack}`}: ${qty * pack} × ${product.name}`);
            addProduct(product, qty * pack);
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
        setBasket([]); setSelected(null); setApproval(null); setCustomer(null); setAgeVerified(false); setInput(''); setPendingQty(null); setResults([]);
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
                if (m.type === 'no_sale' && isDesktop()) {
                    const s = await hardware.settings();
                    if (s?.autoDrawer && s.printMode === 'network') {
                        const r = await hardware.openDrawer();
                        if (!r.ok) toast.error(`Drawer: ${r.error}`);
                    }
                }
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

    /** Desktop app only: print the receipt and pop the drawer for cash. Never blocks or fails the sale. */
    const autoPrintAndDrawer = async (sale: Sale) => {
        if (!isDesktop()) return;
        try {
            const s = await hardware.settings();
            if (!s || s.printMode === 'off') return;
            const cash = sale.payments.some(p => p.method === 'cash');
            if (s.autoPrint) {
                const r = await hardware.printReceipt(buildReceiptPayload(sale, storeName, storeAddress), s.autoDrawer && cash);
                if (!r.ok) toast.error(`Receipt not printed: ${r.error}`);
            } else if (s.autoDrawer && cash) {
                const r = await hardware.openDrawer();
                if (!r.ok) toast.error(`Drawer: ${r.error}`);
            }
        } catch { toast.error('Could not reach the printer'); }
    };

    /** Print button on the sale-complete screen: the real printer when there is one, else the browser dialog. */
    const printReceipt = async (sale: Sale) => {
        if (isDesktop()) {
            const s = await hardware.settings();
            if (s && s.printMode !== 'off') {
                const r = await hardware.printReceipt(buildReceiptPayload(sale, storeName, storeAddress), false);
                if (!r.ok) toast.error(`Receipt not printed: ${r.error}`);
                return;
            }
        }
        window.print();
    };

    /** The sale as the till knows it, for a receipt while offline. The server numbers it properly when it syncs. */
    const provisionalSale = (clientRef: string, receiptNumber: string, payments: PaymentInput[], soldAt: string): Sale => {
        const lines = basket.map(l => ({ l, a: lineAmounts(l, promos) }));
        const total = totals.total;
        return {
            id: clientRef, storeId, receiptNumber, cashierName: user?.name ?? null, status: 'completed', refundedTotal: 0,
            total, netTotal: totals.netTotal, vatTotal: totals.vatTotal,
            changeDue: round2(payments.reduce((a, p) => a + (p.method === 'cash' ? (p.tendered ?? p.amount) - p.amount : 0), 0)),
            itemCount: totals.itemCount, discountTotal: totals.discountTotal, customerName: customer?.name ?? null, pointsEarned: 0, approvedByName: null,
            ageVerified, createdAt: soldAt,
            items: lines.map(({ l, a }, i) => ({
                id: `${clientRef}-${i}`, productId: l.product.id, name: l.product.name, barcode: l.product.barcode, quantity: l.quantity,
                unitPrice: unitPriceOf(l), vatRate: l.product.vatRate, lineTotal: a.lineTotal, vatAmount: a.vatAmount, ageRestriction: l.product.ageRestriction,
                promoDiscount: a.promoDiscount, promotionName: a.promoName, originalUnitPrice: null, adjustmentReason: null,
                refundedQuantity: 0, refundedAmount: 0, refundedVat: 0,
            })),
            payments: payments.map((p, i) => ({ id: `${clientRef}-p${i}`, method: p.method, amount: p.amount, tendered: p.tendered ?? null, reference: p.reference ?? null })),
        } as Sale;
    };

    const completeSale = async (payments: PaymentInput[]) => {
        setSubmitting(true);
        const clientRef = newClientRef();
        const soldAt = new Date().toISOString();
        const body = {
                clientRef,
                items: basket.map(l => ({
                    productId: l.product.id,
                    quantity: l.quantity,
                    ...(l.adjustment
                        ? { [l.adjustment.kind === 'percent' ? 'discountPercent' : 'priceOverride']: l.adjustment.value, reason: l.adjustment.reason }
                        : {}),
                })),
                payments,
                ageVerified: needsAgeCheck(basket) ? ageVerified : undefined,
                customerId: customer?.id,
                approvalToken: hasAdjustments(basket) && !isManager ? approval?.token : undefined,
        };
        /** Server can't be reached: keep the sale on this till and send it later. */
        const saveOffline = async () => {
            if (payments.some(p => p.method === 'card')) { toast.error('Card payments need a connection. Take cash, or wait until the till is back online.'); return; }
            if (hasAdjustments(basket)) { toast.error('Discounts need manager approval online. Remove the discounts or wait until the till is back online.'); return; }
            const receipt = nextProvisionalNumber(storeId);
            await enqueue({ clientRef, storeId, provisionalReceipt: receipt, total: totals.total, createdAt: soldAt, status: 'pending', body: { ...body, soldAt } });
            const sale = provisionalSale(clientRef, receipt, payments, soldAt);
            setShowPayment(false);
            setCompletedSale(sale);
            setCompletedOffline(true);
            clearSale();
            void autoPrintAndDrawer(sale);
        };
        try {
            if (!online) { await saveOffline(); return; }
            const sale = await SalesAPI.create(storeId, body);
            setShowPayment(false);
            setCompletedOffline(false);
            setCompletedSale(sale);
            clearSale();
            void autoPrintAndDrawer(sale);
        } catch (error) {
            if (isNetworkError(error)) { markOffline(); await saveOffline(); return; } // the same clientRef is reused on sync, so a sale that did reach the server is never doubled
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
                        <button type="button" onClick={toggleClock} disabled={!online}
                            title={clock ? `On the clock since ${new Date(clock.clockedInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Clock in'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border disabled:opacity-40 ${clock ? 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                            <Clock className="w-4 h-4" />{clock ? `Clocked in ${new Date(clock.clockedInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Clock in'}
                        </button>
                        {customer ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                                <UserRound className="w-4 h-4" />{customer.name} · {customer.pointsBalance} pts
                                <button type="button" aria-label="Remove customer" onClick={() => setCustomer(null)} className="ml-1 text-blue-700 hover:text-blue-900"><XIcon className="w-3.5 h-3.5" /></button>
                            </span>
                        ) : (
                            <button type="button" onClick={() => setShowCustomer(true)}  disabled={!online} title={!online ? 'Needs a connection' : undefined} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><UserRound className="w-4 h-4" />Customer</button>
                        )}
                        <button type="button" onClick={() => setShowCash(true)}  disabled={!online} title={!online ? 'Needs a connection' : undefined} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><Wallet className="w-4 h-4" />Cash</button>
                        <button type="button" onClick={() => setShowXReport(true)}  disabled={!online} title={!online ? 'Needs a connection' : undefined} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><BarChart3 className="w-4 h-4" />X report</button>
                        {canRefund && <button type="button" onClick={() => setShowRefund(true)} disabled={!online} title={!online ? 'Needs a connection' : undefined} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><Undo2 className="w-4 h-4" />Refund</button>}
                        <button type="button" onClick={() => setShowClose(true)} disabled={!online || outbox.length > 0} title={!online ? 'Needs a connection' : outbox.length > 0 ? 'Send the offline sales first' : undefined} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><Lock className="w-4 h-4" />Close till</button>
                    </span>
                </div>

                <OfflineBanner online={online} forced={forced} pending={pendingCount} failed={failedCount} onShowProblems={() => setShowSyncProblems(true)} />

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
                                const amt = lineAmounts(l, promos);
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
                                            {amt.promoName && <div className="text-xs text-green-700">Offer: {amt.promoName} · saves {money(amt.promoDiscount)}</div>}
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
                    <Button variant="outline" onClick={() => setDiscountIndex(selected)} disabled={selected === null || !online}><Percent className="w-4 h-4 mr-1.5" />Discount</Button>
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
            {showCustomer && <CustomerModal storeId={storeId} onPick={(c) => { setCustomer(c); setShowCustomer(false); }} onClose={() => setShowCustomer(false)} />}
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
                    onClosed={() => { setShowClose(false); setShift(null); if (user?.id) void cacheShift(storeId, user.id, null); }}
                />
            )}
            {showSyncProblems && <SyncProblemsModal entries={outbox} onClose={() => setShowSyncProblems(false)} />}
            {showPayment && <PaymentModal storeId={storeId} total={totals.total} cardAvailable={online} isSubmitting={submitting} onClose={() => setShowPayment(false)} onComplete={completeSale} />}
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
                            {completedOffline && <div role="status" className="rounded-lg bg-amber-100 text-amber-900 px-3 py-2 text-sm font-medium">Saved offline. It will be sent automatically and get its real receipt number then.</div>}
                            <div className="flex flex-col gap-2 pt-2">
                                <Button variant="outline" onClick={() => printReceipt(completedSale)}><Printer className="w-4 h-4 mr-2" />Print receipt</Button>
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
