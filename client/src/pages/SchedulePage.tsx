import { useState } from 'react'
import { useScheduleData } from '../hooks/useScheduleData'
import { useUserRoles } from '../hooks/useUserRoles'
import type { ScheduleItem, Event, Closure } from '../types/ScheduleTypes'

// Admin Actions Component
function AdminActions({ 
  onEdit, 
  onDelete 
}: { 
  onEdit: () => void
  onDelete: () => void 
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onEdit}
        className="text-gray-400 hover:text-light-pink transition-colors"
        aria-label="Edit"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Delete"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

// Schedule Item Component
function ScheduleItem({ 
  item, 
  isAdmin, 
  onEdit, 
  onDelete 
}: { 
  item: ScheduleItem
  isAdmin: boolean
  onEdit: (item: ScheduleItem) => void
  onDelete: (item: ScheduleItem) => void 
}) {
  return (
    <div className="bg-navy-dark/20 backdrop-blur-sm rounded-lg p-4 hover:bg-navy-dark/30 transition-colors">
      <div className="flex justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white">{item.discipline}</h4>
            {item.subtitle && (
              <span className="text-xs text-gray-300 italic">({item.subtitle})</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm">
            <span className="text-light-pink">{item.day}</span>
            <span className="text-gray-300">{item.time}</span>
          </div>
        </div>
        {isAdmin && (
          <AdminActions 
            onEdit={() => onEdit(item)} 
            onDelete={() => onDelete(item)} 
          />
        )}
      </div>
    </div>
  )
}

// Event Item Component
function EventItem({ 
  event, 
  isAdmin, 
  onEdit, 
  onDelete 
}: { 
  event: Event
  isAdmin: boolean
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void 
}) {
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

// Closure Item Component - NOTE: uses 'dates' like cufc-web
function ClosureItem({ 
  closure, 
  isAdmin, 
  onEdit, 
  onDelete 
}: { 
  closure: Closure
  isAdmin: boolean
  onEdit: (closure: Closure) => void
  onDelete: (closure: Closure) => void 
}) {
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

// Schedule Header
function ScheduleHeader() {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Class Schedule</h1>
      <p className="text-lg text-gray-300 max-w-2xl mx-auto">
        Join our regular classes throughout the week. Check our events and closures section for special classes and holidays.
      </p>
    </div>
  )
}

// Schedule Grid
function ScheduleGrid({ 
  items, 
  isAdmin, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  items: ScheduleItem[]
  isAdmin: boolean
  onAdd: () => void
  onEdit: (item: ScheduleItem) => void
  onDelete: (item: ScheduleItem) => void 
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-navy-light/30 rounded-xl -z-10"></div>
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-white">Weekly Schedule</h3>
          {isAdmin && (
            <button 
              onClick={onAdd}
              className="text-light-pink hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
        </div>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No classes scheduled at this time.</p>
          ) : (
            items.map((item) => (
              <ScheduleItem 
                key={item._id || `${item.day}-${item.time}`} 
                item={item} 
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
              <span>Add Schedule Item</span>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

// Events List
function EventsList({ 
  events, 
  isAdmin, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  events: Event[]
  isAdmin: boolean
  onAdd: () => void
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void 
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-navy-light/30 rounded-xl -z-10"></div>
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-2xl font-bold text-white">Upcoming Events</h3>
          {isAdmin && (
            <button 
              onClick={onAdd}
              className="text-light-pink hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
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
              <EventItem 
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

// Closures List
function ClosuresList({ 
  closures, 
  isAdmin, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  closures: Closure[]
  isAdmin: boolean
  onAdd: () => void
  onEdit: (closure: Closure) => void
  onDelete: (closure: Closure) => void 
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-navy-light/30 rounded-xl -z-10"></div>
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Upcoming Closures</h3>
          {isAdmin && (
            <button 
              onClick={onAdd}
              className="text-light-pink hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
        </div>
        <div className="space-y-3">
          {closures.length === 0 ? (
            <p className="text-gray-300 text-center py-4 bg-navy-dark/20 rounded-lg">No upcoming closures.</p>
          ) : (
            closures.map((closure) => (
              <ClosureItem 
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

export default function SchedulePage() {
  const { scheduleItems, upcomingEvents, upcomingClosures, isLoading, error, refresh } = useScheduleData()
  const roles = useUserRoles()
  const isAdmin = roles.includes('club-admin')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'schedule' | 'event' | 'closure'>('schedule')
  const [editingItem, setEditingItem] = useState<ScheduleItem | Event | Closure | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const openAddModal = (type: 'schedule' | 'event' | 'closure') => {
    setModalType(type)
    setEditingItem(null)
    setFormData({})
    setShowModal(true)
  }

  const openEditModal = (type: 'schedule' | 'event' | 'closure', item: ScheduleItem | Event | Closure) => {
    setModalType(type)
    setEditingItem(item)
    setFormData(item as Record<string, string>)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingItem
        ? `/api/schedule/${modalType === 'schedule' ? 'schedule-items' : modalType === 'event' ? 'events' : 'closures'}/${(editingItem as ScheduleItem | Event | Closure)._id}`
        : `/api/schedule/${modalType === 'schedule' ? 'schedule-items' : modalType === 'event' ? 'events' : 'closures'}`
      
      const method = editingItem ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      closeModal()
      refresh()
    } catch (err) {
      alert('Failed to save. Please try again.')
      console.error(err)
    }
  }

  const handleDelete = async (type: 'schedule' | 'event' | 'closure', item: ScheduleItem | Event | Closure) => {
    if (!confirm(`Are you sure you want to delete this ${type} item?`)) return
    try {
      const url = `/api/schedule/${type === 'schedule' ? 'schedule-items' : type === 'event' ? 'events' : 'closures'}/${item._id}`
      
      const response = await fetch(url, { method: 'DELETE' })
      
      if (!response.ok) throw new Error('Failed to delete')
      
      refresh()
    } catch (err) {
      alert('Failed to delete. Please try again.')
      console.error(err)
    }
  }

  // Input component for forms
  const FormInput = ({ label, name, type = 'text' }: { label: string; name: string; type?: string }) => (
    <div className="mb-4">
      <label className="block text-gray-300 mb-2">{label}</label>
      <input
        type={type}
        value={formData[name] || ''}
        onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
        className="w-full px-4 py-2 bg-navy-dark/40 border border-navy-light rounded text-white focus:outline-none focus:border-light-pink"
      />
    </div>
  )

  return (
    <section className="bg-navy py-16 md:py-24 w-full" id="schedule">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        {error && (
          <div className="p-4 bg-red-900/20 text-red-200 border border-red-400/30 backdrop-blur-sm rounded-lg mb-6">
            <p className="font-semibold">Error:</p>
            <p>{error.message}</p>
          </div>
        )}
        
        <ScheduleHeader />
        
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-light-pink"></div>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ScheduleGrid
                items={scheduleItems}
                isAdmin={isAdmin}
                onAdd={() => openAddModal('schedule')}
                onEdit={(item) => openEditModal('schedule', item)}
                onDelete={(item) => handleDelete('schedule', item)}
              />
            </div>
            <div className="lg:col-span-1 space-y-8">
              <EventsList
                events={upcomingEvents}
                isAdmin={isAdmin}
                onAdd={() => openAddModal('event')}
                onEdit={(item) => openEditModal('event', item)}
                onDelete={(item) => handleDelete('event', item)}
              />
              <ClosuresList
                closures={upcomingClosures}
                isAdmin={isAdmin}
                onAdd={() => openAddModal('closure')}
                onEdit={(item) => openEditModal('closure', item)}
                onDelete={(item) => handleDelete('closure', item)}
              />
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
              <div className="bg-navy p-4 text-white">
                <h3 className="text-xl font-bold">
                  {editingItem ? 'Edit' : 'Add New'} {modalType === 'schedule' ? 'Class' : modalType === 'event' ? 'Event' : 'Closure'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                {modalType === 'schedule' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                      <input
                        type="text"
                        value={formData.discipline || ''}
                        onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                      <select
                        value={formData.day || 'Monday'}
                        onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
                        required
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="text"
                        value={formData.time || ''}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        placeholder="e.g., 7:00 PM - 9:00 PM"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (Optional)</label>
                      <input
                        type="text"
                        value={formData.subtitle || ''}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
                      />
                    </div>
                  </>
                )}
                {modalType === 'event' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="text"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        placeholder="e.g., May 15, 2023"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
                        required
                      />
                    </div>
                  </>
                )}
                {modalType === 'closure' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dates</label>
                      <input
                        type="text"
                        value={formData.dates || ''}
                        onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
                        placeholder="e.g., December 24-25, 2023"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                      <input
                        type="text"
                        value={formData.reason || ''}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
                        required
                      />
                    </div>
                  </>
                )}
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-light-pink text-white rounded-md hover:bg-light-pink/90 transition-colors"
                  >
                    {editingItem ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
