import { useContactForm } from './hooks/useContactForm'
import { ContactFormUI } from './ui/ContactFormUI'
import { SuccessMessage } from './ui/SuccessMessage'
import { LocationPinIcon, FacebookIcon, InstagramIcon } from './icons'

interface ContactSectionProps {
  readonly instagramLink?: string
  readonly facebookLink?: string
}

interface SocialLinkProps {
  readonly href: string
  readonly label: string
  readonly children: React.ReactNode
}

const CLUB_ADDRESS = {
  street: '6475 E Main St. #111',
  city: 'Reynoldsburg',
  state: 'OH',
  zip: '43068',
} as const

const DEFAULT_SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/columbusufc/',
  facebook: 'https://www.facebook.com/ColumbusUFC/',
} as const

function ContactHeader() {
  return (
    <header>
      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
        Contact Us
      </h2>
      <p className="text-base text-gray-600 mt-2">
        Have a question? <span className="font-bold">Send us a message.</span>
      </p>
    </header>
  )
}

function AddressBlock() {
  return (
    <address className="flex items-start space-x-4 not-italic">
      <div className="flex-shrink-0 mt-1" aria-hidden="true">
        <LocationPinIcon />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-base">Address</h3>
        <p className="text-gray-600 text-base">
          {CLUB_ADDRESS.street}
          <br />
          {CLUB_ADDRESS.city}, {CLUB_ADDRESS.state} {CLUB_ADDRESS.zip}
        </p>
      </div>
    </address>
  )
}

function SocialLink({ href, label, children }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-70 transition-opacity duration-300"
      aria-label={`Visit our ${label} page`}
    >
      {children}
    </a>
  )
}

interface SocialLinksProps {
  readonly facebookLink: string
  readonly instagramLink: string
}

function SocialLinks({ facebookLink, instagramLink }: SocialLinksProps) {
  return (
    <nav aria-label="Social media links" className="flex space-x-3 pt-2">
      <SocialLink href={facebookLink} label="Facebook">
        <FacebookIcon />
      </SocialLink>
      <SocialLink href={instagramLink} label="Instagram">
        <InstagramIcon />
      </SocialLink>
    </nav>
  )
}

export function ContactSection({
  instagramLink = DEFAULT_SOCIAL_LINKS.instagram,
  facebookLink = DEFAULT_SOCIAL_LINKS.facebook,
}: ContactSectionProps) {
  const {
    formData,
    isSubmitting,
    isSubmitted,
    error,
    updateField,
    submitForm,
    sendAnother,
  } = useContactForm()

  return (
    <section className="w-full px-4 md:px-0" aria-labelledby="contact-heading">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Information Column */}
        <div className="space-y-6">
          <ContactHeader />
          <AddressBlock />
          <SocialLinks facebookLink={facebookLink} instagramLink={instagramLink} />
        </div>

        {/* Contact Form Column */}
        <div>
          {isSubmitted ? (
            <SuccessMessage onSendAnother={sendAnother} />
          ) : (
            <ContactFormUI
              formData={formData}
              onChange={updateField}
              onSubmit={submitForm}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}
        </div>
      </div>
    </section>
  )
}
