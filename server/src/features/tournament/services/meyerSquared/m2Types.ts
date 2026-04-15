// Internal M2 API response types - ONLY used within M2 service
// Business logic should use DTOs from ../dto
// Mappers live here because we map FROM these types

import { TournamentDetailDto, EventDto, ClubDto } from '../../dto';

export interface M2TournamentListResponse {
  TournamentId: number;
  Name: string;
  StartDate: string;
  EndDate: string;
  RegistrationCutOff: string;
  Description: string;
  BasePrice: number | null;
  ClubId: number;
  Visibility: string;
  HostedOnM2: boolean;
  M2Registration: boolean;
  Club: { Name: string; ClubId: number };
  Address: {
    Name: string;
    City: string;
    State: string;
    Address1: string;
    Zip: number | null;
  } | null;
  Images: { ImageId: number; URL: string | null; AltText: string | null }[];
  PrimaryContact: { PersonId: number; DisplayName: string; Pronouns: string | null } | null;
  SocialMedia: { Type: string; Link: string; Label: string }[];
}

export function mapM2TournamentListToDto(t: M2TournamentListResponse): TournamentDetailDto {
  return {
    m2TournamentId: t.TournamentId,
    name: t.Name,
    description: t.Description ?? '',
    startDate: t.StartDate,
    endDate: t.EndDate,
    registrationCutOff: t.RegistrationCutOff,
    basePriceInCents: t.BasePrice ?? 0,
    totalParticipants: 0,
    events: [],
    address: t.Address ? {
      name: t.Address.Name ?? '',
      address1: t.Address.Address1 ?? '',
      city: t.Address.City ?? '',
      state: t.Address.State ?? '',
      zip: t.Address.Zip ?? 0,
    } : { name: '', address1: '', city: '', state: '', zip: 0 },
    imageUrl: t.Images?.[0]?.URL ?? undefined,
    primaryContact: t.PrimaryContact?.DisplayName ?? '',
  };
}

export interface M2TournamentDetailResponse extends M2TournamentListResponse {
  TotalParticipants: number;
  Events: M2EventResponse[];
}

export function mapM2TournamentDetailToDto(t: M2TournamentDetailResponse): TournamentDetailDto {
  return {
    m2TournamentId: t.TournamentId,
    name: t.Name,
    description: t.Description ?? '',
    startDate: t.StartDate,
    endDate: t.EndDate,
    registrationCutOff: t.RegistrationCutOff,
    basePriceInCents: t.BasePrice ?? 0,
    totalParticipants: t.TotalParticipants ?? 0,
    events: (t.Events ?? []).map((e): EventDto => ({
      m2EventId: e.EventId,
      eventName: e.EventName,
      status: e.Status,
      priceInCents: e.EventPrice ?? 0,
      date: e.Date,
      startTime: e.StartTime,
      participantsCount: e.ParticipantsCount,
      weapon: e.Weapon?.Name ?? '',
    })),
    address: t.Address ? {
      name: t.Address.Name ?? '',
      address1: t.Address.Address1 ?? '',
      city: t.Address.City ?? '',
      state: t.Address.State ?? '',
      zip: t.Address.Zip ?? 0,
    } : { name: '', address1: '', city: '', state: '', zip: 0 },
    imageUrl: t.Images?.[0]?.URL ?? undefined,
    primaryContact: t.PrimaryContact?.DisplayName ?? '',
  };
}

export interface M2EventResponse {
  EventId: number;
  EventName: string;
  Status: string;
  EventPrice: number | null;
  Date: string;
  StartTime: string;
  EventCutoff: string;
  ParticipantsCount: number;
  Weapon: { Name: string };
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
