import { SelectedEventDto, ClubAffiliationDto } from './RegistrantDto';

export interface RegistrationRequestDto {
  m2TournamentId: number;
  selectedEvents: SelectedEventDto[];
  preferredFirstName: string;
  preferredLastName: string;
  legalFirstName: string;
  legalLastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: string;
  clubAffiliation?: ClubAffiliationDto;
  isRequestedAlternativeQualification?: boolean;
}

export interface RegistrationResponseDto {
  registrantId: string;
  paymentId: string;
  paymentUrl: string;
}
