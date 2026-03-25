import { ContactSection } from '../components/contact/ContactSection'
import { SmallHero } from '../components/common/SmallHero'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <SmallHero pageTitle="Contact" />
      <section className="py-12 border-t border-b border-gray-200">
        <div className="container mx-auto py-6 px-5 sm:px-6 max-w-6xl">
          <ContactSection />
        </div>
      </section>
    </div>
  )
}
