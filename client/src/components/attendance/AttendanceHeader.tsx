import React from 'react'

interface AttendanceHeaderProps {
  title: string
  totalCheckedIn: number
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({ 
  title, 
  totalCheckedIn 
}) => {
  return (
    <div className="flex items-center justify-between pl-4 mt-2">
      <h1 className="text-2xl font-bold text-deep-sea-blue">{title}</h1>
      <div className="flex items-center">
        <div className="text-sm font-medium text-gray-600">Total Checked In:</div>
        <div className="ml-2 text-lg font-semibold text-deep-sea-blue">{totalCheckedIn}</div>
      </div>
    </div>
  )
}
