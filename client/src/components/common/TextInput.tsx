import React, { InputHTMLAttributes } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  placeholder?: string
  error?: string
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  name,
  placeholder,
  error,
  ...props
}) => {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-semibold text-gray-800 tracking-wide">
        {label}
      </label>
      <input
        id={name}
        name={name}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border focus:outline-none rounded-sm transition-all
          ${error
            ? "border-red-500 focus:ring-2 focus:ring-red-500"
            : "border-gray-300 focus:ring-2 focus:ring-blue-600"}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
