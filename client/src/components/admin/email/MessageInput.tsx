import { useEffect, useRef } from 'react'

interface MessageInputProps {
  value: string
  onChange: (message: string) => void
  isLoading: boolean
}

export function MessageInput({ value, onChange, isLoading }: MessageInputProps) {
  const messageRef = useRef<HTMLTextAreaElement>(null)

  const adjustTextareaHeight = () => {
    const textarea = messageRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(textarea.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [value])

  return (
    <div>
      <label
        htmlFor="message"
        className="block text-sm font-medium text-navy mb-2"
      >
        Message
        <span className="text-red-500 ml-1">*</span>
      </label>
      <textarea
        id="message"
        ref={messageRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy min-h-[200px] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        required
        disabled={isLoading}
      />
    </div>
  )
}
