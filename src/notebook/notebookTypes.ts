export type NotebookBlock = { id: string; kind: "text" | "math"; text: string; collapsed?: boolean };
export type NotebookDoc = { blocks: NotebookBlock[] }; 