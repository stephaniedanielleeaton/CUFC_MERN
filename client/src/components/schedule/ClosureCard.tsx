import type { Closure } from '../../types/ScheduleTypes'
import { AdminActions } from './AdminActions'

interface ClosureCardProps {
  closure: Closure
  isAdmin: boolean
  onEdit: (closure: Closure) => void
  onDelete: (closure: Closure) => void
}

export function ClosureCard({ closure, isAdmin, onEdit, onDelete }: ClosureCardProps) {
  return (
    <div className="bg-navy-dark/20 backdrop-blur-sm rounded-lg p-4 hover:bg-navy-dark/30 transition-colors">
      <div className="flex justify-between">
        <div>
          <h4 className="font-bold text-white">{closure.reason}</h4>
          <div className="text-light-pink text-sm mt-1">{closure.dates || closure.date}</div>
        </div>
        {isAdmin && (
          <AdminActions 
            onEdit={() => onEdit(closure)} 
            onDelete={() => onDelete(closure)} 
          />
        )}
      </div>
    </div>
  )
}
