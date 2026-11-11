import { describe, expect, it } from 'vitest';
import { csvRecords, parseCsv, toCsv } from './csv';

describe('toCsv', () => {
    it('joins rows with CRLF and leaves numbers and empties alone', () => {
        expect(toCsv(['a', 'b'], [[1, null], ['x', 2.5]])).toBe('a,b\r\n1,\r\nx,2.5');
    });
    it('quotes cells with commas, quotes or line breaks', () => {
        expect(toCsv(['t'], [['a,b'], ['say "hi"'], ['two\nlines']])).toBe('t\r\n"a,b"\r\n"say ""hi"""\r\n"two\nlines"');
    });
    it('stops spreadsheet formulas by prefixing text that starts with = + - @', () => {
        expect(toCsv(['t'], [['=SUM(A1)'], ['+1'], ['@cmd'], ['-2+3']])).toBe("t\r\n'=SUM(A1)\r\n'+1\r\n'@cmd\r\n'-2+3");
    });
    it('keeps real negative numbers as numbers', () => {
        expect(toCsv(['n'], [[-5]])).toBe('n\r\n-5');
    });
});

describe('parseCsv', () => {
    it('reads what toCsv writes', () => {
        const rows = [['a,b', 'say "hi"'], ['two\nlines', '']];
        expect(parseCsv(toCsv(['x', 'y'], rows))).toEqual([['x', 'y'], ...rows]);
    });
    it('handles a byte-order mark, LF endings and blank lines', () => {
        expect(parseCsv('\uFEFFa,b\n1,2\n\n3,4\n')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
    });
    it('uses semicolons when the heading line does', () => {
        expect(parseCsv('a;b\r\n1,5;2')).toEqual([['a', 'b'], ['1,5', '2']]);
    });
    it('turns rows into records by heading', () => {
        expect(csvRecords('Name, Price\nMilk,1.65\nBread').records).toEqual([{ Name: 'Milk', Price: '1.65' }, { Name: 'Bread', Price: '' }]);
    });
});
