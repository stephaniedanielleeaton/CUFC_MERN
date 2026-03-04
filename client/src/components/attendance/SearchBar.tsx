import React from 'react'

interface SearchBarProps {
  searchTerm: string
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  onSearch, 
  placeholder = 'Enter Name...' 
}) => {
  return (
    <span className="flex items-center flex-grow mr-4">
      <div className="relative w-full">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg 
            className="w-4 h-4 text-hover-outer-space" 
            aria-hidden="true" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 20 20"
          >
            <path 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="text"
          id="simple-search"
          className="border border-deep-sea-blue text-hover-outer-space text-sm rounded-lg block w-full ps-10 p-2.5 focus:outline-none"
          placeholder={placeholder}
          value={searchTerm}
          onChange={onSearch}
        />
      </div>
    </span>
  )
}
