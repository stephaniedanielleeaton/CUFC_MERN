import { Link } from 'react-router-dom'

export const NAV_LINKS = [
  { href: "/join", label: "Join" },
  { href: "/get-started", label: "Get Started" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
  { href: "/notifications", label: "Notifications" },
]

type NavLinksProps = {
  onClick?: () => void
  className?: string
}

export function NavLinks({ onClick, className = "" }: NavLinksProps) {
  return (
    <>
      {NAV_LINKS.map(link => (
        <Link
          key={link.href}
          to={link.href}
          className={`hover:text-[#904F69] uppercase tracking-widest whitespace-nowrap ${className}`}
          onClick={onClick}
        >
          {link.label}
        </Link>
      ))}
    </>
  )
}
