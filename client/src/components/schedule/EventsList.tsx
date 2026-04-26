import type { Event } from '../../types/ScheduleTypes'
import { EventCard } from './EventCard'
import { AddButton } from './AddButton'

interface EventsListProps {
  events: Event[]
  isAdmin: boolean
  onAdd: () => void
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
}

export function EventsList({ events, isAdmin, onAdd, onEdit, onDelete }: Readonly<EventsListProps>) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-navy-light/30 rounded-xl -z-10"></div>
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-2xl font-bold text-white">Upcoming Events</h3>
          {isAdmin && <AddButton onClick={onAdd} />}
        </div>
        <div className="flex justify-end mb-4">
          <a
            href="/events"
            className="text-light-pink hover:text-white flex items-center text-sm transition-colors"
          >
            <span>See our upcoming events here</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-gray-300 text-center py-4 bg-navy-dark/20 rounded-lg">No upcoming events.</p>
          ) : (
            events.map((event) => (
              <EventCard
                key={event._id || event.title}
                event={event}
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
              <span>Add Event</span>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
