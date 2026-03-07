export interface IntroClassCheckoutRequest {
  catalogObjectId: string;
  memberProfileId: string;
  redirectUrl: string;
}

export interface SingleClassCheckoutRequest {
  memberProfileId: string;
  redirectUrl: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface ErrorResponse {
  error: string;
}
