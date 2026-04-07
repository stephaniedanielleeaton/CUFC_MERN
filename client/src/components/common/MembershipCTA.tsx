import { useNavigate } from 'react-router-dom'
import { SquareButton } from './SquareButton'

export function MembershipCTA() {
  const navigate = useNavigate()

  return (
    <section className="bg-dark-red w-full py-12 md:py-16 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center md:text-left">
          Ready to become a member?
        </h2>
        <SquareButton
          onClick={() => navigate('/join')}
          variant="transparent"
          style={{ minWidth: 160 }}
        >
          JOIN NOW
        </SquareButton>
      </div>
    </section>
  )
}
