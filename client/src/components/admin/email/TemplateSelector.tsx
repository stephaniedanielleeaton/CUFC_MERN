interface TemplateSelectorProps {
  value: string
  onChange: (template: string) => void
  isLoading: boolean
}

const TEMPLATES = [
  { value: 'Standard CUFC', label: 'Standard CUFC' },
  { value: 'LynxCup', label: 'LynxCup' },
]

export function TemplateSelector({ value, onChange, isLoading }: TemplateSelectorProps) {
  return (
    <div>
      <label
        htmlFor="template"
        className="block text-sm font-medium text-navy mb-2"
      >
        Email Template
        <span className="text-red-500 ml-1">*</span>
      </label>
      <select
        id="template"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
        required
        disabled={isLoading}
      >
        {TEMPLATES.map((template) => (
          <option key={template.value} value={template.value}>
            {template.label}
          </option>
        ))}
      </select>
    </div>
  )
}
