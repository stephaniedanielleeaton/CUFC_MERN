import { useNavigate } from 'react-router-dom'
import { SquareButton } from '../common/SquareButton'

const DISCIPLINES = ['Saber', 'Longsword', 'Rapier & Thrusting Weapons']

export function Intro() {
  const navigate = useNavigate()

  const handleLearnMoreClick = () => {
    navigate('/about')
  }

  return (
    <section className="bg-white w-full border-b border-gray-100">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center py-16 md:py-24 px-6 md:px-10">
        {/* Main Intro */}
        <div className="md:w-2/3 md:pr-16 mb-12 md:mb-0 flex flex-col justify-center">
          <div className="flex flex-col space-y-7">
            <h2 className="font-extrabold text-3xl md:text-5xl text-navy leading-tight drop-shadow-sm">
              Columbus United
              <br />
              Fencing Club
            </h2>
            <p className="text-gray-800 text-lg md:text-xl leading-relaxed max-w-2xl">
              An inclusive historical fencing club located in Columbus, Ohio, Columbus United Fencing
              Club (CUFC) welcomes fencers of all levels and backgrounds to train in the art of the
              blade. Whether you want to learn a new skill, improve your fitness, compete in
              Historical European Martial Arts tournaments, or join a supportive community,
              you&apos;ve found the right place.
            </p>
            {/* Learn More button - Desktop only */}
            <div className="hidden md:block">
              <SquareButton
                onClick={handleLearnMoreClick}
                variant="navy"
                style={{ minWidth: 180 }}
              >
                LEARN MORE
              </SquareButton>
            </div>
          </div>
        </div>

        {/* Sidebar / Card */}
        <div className="md:w-1/3 w-full flex flex-col items-stretch mt-1 md:mt-0 md:self-center">
          <div className="bg-white border border-gray-200 rounded-xl shadow px-6 py-4 flex flex-col gap-3 md:gap-4">
            <h3 className="font-bold text-lg md:text-xl text-navy mb-1 tracking-wide text-left flex items-center">
              Primary Disciplines
            </h3>
            <ul className="flex flex-col gap-3 md:gap-3">
              {DISCIPLINES.map((discipline) => (
                <li key={discipline} className="flex items-center gap-3">
                  <span className="inline-block min-w-[8px] h-[8px] bg-mediumPink rounded-full"></span>
                  <span className="text-gray-800 text-base md:text-lg leading-relaxed">
                    {discipline}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {/* Learn More button - Mobile only */}
          <div className="block md:hidden mt-6">
            <SquareButton
              onClick={handleLearnMoreClick}
              variant="navy"
              className="w-full"
              style={{ minWidth: '100%' }}
            >
              LEARN MORE
            </SquareButton>
          </div>
        </div>
      </div>
    </section>
  )
}
