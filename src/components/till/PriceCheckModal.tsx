import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { money } from '../../utils/money';
import { handleApiError } from '../../api/handleApiError';
import { ProductsAPI } from '../../features/products/productsAPI';
import type { Product } from '../../features/products/types';

interface Props {
    restaurantId: string;
    onAdd: (product: Product) => void;
    onClose: () => void;
}

export function PriceCheckModal({ restaurantId, onAdd, onClose }: Props) {
    const [code, setCode] = useState('');
    const [product, setProduct] = useState<Product | null>(null);
    const [busy, setBusy] = useState(false);

    const lookup = async (e: FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setBusy(true);
        try {
            setProduct(await ProductsAPI.byBarcode(code.trim(), restaurantId));
        } catch (error) {
            setProduct(null);
            toast.error(handleApiError(error));
        } finally {
            setBusy(false);
            setCode('');
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Price check" size="sm">
            <form onSubmit={lookup} className="space-y-4">
                <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="Scan or type barcode"
                    aria-label="Barcode" className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-600" />
                {product && (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-1">
                        <div className="font-bold text-gray-900">{product.name}</div>
                        <div className="text-3xl font-extrabold">{money(product.price)}{product.unitType === 'weight' ? ' /kg' : ''}</div>
                        <div className="text-sm text-gray-600">VAT {product.vatRate}% · {product.stockQuantity} in stock{product.ageRestriction ? ` · ${product.ageRestriction}+ only` : ''}</div>
                    </div>
                )}
                <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Close</Button>
                    {product ? (
                        <Button type="button" className="flex-1" onClick={() => { onAdd(product); onClose(); }}>Add to basket</Button>
                    ) : (
                        <Button type="submit" className="flex-1" isLoading={busy}>Look up</Button>
                    )}
                </div>
            </form>
        </Modal>
    );
}
