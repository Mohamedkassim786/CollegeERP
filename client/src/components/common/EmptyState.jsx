export const EmptyState = ({ message = 'No records found', description = '', icon, action }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    {icon && <div className="text-gray-300 mb-4">{icon}</div>}
    <p className="text-gray-500 font-medium">{message}</p>
    {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)
