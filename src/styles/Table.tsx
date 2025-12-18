import React from 'react';

interface TableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  variant?: 'default' | 'compact' | 'striped';
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  loading?: boolean;
  selectedRows?: string[];
  onSelectRow?: (rowId: string) => void;
  rowKey?: string;
  stickyHeader?: boolean;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  variant = 'default',
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  selectedRows = [],
  onSelectRow,
  rowKey = 'id',
  stickyHeader = false
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return {
          header: 'px-3 py-2',
          cell: 'px-3 py-2 text-xs',
          row: 'hover:bg-neutral-50'
        };
      case 'striped':
        return {
          header: 'px-6 py-3',
          cell: 'px-6 py-4 text-sm',
          row: 'hover:bg-neutral-50 even:bg-neutral-50'
        };
      default:
        return {
          header: 'px-6 py-3',
          cell: 'px-6 py-4 text-sm',
          row: 'hover:bg-neutral-50'
        };
    }
  };

  const classes = getVariantClasses();

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-200 border-t-primary-600"></div>
        <span className="ml-3 text-neutral-500">Loading...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-neutral-500">{emptyMessage}</p>
      </div>
    );
  }

  const isRowSelected = (row: any) => selectedRows.includes(row[rowKey]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className={`bg-neutral-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
          <tr>
            {onSelectRow && (
              <th className={`${classes.header} w-12`}>
                <span className="sr-only">Select</span>
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${classes.header} ${getAlignmentClass(column.align)} text-xs font-medium text-neutral-500 uppercase tracking-wider`}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {data.map((row, index) => (
            <tr
              key={row[rowKey] || index}
              className={`${classes.row} ${onRowClick ? 'cursor-pointer' : ''} ${isRowSelected(row) ? 'bg-primary-50' : ''} transition-colors`}
              onClick={() => onRowClick?.(row)}
            >
              {onSelectRow && (
                <td className={`${classes.cell} w-12`}>
                  <input
                    type="checkbox"
                    checked={isRowSelected(row)}
                    onChange={() => onSelectRow(row[rowKey])}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`${classes.cell} ${getAlignmentClass(column.align)} whitespace-nowrap text-neutral-900`}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
