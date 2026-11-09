import { CircularProgress, TablePagination } from "@mui/material";
import { ReactNode, useState, MouseEvent } from "react";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  width?: string;
  onLabelClick?: () => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;

  selected?: boolean;
  height?: number;
  isLoading?: boolean;
  total?: number;
  page?: string;
  handleChangePage?: (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent> | null, newPage: number) => void;
  limit?: string;
  handleChangeRowsPerPage?: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  emptyMessage = "No data available",
  selected,
  height = 500,
  total = 0,
  page,
  handleChangePage = () => { },
  limit,
  handleChangeRowsPerPage,
  isLoading,
}: DataTableProps<T>) {
  const [selectRow, setSelectRow] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const handleSelect = (item: T, index: number) => {
    if (selected) {
      setSelectRow(index);
    }
    onRowClick?.(item);
  };

  return (
    <div className="w-full">
      {/* Table Container */}
      <div className="overflow-hidden">
        <div
          style={{ maxHeight: 600 }}
          className="overflow-y-auto overflow-x-scroll hide-scrollbar"
        >
          <table className="w-full border-collapse">
            {/* Modern Header */}
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="border-b-2 border-gray-200">
                {columns.map((column, idx) => (
                  <th
                    key={column.key}
                    className={`
                      px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider
                      ${column.onLabelClick ? "cursor-pointer hover:text-blue-600 transition-colors duration-200" : ""}
                      ${idx === 0 ? "rounded-tl-xl" : ""}
                      ${idx === columns.length - 1 ? "rounded-tr-xl" : ""}
                      bg-slate-50
                    `}
                    style={{ width: column.width }}
                    onClick={column.onLabelClick}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.onLabelClick && (
                        <svg className="w-3 h-3 transition-transform duration-200 hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white">
              {isLoading ? (
                <tr style={{ height: height - 50 }}>
                  <td
                    colSpan={columns.length}
                    className="px-6 text-center"
                  >
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="relative">
                        <CircularProgress size={48} thickness={3.6} sx={{ color: '#3b82f6' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <p className="mt-6 text-sm text-gray-600 font-medium animate-pulse">Loading data...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr style={{ height: height - 50 }}>
                  <td
                    colSpan={columns.length}
                    className="px-6 text-center"
                  >
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-semibold text-base">{emptyMessage}</p>
                      <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={index}
                    onClick={() => handleSelect(item, index)}
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`
                      transition-all duration-300 ease-out
                      ${onRowClick ? "cursor-pointer" : ""}
                      ${selectRow === index
                        ? "bg-blue-50/80 border-l-4 border-l-blue-500"
                        : hoveredRow === index
                          ? "bg-gradient-to-r from-gray-50/50 to-transparent"
                          : "border-l-4 border-l-transparent"
                      }
                      ${index !== data.length - 1 ? "border-b border-gray-100" : ""}
                      group
                    `}
                  >
                    {columns.map((column, colIdx) => (
                      <td
                        key={column.key}
                        className={`
                          px-6 py-4 text-sm text-gray-700
                          ${hoveredRow === index ? "text-gray-900" : ""}
                          transition-colors duration-200
                          ${colIdx === 0 ? "font-medium" : ""}
                        `}
                      >
                        <div className={hoveredRow === index ? "transform translate-x-0.5 transition-transform duration-200" : ""}>
                          {column.render ? column.render(item) : item[column.key]}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Pagination */}
      {!isLoading && data.length > 0 && (
        <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-t-2 border-gray-200 px-6 py-3 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 font-medium">
              Showing <span className="font-bold text-gray-900">{((Number(page) - 1) * Number(limit)) + 1}</span> to{' '}
              <span className="font-bold text-gray-900">{Math.min(Number(page) * Number(limit), total)}</span> of{' '}
              <span className="font-bold text-gray-900">{total}</span> results
            </div>
            <TablePagination
              component="div"
              count={total}
              page={Number(page) - 1}
              onPageChange={(event, newPage) => handleChangePage && handleChangePage(event, newPage + 1)}
              rowsPerPage={Number(limit)}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Rows per page:"
              sx={{
                '& .MuiTablePagination-toolbar': {
                  minHeight: '52px',
                  paddingLeft: 0,
                  paddingRight: 0,
                },
                '& .MuiTablePagination-selectLabel': {
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontWeight: 500,
                  margin: 0,
                },
                '& .MuiTablePagination-displayedRows': {
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontWeight: 500,
                  margin: 0,
                },
                '& .MuiTablePagination-select': {
                  borderRadius: '0.5rem',
                  border: '2px solid #e5e7eb',
                  padding: '0.375rem 2.5rem 0.375rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: 'white',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                    borderColor: '#d1d5db',
                  },
                  '&:focus': {
                    borderColor: '#3b82f6',
                    backgroundColor: 'white',
                  },
                },
                '& .MuiTablePagination-actions': {
                  marginLeft: '1rem',
                },
                '& .MuiTablePagination-actions button': {
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  border: '2px solid transparent',
                  transition: 'all 0.2s',
                  '&:hover:not(.Mui-disabled)': {
                    backgroundColor: '#f3f4f6',
                    borderColor: '#e5e7eb',
                    transform: 'scale(1.05)',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.3,
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        /* Hide scrollbar but keep functionality */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }

        /* Smooth scroll behavior */
        .hide-scrollbar {
          scroll-behavior: smooth;
        }

        /* Prevent layout shift on hover */
        table {
          table-layout: auto;
        }
      `}</style>
    </div>
  );
}
