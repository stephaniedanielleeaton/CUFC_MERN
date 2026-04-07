import type { Closure } from '../../types/ScheduleTypes'
import { ClosureCard } from './ClosureCard'
import { AddButton } from './AddButton'

interface ClosuresListProps {
  closures: Closure[]
  isAdmin: boolean
  onAdd: () => void
  onEdit: (closure: Closure) => void
  onDelete: (closure: Closure) => void
}

export function ClosuresList({ closures, isAdmin, onAdd, onEdit, onDelete }: ClosuresListProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-navy-light/30 rounded-xl -z-10"></div>
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Upcoming Closures</h3>
          {isAdmin && <AddButton onClick={onAdd} />}
        </div>
        <div className="space-y-3">
          {closures.length === 0 ? (
            <p className="text-gray-300 text-center py-4 bg-navy-dark/20 rounded-lg">No upcoming closures.</p>
          ) : (
            closures.map((closure) => (
              <ClosureCard
                key={closure._id || closure.date}
                closure={closure}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
        {isAdmin && (
          <button
            onClick={onAdd}
            className="w-full mt-4 bg-navy-dark/20 rounded-lg p-4 border-2 border-dashed border-light-pink/30 hover:border-light-pink/50 transition-colors flex items-center justify-center"
          >
            <div className="text-light-pink flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Closure</span>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
