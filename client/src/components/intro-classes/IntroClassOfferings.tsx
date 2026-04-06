import { useState, useEffect, useCallback } from 'react'
import { useIntroClassOfferings } from '../../hooks/useIntroClassOfferings'
import { useMemberProfile } from '../../context/ProfileContext'
import { useAuth0 } from '@auth0/auth0-react'
import { ClassVariationItem } from './ClassVariationItem'
import { EnrollButton } from './EnrollButton'
import ProfileForm from '../profile/ProfileForm'
import { RedirectingOverlay } from '../common/RedirectingOverlay'
import { IntroClassCheckoutRequest, CheckoutResponse } from '@cufc/shared'

type Step = "class" | "profile"

export const IntroClassOfferings: React.FC<{ introClassFlow?: boolean }> = ({ introClassFlow = false }) => {
  const { introClassData, isLoading, error } = useIntroClassOfferings()
  const { isAuthenticated, isLoading: userLoading, getAccessTokenSilently } = useAuth0()
  const { profile, loading: profileLoading, error: profileError } = useMemberProfile()
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>("class")
  const [isProcessing, setIsProcessing] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [profileJustCompleted, setProfileJustCompleted] = useState(false)

  const proceedToCheckout = useCallback(async () => {
    if (!selectedVariationId || !profile?._id) return
    try {
      setIsProcessing(true)
      setCheckoutError(null)
      const token = await getAccessTokenSilently()
      
      const requestPayload: IntroClassCheckoutRequest = {
        catalogObjectId: selectedVariationId,
        memberProfileId: profile._id,
        redirectUrl: `${globalThis.location.origin}/dashboard`,
      }
      
      const response = await fetch('/api/checkout/intro', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestPayload),
      })
      
      const data: CheckoutResponse = await response.json()
      
      if (!response.ok) {
        const errorData = data as any
        throw new Error(errorData.error || 'Failed to create checkout')
      }
      
      setRedirecting(true)
      globalThis.location.href = data.checkoutUrl
    } catch (err) {
      setIsProcessing(false)
      setCheckoutError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [selectedVariationId, profile?._id, getAccessTokenSilently])

  const handleContinue = () => {
    if (!selectedVariationId) return
    if (profile?.profileComplete) {
      proceedToCheckout()
    } else {
      setStep("profile")
    }
  }

  useEffect(() => {
    if (introClassFlow && profile?.profileComplete && selectedVariationId) {
      proceedToCheckout()
    }
  }, [introClassFlow, profile?.profileComplete, selectedVariationId, profileJustCompleted, proceedToCheckout])
  useEffect(() => {
    if (profile?.profileComplete && !profileJustCompleted) {
      setProfileJustCompleted(true)
    }
  }, [profile?.profileComplete, profileJustCompleted])

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

  if (step === "profile" && profile) {
    return (
      <div className="space-y-4">
        <div>
          <button
            onClick={() => setStep("class")}
            className="flex items-center text-sm text-navy hover:text-medium-pink transition-colors mb-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to class selection
          </button>
          <p className="text-sm text-gray-600">Complete your profile below to finish enrolling.</p>
        </div>
        <ProfileForm 
          member={profile} 
          onSaved={() => {
            setProfileJustCompleted(true)
            proceedToCheckout()
          }} 
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-navy p-3 text-center">
        <h2 className="text-lg font-semibold text-white tracking-wide">
          Upcoming Intro Classes for New Fencers
        </h2>
      </div>
      <div className="p-4">
        {introClassData.variations && introClassData.variations.length > 0 ? (
          <ul className="space-y-2" aria-label="Available Intro Classes">
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
          <p className="text-sm text-gray-600">No class dates are available right now.</p>
        )}
        <div className="mt-4">
          <EnrollButton
            hasSelectedVariation={!!selectedVariationId}
            label={profile?.profileComplete ? "Enroll Now" : "Continue"}
            onEnrollClick={handleContinue}
          />
          {isAuthenticated && (
            <div className="mt-1">
              {!selectedVariationId && (
                <p className="text-xs text-center text-gray-500">Select a class date to continue.</p>
              )}
              {checkoutError && (
                <p className="text-xs text-center text-red-500 mt-1">Error: {checkoutError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
