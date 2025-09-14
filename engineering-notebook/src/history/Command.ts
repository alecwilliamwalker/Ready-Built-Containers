export type HistoryScope = 'sheet' | 'report';

export type CommandCtx = {
  // Sheet grid
  getCell(r: number, c: number): { value: string; format?: any };
  setCell(r: number, c: number, value: string, format?: any): void;

  // Report boxes (current report document)
  getBoxes(): any[]; // CalcBoxModel[] but avoid tight coupling
  setBoxes(next: any[] | ((prev: any[]) => any[])): void;
}

export type Command = {
  name: string;
  scope: HistoryScope;
  do(ctx: CommandCtx): void;
  undo(ctx: CommandCtx): void;
  merge?(next: Command): Command | undefined;
}


