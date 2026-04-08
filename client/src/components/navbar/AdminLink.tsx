import { Link } from 'react-router-dom'

type AdminLinkProps = {
  onClick?: () => void
}

export function AdminLink({ onClick }: AdminLinkProps) {
  return (
    <Link to="/admin" className="hover:text-[#904F69] uppercase tracking-widest" onClick={onClick}>
      Admin
    </Link>
  )
}
