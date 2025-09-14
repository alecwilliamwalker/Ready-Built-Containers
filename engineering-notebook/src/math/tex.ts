// Utilities to convert formatted plain text with units into TeX

const THIN_SPACE = '\u2009';

const UNIT_TOKEN = /^([A-Za-z]+)(?:\^(-?\d+))?$/;

function unitTokenToTex(tok: string): string {
	const m = UNIT_TOKEN.exec(tok.trim());
	if (!m) return `\\mathrm{${tok}}`;
	const base = `\\mathrm{${m[1]}}`;
	const exp = m[2] ? `^{${m[2]}}` : '';
	return `${base}${exp}`;
}

function unitSideToTex(side: string): string {
	const parts = side.split(/[\u00B7.]/g).map(s => s.trim()).filter(Boolean);
	return parts.map(unitTokenToTex).join(' \\cdot ');
}

function unitTextToTex(u: string): string {
	const slash = u.indexOf('/');
	if (slash >= 0) {
		const num = u.slice(0, slash);
		const den = u.slice(slash + 1);
		return `\\frac{${unitSideToTex(num)}}{${unitSideToTex(den)}}`;
	}
	return unitSideToTex(u);
}

// Convert a plain formatted quantity "12 in" or expression chain
// like "A = 5 in + 4 in = 9 in" into TeX.
export function plainToTeX(formatted: string): string {
	// Replace thin spaces with TeX thin-space
	let s = formatted.replace(new RegExp(THIN_SPACE, 'g'), '\\,');
	// Convert unit tails: any number followed by optional space and a unit spec
	// We conservatively match number + space + unit group to avoid hitting variables
	// Example: "12 in" -> "12\\,\\mathrm{in}"
	s = s.replace(/(\d(?:[\d.,]*))(\s+)([A-Za-z][A-Za-z0-9]*(?:[\u00B7·.][A-Za-z][A-Za-z0-9]*)*(?:\/[A-Za-z][A-Za-z0-9]*(?:[\u00B7·.][A-Za-z][A-Za-z0-9]*)*)?(?:\^-?\d+)?)/g,
		(_, v: string, _sp: string, u: string) => `${v}\\,${unitTextToTex(u)}`
	);
	// Also convert bare unit identifiers inside equals chains, but avoid touching variable names
	return s;
}



