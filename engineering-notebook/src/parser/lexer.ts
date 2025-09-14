// A small, deterministic lexer with reserved UNIT tokens.
// It prefers UNIT over IDENT whenever a match exists.

export const UNITS = [
  "in","ft","yd","mm","cm","m","km","mil",
  "N","kN","lb","lbs","kip","Pa","kPa","MPa","GPa",
  "psi","psf","ksi","deg","rad"
] as const;
export type Unit = typeof UNITS[number];

export type Token =
  | { type: "NUMBER"; lexeme: string; value: number }
  | { type: "UNIT"; unit: Unit; lexeme: string }
  | { type: "IDENT"; name: string; lexeme: string }
  | { type: "PLUS" | "MINUS" | "STAR" | "SLASH" | "EQUAL" | "LPAREN" | "RPAREN" }
  | { type: "WS" };

const isDigit = (c: string) => c >= "0" && c <= "9";
const isAlpha = (c: string) => /[A-Za-z_]/.test(c);
const isAlphaNum = (c: string) => /[A-Za-z0-9_]/.test(c);
const isSpace = (c: string) => /\s/.test(c);

function readNumber(src: string, i: number) {
  let j = i;
  // digits with optional commas and one decimal point
  while (j < src.length && /[0-9.,]/.test(src[j])) j++;
  const lexeme = src.slice(i, j);
  const value = Number(lexeme.replace(/,/g, ""));
  return { token: { type: "NUMBER" as const, lexeme, value }, j };
}

function readWord(src: string, i: number) {
  let j = i;
  while (j < src.length && isAlphaNum(src[j])) j++;
  const word = src.slice(i, j);
  return { word, j };
}

function looksLikeUnit(word: string): word is Unit {
  return (UNITS as readonly string[]).includes(word);
}

export function tokenize(input: string): Token[] {
  const s = input ?? "";
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];

    if (isSpace(c)) { out.push({ type: "WS" }); i++; continue; }

    if (c === "+") { out.push({ type: "PLUS" }); i++; continue; }
    if (c === "-") { out.push({ type: "MINUS" }); i++; continue; }
    if (c === "*") { out.push({ type: "STAR" }); i++; continue; }
    if (c === "/") { out.push({ type: "SLASH" }); i++; continue; }
    if (c === "=") { out.push({ type: "EQUAL" }); i++; continue; }
    if (c === "(") { out.push({ type: "LPAREN" }); i++; continue; }
    if (c === ")") { out.push({ type: "RPAREN" }); i++; continue; }

    if (isDigit(c)) {
      const { token: numTok, j } = readNumber(s, i);
      out.push(numTok);
      i = j;

      // Optional whitespace
      let k = i;
      while (k < s.length && isSpace(s[k])) { out.push({ type: "WS" }); k++; }

      // Optional unit directly after number (with or without spaces)
      if (k < s.length && isAlpha(s[k])) {
        const { word, j: k2 } = readWord(s, k);
        if (looksLikeUnit(word)) {
          out.push({ type: "UNIT", unit: word as Unit, lexeme: word });
          i = k2;
          continue;
        }
      }

      i = k;
      continue;
    }

    if (isAlpha(c)) {
      const { word, j } = readWord(s, i);
      // Prefer UNIT over IDENT everywhere
      if (looksLikeUnit(word)) {
        out.push({ type: "UNIT", unit: word as Unit, lexeme: word });
      } else {
        out.push({ type: "IDENT", name: word, lexeme: word });
      }
      i = j;
      continue;
    }

    // Unknown char: skip
    i++;
  }
  return out;
}


