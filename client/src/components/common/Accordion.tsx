import { useState } from 'react'

interface AccordionItemProps {
  readonly title: string
  readonly children: React.ReactNode
  readonly isOpen?: boolean
  readonly onToggle?: () => void
}

interface AccordionProps {
  readonly items: Array<{
    title: string
    content: React.ReactNode
  }>
  readonly allowMultiple?: boolean
}

function ChevronIcon({ isOpen }: { readonly isOpen: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export function AccordionItem({ title, children, isOpen = false, onToggle }: AccordionItemProps) {
  return (
    <div className="border-t border-gray-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold uppercase tracking-widest text-gray-800">
          {title}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[2000px] pb-4' : 'max-h-0'
        }`}
      >
        <div className="text-gray-600 text-base leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Accordion({ items, allowMultiple = false }: AccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([])

  const handleToggle = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      )
    } else {
      setOpenIndexes((prev) => (prev.includes(index) ? [] : [index]))
    }
  }

  return (
    <div className="border-b border-gray-200">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          isOpen={openIndexes.includes(index)}
          onToggle={() => handleToggle(index)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  )
}
