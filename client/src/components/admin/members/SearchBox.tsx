interface SearchBoxProps {
  readonly searchQuery: string
  readonly onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function SearchBox({ searchQuery, onSearchChange }: SearchBoxProps) {
  return (
    <div className="relative w-full md:w-auto flex-grow">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-500"
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
        className="border border-gray-300 text-gray-700 text-sm rounded-lg block w-full pl-10 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Search by Name"
        value={searchQuery}
        onChange={onSearchChange}
      />
    </div>
  )
}
