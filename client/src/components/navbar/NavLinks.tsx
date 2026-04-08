import { Link } from 'react-router-dom'
import { useJoinNavigation } from '../../hooks/useJoinNavigation'

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
  const { handleJoinClick } = useJoinNavigation()

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
    </>
  )
}
