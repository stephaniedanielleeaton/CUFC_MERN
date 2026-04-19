import { TournamentDetailDto, EventDto, ClubDto } from '../../dto';


export interface M2ClubTournamentsResponse {
  TournamentId: number;
  Name: string;
  StartDate: string;
  EndDate: string;
  RegistrationCutOff: string;
  Description: string;
  BasePrice: number | null;
  Address: {
    AddressId: number;
    Name: string;
    Address1: string;
    Address2: string | null;
    City: string;
    State: string;
    Zip: number | null;
    Coordinates: string;
  } | null;
  Events: M2ClubEventResponse[];
}

export interface M2ClubEventResponse {
  EventId: number;
  EventName: string;
  Date: string;
  StartTime: string;
  WeaponId: number;
  WeaponName: string;
  EventPrice: string | null; // Decimal string e.g. "20.00"
  CutOffNumber: number | null;
  RegisteredCount: number;
}

export function mapM2ClubTournamentsToDto(t: M2ClubTournamentsResponse): TournamentDetailDto {
  return {
    m2TournamentId: t.TournamentId,
    name: t.Name,
    description: t.Description ?? '',
    startDate: t.StartDate,
    endDate: t.EndDate,
    registrationCutOff: t.RegistrationCutOff,
    events: (t.Events ?? []).map((e): EventDto => ({
      m2EventId: e.EventId,
      eventName: e.EventName,
      priceInCents: e.EventPrice ? Math.round(parseFloat(e.EventPrice) * 100) : 0,
      date: e.Date,
      startTime: e.StartTime,
      participantsCount: e.RegisteredCount,
      participantsCap: e.CutOffNumber ?? undefined,
      weapon: e.WeaponName,
    })),
    address: t.Address ? {
      name: t.Address.Name ?? '',
      address1: t.Address.Address1 ?? '',
      city: t.Address.City ?? '',
      state: t.Address.State ?? '',
      zip: String(t.Address.Zip ?? ''),
    } : { name: '', address1: '', city: '', state: '', zip: '' },
  };
}

export interface M2ClubResponse {
  ClubId: number;
  Name: string;
}

export function mapM2ClubToDto(c: M2ClubResponse): ClubDto {
  return {
    m2ClubId: c.ClubId,
    name: c.Name,
  };
}

export interface M2AddPersonRequest {
  Email: string;
  DisplayName: string;
  FirstName: string;
  LastName: string;
  ClubId?: number;
}
