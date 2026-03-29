import type { FormEvent, ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { useUnsubscribe } from '../../../hooks/useUnsubscribe'

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
      <div className="w-full rounded-xl bg-gray-100/50 text-navy py-10 md:py-12 px-6 md:px-12">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
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
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Successfully Unsubscribed
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    You have been removed from our mailing list. You will no longer
                    receive promotional emails from us.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Unsubscribe another email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-xl bg-gray-100/50 text-navy py-10 md:py-12 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-bold mb-2">Unsubscribe from Notifications</h3>
        <p className="text-sm text-navy/80 mb-4">
          Enter your email address below to unsubscribe from our mailing list.
        </p>

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <div>
            <label
              htmlFor="unsubscribe-email"
              className="block text-sm font-medium mb-1 text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="unsubscribe-email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all duration-200 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'unsubscribe-email-error' : undefined}
              autoComplete="email"
            />
            {error && (
              <p
                id="unsubscribe-email-error"
                className="mt-1 text-sm text-red-600"
                aria-live="polite"
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className={`w-full px-6 py-3 font-bold rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2
              bg-navy text-white hover:bg-navy/90
              ${isDisabled ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105'}`}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <span>Unsubscribe</span>
            )}
          </button>

          <p className="mt-2 text-xs text-gray-500">
            Changed your mind?{' '}
            <Link to="/notifications" className="text-navy underline hover:text-navy/80">
              Sign up for notifications
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
