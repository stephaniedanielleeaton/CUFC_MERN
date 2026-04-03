interface AdditionalEmailsInputProps {
  value: string
  onChange: (value: string) => void
  isRequired: boolean
  isLoading: boolean
}

export function AdditionalEmailsInput({
  value,
  onChange,
  isRequired,
  isLoading,
}: AdditionalEmailsInputProps) {
  return (
    <div>
      <label
        htmlFor="additionalEmails"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Additional email addresses
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id="additionalEmails"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter email addresses separated by commas"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-Navy focus:border-Navy h-24 disabled:bg-gray-100 disabled:cursor-not-allowed"
        required={isRequired}
        disabled={isLoading}
      />
      <p className="mt-1 text-sm text-gray-500">
        Separate multiple email addresses with commas
      </p>
    </div>
  )
}
