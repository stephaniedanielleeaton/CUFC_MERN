import type { FormEvent, ReactElement } from 'react'
import { useNotificationSignup } from '../../../hooks/useNotificationSignup'
import { CheckIcon } from './Icons'
import { SquareButton } from '../SquareButton'

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
    <div className="w-full px-4 md:px-0">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column - Text */}
        <div>
          <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
            Stay Updated
          </span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-navy mt-2 mb-3">
            Get Notified
          </h3>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Want to know when new class dates are available? Sign up to receive 
            notifications about upcoming classes and events.
          </p>
          <p className="mt-3 text-xs text-gray-500">
            We respect your privacy. Your email will never be shared.
          </p>
        </div>

        {/* Right Column - Form */}
        <div className="flex flex-col justify-center">
          {isSuccess ? (
            <div
              className="p-4 bg-green-50 border border-green-200 text-green-800 text-base flex items-center gap-3"
              aria-live="polite"
            >
              <CheckIcon />
              <span>Thank you! We&apos;ll keep you updated.</span>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <input
                type="email"
                id="notification-email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-4 py-3 border focus:outline-none focus:border-navy transition-colors ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Email Address*"
                required
                aria-invalid={!!error}
                aria-describedby={error ? 'notification-email-error' : undefined}
                autoComplete="email"
              />
              {error && (
                <p
                  id="notification-email-error"
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
                  {isLoading ? 'SUBMITTING...' : 'NOTIFY ME'}
                </SquareButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
