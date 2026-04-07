import { useState } from 'react'
import { useScheduleData } from '../hooks/useScheduleData'
import { useUserRoles } from '../hooks/useUserRoles'
import { SmallHero } from '../components/common/SmallHero'
import { ScheduleGrid, EventsList, ClosuresList, ScheduleModal } from '../components/schedule'
import type { ScheduleItem, Event, Closure } from '../types/ScheduleTypes'

type ModalType = 'schedule' | 'event' | 'closure'

export default function SchedulePage() {
  const { scheduleItems, upcomingEvents, upcomingClosures, isLoading, error, refresh } = useScheduleData()
  const roles = useUserRoles()
  const isAdmin = roles.includes('club-admin')

  // Modal state
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

  return (
    <div className="min-h-screen bg-white">
      <SmallHero pageTitle="Schedule" />
      <section className="bg-navy py-16 md:py-24 w-full" id="schedule">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          {error && (
            <div className="p-4 bg-red-900/20 text-red-200 border border-red-400/30 backdrop-blur-sm rounded-lg mb-6">
              <p className="font-semibold">Error:</p>
              <p>{error.message}</p>
            </div>
          )}
          
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Class Schedule</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Join our regular classes throughout the week. Check our events and closures section for special classes and holidays.
            </p>
          </div>
          
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
