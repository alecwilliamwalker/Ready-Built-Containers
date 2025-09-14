export type BoxKind = "calc" | "text";
export type BoxMode = "edit" | "render";

export type CalcBoxModel = {
  id: string;
  x: number;
  y: number;
  z: number;
  kind: BoxKind;
  mode: BoxMode;
  raw: string;
  src?: string;
  nameNorm?: string;
  resultText?: string;
  error?: string | null;
  w?: number;
  renderAsMath?: boolean;
};

export type Doc = { boxes: CalcBoxModel[] }; 