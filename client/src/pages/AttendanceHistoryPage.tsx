import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { ArrowLeft, CalendarCheck } from 'lucide-react'
import { fetchAttendanceHistory, type AttendanceRecord } from '../services/dashboardService'

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function AttendanceList({ records }: Readonly<{ records: AttendanceRecord[] }>) {
  return (
    <div className="space-y-2">
      {records.map((record) => (
        <div
          key={record.id}
          className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
        >
          <span className="text-sm text-gray-900">
            {formatDate(record.timestamp)}
          </span>
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 bg-gray-100 rounded-md animate-pulse" />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <p className="text-gray-500 text-sm text-center py-8">
      No attendance history found.
    </p>
  )
}

function AttendanceHistoryContent({ loading, records }: Readonly<{ loading: boolean; records: AttendanceRecord[] }>) {
  if (loading) {
    return <LoadingSkeleton />
  }
  if (records.length === 0) {
    return <EmptyState />
  }
  return <AttendanceList records={records} />
}

export default function AttendanceHistoryPage() {
  const navigate = useNavigate()
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAttendance() {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }
      try {
        const token = await getAccessTokenSilently()
        const data = await fetchAttendanceHistory(token)
        setRecords(data)
      } catch {
        setRecords([])
      } finally {
        setLoading(false)
      }
    }
    loadAttendance()
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
            <div className="bg-green-100 text-green-600 p-2 rounded-full">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Attendance History</h1>
          </div>

          <AttendanceHistoryContent loading={loading} records={records} />
        </div>
      </div>
    </div>
  )
}
