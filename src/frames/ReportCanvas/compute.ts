import type { CalcBoxModel } from './types';
import { classifyLine, recompute as recomputePad } from '../ReportPad/model';
import { parseAddress } from '../../referencing/a1';
import { autoDisplay, formatText } from '../../engine/formatUnits';
import { trimTrailingEquals } from '../../parsing/classify';

export function computeBoxes(
  nextBoxes: CalcBoxModel[],
  getCellDisplay: (r: number, c: number) => string
): CalcBoxModel[] {
  const ordered = [...nextBoxes].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const doc = { lines: ordered.map((b) => {
    const srcText = (b as any).src ? String((b as any).src) : b.raw;
    const trimmed = trimTrailingEquals(srcText);
    const m = /^([^=]+?)=(.+)$/.exec(trimmed);
    const evalText = m ? m[2].trim() : trimmed;
    const looksMathy = /[=+\-*/^()]/.test(evalText) || /(sqrt|sin|cos|tan|ln|log)\s*\(/i.test(evalText) || /\b[A-Z]+[1-9][0-9]*\b/.test(evalText);
    const kind = (!((b as any).renderAsMath) && !looksMathy) ? 'text' : classifyLine(evalText);
    return { id: b.id, text: evalText, kind } as any;
  }) } as any;
  const computed = recomputePad(doc, getCellDisplay, (a1) => parseAddress(a1));
  const idToRes = new Map(computed.lines.map((l: any) => [l.id, l] as const));
  return nextBoxes.map((b) => {
    const line = idToRes.get(b.id);
    const resultText = line?.result ? formatText(autoDisplay({ valueSI: line.result.valueSI, dims: line.result.dims })) : undefined;
    // Do not mutate raw here; keep raw/src as the user's editable/source text
    return { ...b, resultText, error: line?.error ?? null } as CalcBoxModel;
  });
}


