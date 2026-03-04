import { useAuth0 } from '@auth0/auth0-react'

export function ProfileHeader() {
  const { user } = useAuth0()
  const profileImage = user?.picture || "/default-avatar.png"
  const displayName = user?.name || user?.nickname || user?.email || "Your Profile"

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
    </div>
  )
}
