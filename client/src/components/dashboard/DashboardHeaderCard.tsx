import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { AlertCircle } from 'lucide-react'
import type { MemberProfileDTO } from '@cufc/shared'

interface DashboardHeaderCardProps {
  profile: MemberProfileDTO
  onEditProfile?: () => void
}

export function DashboardHeaderCard({ profile, onEditProfile }: DashboardHeaderCardProps) {
  const { user } = useAuth0()

  const displayName = profile.displayFirstName && profile.displayLastName
    ? `${profile.displayFirstName} ${profile.displayLastName}`
    : profile.personalInfo?.legalFirstName && profile.personalInfo?.legalLastName
    ? `${profile.personalInfo.legalFirstName} ${profile.personalInfo.legalLastName}`
    : "Member"

  const profileImage = user?.picture || "/default-avatar.png"

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-gradient-to-tr from-green-400 via-blue-500 to-purple-500 p-1 rounded-full">
        <div className="bg-white p-1 rounded-full">
          <img
            src={profileImage}
            alt="Profile"
            width={80}
            height={80}
            className="rounded-full object-cover w-20 h-20"
          />
        </div>
      </div>

      <h1 className="text-lg font-semibold text-gray-900">{displayName}</h1>

      <div className="flex gap-2">
        {onEditProfile ? (
          <button 
            onClick={onEditProfile}
            className="relative flex items-center gap-1 px-4 py-1 text-blue-600 border border-blue-600 rounded-md text-sm font-semibold hover:bg-blue-50 transition"
          >
            EDIT PROFILE
            {!profile.profileComplete && (
              <AlertCircle className="w-4 h-4 text-yellow-500" aria-label="Profile incomplete" />
            )}
          </button>
        ) : (
          <Link to="/profile">
            <button className="relative flex items-center gap-1 px-4 py-1 text-blue-600 border border-blue-600 rounded-md text-sm font-semibold hover:bg-blue-50 transition">
              VIEW PROFILE
              {!profile.profileComplete && (
                <AlertCircle className="w-4 h-4 text-yellow-500" aria-label="Profile incomplete" />
              )}
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}
