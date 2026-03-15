import { PageSpinner } from './Spinner'
import { EmptyState } from './EmptyState'

export const Table = ({ headers, data, renderRow, loading, emptyMessage = 'No records found', className = '' }) => {
  if (loading) return <PageSpinner />
  if (!data || !data.length) return <EmptyState message={emptyMessage} />
  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, i) => renderRow(row, i))}
        </tbody>
      </table>
    </div>
  )
}
