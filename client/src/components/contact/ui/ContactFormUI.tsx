import type { ContactFormData } from '../../../types/contact'
import { SquareButton } from '../../common/SquareButton'


interface ContactFormUIProps {
  readonly formData: ContactFormData
  readonly onChange: (field: keyof ContactFormData, value: string) => void
  readonly onSubmit: () => void
  readonly isSubmitting: boolean
  readonly error: string | null
}

const INPUT_CLASSES = 
  'w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-navy transition-colors'

const TEXTAREA_CLASSES = 
  `${INPUT_CLASSES} resize-none`

export function ContactFormUI({
  formData,
  onChange,
  onSubmit,
  isSubmitting,
  error,
}: ContactFormUIProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4 text-base"
      aria-label="Contact form"
    >
      {error && (
        <div role="alert" className="text-center text-red-500">
          {error}
        </div>
      )}

      <input
        type="text"
        name="fullName"
        placeholder="Full Name*"
        value={formData.fullName}
        onChange={(e) => onChange('fullName', e.target.value)}
        className={INPUT_CLASSES}
        required
        aria-required="true"
      />

      <input
        type="email"
        name="emailAddress"
        placeholder="Email Address*"
        value={formData.emailAddress}
        onChange={(e) => onChange('emailAddress', e.target.value)}
        className={INPUT_CLASSES}
        required
        aria-required="true"
      />

      <textarea
        name="message"
        placeholder="Message*"
        value={formData.message}
        onChange={(e) => onChange('message', e.target.value)}
        rows={5}
        className={TEXTAREA_CLASSES}
        required
        aria-required="true"
      />

      <div className="pt-2 flex justify-center md:justify-start">
        <SquareButton
          type="submit"
          variant="white"
          disabled={isSubmitting}
          className="w-full md:w-auto"
          style={{ minWidth: 180 }}
        >
          {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
        </SquareButton>
      </div>
    </form>
  )
}
