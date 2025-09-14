export type MathRun =
  | { kind: "text"; text: string }
  | { kind: "inline"; tex: string }
  | { kind: "display"; tex: string };

export function splitMathRuns(input: string): MathRun[] {
  const runs: MathRun[] = [];
  let i = 0;
  while (i < input.length) {
    if (input.startsWith("$$", i)) {
      const end = input.indexOf("$$", i + 2);
      if (end !== -1) {
        const tex = input.slice(i + 2, end);
        runs.push({ kind: "display", tex });
        i = end + 2;
        continue;
      }
    }
    if (input[i] === "$") {
      const end = input.indexOf("$", i + 1);
      if (end !== -1) {
        const tex = input.slice(i + 1, end);
        runs.push({ kind: "inline", tex });
        i = end + 1;
        continue;
      }
    }
    // Accumulate text until next $ or end
    let j = i;
    while (j < input.length && input[j] !== "$") j += 1;
    const text = input.slice(i, j);
    if (text) runs.push({ kind: "text", text });
    i = j;
  }
  return runs;
} 