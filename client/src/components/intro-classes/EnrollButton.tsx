import { useAuth0 } from '@auth0/auth0-react'

interface EnrollButtonProps {
  hasSelectedVariation: boolean
  label?: string
  onEnrollClick: () => void
}

export const EnrollButton: React.FC<EnrollButtonProps> = ({
  hasSelectedVariation,
  label = "Continue",
  onEnrollClick,
}) => {
  const { isAuthenticated, loginWithRedirect } = useAuth0()

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => loginWithRedirect({ appState: { returnTo: '/dashboard' } })}
        className="w-full bg-navy hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center text-sm"
      >
        Sign In to Enroll
      </button>
    )
  }

  return (
    <button
      className="w-full bg-medium-pink hover:bg-dark-red text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!hasSelectedVariation}
      onClick={onEnrollClick}
    >
      {label}
    </button>
  )
}
