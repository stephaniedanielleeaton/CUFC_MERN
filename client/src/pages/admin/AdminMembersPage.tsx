import { useState, useMemo, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import type { MemberProfileDTO, MemberStatus } from '@cufc/shared'
import MemberCard from '../../components/admin/members/MemberCard'
import MemberDetailsInline from '../../components/admin/members/MemberDetailsInline'
import SearchBox from '../../components/admin/members/SearchBox'
import { SaveStatus } from '../../components/common/SaveButton'
import {
  fetchAllMembersWithAttendance,
  fetchSquareSubscriptionStatus,
  enrichMembersWithSquareStatus,
  deleteMemberById,
  updateMemberById,
} from '../../services/adminMembersService'

export default function AdminMembersPage() {
  const { getAccessTokenSilently } = useAuth0()
  const [search, setSearch] = useState("")
  const [checkedInOnly, setCheckedInOnly] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  
  const [members, setMembers] = useState<MemberProfileDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCheckInMap, setLastCheckInMap] = useState<Record<string, string | null>>({})
  const [squareStatusLoading, setSquareStatusLoading] = useState(true)

  const loadMembersAndAttendance = async () => {
    try {
      const token = await getAccessTokenSilently()
      const { members: membersList, lastCheckInMap: checkInMap } = await fetchAllMembersWithAttendance(token)
      
      setLastCheckInMap(checkInMap)
      setMembers(membersList)
      setLoading(false)
      
      const nonArchivedMembers = membersList.filter(member => !member.isArchived)
      if (nonArchivedMembers.length > 0) {
        loadSquareStatusForMembers(token, nonArchivedMembers)
      } else {
        setSquareStatusLoading(false)
      }
    } catch (err) {
      setError('Failed to load members')
      console.error(err)
      setLoading(false)
    }
  }

  const loadSquareStatusForMembers = async (token: string, membersList: MemberProfileDTO[]) => {
    try {
      const { activeSubscriberIds, dropInCustomerIds } = await fetchSquareSubscriptionStatus(token)
      const enrichedMembers = enrichMembersWithSquareStatus(membersList, activeSubscriberIds, dropInCustomerIds)
      setMembers(enrichedMembers)
    } catch (err) {
      console.error('Failed to load Square status:', err)
    } finally {
      setSquareStatusLoading(false)
    }
  }

  useEffect(() => {
    loadMembersAndAttendance()
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
    
      const isArchived = m.isArchived ?? false
      const matchesArchive = showArchived ? isArchived : !isArchived
      
      return matchesSearch && matchesCheckedIn && matchesArchive
    })
  }, [members, search, checkedInOnly, lastCheckInMap, todayDateString, showArchived])

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const updateMemberInList = (id: string, updates: Partial<MemberProfileDTO>) => {
    setMembers((previousMembers) =>
      previousMembers.map((member) =>
        String(member._id) === id ? { ...member, ...updates } as MemberProfileDTO : member
      )
    )
  }

  const removeMemberFromList = (memberId: string) => {
    setMembers((previousMembers) => previousMembers.filter((member) => String(member._id) !== memberId))
    setLastCheckInMap((previousCheckInMap) => {
      const { [memberId]: _, ...remainingCheckIns } = previousCheckInMap
      return remainingCheckIns
    })
  }

  const handleDelete = async (memberId: string) => {
    try {
      const token = await getAccessTokenSilently()
      await deleteMemberById(token, memberId)
      setExpandedId(null)
      removeMemberFromList(memberId)
    } catch {
      alert("Failed to delete member. Please try again.")
    }
  }

  const extractMemberUpdatesFromForm = (formData: FormData): Partial<MemberProfileDTO> => {
    return {
      displayFirstName: formData.get("displayFirstName") as string,
      displayLastName: formData.get("displayLastName") as string,
      personalInfo: {
        legalFirstName: formData.get("legalFirstName") as string,
        legalLastName: formData.get("legalLastName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        dateOfBirth: (formData.get("dateOfBirth") as string) || null,
        address: {
          street: formData.get("street") as string,
          city: formData.get("city") as string,
          state: formData.get("state") as string,
          zip: formData.get("zip") as string,
          country: formData.get("country") as string,
        },
      },
      guardian: {
        firstName: formData.get("guardian.firstName") as string,
        lastName: formData.get("guardian.lastName") as string,
      },
      profileComplete: formData.get("profileComplete") === "on",
      isWaiverOnFile: formData.get("isWaiverOnFile") === "on",
      isPaymentWaived: formData.get("isPaymentWaived") === "on",
      isArchived: formData.get("isArchived") === "on",
      memberStatus: formData.get("memberStatus") as MemberStatus,
      squareCustomerId: formData.get("squareCustomerId") as string,
      notes: formData.get("notes") as string,
    }
  }

  const handleSave = (memberId: string) => async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const memberUpdates = extractMemberUpdatesFromForm(formData)

    setSaveStatus("saving")
    try {
      const token = await getAccessTokenSilently()
      await updateMemberById(token, memberId, memberUpdates)
      updateMemberInList(memberId, memberUpdates)
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              showArchived
                ? 'bg-orange-100 text-orange-700 border-orange-400'
                : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            {showArchived && <span className="text-xs">📦</span>}
            Show Archived
          </button>
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
