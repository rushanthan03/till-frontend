import { CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';
import { money } from '../../utils/money';

/** Cash count result. Always icon + text + sign, never colour alone. */
export function DifferenceBadge({ variance }: { variance: number | null }) {
    if (variance === null) return <span className="text-gray-400">—</span>;
    if (variance === 0) {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden />Balanced</span>;
    }
    const short = variance < 0;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${short ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
            {short ? <TrendingDown className="w-3.5 h-3.5" aria-hidden /> : <TrendingUp className="w-3.5 h-3.5" aria-hidden />}
            {short ? 'Short' : 'Over'} {short ? '-' : '+'}{money(Math.abs(variance))}
        </span>
    );
}
