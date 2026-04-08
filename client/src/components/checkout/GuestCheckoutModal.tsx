import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { UnifiedProfileForm } from '../profile/UnifiedProfileForm'
import type { MemberProfileDTO } from '@cufc/shared'

type Step = 'choice' | 'profile'

interface GuestCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onGuestProfileCreated: (profile: MemberProfileDTO) => void
  returnTo?: string
}

export function GuestCheckoutModal({
  isOpen,
  onClose,
  onGuestProfileCreated,
  returnTo = '/dashboard'
}: Readonly<GuestCheckoutModalProps>) {
  const { loginWithRedirect } = useAuth0()
  const [step, setStep] = useState<Step>('choice')

  if (!isOpen) return null

  const handleSignIn = () => {
    loginWithRedirect({ appState: { returnTo } })
  }

  const handleGuestCheckout = () => {
    setStep('profile')
  }

  const handleProfileCreated = (profile: MemberProfileDTO) => {
    onGuestProfileCreated(profile)
    onClose()
  }

  const handleBack = () => {
    setStep('choice')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
      <div className="bg-white w-full md:max-w-md md:rounded-xl shadow-xl p-6 space-y-5 max-h-[95vh] md:max-h-[90vh] overflow-y-auto rounded-t-xl md:mx-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {step === 'choice' ? 'Sign In or Continue as Guest' : 'Create Your Profile'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {step === 'choice' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Recommended:</strong> Sign in for a smoother experience. 
                Your enrollment history, payments, and profile will be saved to your account.
              </p>
            </div>

            <button
              onClick={handleSignIn}
              className="w-full bg-navy hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Sign In to Continue
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGuestCheckout}
                className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Continue as Guest
              </button>
              <p className="text-xs text-gray-500 text-center">
                You&apos;ll need to fill out a profile form to complete your enrollment.
              </p>
            </div>
          </div>
        )}

        {step === 'profile' && (
          <div className="space-y-4">
            <button
              onClick={handleBack}
              className="flex items-center text-sm text-navy hover:text-medium-pink transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to options
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                Complete the form below to create your profile. This information is required for enrollment.
              </p>
            </div>

            <UnifiedProfileForm 
              mode="guest"
              onProfileCreated={handleProfileCreated}
            />
          </div>
        )}
      </div>
    </div>
  )
}
