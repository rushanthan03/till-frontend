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

/**
 * Reads CSV text into rows of cells. Handles quoted cells (with commas, quotes and line breaks),
 * CRLF or LF line ends and a UTF-8 byte-order mark. The separator is a comma, or a semicolon
 * when the heading line uses semicolons (Excel does this in some countries).
 */
export function parseCsv(text: string): string[][] {
    const src = text.replace(/^\uFEFF/, '');
    const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
    const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (quoted) {
            if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
            else if (ch === '"') quoted = false;
            else cell += ch;
        } else if (ch === '"' && cell === '') quoted = true;
        else if (ch === sep) { row.push(cell); cell = ''; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && src[i + 1] === '\n') i++;
            row.push(cell); rows.push(row); row = []; cell = '';
        } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ''));
}

/** CSV text to one object per data row, keyed by the heading row. */
export function csvRecords(text: string): { headers: string[]; records: Record<string, string>[] } {
    const [headers = [], ...rows] = parseCsv(text);
    const clean = headers.map(h => h.trim());
    return { headers: clean, records: rows.map(r => Object.fromEntries(clean.map((h, i) => [h, (r[i] ?? '').trim()]))) };
}
