import type { MemberProfileDTO } from '@cufc/shared'
import { CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface MemberCardProps {
  member: MemberProfileDTO
  lastCheckIn?: Date | string | null
  onToggle?: () => void
  isExpanded?: boolean
  squareStatusLoading?: boolean
}

export default function MemberCard({ member, lastCheckIn, onToggle, isExpanded, squareStatusLoading }: MemberCardProps) {
  const name =
    [member.displayFirstName, member.displayLastName].filter(Boolean).join(" ") || (
      <span className="text-gray-400 italic">N/A</span>
    )

  const isSubscribed = member.subscriptionStatus === "Active" || member.isSubscriptionActive
  const hasPaidDropIn = !!member.hasPaidDropInToday
  const role = member.role
  const isCoach = role === "coach"
  const isStaff = member.memberStatus === "Staff"
  const hasActiveAccess = isSubscribed || isCoach || hasPaidDropIn || isStaff

  let checkInDate: Date | undefined = undefined
  if (lastCheckIn) {
    checkInDate = typeof lastCheckIn === "string" ? new Date(lastCheckIn) : lastCheckIn
  }
  const notes = member.notes

  const subIcon = squareStatusLoading ? (
    <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
  ) : hasActiveAccess ? (
    <CheckCircle className="w-5 h-5 text-green-500" />
  ) : (
    <AlertCircle className="w-5 h-5 text-red-500" />
  )

  const mobileAlertIcons = (
    <div className="flex items-center gap-2">
      {squareStatusLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
      ) : hasActiveAccess ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-500" />
      )}
      {member.isWaiverOnFile !== true && (
        <FileText className="w-4 h-4 text-red-500" />
      )}
    </div>
  )

  const formatCheckInDate = (date?: Date) => {
    if (!date) return "Never"
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!!isExpanded}
      className={`text-left w-full bg-white rounded-lg shadow-sm border border-gray-200 mb-2 p-4 sm:p-6 hover:shadow transition-shadow ${
        isExpanded ? "ring-2 ring-blue-200" : ""
      }`}
    >
      {/* MOBILE: simple header */}
      <div className="sm:hidden space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-lg text-gray-900 truncate">{name}</div>
          <div className="flex items-center gap-2">
            {mobileAlertIcons}
          </div>
        </div>

        {hasPaidDropIn && (
          <div className="text-sm text-green-600 font-medium">Paid drop-in fee today</div>
        )}
        {!hasActiveAccess && (
          <div className="text-sm text-gray-600">Not enrolled in a monthly plan</div>
        )}
      </div>

      {/* DESKTOP/TABLET: full info row */}
      <div className="hidden sm:flex sm:items-center sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg text-gray-900 truncate">{name}</div>
          {role && <div className="text-sm text-gray-500">{role}</div>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-600">Subscription Status</div>
          <div className="text-base text-gray-900">
            {hasPaidDropIn
              ? "Paid drop-in fee today"
              : isSubscribed
              ? "Active"
              : "Not enrolled in a monthly plan"}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-600">Last Check-In</div>
          <div className="text-base text-gray-900">{formatCheckInDate(checkInDate)}</div>
        </div>

        <div className="flex-1 min-w-0">
          {notes && (
            <>
              <div className="text-sm text-gray-600">Notes</div>
              <div className="text-base text-gray-900 truncate">{notes}</div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end min-w-[40px] ml-2 space-x-2">
          {subIcon}
          {member.isWaiverOnFile !== true && (
            <FileText className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>
    </button>
  )
}
