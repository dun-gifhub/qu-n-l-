import React from 'react';

interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface EducationTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function EducationTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Không có dữ liệu hiển thị',
  isLoading = false,
}: EducationTableProps<T>) {
  if (isLoading) {
    return (
      <div className="py-16 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center gap-2">
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Đang tải dữ liệu trường học</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-[var(--radius-card)] bg-[var(--surface-muted)]/60 border border-[var(--border)]">
        <p className="text-sm font-medium text-[var(--text-secondary)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--surface-muted)] border-b border-[var(--border)]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-xs font-medium text-[var(--text-secondary)] ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-[var(--surface-muted)]/40 transition-colors duration-[var(--duration-fast)]"
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-4 py-3.5 align-middle font-normal ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(item, index)
                      : col.accessor
                      ? (item[col.accessor] as any)
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
