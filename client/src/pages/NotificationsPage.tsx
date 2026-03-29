import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { NotificationSignup } from '../components/common/NotificationSignup'
import { SmallHero } from '../components/common/SmallHero'

export default function NotificationsPage(): ReactElement {
  return (
    <div className="min-h-screen bg-gray-50">
      <SmallHero pageTitle="Stay Updated" />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <NotificationSignup />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            You can unsubscribe at any time by clicking the unsubscribe link in our
            emails or by visiting our{' '}
            <Link
              to="/unsubscribe"
              className="font-medium text-navy underline hover:text-navy/80"
            >
              unsubscribe page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
