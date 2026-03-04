import React from 'react'
import type { MemberCheckIn } from '@cufc/shared'
import { MemberCard } from './MemberCard'

interface MemberListProps {
  members: MemberCheckIn[]
  onCheckIn: (memberId: string) => void
  loading?: boolean
  error?: string | null
}

export const MemberList: React.FC<MemberListProps> = ({ 
  members, 
  onCheckIn, 
  loading = false,
  error = null
}) => {
  if (loading) {
    return <div className="text-center py-8">Loading members...</div>
  }

  if (error) {
    return <div className="text-red-600">{error}</div>
  }

  if (members.length === 0) {
    return <div className="text-center py-8 text-gray-500">No members found</div>
  }

  return (
    <div className="grid grid-cols-1 gap-3 mt-4">
      {members.map((member, index) => (
        <div key={member.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
          <MemberCard member={member} onCheckIn={onCheckIn} />
        </div>
      ))}
    </div>
  )
}
