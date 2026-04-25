import { useState, useMemo, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { MemberStatus } from '@cufc/shared'
import type { MemberProfileDTO } from '@cufc/shared'
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
  createMember,
} from '../../services/adminMembersService'

const WAIVER_REPOSITORY_URL = 'https://drive.google.com/drive/folders/1DXwPUSE1tVTiyCIsDPEYRzLjdKuVV5Yy'

export default function AdminMembersPage() {
  const { getAccessTokenSilently } = useAuth0()
  const [search, setSearch] = useState("")
  const [checkedInOnly, setCheckedInOnly] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string[]>(['Enrolled', 'Full'])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '' })
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
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

  const stats = useMemo(() => {
    const nonArchived = members.filter(m => !m.isArchived)
    const totalSubscribers = nonArchived.filter(m => (m as MemberProfileDTO & { isSubscriptionActive?: boolean }).isSubscriptionActive).length
    const activeInLastTwoMonths = nonArchived.filter(m => {
      const lastCheckIn = lastCheckInMap[String(m._id)]
      return lastCheckIn && new Date(lastCheckIn) >= twoMonthsAgo
    }).length
    const checkedInToday = nonArchived.filter(m => {
      const lastCheckIn = lastCheckInMap[String(m._id)]
      return lastCheckIn && new Date(lastCheckIn).toDateString() === todayDateString
    }).length
    return { totalSubscribers, activeInLastTwoMonths, checkedInToday }
  }, [members, lastCheckInMap, todayDateString])

  const filtered = useMemo(() => {
    const searchQueryLower = search.toLowerCase()
    return members
      .filter((m) => {
        const firstName = m.displayFirstName || ""
        const lastName = m.displayLastName || ""
        const matchesSearch = `${firstName} ${lastName}`.toLowerCase().includes(searchQueryLower)
        
        const lastCheckIn = lastCheckInMap[String(m._id)]
        const isCheckedInToday = !!lastCheckIn && new Date(lastCheckIn).toDateString() === todayDateString
        const matchesCheckedIn = !checkedInOnly || isCheckedInToday
      
        const isArchived = m.isArchived ?? false
        const matchesArchive = showArchived ? isArchived : !isArchived

        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(m.memberStatus || MemberStatus.New)
        
        return matchesSearch && matchesCheckedIn && matchesArchive && matchesStatus
      })
      .sort((a, b) => {
        const lastNameA = (a.displayLastName || "").toLowerCase()
        const lastNameB = (b.displayLastName || "").toLowerCase()
        return lastNameA.localeCompare(lastNameB)
      })
  }, [members, search, checkedInOnly, lastCheckInMap, todayDateString, showArchived, statusFilter])

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

  const handleAddMember = async () => {
    if (!newMember.firstName.trim() || !newMember.lastName.trim()) return
    
    try {
      const token = await getAccessTokenSilently()
      const created = await createMember(token, {
        displayFirstName: newMember.firstName.trim(),
        displayLastName: newMember.lastName.trim(),
        email: newMember.email.trim() || undefined,
      })
      setMembers(prev => [...prev, created])
      setNewMember({ firstName: '', lastName: '', email: '' })
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to create member:', err)
    }
  }

  if (loading) return <div className="text-center py-8 text-gray-400">Loading members...</div>
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>

  return (
    <div>
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-medium-pink">{stats.totalSubscribers}</div>
            <div className="text-xs text-medium-gray uppercase tracking-wide">Subscribers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-medium-pink">{stats.activeInLastTwoMonths}</div>
            <div className="text-xs text-medium-gray uppercase tracking-wide">Active (2 mo)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-medium-pink">{stats.checkedInToday}</div>
            <div className="text-xs text-medium-gray uppercase tracking-wide">Today</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-1">
            <SearchBox searchQuery={search} onSearchChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(prev => !prev)}
              className="px-4 py-2 text-sm font-medium rounded-lg border shadow-sm transition-colors bg-white text-dark-gray border-light-gray hover:bg-light-pink/20"
            >
              {showAddForm ? '− Cancel' : '+ Add Member'}
            </button>
            <a
              href={WAIVER_REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium rounded-lg border shadow-sm transition-colors bg-white text-dark-gray border-light-gray hover:bg-light-pink/20 text-center"
            >
              Waiver Repository
            </a>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-sm font-medium text-dark-gray whitespace-nowrap">Filter by status:</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-light-gray overflow-hidden shadow-sm">
              {(['New', 'Enrolled', 'Full'] as const).map((status, index) => {
                const isSelected = statusFilter.includes(status)
                const toggleStatus = () => {
                  setStatusFilter((prev) =>
                    isSelected ? prev.filter((s) => s !== status) : [...prev, status]
                  )
                }
                return (
                  <button
                    key={status}
                    onClick={toggleStatus}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      index > 0 ? 'border-l border-light-gray' : ''
                    } ${
                      isSelected
                        ? 'bg-medium-pink text-white'
                        : 'bg-white text-dark-gray hover:bg-light-pink/20'
                    }`}
                  >
                    {status}
                  </button>
                )
              })}
              <button
                onClick={() => setStatusFilter([])}
                className={`px-3 py-1.5 text-sm font-medium border-l border-light-gray transition-colors ${
                  statusFilter.length === 0
                    ? 'bg-medium-pink text-white'
                    : 'bg-white text-dark-gray hover:bg-light-pink/20'
                }`}
              >
                All
              </button>
            </div>

            <button
              onClick={() => setShowArchived((prev) => !prev)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border shadow-sm transition-colors ${
                showArchived
                  ? 'bg-light-pink text-dark-red border-medium-pink'
                  : 'bg-white text-dark-gray border-light-gray hover:bg-light-pink/20'
              }`}
            >
              {showArchived ? '✓ Show Archived' : 'Show Archived'}
            </button>
            
            <button
              onClick={() => setCheckedInOnly((prev) => !prev)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border shadow-sm transition-colors ${
                checkedInOnly
                  ? 'bg-light-pink text-dark-red border-medium-pink'
                  : 'bg-white text-dark-gray border-light-gray hover:bg-light-pink/20'
              }`}
            >
              {checkedInOnly ? '✓ Show Checked In' : 'Show Checked In'}
            </button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-white border border-light-gray rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="First Name *"
              value={newMember.firstName}
              onChange={(e) => setNewMember(prev => ({ ...prev, firstName: e.target.value }))}
              className="flex-1 px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medium-pink"
            />
            <input
              type="text"
              placeholder="Last Name *"
              value={newMember.lastName}
              onChange={(e) => setNewMember(prev => ({ ...prev, lastName: e.target.value }))}
              className="flex-1 px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medium-pink"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={newMember.email}
              onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
              className="flex-1 px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medium-pink"
            />
            <button
              onClick={handleAddMember}
              disabled={!newMember.firstName.trim() || !newMember.lastName.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-navy text-white hover:bg-dark-gray disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Add Member
            </button>
          </div>
        </div>
      )}

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
