import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { ShieldCheck } from 'lucide-react'
import { 
  fetchMemberSubscriptions, 
  getSubscriptionCheckoutUrl,
  type MemberSubscriptionDTO
} from '../../services/dashboardService'


interface DashboardSubscriptionCardProps {
  memberProfileId: string
}

export function DashboardSubscriptionCard({ memberProfileId }: Readonly<DashboardSubscriptionCardProps>) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [subscriptions, setSubscriptions] = useState<MemberSubscriptionDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    async function loadSubscriptions() {
      if (!memberProfileId || !isAuthenticated) return
      try {
        const token = await getAccessTokenSilently()
        const subsData = await fetchMemberSubscriptions(token, memberProfileId)
        setSubscriptions(subsData)
      } catch {
        setSubscriptions([])
      } finally {
        setIsLoading(false)
      }
    }
    loadSubscriptions()
  }, [memberProfileId, isAuthenticated, getAccessTokenSilently])

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-green-400 to-blue-500 p-0.5 rounded-lg shadow-md animate-pulse">
        <div className="bg-white rounded-md h-16" />
      </div>
    )
  }

  const handleStartSubscription = async () => {
    try {
      setIsProcessing(true)
      const token = await getAccessTokenSilently()
      const checkoutUrl = await getSubscriptionCheckoutUrl(token)
      globalThis.location.href = checkoutUrl
    } catch (error) {
      setIsProcessing(false)
      alert(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-gray-500 text-sm">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>No active subscriptions</span>
        </div>
        <button
          onClick={handleStartSubscription}
          disabled={isProcessing}
          className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {isProcessing ? 'Loading...' : 'Start a Monthly Plan'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((sub) => (
        <div
          key={sub.id}
          className="bg-gradient-to-r from-green-400 to-blue-500 p-0.5 rounded-lg shadow-md"
        >
          <div className="bg-white rounded-md p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className="w-5 h-5 shrink-0 text-green-500" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{sub.planName}</div>
                  {sub.canceledDate ? (
                    <div className="text-xs text-amber-700 mt-0.5">Cancels on {sub.canceledDate}</div>
                  ) : sub.activeThrough && (
                    <div className="text-xs text-gray-600 mt-0.5">Active through {sub.activeThrough}</div>
                  )}
                  {sub.lastInvoiceDate && (
                    <div className="text-xs text-gray-600 mt-0.5">Last invoice: {sub.lastInvoiceDate}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sub.canceledDate ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'}`}>
                  {sub.canceledDate ? 'Canceling' : 'Active'}
                </span>
                <span className="text-sm font-medium text-gray-900">{sub.priceFormatted}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
