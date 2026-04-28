import { Link } from 'react-router-dom'
import { useJoinNavigation } from '../../hooks/useJoinNavigation'
import { useDropInCheckout } from '../../hooks/useDropInCheckout'

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
  const { handleDropInCheckout } = useDropInCheckout()

  const onJoinClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handleJoinClick()
    onClick?.()
  }

  const onDropInClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handleDropInCheckout()
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
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-400 normal-case tracking-normal">Current Members Only</span>
        <button
          className={`hover:text-[#904F69] uppercase tracking-widest whitespace-nowrap ${className}`}
          onClick={onDropInClick}
        >
          Drop-In
        </button>
      </div>
    </>
  )
}
