import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { fetchTransactions, type Transaction } from '../services/dashboardService'

function formatMoney(amount?: number, currency?: string): string {
  if (amount === undefined) return '—'
  const dollars = amount / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
  }).format(dollars)
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function TransactionsList({ transactions }: Readonly<{ transactions: Transaction[] }>) {
  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const stateLabel = tx.state === 'COMPLETED' ? 'Completed' : tx.state
        const stateStyle = tx.state === 'COMPLETED' 
          ? 'bg-green-100 text-green-700' 
          : 'bg-gray-100 text-gray-600'
        
        return (
          <div
            key={tx.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {tx.lineItems.map((li) => li.name).filter(Boolean).join(', ') || 'Payment'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(tx.createdAt)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-semibold text-gray-900">
                  {formatMoney(tx.totalMoney?.amount, tx.totalMoney?.currency)}
                </span>
                {tx.state && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${stateStyle}`}>
                    {stateLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <p className="text-gray-500 text-sm text-center py-8">
      No payment history found.
    </p>
  )
}

function PaymentHistoryContent({ loading, transactions }: Readonly<{ loading: boolean; transactions: Transaction[] }>) {
  if (loading) {
    return <LoadingSkeleton />
  }
  if (transactions.length === 0) {
    return <EmptyState />
  }
  return <TransactionsList transactions={transactions} />
}

export default function PaymentHistoryPage() {
  const navigate = useNavigate()
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTransactions() {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }
      try {
        const token = await getAccessTokenSilently()
        const data = await fetchTransactions(token)
        setTransactions(data)
      } catch {
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }
    loadTransactions()
  }, [isAuthenticated, getAccessTokenSilently])

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-md mx-auto px-4 space-y-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-sm text-navy hover:text-medium-pink transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
              <CreditCard className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Payment History</h1>
          </div>

          <PaymentHistoryContent loading={loading} transactions={transactions} />
        </div>
      </div>
    </div>
  )
}
