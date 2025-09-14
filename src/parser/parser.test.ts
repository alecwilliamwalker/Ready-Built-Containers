import { describe, it, expect } from 'vitest';
import { tokenize } from './lexer';
import { parseStatement } from './parser';
import { formatStatement } from './evalFormat';

describe('units tokenization and formatting', () => {
  it('tokenizes 5in + 4in as NUMBER UNIT PLUS NUMBER UNIT', () => {
    const toks = tokenize('5in + 4in').filter(t => t.type !== 'WS');
    expect(toks.map(t => t.type)).toEqual(['NUMBER','UNIT','PLUS','NUMBER','UNIT']);
  });

  it('formats assignment with result', () => {
    const stmt = parseStatement('A = 5in + 4in');
    const out = formatStatement(stmt);
    const norm = out.replace(/[\u2009\t ]+/g, ' ');
    expect(norm).toContain('A = 5 in + 4 in = 9 in');
  });

  it('handles spaced and unspaced equivalently', () => {
    const a = parseStatement('5 in + 3 in');
    const b = parseStatement('5in+3in');
    expect(formatStatement(a)).toBe(formatStatement(b));
  });

  it('explicitly falls back on mult/div', () => {
    // Parser is intentionally +/− only for now; mult/div should trigger fallback marker
    expect(() => parseStatement('A = 2 in * 3')).toThrow('__MULT_DIV_FALLBACK__');
  });
});


