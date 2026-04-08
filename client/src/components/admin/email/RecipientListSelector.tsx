interface RecipientListSelectorProps {
  recipientLists: Array<{
    id: string
    name: string
    emails: string[]
  }>
  selectedLists: string[]
  onListChange: (listId: string) => void
  isLoading: boolean
}

export function RecipientListSelector({
  recipientLists,
  selectedLists,
  onListChange,
  isLoading,
}: RecipientListSelectorProps) {
  const totalSelectedRecipients = selectedLists.reduce((total, listId) => {
    const list = recipientLists.find((l) => l.id === listId)
    return total + (list ? list.emails.length : 0)
  }, 0)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Choose recipient lists (optional)
      </label>
      <div className="space-y-2 border border-gray-300 rounded-lg p-4 bg-white">
        {recipientLists.map((list) => (
          <div key={list.id} className="flex items-center">
            <input
              type="checkbox"
              id={`list-${list.id}`}
              checked={selectedLists.includes(list.id)}
              onChange={() => onListChange(list.id)}
              className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isLoading}
            />
            <label
              htmlFor={`list-${list.id}`}
              className="ml-2 text-sm text-gray-700 cursor-pointer flex-1"
            >
              {list.name} ({list.emails.length} recipients)
            </label>
          </div>
        ))}
      </div>
      {selectedLists.length > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          Total recipients from selected lists: {totalSelectedRecipients}
        </p>
      )}
    </div>
  )
}
