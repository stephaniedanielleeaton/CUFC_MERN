interface ClassVariationItemProps {
  variation: {
    id: string
    name: string
    quantity?: string
  }
  isSelected: boolean
  onSelect: () => void
}

export const ClassVariationItem: React.FC<ClassVariationItemProps> = ({ variation, isSelected, onSelect }) => {
  const hasSpots = parseInt(variation.quantity || '0') > 0
  return (
    <li className="list-none">
      <button
        type="button"
        className={`w-full border rounded-md p-3 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-medium-pink transition-all
          ${hasSpots ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}
          ${isSelected ? 'border-medium-pink bg-pink-50' : 'border-gray-200'}`}
        aria-pressed={isSelected}
        aria-disabled={!hasSpots}
        tabIndex={hasSpots ? 0 : -1}
        disabled={!hasSpots}
        onClick={() => hasSpots && onSelect()}
      >
        <div>
          <p className="font-medium text-sm">{variation.name}</p>
          <p className="text-xs text-gray-500">
            {hasSpots ? `${variation.quantity} spots available` : 'Class full'}
          </p>
        </div>
        <div className="flex items-center">
          <div className={`w-2.5 h-2.5 rounded-full mr-2 ${hasSpots ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {isSelected && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-medium-pink" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </button>
    </li>
  )
}
