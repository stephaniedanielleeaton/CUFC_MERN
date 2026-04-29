import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMemberProfile } from '../context/ProfileContext'
import { DashboardHeaderCard } from '../components/dashboard/DashboardHeaderCard'
import { DashboardSubscriptionCard } from '../components/dashboard/DashboardSubscriptionCard'
import { DashboardToolCard } from '../components/dashboard/DashboardToolCard'
import { LastCheckInCard } from '../components/dashboard/LastCheckInCard'
import { DashboardIntroCourseCard } from '../components/dashboard/DashboardIntroCourseCard'
import { DashboardIntroEnrollmentCard } from '../components/dashboard/DashboardIntroEnrollmentCard'
import { IntroClassOfferings } from '../components/intro-classes/IntroClassOfferings'
import { UnifiedProfileForm } from '../components/profile/UnifiedProfileForm'
import { RedirectingOverlay } from '../components/common/RedirectingOverlay'
import { BackButton } from '../components/common/BackButton'
import { useIntroEnrollment } from '../hooks/useIntroEnrollment'
import { MemberStatus } from '@cufc/shared'
import { useAuth0 } from '@auth0/auth0-react'
import { createIntroCheckout, createDropInCheckout, CheckoutError } from '../services/checkoutService'
import type { IntroEnrollmentDTO } from '../hooks/useIntroEnrollment'

type EnrollmentStep = 'dashboard' | 'profile' | 'class-selection'

interface EnrollmentSectionProps {
  enrollmentLoading: boolean
  enrollment: IntroEnrollmentDTO | null
  onEnroll: () => void
}

function EnrollmentSection({ enrollmentLoading, enrollment, onEnroll }: Readonly<EnrollmentSectionProps>) {
  if (enrollmentLoading) {
    return <div className="h-16 bg-white rounded-lg shadow-md animate-pulse" />
  }
  if (enrollment) {
    return <DashboardIntroEnrollmentCard enrollment={enrollment} />
  }
  return <DashboardIntroCourseCard onEnroll={onEnroll} />
}

export default function DashboardPage() {
  const { profile, loading, error, refreshProfile } = useMemberProfile()
  const { enrollment, loading: enrollmentLoading } = useIntroEnrollment(profile?._id)
  const [enrollmentStep, setEnrollmentStep] = useState<EnrollmentStep>('dashboard')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()

  // Checkout function
  const proceedToCheckout = useCallback(async (classId: string, profileId: string) => {
    try {
      setIsCheckingOut(true)
      const token = await getAccessTokenSilently()
      const data = await createIntroCheckout(token, {
        catalogObjectId: classId,
        memberProfileId: profileId,
        redirectUrl: `${globalThis.location.origin}/dashboard`
      })
      globalThis.location.href = data.checkoutUrl
    } catch (err) {
      setIsCheckingOut(false)
      if (err instanceof CheckoutError && err.code === 'PROFILE_INCOMPLETE') {
        alert('Your profile appears to be incomplete. Please complete your profile before enrolling.\n\nIf you continue to experience issues, please use the Contact form to reach us.')
        await refreshProfile()
        setEnrollmentStep('profile')
        return
      }
      alert(err instanceof Error ? err.message : 'Checkout failed')
    }
  }, [getAccessTokenSilently, refreshProfile])

  // Handle enroll button click - check if profile is complete first
  const handleEnrollClick = useCallback(() => {
    if (profile?.profileComplete) {
      setEnrollmentStep('class-selection')
    } else {
      setEnrollmentStep('profile')
    }
  }, [profile?.profileComplete])

  // After profile is saved, proceed to class selection
  const handleProfileSaved = useCallback(() => {
    refreshProfile()
    setEnrollmentStep('class-selection')
  }, [refreshProfile])

  // After class is selected, proceed to checkout
  const handleClassSelected = useCallback((classId: string) => {
    if (!profile?._id || !profile?.profileComplete) {
      setEnrollmentStep('profile')
      return
    }
    proceedToCheckout(classId, profile._id)
  }, [profile?._id, profile?.profileComplete, proceedToCheckout])

  // Redirect to login if not authenticated (after auth loading completes)
  if (!authLoading && !isAuthenticated) {
    loginWithRedirect({ appState: { returnTo: '/dashboard' } })
    return <div className="p-6">Redirecting to login...</div>
  }

  if (authLoading || loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  // No profile yet - show create profile form directly
  if (!profile) {
    return (
      <div className="bg-gray-50 py-10">
        <div className="max-w-md mx-auto px-4 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Welcome to CUFC!</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create your profile to get started.
            </p>
          </div>
          <UnifiedProfileForm 
            mode="authenticated"
            onSaved={() => refreshProfile()}
          />
        </div>
      </div>
    )
  }

  const isNewMember = profile.memberStatus === MemberStatus.New
  const dropInDisabled = !profile.profileComplete || isNewMember

  const getDropInDisabledReason = (): string | undefined => {
    if (!profile.profileComplete) {
      return "Complete your profile to unlock"
    }
    if (isNewMember) {
      return "Complete an intro course or contact a coach to unlock"
    }
    return undefined
  }
  const dropInDisabledReason = getDropInDisabledReason()

  const handleDropInCheckout = async () => {
    try {
      const token = await getAccessTokenSilently()
      const data = await createDropInCheckout(token, {
        memberProfileId: profile._id ?? '',
        redirectUrl: `${globalThis.location.origin}/dashboard`
      })
      globalThis.location.href = data.checkoutUrl
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred while creating checkout')
    }
  }

  // Show profile form step
  if (enrollmentStep === 'profile') {
    return (
      <div className="bg-gray-50 py-10">
        <div className="max-w-md mx-auto px-4 space-y-4">
          <BackButton onClick={() => setEnrollmentStep('dashboard')} label="Back to Dashboard" />
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Complete Your Profile</h2>
            <p className="text-sm text-gray-600 mb-4">Please complete your profile before enrolling in an intro class.</p>
          </div>
          <UnifiedProfileForm 
              mode={profile ? 'edit' : 'authenticated'}
              existingProfile={profile}
              onSaved={handleProfileSaved}
            />
        </div>
      </div>
    )
  }

  // Show class selection step
  if (enrollmentStep === 'class-selection') {
    if (isCheckingOut) {
      return <RedirectingOverlay message="Redirecting to checkout..." />
    }
    return (
      <div className="bg-gray-50 py-10">
        <div className="max-w-md mx-auto px-4 space-y-6">
          <BackButton onClick={() => setEnrollmentStep('dashboard')} label="Back to Dashboard" />
          <IntroClassOfferings 
            onClassSelected={handleClassSelected}
          />
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
          {profile.memberStatus === MemberStatus.Full || profile.memberStatus === MemberStatus.Staff ? (
            <DashboardSubscriptionCard memberProfileId={profile._id ?? ""} />
          ) : (
            <EnrollmentSection
              enrollmentLoading={enrollmentLoading}
              enrollment={enrollment}
              onEnroll={handleEnrollClick}
            />
          )}
          {profile.memberStatus === MemberStatus.Full && (
            <p className="text-xs text-gray-500 px-1 mt-2 text-center">
              Interested in a family plan? Contact our team to get started.
            </p>
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
            <DashboardToolCard label="My Payments" icon="credit-card" onClick={() => navigate('/dashboard/payments')} />
            <DashboardToolCard label="My Attendance" icon="calendar-check" onClick={() => navigate('/dashboard/attendance')} />
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
