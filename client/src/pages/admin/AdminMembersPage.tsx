import { useState, useMemo, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import type { MemberProfileDTO } from '@cufc/shared'
import MemberCard from '../../components/admin/members/MemberCard'
import MemberDetailsInline from '../../components/admin/members/MemberDetailsInline'
import SearchBox from '../../components/admin/members/SearchBox'
import { SaveStatus } from '../../components/common/SaveButton'

export default function AdminMembersPage() {
  const { getAccessTokenSilently } = useAuth0()
  const [search, setSearch] = useState("")
  const [checkedInOnly, setCheckedInOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  
  const [members, setMembers] = useState<MemberProfileDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCheckInMap, setLastCheckInMap] = useState<Record<string, string | null>>({})
  const [squareStatusLoading, setSquareStatusLoading] = useState(true)

  const fetchMembersAndAttendance = async () => {
    try {
      const token = await getAccessTokenSilently()
      const headers = { Authorization: `Bearer ${token}` }
      
      // Fetch members and attendance first (fast)
      const [membersRes, attendanceRes] = await Promise.all([
        fetch('/api/admin/members', { headers }),
        fetch('/api/attendance/recent', { headers }),
      ])
      
      const membersData = await membersRes.json()
      const attendanceData = await attendanceRes.json()
      
      const membersList: MemberProfileDTO[] = membersData.members || []
      
      // Build last check-in map
      const checkInMap: Record<string, string | null> = {}
      if (Array.isArray(attendanceData)) {
        attendanceData.forEach((item: { memberId: string; lastCheckIn: string | null }) => {
          checkInMap[item.memberId] = item.lastCheckIn
        })
      }
      setLastCheckInMap(checkInMap)
      setMembers(membersList)
      setLoading(false)
      
      // Fetch Square status in background (slow)
      fetchSquareStatus(token, membersList)
    } catch (err) {
      setError('Failed to load members')
      console.error(err)
      setLoading(false)
    }
  }

  const fetchSquareStatus = async (token: string, membersList: MemberProfileDTO[]) => {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const squareRes = await fetch('/api/admin/members/square-status', { headers })
      const squareData = await squareRes.json()
      
      // Enrich members with Square status
      const activeSubs = new Set<string>(squareData.activeSubscribers ?? [])
      const dropIns = new Set<string>(squareData.dropIns ?? [])
      const enriched = membersList.map((m) => ({
        ...m,
        isSubscriptionActive: !!m.squareCustomerId && activeSubs.has(m.squareCustomerId),
        hasPaidDropInToday: !!m.squareCustomerId && dropIns.has(m.squareCustomerId),
      }))
      
      setMembers(enriched)
    } catch (err) {
      console.error('Failed to load Square status:', err)
    } finally {
      setSquareStatusLoading(false)
    }
  }

  useEffect(() => {
    fetchMembersAndAttendance()
  }, [getAccessTokenSilently])

  const todayDateString = new Date().toDateString()

  const filtered = useMemo(() => {
    const searchQueryLower = search.toLowerCase()
    return members.filter((m) => {
      const firstName = m.displayFirstName || ""
      const lastName = m.displayLastName || ""
      const matchesSearch = `${firstName} ${lastName}`.toLowerCase().includes(searchQueryLower)
      const lastCheckIn = lastCheckInMap[String(m._id)]
      const isCheckedInToday = !!lastCheckIn && new Date(lastCheckIn).toDateString() === todayDateString
      const matchesCheckedIn = !checkedInOnly || isCheckedInToday
      return matchesSearch && matchesCheckedIn
    })
  }, [members, search, checkedInOnly, lastCheckInMap, todayDateString])

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleDelete = async (id: string) => {
    try {
      const token = await getAccessTokenSilently()
      const res = await fetch(`/api/admin/members/${id}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      setExpandedId(null)
      
      // Refetch members list only
      const membersRes = await fetch('/api/admin/members', { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      const membersData = await membersRes.json()
      setMembers(membersData.members || [])
    } catch {
      alert("Failed to delete member. Please try again.")
    }
  }

  const handleSave = (id: string) => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const body = {
      displayFirstName: formData.get("displayFirstName"),
      displayLastName: formData.get("displayLastName"),
      personalInfo: {
        legalFirstName: formData.get("legalFirstName"),
        legalLastName: formData.get("legalLastName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        dateOfBirth: formData.get("dateOfBirth") || null,
        address: {
          street: formData.get("street"),
          city: formData.get("city"),
          state: formData.get("state"),
          zip: formData.get("zip"),
          country: formData.get("country"),
        },
      },
      guardian: {
        firstName: formData.get("guardian.firstName"),
        lastName: formData.get("guardian.lastName"),
      },
      profileComplete: formData.get("profileComplete") === "on",
      isWaiverOnFile: formData.get("isWaiverOnFile") === "on",
      isPaymentWaived: formData.get("isPaymentWaived") === "on",
      memberStatus: formData.get("memberStatus"),
      squareCustomerId: formData.get("squareCustomerId"),
      notes: formData.get("notes"),
    }

    setSaveStatus("saving")
    try {
      const token = await getAccessTokenSilently()
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      
      // Only refetch members list, not Square status (which is slow)
      const membersRes = await fetch('/api/admin/members', { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      const membersData = await membersRes.json()
      const membersList: MemberProfileDTO[] = membersData.members || []
      setMembers(membersList)
      
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
    } finally {
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  if (loading) return <div className="text-center py-8 text-gray-400">Loading members...</div>
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>

  return (
    <div>
      <div className="max-w-2xl mx-auto mb-6 flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex-1">
          <SearchBox searchQuery={search} onSearchChange={(e) => setSearch(e.target.value)} />
        </div>
        <button
          onClick={() => setCheckedInOnly((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap ${
            checkedInOnly
              ? "bg-gray-200 text-gray-700 border-gray-400"
              : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          {checkedInOnly && <span className="text-xs">✓</span>}
          Show checked in
        </button>
      </div>

      <div className="space-y-4">
        {filtered.map((member) => {
          const id = String(member._id)
          const expanded = expandedId === id

          return (
            <div key={id} className="w-full">
              <MemberCard
                member={member}
                lastCheckIn={lastCheckInMap[id] ?? null}
                onToggle={() => handleToggle(id)}
                isExpanded={expanded}
                squareStatusLoading={squareStatusLoading}
              />

              {expanded && (
                <div className="mt-2">
                  <MemberDetailsInline
                    member={member}
                    onSubmit={handleSave(id)}
                    onDelete={() => handleDelete(id)}
                    saveStatus={saveStatus}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
