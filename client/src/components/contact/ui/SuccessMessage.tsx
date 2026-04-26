import { SquareButton } from '../../common/SquareButton'

interface SuccessMessageProps {
  onSendAnother: () => void;
}

export function SuccessMessage({ onSendAnother }: SuccessMessageProps) {
  return (
    <div className="text-center py-8">
      <div className="mb-4">
        <svg
          className="w-16 h-16 text-green-500 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
      <p className="text-gray-600 mb-6">
        Thank you for reaching out. We will get back to you soon.
      </p>
      <SquareButton
        onClick={onSendAnother}
        variant="white"
        style={{ minWidth: 200 }}
      >
        Send Another Message
      </SquareButton>
    </div>
  );
}
