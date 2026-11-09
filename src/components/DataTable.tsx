import { CircularProgress } from '@mui/material';
import { ReactNode, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { hexToRgba } from '../utils';

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
  rowColor?: string;
  selected?: boolean;
  height?: number;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data available',
  rowColor = 'bg-white',
  selected,
  height = 500,
  isLoading
}: DataTableProps<T>) {

  const { primaryColor } = useAuth();
  const [selectRow, setSelectRow] = useState<number | null>(null)

  const handleSelect = (item: T, index: number) => {
    if (selected) {
      setSelectRow(index)
    }
    onRowClick?.(item);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-left text-xs font-semibold ${column.onLabelClick ? 'text-red-700' : 'text-gray-700'
                      } uppercase tracking-wider whitespace-nowrap ${column.onLabelClick && 'cursor-pointer'
                      } bg-gray-50`}
                    style={{ width: column.width }}
                    onClick={column.onLabelClick}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading || data.length === 0 ? (
                <tr style={{ height: height - 50 }}>
                  <td
                    colSpan={columns.length}
                    className="px-6 text-center text-gray-500"
                  >
                    {isLoading ? (<CircularProgress />) : emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={index}
                    onClick={() => handleSelect(item, index)}
                    style={{ backgroundColor: selectRow === index ? hexToRgba(primaryColor, 0.8) : (!(index % 2) ? rowColor : '') }}
                    className={`transition-colors
                        ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                        ${selectRow === index ? 'text-white hover:text-gray-900' : 'text-gray-900'}`}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 text-sm whitespace-nowrap">
                        {column.render ? column.render(item) : item[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
}
