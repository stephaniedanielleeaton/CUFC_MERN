import { SelectedEventDto, ClubAffiliationDto } from './RegistrantDto';

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
