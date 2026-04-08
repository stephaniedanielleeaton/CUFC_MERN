import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useIntroClassOfferings } from '../../hooks/useIntroClassOfferings'
import { useMemberProfile } from '../../context/ProfileContext'
import { useAuth0 } from '@auth0/auth0-react'
import { ClassVariationItem } from './ClassVariationItem'
import { EnrollButton } from './EnrollButton'
import { RedirectingOverlay } from '../common/RedirectingOverlay'
import { GuestCheckoutModal } from '../checkout'
import { IntroClassCheckoutRequest, CheckoutResponse, MemberProfileDTO } from '@cufc/shared'
import { API_ENDPOINTS } from '../../constants/api'

interface IntroClassOfferingsProps {
  onClassSelected?: (classId: string) => void
  allowIncompleteProfile?: boolean
}

export const IntroClassOfferings: React.FC<IntroClassOfferingsProps> = ({ 
  onClassSelected,
  allowIncompleteProfile = false,
}) => {
  const { introClassData, isLoading, error } = useIntroClassOfferings()
  const { isAuthenticated, isLoading: userLoading, getAccessTokenSilently } = useAuth0()
  const { profile, loading: profileLoading, error: profileError } = useMemberProfile()
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showGuestModal, setShowGuestModal] = useState(false)

  const proceedToCheckout = useCallback(async (profileId?: string) => {
    const memberProfileId = profileId || profile?._id
    if (!selectedVariationId || !memberProfileId) return
    try {
      setIsProcessing(true)
      setCheckoutError(null)
      
      const requestPayload: IntroClassCheckoutRequest = {
        catalogObjectId: selectedVariationId,
        memberProfileId,
        redirectUrl: `${globalThis.location.origin}/`,
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      let endpoint: string = API_ENDPOINTS.CHECKOUT.INTRO_GUEST

      if (isAuthenticated) {
        const token = await getAccessTokenSilently()
        headers['Authorization'] = `Bearer ${token}`
        endpoint = API_ENDPOINTS.CHECKOUT.INTRO
        requestPayload.redirectUrl = `${globalThis.location.origin}/dashboard`
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
      })
      
      const data: CheckoutResponse = await response.json()
      
      if (!response.ok) {
        const errorData = data as unknown as { error?: string }
        throw new Error(errorData.error || 'Failed to create checkout')
      }
      
      setRedirecting(true)
      globalThis.location.href = data.checkoutUrl
    } catch (err) {
      setIsProcessing(false)
      setCheckoutError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [selectedVariationId, profile?._id, isAuthenticated, getAccessTokenSilently])

  const handleEnrollClick = () => {
    if (!selectedVariationId) return
    
    // If callback provided (dashboard flow), let parent handle it
    if (onClassSelected) {
      onClassSelected(selectedVariationId)
      return
    }
    
    proceedToCheckout()
  }

  const handleGuestEnrollClick = () => {
    if (!selectedVariationId) return
    setShowGuestModal(true)
  }

  const handleGuestProfileCreated = (createdProfile: MemberProfileDTO) => {
    setShowGuestModal(false)
    proceedToCheckout(createdProfile._id)
  }

  if (isLoading || userLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medium-pink" />
      </div>
    )
  }

  if (error || profileError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>{profileError ? "Unable to load profile. Please try again later." : "Unable to load class information. Please try again later."}</p>
      </div>
    )
  }

  if (!introClassData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
        <p>No class information available at this time.</p>
      </div>
    )
  }

  if (redirecting || isProcessing) {
    return (
      <RedirectingOverlay
        message={redirecting ? "Redirecting to Square checkout…" : "Preparing checkout…"}
      />
    )
  }

  return (
    <div className="w-full px-4 md:px-0">
      {/* Centered Header */}
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-widest text-navy/60 font-semibold">
          Get Started
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-navy mt-2 mb-3">
          Upcoming Intro Classes
        </h2>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-3">
          New to fencing? Our intro classes are designed for beginners of all ages 
          and fitness levels. Select a date that works for you.
        </p>
        <Link 
          to="/about#getting-started" 
          className="text-navy underline hover:text-medium-pink transition-colors text-sm"
        >
          Learn more about our intro course →
        </Link>
      </div>

      {/* Class Selection - Centered */}
      <div className="max-w-md mx-auto">
        {introClassData.variations && introClassData.variations.length > 0 ? (
          <ul className="space-y-2 mb-4" aria-label="Available Intro Classes">
            {introClassData.variations.map((variation) => (
              <ClassVariationItem
                key={variation.id}
                variation={variation}
                isSelected={selectedVariationId === variation.id}
                onSelect={() => setSelectedVariationId(variation.id === selectedVariationId ? null : variation.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 mb-4 text-center">No class dates are available right now.</p>
        )}
        
        <div className="flex flex-col items-center">
          {isAuthenticated ? (
            <EnrollButton
              hasSelectedVariation={!!selectedVariationId && (allowIncompleteProfile || !!profile?.profileComplete)}
              label="Enroll Now"
              onEnrollClick={handleEnrollClick}
            />
          ) : (
            <button
              className="w-full bg-medium-pink hover:bg-dark-red text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedVariationId}
              onClick={handleGuestEnrollClick}
            >
              Enroll Now
            </button>
          )}
          <div className="mt-2 text-center">
            {!selectedVariationId && (
              <p className="text-xs text-gray-500">Select a class date to continue.</p>
            )}
            {isAuthenticated && selectedVariationId && !profile?.profileComplete && (
              <p className="text-xs text-amber-600">
                <Link to="/dashboard" className="underline hover:text-amber-700">Complete your profile</Link> to enroll.
              </p>
            )}
            {checkoutError && (
              <p className="text-xs text-red-500 mt-1">Error: {checkoutError}</p>
            )}
          </div>
        </div>
      </div>

      <GuestCheckoutModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        onGuestProfileCreated={handleGuestProfileCreated}
        returnTo="/dashboard"
      />
    </div>
  )
}
