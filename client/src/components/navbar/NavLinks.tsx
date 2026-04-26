import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useJoinNavigation } from '../../hooks/useJoinNavigation'

const DROP_IN_URL = 'https://checkout.square.site/merchant/MLKW7ZG52B9ZV/order/Wm5I8FGH457zzxpSZVwOLkeCfwHZY'

export const NAV_LINKS = [
  { href: "/join", label: "Join", isJoin: true },
  { href: "/about", label: "About" },
  { href: "/schedule", label: "Schedule" },
  { href: "/tournaments", label: "Events" },
  { href: "/contact", label: "Contact" },
  { href: "/notifications", label: "Notifications" },
]

type NavLinksProps = Readonly<{
  onClick?: () => void
  className?: string
}>

export function NavLinks({ onClick, className = "" }: NavLinksProps) {
  const { handleJoinClick } = useJoinNavigation()
  const { isAuthenticated } = useAuth0()

  const onJoinClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handleJoinClick()
    onClick?.()
  }

  return (
    <>
      {NAV_LINKS.map(link => (
        link.isJoin ? (
          <button
            key={link.href}
            className={`hover:text-[#904F69] uppercase tracking-widest whitespace-nowrap ${className}`}
            onClick={onJoinClick}
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
      {!isAuthenticated && (
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 normal-case tracking-normal">Current Members Only</span>
          <a
            href={DROP_IN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`hover:text-[#904F69] uppercase tracking-widest whitespace-nowrap ${className}`}
            onClick={onClick}
          >
            Drop-In
          </a>
        </div>
      )}
    </>
  )
}
