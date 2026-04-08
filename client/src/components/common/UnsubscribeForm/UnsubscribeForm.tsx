import type { FormEvent, ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { useUnsubscribe } from '../../../hooks/useUnsubscribe'
import { SquareButton } from '../SquareButton'

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 text-green-500"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function UnsubscribeForm(): ReactElement {
  const {
    email,
    status,
    error,
    isValidEmail,
    handleEmailChange,
    handleSubmit,
    reset,
  } = useUnsubscribe()

  const isLoading: boolean = status === 'loading'
  const isSuccess: boolean = status === 'success'
  const isDisabled: boolean = isLoading || !isValidEmail

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    handleSubmit()
  }

  if (isSuccess) {
    return (
      <div className="w-full px-4 md:px-0">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Email Preferences
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-navy mt-2 mb-3">
              Unsubscribed
            </h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              You have been removed from our mailing list. You will no longer
              receive promotional emails from us.
            </p>
          </div>
          <div className="flex flex-col justify-center">
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-base flex items-center gap-3 mb-4">
              <CheckIcon />
              <span>Successfully unsubscribed!</span>
            </div>
            <div className="flex justify-center md:justify-start">
              <SquareButton
                onClick={reset}
                variant="white"
                className="w-full md:w-auto"
                style={{ minWidth: 180 }}
              >
                UNSUBSCRIBE ANOTHER
              </SquareButton>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 md:px-0">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column - Text */}
        <div>
          <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
            Email Preferences
          </span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-navy mt-2 mb-3">
            Unsubscribe
          </h3>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Enter your email address below to unsubscribe from our mailing list.
          </p>
          <p className="mt-3 text-xs text-gray-500">
            Changed your mind?{' '}
            <Link to="/notifications" className="text-navy underline hover:text-navy/80">
              Sign up for notifications
            </Link>
          </p>
        </div>

        {/* Right Column - Form */}
        <div className="flex flex-col justify-center">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <input
              type="email"
              id="unsubscribe-email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full px-4 py-3 border focus:outline-none focus:border-navy transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Email Address*"
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'unsubscribe-email-error' : undefined}
              autoComplete="email"
            />
            {error && (
              <p
                id="unsubscribe-email-error"
                className="text-sm text-red-600"
                aria-live="polite"
              >
                {error}
              </p>
            )}

            <div className="flex justify-center md:justify-start">
              <SquareButton
                type="submit"
                variant="white"
                disabled={isDisabled}
                className="w-full md:w-auto"
                style={{ minWidth: 180 }}
              >
                {isLoading ? 'PROCESSING...' : 'UNSUBSCRIBE'}
              </SquareButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
