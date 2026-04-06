import Hero from '../components/home/Hero'
import { Intro } from '../components/home/Intro'
import { ContactSection } from '../components/contact/ContactSection'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <section className="py-12 bg-white border-t border-b border-gray-200">
        <div className="container mx-auto py-6 px-5 sm:px-6 max-w-6xl">
          <ContactSection />
        </div>
      </section>
    </>
  )
}
