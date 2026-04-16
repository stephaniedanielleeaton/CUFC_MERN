export interface EventDto {
  m2EventId: number;
  eventName: string;
  status: string;
  priceInCents: number;
  date: string;
  startTime: string;
  participantsCount: number;
  participantsCap?: number; // Pending M2 API enhancement
  weapon: string;
}

export interface AddressDto {
  name: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
}

export interface TournamentDetailDto {
  m2TournamentId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationCutOff: string;
  basePriceInCents: number;
  totalParticipants: number;
  events: EventDto[];
  address: AddressDto;
  imageUrl?: string;
  primaryContact: string;
}

export interface TournamentDto {
  id: string;
  m2TournamentId: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClubDto {
  m2ClubId: number;
  name: string;
}

export interface SelectedEventDto {
  m2EventId: number;
  eventName: string;
  priceInCents: number;
}

export interface ClubAffiliationDto {
  m2ClubId: number;
  name: string;
}

export interface RegistrationRequestDto {
  m2TournamentId: number;
  selectedEvents: SelectedEventDto[];
  preferredFirstName: string;
  preferredLastName: string;
  legalFirstName: string;
  legalLastName: string;
  email: string;
  phoneNumber: string;
  clubAffiliation?: ClubAffiliationDto;
  isMinor: boolean;
  guardianFirstName?: string;
  guardianLastName?: string;
  isRequestedAlternativeQualification?: boolean;
}

export interface RegistrationResponseDto {
  registrantId: string;
  paymentId: string;
  paymentUrl: string;
}
