import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

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
