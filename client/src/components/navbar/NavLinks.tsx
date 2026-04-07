import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

export const NAV_LINKS = [
  { href: "/join", label: "Join", isJoin: true },
  { href: "/about", label: "About" },
  { href: "/schedule", label: "Schedule" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
  { href: "/notifications", label: "Notifications" },
]

type NavLinksProps = Readonly<{
  onClick?: () => void
  className?: string
}>

export function NavLinks({ onClick, className = "" }: NavLinksProps) {
  const { loginWithRedirect, isAuthenticated } = useAuth0()

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isAuthenticated) {
      globalThis.location.href = '/dashboard'
    } else {
      loginWithRedirect({ appState: { returnTo: '/dashboard' } })
    }
    onClick?.()
  }

  return (
    <>
      {NAV_LINKS.map(link => (
        link.isJoin ? (
          <button
            key={link.href}
            className={`hover:text-[#904F69] uppercase tracking-widest whitespace-nowrap ${className}`}
            onClick={handleJoinClick}
          >
            {link.label}
          </button>
        ) : (
          <Link
            key={link.href}
            to={link.href}
            className={`hover:text-[#904F69] uppercase tracking-widest whitespace-nowrap ${className}`}
            onClick={onClick}
          >
            {link.label}
          </Link>
        )
      ))}
    </>
  )
}
