import type { ContactFormData } from '../../../types/contact'
import { SquareButton } from '../../common/SquareButton'

interface ContactFormUIProps {
  formData: ContactFormData;
  onChange: (field: keyof ContactFormData, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function ContactFormUI({
  formData,
  onChange,
  onSubmit,
  isSubmitting,
  error,
}: ContactFormUIProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-base">
      {error && (
        <p className="text-center text-red-500">
          {error}
        </p>
      )}

      <div>
        <label className="block text-base font-medium text-gray-700 mb-2">
          Full Name <span className="text-[#904F69]">*</span>
        </label>
        <input
          type="text"
          placeholder="Your name"
          value={formData.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#904F69]/20 focus:border-[#904F69] transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-base font-medium text-gray-700 mb-2">
          Email Address <span className="text-[#904F69]">*</span>
        </label>
        <input
          type="email"
          placeholder="your.email@example.com"
          value={formData.emailAddress}
          onChange={(e) => onChange('emailAddress', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#904F69]/20 focus:border-[#904F69] transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-base font-medium text-gray-700 mb-2">
          Message <span className="text-[#904F69]">*</span>
        </label>
        <textarea
          placeholder="How can we help you?"
          value={formData.message}
          onChange={(e) => onChange('message', e.target.value)}
          rows={4}
          className="w-full px-4 py-4 text-base md:text-lg rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#904F69]/20 focus:border-[#904F69] transition-colors resize-none"
          required
        />
      </div>

      <div>
        <SquareButton
          type="submit"
          variant="medium-pink"
          disabled={isSubmitting}
          style={{ width: '100%', minWidth: '100%' }}
        >
          {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
        </SquareButton>
      </div>
    </form>
  );
}
