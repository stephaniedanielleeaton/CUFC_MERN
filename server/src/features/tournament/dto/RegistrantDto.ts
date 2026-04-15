// DTO interfaces only - mappers are in ../models/Registrant.ts (mapping FROM IRegistrant)

export interface SelectedEventDto {
  m2EventId: number;
  eventName: string;
  priceInCents: number;
}

export interface ClubAffiliationDto {
  m2ClubId: number;
  name: string;
}

export interface RegistrantDto {
  id: string;
  paymentId: string;
  tournamentId: string;
  m2TournamentId: number;
  tournamentName: string;
  selectedEvents: SelectedEventDto[];
  displayName: string;
  email: string;
  isPaid: boolean;
  paidAt?: string;
  amountPaidInCents?: number;
  baseFeeChargedInCents?: number;
  m2Posted: boolean;
  createdAt: string;
}

export interface RegistrantDetailDto extends RegistrantDto {
  preferredFirstName: string;
  preferredLastName: string;
  legalFirstName: string;
  legalLastName: string;
  phoneNumber: string;
  clubAffiliation?: ClubAffiliationDto;
  isMinor: boolean;
  guardianFirstName?: string;
  guardianLastName?: string;
  squareOrderId?: string;
  auth0Id?: string;
  isRequestedAlternativeQualification: boolean;
}
