interface BatchProgress {
  jobId: string
  batchNumber: number
  totalBatches: number
  batchSize: number
  successCount: number
  failureCount: number
  totalProcessed: number
  totalEmails: number
  failures: { email: string; error: string }[]
  status: 'processing' | 'completed' | 'error'
}

interface EmailProgressDisplayProps {
  readonly progress: BatchProgress
}

export function EmailProgressDisplay({ progress }: EmailProgressDisplayProps) {
  const percentComplete = progress.totalEmails > 0
    ? Math.round((progress.totalProcessed / progress.totalEmails) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="font-medium">Sending Emails...</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Batch {progress.batchNumber} of {progress.totalBatches}</span>
            <span>{percentComplete}%</span>
          </div>

          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <div className="text-sm space-y-1">
            <p>Processed: {progress.totalProcessed} / {progress.totalEmails}</p>
            <p className="text-green-600">Successful: {progress.successCount}</p>
            {progress.failureCount > 0 && (
              <p className="text-red-600">Failed: {progress.failureCount}</p>
            )}
            <p className="text-gray-500 text-xs mt-2">
              Batch size: {progress.batchSize} emails
            </p>
          </div>
        </div>
      </div>

      {progress.failures.length > 0 && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg max-h-40 overflow-y-auto">
          <p className="font-medium mb-2">Recent failures:</p>
          <ul className="text-sm space-y-1">
            {progress.failures.slice(-5).map((failure: { email: string; error: string }, idx: number) => (
              <li key={`${failure.email}-${idx}`} className="text-xs">
                {failure.email}: {failure.error.substring(0, 50)}...
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
