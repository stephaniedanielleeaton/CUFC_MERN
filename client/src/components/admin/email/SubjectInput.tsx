interface SubjectInputProps {
  value: string
  onChange: (subject: string) => void
  isLoading: boolean
}

export function SubjectInput({ value, onChange, isLoading }: SubjectInputProps) {
  return (
    <div>
      <label
        htmlFor="subject"
        className="block text-sm font-medium text-navy mb-2"
      >
        Subject
        <span className="text-red-500 ml-1">*</span>
      </label>
      <input
        type="text"
        id="subject"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
        required
        disabled={isLoading}
      />
    </div>
  )
}
