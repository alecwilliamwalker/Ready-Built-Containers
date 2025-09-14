// Canonicalize editor text so parsing is stable across typing, paste, undo/redo.

const UNICODE_SPACES = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g; // nbsp..ideographic
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g; // zwsp, zwnj, zwj, bom

// Extend units as needed for your domain.
// Define UNIT as a plain alternation string (no capturing parens) to avoid nested capture groups
export const UNIT = 'in|ft|yd|mm|cm|m|km|mil|N|kN|lb|lbs|kip|Pa|kPa|MPa|GPa|psi|psf|ksi|deg|rad';
// number + optional spaces + (capture unit) + word boundary
const NUM_UNIT = new RegExp(`(\\d(?:[\\d.,]*))\\s*(?:(${UNIT}))(\\b)`, 'gi');

export function normalizeForParser(raw: string): string {
  if (!raw) return '';
  let s = raw
    .replace(ZERO_WIDTH, '')
    .replace(UNICODE_SPACES, ' ')
    .replace(/\s+/g, ' '); // collapse spaces

  // Ensure there's a space between number and unit
  s = s.replace(NUM_UNIT, '$1 $2$3');

  // Convert all multiplication symbols to *
  s = s.replace(/\\cdot|\\times|·|×/g, '*');
  
  // Convert all division symbols to /
  s = s.replace(/\\div|÷/g, '/');
  
  // Convert Unicode minus to regular minus
  s = s.replace(/−/g, '-');
  
  // Optional tidy around equals
  s = s.replace(/\s*=\s*/g, ' = ');
  return s.trim();
}

// Collapse accidental duplicate unit tokens like "in in" or "inin" into a single unit.
export function collapseDuplicateUnits(raw: string): string {
  if (!raw) return '';
  let s = raw;
  // Replace repeated unit tokens after a number: e.g., 5 inin, 5 in in
  const DUP_AFTER_NUM = new RegExp(`(\\d(?:[\\d.,]*))\\s*(?:(${UNIT}))\\s*\\2\\b`, 'gi');
  for (let i = 0; i < 3; i += 1) {
    const next = s.replace(DUP_AFTER_NUM, '$1 $2');
    if (next === s) break; s = next;
  }
  // Replace standalone repeated units: e.g., in in -> in
  const DUP_LONE = new RegExp(`(\\b)(?:(${UNIT}))\\s*\\2\\b`, 'gi');
  for (let i = 0; i < 3; i += 1) {
    const next = s.replace(DUP_LONE, '$1$2');
    if (next === s) break; s = next;
  }
  return s;
}


