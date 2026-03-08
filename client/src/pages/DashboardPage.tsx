import { useState } from 'react'
import { useMemberProfile } from '../context/ProfileContext'
import { DashboardHeaderCard } from '../components/dashboard/DashboardHeaderCard'
import { DashboardSubscriptionCard } from '../components/dashboard/DashboardSubscriptionCard'
import { DashboardToolCard } from '../components/dashboard/DashboardToolCard'
import { LastCheckInCard } from '../components/dashboard/LastCheckInCard'
import { DashboardIntroCourseCard } from '../components/dashboard/DashboardIntroCourseCard'
import { DashboardIntroEnrollmentCard } from '../components/dashboard/DashboardIntroEnrollmentCard'
import { CreateProfileModal } from '../components/dashboard/CreateProfileModal'
import { IntroClassOfferings } from '../components/intro-classes/IntroClassOfferings'
import { useIntroEnrollment } from '../hooks/useIntroEnrollment'
import { MemberStatus } from '@cufc/shared'
import { useAuth0 } from '@auth0/auth0-react'

export default function DashboardPage() {
  const { profile, loading, error } = useMemberProfile()
  const { enrollment, loading: enrollmentLoading } = useIntroEnrollment(profile?._id)
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [showIntroClasses, setShowIntroClasses] = useState(false)
  const [introClassFlow, setIntroClassFlow] = useState(false)
  const { getAccessTokenSilently } = useAuth0()

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  if (!profile) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Welcome!</h2>
            <p className="text-sm text-gray-500">
              Get started by creating a profile for the fencer you are registering.
            </p>
            <button
              onClick={() => setShowCreateProfile(true)}
              className="px-6 py-2.5 bg-navy text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Create a profile
            </button>
          </div>
        </div>
        {showCreateProfile && <CreateProfileModal onClose={() => setShowCreateProfile(false)} />}
      </div>
    )
  }

  const isNewMember = profile.memberStatus === MemberStatus.New
  const dropInDisabled = !profile.profileComplete || isNewMember
  const dropInDisabledReason = !profile.profileComplete
    ? "Complete your profile to unlock"
    : isNewMember
    ? "Complete an intro course or contact a coach to unlock"
    : undefined

  const handleShowIntroClasses = () => {
    setIntroClassFlow(true)
    setShowIntroClasses(true)
  }
  const handleBackToDashboard = () => {
    setShowIntroClasses(false)
    setIntroClassFlow(false)
  }

  const handleDropInCheckout = async () => {

  try {
    const token = await getAccessTokenSilently()
    const response = await fetch('/api/checkout/dropin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        memberProfileId: profile._id,
        redirectUrl: `${window.location.origin}/dashboard`
      })
    })
 
    const data = await response.json()
    if (response.ok) {
      window.location.href = data.checkoutUrl
    } else {
      alert(data.error || 'Failed to create checkout')
    }
  } catch (error) {
    alert('An error occurred while creating checkout')
  }
}

  if (showIntroClasses) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-md mx-auto px-4 space-y-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center text-sm text-navy hover:text-medium-pink transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <IntroClassOfferings introClassFlow={introClassFlow} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-md mx-auto px-4 space-y-6">
        <DashboardHeaderCard profile={profile} />

        {/* Section: Class Enrollment */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold tracking-wide px-1">
            Class Enrollment
          </h2>
          {profile.memberStatus === MemberStatus.Full ? (
            <DashboardSubscriptionCard memberProfileId={profile._id ?? ""} />
          ) : (
            <>
              {enrollmentLoading ? (
                <div className="h-16 bg-white rounded-lg shadow-md animate-pulse" />
              ) : enrollment ? (
                <DashboardIntroEnrollmentCard enrollment={enrollment} />
              ) : (
                <DashboardIntroCourseCard onEnroll={handleShowIntroClasses} />
              )}
            </>
          )}
        </div>

        {/* Section: Tools */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold tracking-wide px-1">
            My Tools
          </h2>
          <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
            <DashboardToolCard
              label="Pay for Drop In"
              icon="dollar-sign"
              disabled={dropInDisabled}
              disabledReason={dropInDisabledReason}
              onClick={handleDropInCheckout}
            />
            <DashboardToolCard label="My Payments" icon="credit-card" />
            <DashboardToolCard label="My Attendance" icon="calendar-check" />
          </div>
        </div>

        {/* Section: Last Check-in */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold tracking-wide px-1">
            Last Check-in
          </h2>
          <LastCheckInCard memberProfileId={profile._id ?? ""} />
        </div>
      </div>
    </div>
  )
}
