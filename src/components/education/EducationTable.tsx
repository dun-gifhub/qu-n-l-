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
      <div className="py-16 text-center text-[#60758D] flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Đang tải dữ liệu trường học...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-14 px-4 text-center rounded-[20px] bg-[#F5F9FD] border border-dashed border-[#DCE7F2] my-3">
        <p className="text-sm font-semibold text-[#60758D]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-[#DCE7F2] bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#EAF5FF]/80 border-b border-[#DCE7F2]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#003B7A] ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE7F2]/70 text-[#172B4D]">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-[#F5F9FD] transition-colors duration-150"
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-5 py-4 align-middle font-medium ${col.className || ''}`}
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
