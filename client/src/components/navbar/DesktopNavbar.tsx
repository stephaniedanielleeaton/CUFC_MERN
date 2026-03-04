import { Link } from 'react-router-dom'
import { UserAvatar } from './UserAvatar'
import { SignInOutButton } from './SignInOutButton'
import { NavLinks } from './NavLinks'
import { AdminLink } from './AdminLink'

type Auth0User = {
  picture?: string
  name?: string
  nickname?: string
  email?: string
}

type DesktopNavbarProps = {
  user: Auth0User | null
  isAdmin: boolean
  displayName: string | null
  profileComplete: boolean
  onLogin: () => void
  onLogout: () => void
}

export function DesktopNavbar({ user, isAdmin, displayName, onLogin, onLogout }: DesktopNavbarProps) {
  return (
    <div className="hidden md:block w-full z-40">
      <div className="h-[58px] bg-navy text-white flex items-center justify-between px-12 py-1 font-khula font-normal leading-none tracking-[.1em]">
        <img src="/pride-flag.svg" alt="Pride" width={32} height={32} />
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && <AdminLink />}
              <SignInOutButton
                user={user}
                onClick={onLogout}
              />
              {user && (
                <Link to="/dashboard" className="flex items-center gap-2 group">
                  <UserAvatar picture={user.picture} alt="User Dashboard" size={32} className="group-hover:ring-2 group-hover:ring-blue-300 transition-all" />
                  <span className="font-semibold group-hover:text-[#904F69] text-base">
                    {displayName || user.name || user.nickname || user.email}
                  </span>
                </Link>
              )}
            </>
          ) : (
            <>
              <SignInOutButton
                user={null}
                onClick={onLogin}
              />
              <UserAvatar alt="User Profile" size={40} className="group-hover:ring-2 group-hover:ring-blue-300 transition-all" />
            </>
          )}
        </div>
      </div>
      <div className="hidden md:flex justify-around items-center h-[187px] px-8 bg-white overflow-hidden">
        <div className="flex-none flex justify-center items-center bg-white h-full">
          <Link to="/">
            <img src="/LogoFullColourNavy.svg" alt="CUFC Logo" width={200} height={71} className="w-[200px] cursor-pointer" />
          </Link>
        </div>
        <nav className="md:w-1/2 lg:w-2/3 flex items-center justify-center">
          <div className="flex items-center justify-center gap-4 lg:gap-8 flex-wrap">
            <NavLinks />
          </div>
        </nav>
      </div>
    </div>
  )
}
