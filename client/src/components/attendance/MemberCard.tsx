import React from 'react'
import type { MemberCheckIn } from '@cufc/shared'

interface MemberCardProps {
  member: MemberCheckIn
  onCheckIn: (memberId: string) => void
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onCheckIn }) => {
  return (
    <button
      type="button"
      aria-pressed={member.isCheckedIn}
      onClick={() => onCheckIn(member.id)}
      className={`w-full text-left flex items-center p-4 shadow-sm rounded-lg cursor-pointer border appearance-none ${
        member.isCheckedIn 
          ? 'bg-medium-pink border-dark-red text-light-gray'
          : 'bg-white hover:bg-gray-50 border-gray-200'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          member.isCheckedIn ? 'bg-dark-red' : 'bg-gray-300'
        }`}
      >
        {member.isCheckedIn && (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="ml-4">
        <div className={`text-xl ${member.isCheckedIn ? 'text-white' : 'text-gray-900'}`}>
          <span className="font-normal">{(member.displayLastName || '').trim()}, </span>
          <span className="font-bold">{(member.displayFirstName || '').trim()}</span>
        </div>
      </div>
    </button>
  )
}
