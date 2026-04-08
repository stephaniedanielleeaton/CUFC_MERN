import { Link } from 'react-router-dom'

type CheckInLinkProps = {
  readonly onClick?: () => void
}

export function CheckInLink({ onClick }: CheckInLinkProps) {
  return (
    <Link to="/attendance" className="hover:text-[#904F69] uppercase tracking-widest" onClick={onClick}>
      Check In
    </Link>
  )
}
