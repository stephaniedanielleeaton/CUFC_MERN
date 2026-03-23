export interface MemberSubscriptionDTO {
  id: string;
  planName: string;
  status: string;
  activeThrough?: string;
  priceFormatted: string;
  lastInvoiceDate?: string;
  canceledDate?: string;
}

export interface IntroEnrollmentDTO {
  orderId: string;
  itemName: string;
  variationName: string;
}

export interface LastCheckInDTO {
  timestamp: string;
}
