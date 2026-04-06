import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { MobileNavbar } from './MobileNavbar'
import { DesktopNavbar } from './DesktopNavbar'
import { useUserRoles } from '../../hooks/useUserRoles'
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
  const roles = useUserRoles()
  const { profile, loading, error } = useMemberProfile()
  const displayName = loading || error ? "" : `${profile?.displayFirstName || ""} ${profile?.displayLastName || ""}`.trim()
  const profileComplete = loading || error ? false : (profile?.profileComplete ?? false)
  const isAdmin = roles.includes("club-admin")

  const handleLogin = () => loginWithRedirect()
  const handleLogout = () => logout({ logoutParams: { returnTo: window.location.origin } })

  return (
    <>
      <MobileNavbar
        user={user as Auth0User | null}
        isAdmin={isAdmin}
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
        displayName={displayName}
        profileComplete={profileComplete}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </>
  )
}
