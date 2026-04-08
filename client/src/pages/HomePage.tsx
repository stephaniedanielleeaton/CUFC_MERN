import Hero from '../components/home/Hero'
import { Intro } from '../components/home/Intro'
import { IntroClassOfferings } from '../components/intro-classes/IntroClassOfferings'
import { NotificationSignup } from '../components/common/NotificationSignup/NotificationSignup'
import { ContactSection } from '../components/contact/ContactSection'
import { MembershipCTA } from '../components/common/MembershipCTA'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <section id="intro-classes" className="py-12 bg-navy-light border-t border-navy-dark">
        <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
          <IntroClassOfferings />
        </div>
      </section>
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
          <NotificationSignup />
        </div>
      </section>
      <section className="py-12 bg-white border-t border-b border-gray-200">
        <div className="container mx-auto py-6 px-5 sm:px-6 max-w-6xl">
          <ContactSection />
        </div>
      </section>
      <MembershipCTA />
    </>
  )
}
