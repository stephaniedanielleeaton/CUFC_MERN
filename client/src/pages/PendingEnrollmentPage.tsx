import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useMemberProfile } from '../context/ProfileContext'
import { UnifiedProfileForm } from '../components/profile/UnifiedProfileForm'
import { RedirectingOverlay } from '../components/common/RedirectingOverlay'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { createIntroCheckout } from '../services/checkoutService'

interface PendingEnrollment {
  classId: string
  timestamp: number
}

const ENROLLMENT_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

function getPendingEnrollment(): PendingEnrollment | null {
  try {
    const stored = sessionStorage.getItem('pendingIntroEnrollment')
    if (!stored) return null
    
    const parsed: PendingEnrollment = JSON.parse(stored)
    
    // Check if expired (30 minutes)
    if (Date.now() - parsed.timestamp > ENROLLMENT_EXPIRY_MS) {
      sessionStorage.removeItem('pendingIntroEnrollment')
      return null
    }
    
    return parsed
  } catch {
    return null
  }
}

function clearPendingEnrollment(): void {
  sessionStorage.removeItem('pendingIntroEnrollment')
}

export default function PendingEnrollmentPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0()
  const { profile, loading: profileLoading, refreshProfile } = useMemberProfile()
  
  const [pendingEnrollment, setPendingEnrollment] = useState<PendingEnrollment | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showProfileForm, setShowProfileForm] = useState(false)

  // Load pending enrollment on mount
  useEffect(() => {
    const enrollment = getPendingEnrollment()
    setPendingEnrollment(enrollment)
    
    // If no pending enrollment, redirect to dashboard
    if (!enrollment && !authLoading) {
      navigate('/dashboard')
    }
  }, [authLoading, navigate])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: '/enroll/pending' } })
    }
  }, [authLoading, isAuthenticated, loginWithRedirect])

  // Check profile status and proceed accordingly
  useEffect(() => {
    if (authLoading || profileLoading || !pendingEnrollment || !isAuthenticated) return
    
    if (!profile) {
      // No profile yet - show profile form
      setShowProfileForm(true)
    } else if (!profile.profileComplete) {
      // Profile exists but incomplete - show profile form
      setShowProfileForm(true)
    } else {
      // Profile complete - proceed to checkout
      proceedToCheckout()
    }
  }, [authLoading, profileLoading, profile, pendingEnrollment, isAuthenticated])

  const proceedToCheckout = useCallback(async () => {
    if (!pendingEnrollment || !profile?._id) return
    
    try {
      setIsCheckingOut(true)
      setCheckoutError(null)
      
      const token = await getAccessTokenSilently()
      const data = await createIntroCheckout(token, {
        catalogObjectId: pendingEnrollment.classId,
        memberProfileId: profile._id,
        redirectUrl: `${globalThis.location.origin}/dashboard`
      })
      
      // Clear pending enrollment before redirect
      clearPendingEnrollment()
      
      globalThis.location.href = data.checkoutUrl
    } catch (err) {
      setIsCheckingOut(false)
      setCheckoutError(err instanceof Error ? err.message : 'Checkout failed')
    }
  }, [pendingEnrollment, profile?._id, getAccessTokenSilently])

  const handleProfileSaved = useCallback(async () => {
    await refreshProfile()
    setShowProfileForm(false)
    // Profile is now complete, useEffect will trigger checkout
  }, [refreshProfile])

  // Loading states
  if (authLoading || profileLoading) {
    return <LoadingSpinner />
  }

  // Redirecting to login
  if (!isAuthenticated) {
    return <RedirectingOverlay message="Redirecting to sign in..." />
  }

  // No pending enrollment
  if (!pendingEnrollment) {
    return <RedirectingOverlay message="Redirecting to dashboard..." />
  }

  // Checkout in progress
  if (isCheckingOut) {
    return <RedirectingOverlay message="Redirecting to checkout..." />
  }

  // Show profile form
  if (showProfileForm) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-md mx-auto px-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Almost there!</strong> Complete your profile to finish enrolling in the intro class.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-gray-800">Complete Your Profile</h2>
            <p className="text-sm text-gray-500 mt-1">
              We need a few details before you can enroll.
            </p>
          </div>
          
          <UnifiedProfileForm 
            mode={profile ? 'edit' : 'authenticated'}
            existingProfile={profile}
            onSaved={handleProfileSaved}
            submitLabel="Continue to Checkout"
          />
          
          {checkoutError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{checkoutError}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default: processing
  return <RedirectingOverlay message="Processing enrollment..." />
}
