import { useCallback } from 'react'

export function useToggleAttendance() {
  return useCallback(async (memberId: string) => {
    if (!memberId) throw new Error('Missing memberId')
    const res = await fetch('/api/attendance/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    if (!res.ok) {
      let errorMsg = 'Failed to toggle check-in'
      try {
        const error = await res.json()
        errorMsg = error?.error || errorMsg
      } catch {
        // ignore parse error
      }
      throw new Error(errorMsg)
    }
    const data = await res.json()
    return data.checkedIn as boolean
  }, [])
}
