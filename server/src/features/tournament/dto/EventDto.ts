export interface EventDto {
  m2EventId: number;
  eventName: string;
  status: string;
  priceInCents: number;
  date: string;
  startTime: string;
  participantsCount: number;
  weapon: string;
}

export interface AddressDto {
  name: string;
  address1: string;
  city: string;
  state: string;
  zip: number;
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
