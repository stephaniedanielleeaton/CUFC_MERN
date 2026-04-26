import { useState } from 'react'
import { useScheduleData } from '../hooks/useScheduleData.ts'
import { useUserRoles } from '../hooks/useUserRoles'
import { SmallHero } from '../components/common/SmallHero'
import { ScheduleModal } from '../components/schedule'
import type { ScheduleItem, Event, Closure } from '../types/ScheduleTypes'

type ModalType = 'schedule' | 'event' | 'closure'

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function groupByDay(items: ScheduleItem[]): Record<string, ScheduleItem[]> {
  const grouped: Record<string, ScheduleItem[]> = {}
  for (const item of items) {
    if (!grouped[item.day]) grouped[item.day] = []
    grouped[item.day].push(item)
  }
  return grouped
}

function formatEventDate(dateStr: string): string {
  return dateStr
}

export default function SchedulePage() {
  const { scheduleItems, upcomingEvents, upcomingClosures, isLoading, error, refresh } = useScheduleData()
  const roles = useUserRoles()
  const isAdmin = roles.includes('club-admin')

  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<ModalType>('schedule')
  const [editingItem, setEditingItem] = useState<ScheduleItem | Event | Closure | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const openAddModal = (type: ModalType) => {
    setModalType(type)
    setEditingItem(null)
    setFormData(type === 'schedule' ? { day: 'Monday' } : {})
    setShowModal(true)
  }

  const openEditModal = (type: ModalType, item: ScheduleItem | Event | Closure) => {
    setModalType(type)
    setEditingItem(item)
    setFormData(item as unknown as Record<string, string>)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({})
  }

  const getEndpoint = (type: ModalType) => {
    switch (type) {
      case 'schedule': return 'schedule-items'
      case 'event': return 'events'
      case 'closure': return 'closures'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const endpoint = getEndpoint(modalType)
      const url = editingItem
        ? `/api/schedule/${endpoint}/${editingItem._id}`
        : `/api/schedule/${endpoint}`
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
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

  const handleDelete = async (type: ModalType, item: ScheduleItem | Event | Closure) => {
    if (!confirm(`Are you sure you want to delete this ${type} item?`)) return
    try {
      const endpoint = getEndpoint(type)
      const response = await fetch(`/api/schedule/${endpoint}/${item._id}`, { method: 'DELETE' })
      
      if (!response.ok) throw new Error('Failed to delete')
      
      refresh()
    } catch (err) {
      alert('Failed to delete. Please try again.')
      console.error(err)
    }
  }

  const groupedSchedule = groupByDay(scheduleItems)

  return (
    <div className="bg-white">
      <SmallHero pageTitle="Schedule" />
      
      {/* Hero Section */}
      <section className="bg-navy py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">
            Class Schedule
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto">
            Join our regular classes throughout the week. Check our events and closures section for special classes and holidays.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 px-6 md:px-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg mb-6">
              <p className="font-semibold">Error:</p>
              <p>{error.message}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy"></div>
            </div>
          ) : (
            <>
              {/* Weekly Schedule */}
              <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                      Weekly Classes
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-navy mt-1">
                      Regular Schedule
                    </h3>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => openAddModal('schedule')}
                      className="text-sm text-navy hover:text-medium-pink transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Class
                    </button>
                  )}
                </div>

                {scheduleItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 border border-gray-200 rounded-lg">
                    No classes scheduled at this time.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {DAYS_ORDER.filter(day => groupedSchedule[day]).map(day => (
                      <div key={day}>
                        <h4 className="text-sm font-semibold text-medium-pink uppercase tracking-wide mb-3">
                          {day}
                        </h4>
                        <div className="space-y-2">
                          {groupedSchedule[day].map(item => (
                            <div
                              key={item._id || `${item.day}-${item.time}`}
                              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-navy">{item.discipline}</span>
                                  {item.subtitle && (
                                    <span className="text-xs text-gray-500 italic">({item.subtitle})</span>
                                  )}
                                </div>
                                <span className="text-sm text-gray-600">{item.time}</span>
                              </div>
                              {isAdmin && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditModal('schedule', item)}
                                    className="text-gray-400 hover:text-navy transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete('schedule', item)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Events & Closures Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upcoming Events */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                        Special Classes
                      </span>
                      <h3 className="text-xl font-extrabold text-navy mt-1">
                        Upcoming Events
                      </h3>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => openAddModal('event')}
                        className="text-sm text-navy hover:text-medium-pink transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {upcomingEvents.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 border border-gray-200 rounded-lg text-sm">
                      No upcoming events.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.map(event => (
                        <div
                          key={event._id || event.title}
                          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-bold text-navy">{event.title}</h4>
                              <p className="text-sm text-medium-pink">{formatEventDate(event.date)}</p>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                            </div>
                            {isAdmin && (
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => openEditModal('event', event)}
                                  className="text-gray-400 hover:text-navy transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete('event', event)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Closures */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                        Holidays & Breaks
                      </span>
                      <h3 className="text-xl font-extrabold text-navy mt-1">
                        Upcoming Closures
                      </h3>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => openAddModal('closure')}
                        className="text-sm text-navy hover:text-medium-pink transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {upcomingClosures.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 border border-gray-200 rounded-lg text-sm">
                      No upcoming closures.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingClosures.map(closure => (
                        <div
                          key={closure._id || closure.reason}
                          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-bold text-navy">{closure.reason}</h4>
                              <p className="text-sm text-medium-pink">{formatEventDate(closure.dates || '')}</p>
                            </div>
                            {isAdmin && (
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => openEditModal('closure', closure)}
                                  className="text-gray-400 hover:text-navy transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete('closure', closure)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <ScheduleModal
            isOpen={showModal}
            modalType={modalType}
            editingItem={editingItem}
            formData={formData}
            onFormChange={setFormData}
            onSubmit={handleSubmit}
            onClose={closeModal}
          />
        </div>
      </section>
    </div>
  )
}
