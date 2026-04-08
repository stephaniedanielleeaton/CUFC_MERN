interface EmailSendSummary {
  totalEmails: number
  emailsSent: number
  emailsFailed: number
  emailsBlocked: number
}

interface FailedEmail {
  email: string
  error: string
}

interface SendResultDisplayProps {
  readonly summary: EmailSendSummary
  readonly blockedEmails: string[]
  readonly failedEmails: FailedEmail[]
  readonly onSendAnother: () => void
}

export function SendResultDisplay({
  summary,
  blockedEmails,
  failedEmails,
  onSendAnother,
}: SendResultDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">Email Processing Complete</span>
          </div>

          <div className="mt-2 text-sm">
            <p>Total Recipients: {summary.totalEmails}</p>
            <p>Successfully Sent: {summary.emailsSent}</p>
            {summary.emailsFailed > 0 && (
              <p className="text-red-600">Failed to Send: {summary.emailsFailed}</p>
            )}
            {summary.emailsBlocked > 0 && (
              <div className="mt-2">
                <p className="text-amber-700">
                  Blocked Recipients: {summary.emailsBlocked}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  The following recipients are on the do-not-contact list:
                </p>
                <ul className="list-disc list-inside ml-2 text-gray-600">
                  {blockedEmails.map((email, index) => (
                    <li key={index}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {failedEmails.length > 0 && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Failed to send to:</p>
            <ul className="list-disc list-inside ml-2">
              {failedEmails.map((item, index) => (
                <li key={index}>{item.email}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-4">
        <button
          onClick={onSendAnother}
          className="px-6 py-3 font-bold rounded-lg transition-all duration-300 shadow-md flex items-center gap-2
            bg-navy text-white hover:bg-navy/90 hover:scale-105"
        >
          <span>Send Another Email</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
