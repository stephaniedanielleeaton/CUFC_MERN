import type { ScheduleItem, Event, Closure } from '../../types/ScheduleTypes'

type ModalType = 'schedule' | 'event' | 'closure'

interface ScheduleModalProps {
  isOpen: boolean
  modalType: ModalType
  editingItem: ScheduleItem | Event | Closure | null
  formData: Record<string, string>
  onFormChange: (data: Record<string, string>) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function ScheduleModal({
  isOpen,
  modalType,
  editingItem,
  formData,
  onFormChange,
  onSubmit,
  onClose
}: ScheduleModalProps) {
  if (!isOpen) return null

  const updateField = (field: string, value: string) => {
    onFormChange({ ...formData, [field]: value })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="bg-navy p-4 text-white">
          <h3 className="text-xl font-bold">
            {editingItem ? 'Edit' : 'Add New'} {modalType === 'schedule' ? 'Class' : modalType === 'event' ? 'Event' : 'Closure'}
          </h3>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          {modalType === 'schedule' && (
            <ScheduleFields formData={formData} updateField={updateField} />
          )}
          {modalType === 'event' && (
            <EventFields formData={formData} updateField={updateField} />
          )}
          {modalType === 'closure' && (
            <ClosureFields formData={formData} updateField={updateField} />
          )}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
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
  )
}

interface FieldsProps {
  formData: Record<string, string>
  updateField: (field: string, value: string) => void
}

function ScheduleFields({ formData, updateField }: FieldsProps) {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
        <input
          type="text"
          value={formData.discipline || ''}
          onChange={(e) => updateField('discipline', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
        <select
          value={formData.day || 'Monday'}
          onChange={(e) => updateField('day', e.target.value)}
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
          onChange={(e) => updateField('time', e.target.value)}
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
          onChange={(e) => updateField('subtitle', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
        />
      </div>
    </>
  )
}

function EventFields({ formData, updateField }: FieldsProps) {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="text"
          value={formData.date || ''}
          onChange={(e) => updateField('date', e.target.value)}
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
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
          required
        />
      </div>
    </>
  )
}

function ClosureFields({ formData, updateField }: FieldsProps) {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Dates</label>
        <input
          type="text"
          value={formData.dates || ''}
          onChange={(e) => updateField('dates', e.target.value)}
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
          onChange={(e) => updateField('reason', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-light-pink focus:border-light-pink"
          required
        />
      </div>
    </>
  )
}
