import { useAuth0 } from '@auth0/auth0-react'
import { useMemberProfile } from '../context/ProfileContext'
import { createDropInCheckout } from '../services/checkoutService'

export function useDropInCheckout() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()
  const { profile } = useMemberProfile()

  const handleDropInCheckout = async () => {
    if (!isAuthenticated || !profile?._id) {
      // Fallback to direct Square link for unauthenticated users
      window.location.href = 'https://square.link/u/rKtS8AoN'
      return
    }

    try {
      const token = await getAccessTokenSilently()
      const data = await createDropInCheckout(token, {
        memberProfileId: profile._id,
        redirectUrl: `${window.location.origin}/dashboard`
      })
      window.location.href = data.checkoutUrl
    } catch (error) {
      console.error('Drop-in checkout error:', error)
      alert(error instanceof Error ? error.message : 'An error occurred while creating checkout')
    }
  }

  return { handleDropInCheckout }
}
