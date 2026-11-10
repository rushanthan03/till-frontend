/** Downloads rows as a CSV file. Cells starting with = + - @ are prefixed so spreadsheets never run them as formulas. */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null)[][]) {
    const cell = (v: string | number | null) => {
        let s = v === null || v === undefined ? '' : String(v);
        if (typeof v === 'string' && /^[=+\-@]/.test(s)) s = `'${s}`;
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}
