type Cell = string | number | null;

/** CSV text. Text cells starting with = + - @ are prefixed so spreadsheets never run them as formulas. */
export function toCsv(header: string[], rows: Cell[][]): string {
    const cell = (v: Cell) => {
        let s = v === null || v === undefined ? '' : String(v);
        if (typeof v === 'string' && /^[=+\-@]/.test(s)) s = `'${s}`;
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [header, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
}

/** Downloads rows as a CSV file (opens cleanly in Excel: UTF-8 with a byte-order mark). */
export function downloadCsv(filename: string, header: string[], rows: Cell[][]) {
    const url = URL.createObjectURL(new Blob(['﻿' + toCsv(header, rows)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}
