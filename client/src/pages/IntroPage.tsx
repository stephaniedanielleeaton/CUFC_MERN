import { IntroClassOfferings } from '../components/intro-classes/IntroClassOfferings'
import { SmallHero } from '../components/common/SmallHero'

export default function IntroPage() {
  return (
    <div className="bg-white">
      <SmallHero pageTitle="Intro Classes" />
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
          <IntroClassOfferings />
        </div>
      </section>
    </div>
  )
}
