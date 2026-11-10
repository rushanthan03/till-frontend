import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ProductsAPI } from '../../features/products/productsAPI';
import type { Product } from '../../features/products/types';

interface Props {
    storeId: string;
    onPick: (p: Product) => void;
    placeholder?: string;
}

/** Type a name or scan a barcode, pick the product from the matches. */
export function ProductPicker({ storeId, onPick, placeholder = 'Scan barcode or search product…' }: Props) {
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<Product[]>([]);

    useEffect(() => {
        const t = term.trim();
        if (t.length < 2) { setResults([]); return; }
        const id = setTimeout(() => {
            ProductsAPI.list({ storeId, search: t, status: 'active', limit: 8 }).then(r => setResults(r.data)).catch(() => setResults([]));
        }, 250);
        return () => clearTimeout(id);
    }, [term, storeId]);

    const pick = (p: Product) => { onPick(p); setTerm(''); setResults([]); };

    return (
        <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={placeholder} aria-label="Find product" autoComplete="off"
                onKeyDown={(e) => { if (e.key === 'Enter' && results.length >= 1) { e.preventDefault(); pick(results[0]); } }}
                className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" />
            {results.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {results.map(p => (
                        <li key={p.id}>
                            <button type="button" onClick={() => pick(p)} className="w-full flex justify-between gap-3 px-3 py-2 text-left hover:bg-blue-50">
                                <span><span className="font-medium">{p.name}</span> <span className="text-xs text-gray-500">{p.barcode}</span></span>
                                <span className="text-xs text-gray-600">{p.stockQuantity} in stock</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
