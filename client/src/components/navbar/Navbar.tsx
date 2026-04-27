import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { MobileNavbar } from './MobileNavbar'
import { DesktopNavbar } from './DesktopNavbar'
import { useUserRolesWithLoading } from '../../hooks/useUserRoles'
import { useMemberProfile } from '../../context/ProfileContext'

type Auth0User = {
  picture?: string
  name?: string
  nickname?: string
  email?: string
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, loginWithRedirect, logout } = useAuth0()
  const { roles, isLoading: rolesLoading } = useUserRolesWithLoading()
  const { profile, loading, error } = useMemberProfile()
  const displayName = loading || error ? "" : `${profile?.displayFirstName || ""} ${profile?.displayLastName || ""}`.trim()
  const profileComplete = loading || error ? false : (profile?.profileComplete ?? false)
  // Don't show admin link until roles are loaded
  const isAdmin = !rolesLoading && roles.includes("club-admin")
  const canCheckIn = !rolesLoading && (roles.includes("club-admin") || roles.includes("kiosk"))

  const handleLogin = () => loginWithRedirect()
  const handleLogout = () => logout({ logoutParams: { returnTo: globalThis.location.origin } })

  return (
    <>
      <MobileNavbar
        user={user as Auth0User | null}
        isAdmin={isAdmin}
        canCheckIn={canCheckIn}
        displayName={displayName}
        profileComplete={profileComplete}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <DesktopNavbar
        user={user as Auth0User | null}
        isAdmin={isAdmin}
        canCheckIn={canCheckIn}
        displayName={displayName}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </>
  )
}
