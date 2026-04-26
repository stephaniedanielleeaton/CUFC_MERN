import { useAuth0 } from '@auth0/auth0-react'
import { Link } from 'react-router-dom'
import { useMemberProfile } from '../context/ProfileContext'
import { ProfileHeader } from '../components/profile/ProfileHeader'
import { UnifiedProfileForm } from '../components/profile/UnifiedProfileForm'

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const { profile, loading: profileLoading, error } = useMemberProfile()

  if (authLoading || profileLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <p>Please log in to view your profile.</p>
      </div>
    )
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  if (!profile) {
    return <div className="p-6 text-red-600">No profile found for your account.</div>
  }

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-md mx-auto px-4 space-y-6">
        <Link 
          to="/dashboard" 
          className="flex items-center text-sm text-navy hover:text-medium-pink transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
        <ProfileHeader />
        <UnifiedProfileForm mode="edit" existingProfile={profile} />
      </div>
    </div>
  )
}
