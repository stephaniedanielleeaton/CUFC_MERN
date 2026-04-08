import type { Event } from '../../types/ScheduleTypes'
import { AdminActions } from './AdminActions'

interface EventCardProps {
  event: Event
  isAdmin: boolean
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
}

export function EventCard({ event, isAdmin, onEdit, onDelete }: EventCardProps) {
  return (
    <div className="bg-navy-dark/20 backdrop-blur-sm rounded-lg p-4 hover:bg-navy-dark/30 transition-colors">
      <div className="flex justify-between">
        <div>
          <h4 className="font-bold text-white">{event.title}</h4>
          <div className="text-light-pink text-sm mt-1">{event.date}</div>
          {event.description && (
            <p className="text-gray-300 text-sm mt-2">{event.description}</p>
          )}
        </div>
        {isAdmin && (
          <AdminActions 
            onEdit={() => onEdit(event)} 
            onDelete={() => onDelete(event)} 
          />
        )}
      </div>
    </div>
  )
}
