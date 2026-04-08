import { Menu, X, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { UserAvatar } from './UserAvatar'
import { SignInOutButton } from './SignInOutButton'
import { NavLinks } from './NavLinks'
import { AdminLink } from './AdminLink'
import { CheckInLink } from './CheckInLink'

type Auth0User = {
  picture?: string
  name?: string
  nickname?: string
  email?: string
}

type MobileNavbarProps = {
  readonly user: Auth0User | null
  readonly isAdmin: boolean
  readonly canCheckIn: boolean
  readonly displayName: string | null
  readonly profileComplete: boolean
  readonly menuOpen: boolean
  readonly setMenuOpen: (open: boolean) => void
  readonly onLogin: () => void
  readonly onLogout: () => void
}

export function MobileNavbar({ user, isAdmin, canCheckIn, displayName, profileComplete, menuOpen, setMenuOpen, onLogin, onLogout }: MobileNavbarProps) {
  return (
    <>
      {/* Mobile Nav */}
      <nav className="md:hidden w-full h-[70px] bg-navy text-white flex items-center justify-between px-4 font-khula z-50 relative">
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={28} />
        </button>
        <Link
          to="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ display: "block" }}
        >
          <img src="/LogoAllWhite.svg" alt="CUFC Logo" width={100} height={40} />
        </Link>
        <div className="flex items-center gap-2">
          <img src="/pride-flag.svg" alt="Pride" width={28} height={28} />
          {user && (
            <Link to="/dashboard" className="block md:hidden ml-2">
              <UserAvatar picture={user.picture} alt="User Dashboard" size={32} className="hover:ring-2 hover:ring-blue-300 transition-all" />
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-navy/90 z-50 text-white font-khula text-xl h-screen w-screen overflow-y-auto">
          <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4" aria-label="Close menu">
            <X size={32} />
          </button>
          <div className="flex flex-col items-center justify-center h-full w-full space-y-6">
            {/* User section at the top */}
            {user && (
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex flex-col items-center group">
                <UserAvatar picture={user.picture} alt="User Dashboard" size={40} className="group-hover:ring-2 group-hover:ring-blue-300 transition-all" />
                <span className="mt-2 font-semibold group-hover:text-[#904F69] text-lg flex items-center gap-1">
                  {displayName || user.name || user.nickname || user.email}
                  {!profileComplete && (
                    <AlertCircle size={20} className="text-yellow-400 ml-1" aria-label="Profile incomplete" />
                  )}
                </span>
              </Link>
            )}
            <NavLinks onClick={() => setMenuOpen(false)} />
            {(canCheckIn || isAdmin) && (
              <div className="w-16 border-t border-gray-500 my-2"></div>
            )}
            {canCheckIn && <CheckInLink onClick={() => setMenuOpen(false)} />}
            {isAdmin && <AdminLink onClick={() => setMenuOpen(false)} />}
            <SignInOutButton
              user={user}
              onClick={() => {
                if (user) {
                  onLogout()
                } else {
                  onLogin()
                }
                setMenuOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
