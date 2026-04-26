interface SendButtonProps {
  readonly isLoading: boolean
}

export function SendButton({ isLoading }: SendButtonProps) {
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="submit"
        disabled={isLoading}
        className={`w-fit px-6 py-3 font-bold rounded-lg transition-all duration-300 shadow-md flex items-center gap-2
          ${isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-navy text-white hover:bg-navy/90 hover:scale-105'
          }`}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>Send Email</span>
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </>
        )}
      </button>
      {isLoading && (
        <div className="text-sm text-gray-600 italic">
          This process may take a few minutes depending on the number of recipients
        </div>
      )}
    </div>
  )
}
