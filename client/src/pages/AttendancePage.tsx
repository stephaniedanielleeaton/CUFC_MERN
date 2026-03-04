import { useEffect, useState } from 'react'
import type { MemberCheckIn } from '@cufc/shared'
import { useToggleAttendance } from '../hooks/useToggleAttendance'
import { SearchBar } from '../components/attendance/SearchBar'
import { AlphabetFilter } from '../components/attendance/AlphabetFilter'
import { AttendanceHeader } from '../components/attendance/AttendanceHeader'
import { MemberList } from '../components/attendance/MemberList'

async function fetchMembers(): Promise<MemberCheckIn[]> {
  const res = await fetch('/api/attendance/members')
  if (!res.ok) throw new Error('Failed to fetch members')
  return res.json()
}

export default function AttendancePage() {
  const [members, setMembers] = useState<MemberCheckIn[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedLetter, setSelectedLetter] = useState<string>('')
  const toggleAttendance = useToggleAttendance()

  useEffect(() => {
    fetchMembers()
      .then(setMembers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setSelectedLetter('')
  }

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(prev => (prev === letter ? '' : letter))
    setSearchTerm('')
  }

  const handleCheckIn = async (memberId: string) => {
    try {
      const checkedIn = await toggleAttendance(memberId)
      setMembers(members =>
        members.map(m =>
          m.id === memberId ? { ...m, isCheckedIn: checkedIn } : m
        )
      )
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred'
      setError(error)
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedLetter('')
  }

  const totalCheckedIn = members.filter(m => m.isCheckedIn).length

  const availableLetters = Array.from(
    new Set(members.map(m => (m.displayLastName || '').charAt(0).toUpperCase()).filter(Boolean))
  )

  let filteredMembers = [...members]
  
  if (searchTerm) {
    filteredMembers = filteredMembers.filter(
      m =>
        (m.displayFirstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.displayLastName || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }
  
  if (selectedLetter) {
    filteredMembers = filteredMembers.filter(
      m => (m.displayLastName || '').charAt(0).toUpperCase() === selectedLetter
    )
  }

  filteredMembers = filteredMembers.sort((a, b) =>
    (a.displayLastName || '').localeCompare(b.displayLastName || '')
  )

  return (
    <div className="mx-4 sm:mx-8 md:mx-16 lg:mx-40">
      <div className="flex flex-row justify-center w-full">
        <div className="w-full lg:w-3/4">
          <AttendanceHeader 
            title="Fencer Check-In" 
            totalCheckedIn={totalCheckedIn} 
          />
          
          <div className="p-4 bg-white min-h-screen">
            <div className="flex items-center justify-between mb-4">
              <SearchBar 
                searchTerm={searchTerm} 
                onSearch={handleSearch} 
                placeholder="Enter Name..." 
              />
            </div>
            
            <AlphabetFilter 
              availableLetters={availableLetters} 
              selectedLetter={selectedLetter} 
              onLetterClick={handleLetterClick} 
              onClearFilter={(selectedLetter || searchTerm) ? handleClearFilters : undefined} 
            />

            <MemberList 
              members={filteredMembers} 
              onCheckIn={handleCheckIn} 
              loading={loading} 
              error={error} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
