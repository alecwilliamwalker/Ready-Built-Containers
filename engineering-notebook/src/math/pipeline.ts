import { normalizeForParser } from '../lib/text/normalize';
import { parseStatement, type Stmt } from '../parser/parser';
import { formatStatement } from '../parser/evalFormat';

export type PipelineResult = {
	original: string;
	normalized: string;
	stmt: Stmt | null;
	formatted: string | null; // plain text with thin spaces and unit strings
	tex: string | null; // TeX string for rendering
	error?: string | null;
};

/**
 * End-to-end math pipeline: normalize -> parse -> format.
 * Returns both plain formatted and TeX strings, or an error.
 */
export function runMathPipeline(input: string, toTeX: (formatted: string) => string): PipelineResult {
	const original = input;
	const normalized = normalizeForParser(original);
	try {
		const stmt = parseStatement(normalized);
		const formatted = formatStatement(stmt);
		const tex = toTeX(formatted);
		return { original, normalized, stmt, formatted, tex };
	} catch (e: any) {
		return { original, normalized, stmt: null, formatted: null, tex: null, error: String(e?.message ?? e) };
	}
}



