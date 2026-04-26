import { useNavigate } from 'react-router-dom'
import { SquareButton } from '../common/SquareButton'

const DISCIPLINES = ['Saber', 'Longsword', 'Footwork, Thrusting, & Weapons']

export function Intro() {
  const navigate = useNavigate()

  const handleLearnMoreClick = () => {
    navigate('/about')
  }

  return (
    <section className="bg-gray-50 w-full border-t border-b border-gray-200 relative z-10 px-4 md:px-0">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row pt-10 pb-12 md:py-16 px-4 md:px-10">
        {/* Left Column - Main Content */}
        <div className="md:w-2/3 md:pr-16 mb-8 md:mb-0">
          <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
            About Us
          </span>
          <h2 className="font-extrabold text-2xl md:text-3xl text-navy leading-tight mt-2 mb-4">
            Columbus United Fencing Club
          </h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6 max-w-lg">
            An inclusive historical fencing club located in Columbus, Ohio. We welcome fencers of 
            all levels and backgrounds to train in the art of the blade. Whether you want to learn 
            a new skill, improve your fitness, compete in tournaments, or join a supportive 
            community, you&apos;ve found the right place.
          </p>
          <SquareButton
            onClick={handleLearnMoreClick}
            variant="white"
            style={{ minWidth: 160 }}
          >
            LEARN MORE
          </SquareButton>
        </div>

        {/* Right Column - Disciplines */}
        <div className="md:w-1/3 md:pl-8">
          <h3 className="font-bold text-base md:text-lg text-navy mb-4">
            Disciplines
          </h3>
          <ul className="space-y-2">
            {DISCIPLINES.map((discipline) => (
              <li key={discipline} className="flex items-start gap-2 text-gray-700 text-base">
                <span className="text-medium-pink mt-1">•</span>
                <span>{discipline}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
