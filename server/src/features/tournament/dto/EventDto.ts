export interface EventDto {
  m2EventId: number;
  eventName: string;
  priceInCents: number;
  date: string;
  startTime: string;
  participantsCount: number;
  participantsCap?: number;
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
  events: EventDto[];
  address: AddressDto;
}
