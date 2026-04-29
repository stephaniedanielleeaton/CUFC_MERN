import React from 'react'

interface AlphabetFilterProps {
  availableLetters: string[]
  selectedLetter: string
  onLetterClick: (letter: string) => void
  onClearFilter?: () => void
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const AlphabetFilter: React.FC<AlphabetFilterProps> = ({
  availableLetters,
  selectedLetter,
  onLetterClick,
  onClearFilter
}) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {ALPHABET.map(letter => {
        const isAvailable = availableLetters.includes(letter)
        const isSelected = selectedLetter === letter
        return (
          <button
            key={letter}
            onClick={() => onLetterClick(letter)}
            disabled={!isAvailable}
            className={`
              w-16 h-14 rounded-lg text-2xl font-medium 
              transition-all duration-200 ease-in-out
              ${isSelected
                ? 'bg-deep-sea-blue text-white font-bold shadow-md'
                : isAvailable
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }
            `}
          >
            {letter}
          </button>
        )
      })}
      {(selectedLetter || onClearFilter) && (
        <button
          onClick={onClearFilter}
          className="w-16 h-14 rounded-lg text-xl font-medium bg-orange-500 text-white hover:bg-orange-600 shadow-md"
        >
          Clear
        </button>
      )}
    </div>
  )
}
