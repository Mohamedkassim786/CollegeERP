export const ErrorMessage = ({ message = 'Something went wrong', onRetry }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <p className="text-red-500 font-medium">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-3 text-sm text-blue-600 hover:underline">
        Try again
      </button>
    )}
  </div>
)
