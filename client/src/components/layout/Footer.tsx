import { Link } from 'react-router-dom'

const CLUB_ADDRESS = {
  street: '6475 E Main St. #111',
  city: 'Reynoldsburg',
  state: 'OH',
  zip: '43068',
} as const

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/ColumbusUFC/',
  instagram: 'https://www.instagram.com/columbusufc/',
} as const

function FacebookIcon() {
  return (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M15 8h-1.5A2.5 2.5 0 0011 10.5V12h-2v2h2v4h2v-4h2l.5-2H13v-1.5a.5.5 0 01.5-.5H15V8z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="18" cy="6" r="1" fill="currentColor" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link to="/">
            <img 
              src="/LogoFullColourNavy.svg" 
              alt="Columbus United Fencing Club" 
              className="h-16 md:h-20 w-auto"
            />
          </Link>
        </div>

        {/* Address */}
        <div className="text-center">
          <p className="text-gray-700 text-sm md:text-base">
            {CLUB_ADDRESS.street}, {CLUB_ADDRESS.city}, {CLUB_ADDRESS.state} {CLUB_ADDRESS.zip}
          </p>
        </div>

        {/* Social Links */}
        <nav aria-label="Social media" className="flex items-center gap-3">
          <a
            href={SOCIAL_LINKS.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy hover:opacity-70 transition-opacity"
            aria-label="Visit our Facebook page"
          >
            <FacebookIcon />
          </a>
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy hover:opacity-70 transition-opacity"
            aria-label="Visit our Instagram page"
          >
            <InstagramIcon />
          </a>
        </nav>
      </div>
    </footer>
  )
}
