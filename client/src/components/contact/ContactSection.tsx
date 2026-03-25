import { useContactForm } from './hooks/useContactForm';
import { ContactFormUI } from './ui/ContactFormUI';
import { SuccessMessage } from './ui/SuccessMessage';

interface ContactSectionProps {
  instagramLink?: string;
  facebookLink?: string;
}

const AddressPinIcon = () => (
  <svg
    className="w-6 h-6 text-[#904F69]"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
      clipRule="evenodd"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg
    className="w-7 h-7 text-[#1877F2]"
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg
    className="w-7 h-7 text-[#E1306C]"
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export function ContactSection({
  instagramLink = 'https://www.instagram.com/columbusufc/',
  facebookLink = 'https://www.facebook.com/ColumbusUFC/',
}: ContactSectionProps) {
  const { formData, isSubmitting, isSubmitted, error, updateField, submitForm, sendAnother } = useContactForm();

  return (
    <section className="w-full">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <span className="w-2 h-6 bg-[#904F69] rounded mr-3 hidden sm:inline-block"></span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Contact Us</h2>
            </div>
            <p className="text-base md:text-lg text-gray-600 mt-3">
              Have a question? <span className="font-bold">Send us a message.</span>
            </p>
            <p className="text-base md:text-lg text-gray-600 mt-1">
              Feel free to schedule a time to visit us and see what we do!
            </p>
          </div>

          {/* Address */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AddressPinIcon />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Address</h3>
                <p className="text-gray-600 text-base md:text-lg">
                  6475 E Main St. #111, Reynoldsburg, OH 43068
                </p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-base uppercase tracking-wider text-gray-500 font-semibold mb-3">
              Follow Us
            </h3>
            <div className="flex space-x-4">
              <a
                href={facebookLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:bg-blue-50"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:bg-pink-50"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 sm:p-6">
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
  );
}
