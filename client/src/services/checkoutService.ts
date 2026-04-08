import { API_ENDPOINTS } from '../constants/api'
import type { IntroClassCheckoutRequest, CheckoutResponse } from '@cufc/shared'

export interface CheckoutError {
  error: string
}

/**
 * Create an intro class checkout for an authenticated user
 */
export async function createIntroCheckout(
  token: string,
  payload: IntroClassCheckoutRequest
): Promise<CheckoutResponse> {
  const response = await fetch(API_ENDPOINTS.CHECKOUT.INTRO, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error((data as CheckoutError).error || 'Failed to create checkout')
  }

  return data as CheckoutResponse
}

/**
 * Create an intro class checkout for a guest user (no auth required)
 */
export async function createGuestIntroCheckout(
  payload: IntroClassCheckoutRequest
): Promise<CheckoutResponse> {
  const response = await fetch(API_ENDPOINTS.CHECKOUT.INTRO_GUEST, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error((data as CheckoutError).error || 'Failed to create checkout')
  }

  return data as CheckoutResponse
}

/**
 * Create a drop-in checkout for an authenticated user
 */
export async function createDropInCheckout(
  token: string,
  payload: { memberProfileId: string; redirectUrl: string }
): Promise<CheckoutResponse> {
  const response = await fetch(API_ENDPOINTS.CHECKOUT.DROPIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error((data as CheckoutError).error || 'Failed to create checkout')
  }

  return data as CheckoutResponse
}

/**
 * Get subscription checkout URL for an authenticated user
 */
export async function createSubscriptionCheckout(
  token: string
): Promise<string> {
  const response = await fetch(API_ENDPOINTS.CHECKOUT.SUBSCRIPTION, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error((data as CheckoutError).error || 'Failed to get checkout URL')
  }

  return (data as CheckoutResponse).checkoutUrl
}
