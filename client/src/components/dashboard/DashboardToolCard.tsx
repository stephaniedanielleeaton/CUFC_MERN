import {
  Users,
  DollarSign,
  Link as LinkIcon,
  CreditCard,
  CalendarCheck,
  ChevronRight,
  Lock,
} from 'lucide-react'

interface DashboardToolCardProps {
  label: string
  icon: "users" | "dollar-sign" | "link" | "credit-card" | "calendar-check"
  disabled?: boolean
  disabledReason?: string
}

const iconMap = {
  users: Users,
  "dollar-sign": DollarSign,
  link: LinkIcon,
  "credit-card": CreditCard,
  "calendar-check": CalendarCheck,
}

export function DashboardToolCard({ label, icon, disabled = false, disabledReason }: DashboardToolCardProps) {
  const Icon = iconMap[icon]

  return (
    <div
      className={`flex items-center justify-between px-2 py-2 rounded-md transition ${
        disabled
          ? "bg-gray-50 cursor-not-allowed"
          : "hover:bg-gray-50 cursor-pointer text-gray-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${disabled ? "text-gray-300" : "text-gray-700"}`} />
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${disabled ? "text-gray-400" : ""}`}>{label}</span>
          {disabled && disabledReason && (
            <span className="text-xs text-amber-600 font-medium">{disabledReason}</span>
          )}
        </div>
      </div>
      {disabled ? (
        <Lock className="w-4 h-4 text-gray-300" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-400" />
      )}
    </div>
  )
}
