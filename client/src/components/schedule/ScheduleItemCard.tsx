import type { ScheduleItem } from '../../types/ScheduleTypes'
import { AdminActions } from './AdminActions'

interface ScheduleItemCardProps {
  item: ScheduleItem
  isAdmin: boolean
  onEdit: (item: ScheduleItem) => void
  onDelete: (item: ScheduleItem) => void
}

export function ScheduleItemCard({ item, isAdmin, onEdit, onDelete }: Readonly<ScheduleItemCardProps>) {
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
