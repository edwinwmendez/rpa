// Excel Preview - Componente para mostrar preview de datos Excel
import type { ExcelData } from '../../types/workflow';
import { cn } from '../../lib/utils';

interface ExcelPreviewProps {
  data: ExcelData;
  maxRows?: number;
  className?: string;
}

export function ExcelPreview({ data, maxRows = 5, className }: ExcelPreviewProps) {
  const displayRows = data.rows.slice(0, maxRows);

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {data.headers.map((header, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {data.headers.map((header, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap"
                  >
                    {String(row[header] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.totalRows > maxRows && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
          Mostrando {maxRows} de {data.totalRows} filas
        </div>
      )}
    </div>
  );
}

