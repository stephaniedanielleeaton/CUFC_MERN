import { Link } from 'react-router-dom'

export function CheckInLink() {
  return (
    <Link to="/attendance" className="hover:text-[#904F69] uppercase tracking-widest">
      Check In
    </Link>
  )
}
