type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type AdminTableProps<T> = {
  columns: Array<Column<T>>;
  data: T[];
  emptyMessage?: string;
};

export function AdminTable<T>({ columns, data, emptyMessage = "No records yet." }: AdminTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-muted/60 bg-white">
      <table className="min-w-full divide-y divide-surface-muted/60 text-sm">
        <thead className="bg-surface">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs text-foreground/70">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-muted/60">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-foreground/60">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-surface-muted/40">
                {columns.map((column) => {
                  let value: React.ReactNode;
                  if (column.render) {
                    value = column.render(row);
                  } else {
                    const rawValue = (row as Record<string, unknown>)[column.key];
                    value = rawValue != null ? String(rawValue) : "—";
                  }
                  return (
                    <td key={column.key} className="px-4 py-3 text-foreground/80">
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
