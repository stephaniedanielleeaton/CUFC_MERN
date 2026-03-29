import type { FormEvent, ReactElement } from 'react'
import { useNotificationSignup } from '../../../hooks/useNotificationSignup'
import { BellIcon, CheckIcon } from './Icons'

export function NotificationSignup(): ReactElement {
  const {
    email,
    status,
    error,
    isValidEmail,
    handleEmailChange,
    handleSubmit,
  } = useNotificationSignup()

  const isLoading: boolean = status === 'loading'
  const isSuccess: boolean = status === 'success'
  const isDisabled: boolean = isLoading || !isValidEmail

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    handleSubmit()
  }

  return (
    <div className="w-full rounded-xl bg-gray-100/50 text-navy py-10 md:py-12 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-bold mb-2">
          Want to know when new class dates are available?
        </h3>
        <p className="text-sm text-navy/80 mb-4">
          Sign up to receive notifications about upcoming class dates and events.
        </p>

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <div>
            <label
              htmlFor="notification-email"
              className="block text-sm font-medium mb-1 text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="notification-email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all duration-200 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'notification-email-error' : undefined}
              autoComplete="email"
            />
            {error && (
              <p
                id="notification-email-error"
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
              <span>Submitting...</span>
            ) : (
              <>
                <span>Notify Me</span>
                <BellIcon />
              </>
            )}
          </button>

          {isSuccess && (
            <div
              className="mt-4 p-3 rounded-lg bg-green-100 text-green-900 text-sm flex items-center gap-2"
              aria-live="polite"
            >
              <CheckIcon />
              <span>Thank you! We&apos;ll keep you updated.</span>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            We respect your privacy. Your email will never be shared.
          </p>
        </form>
      </div>
    </div>
  )
}
