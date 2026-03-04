import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { ShieldCheck } from 'lucide-react'

type ActiveSubscriptionStatus = "ACTIVE" | "PAUSED"

interface MemberSubscriptionDTO {
  id: string
  planName: string
  status: string
  activeThrough?: string
  priceFormatted: string
}

const statusStyles: Record<ActiveSubscriptionStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
}

const statusLabel: Record<ActiveSubscriptionStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
}

export function DashboardSubscriptionCard({ memberProfileId }: { memberProfileId: string }) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [subscriptions, setSubscriptions] = useState<MemberSubscriptionDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscriptions() {
      if (!memberProfileId || !isAuthenticated) return
      try {
        const token = await getAccessTokenSilently()
        const res = await fetch(`/api/members/me/subscriptions?memberProfileId=${memberProfileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          setSubscriptions([])
          return
        }
        const data = await res.json()
        setSubscriptions(Array.isArray(data) ? data : [])
      } catch {
        setSubscriptions([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubscriptions()
  }, [memberProfileId, isAuthenticated, getAccessTokenSilently])

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg p-4 shadow-md animate-pulse h-16" />
    )
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3 text-gray-500 text-sm">
        <ShieldCheck className="w-5 h-5 shrink-0" />
        <span>No active subscriptions</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((sub) => (
        <div
          key={sub.id}
          className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg p-4 shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{sub.planName}</div>
                {sub.activeThrough && (
                  <div className="text-xs text-white/80 mt-0.5">Active through {sub.activeThrough}</div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyles[sub.status as ActiveSubscriptionStatus]}`}
              >
                {statusLabel[sub.status as ActiveSubscriptionStatus]}
              </span>
              <span className="text-sm font-medium">{sub.priceFormatted}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
