import { IM2Service, M2AddPersonData } from './IM2Service';
import { TournamentDetailDto, ClubDto } from '../../dto';

export class M2ServiceStub implements IM2Service {
  private readonly stubTournaments: TournamentDetailDto[] = [
    {
      m2TournamentId: 150,
      name: 'Looking Sharpe 2026',
      description: '<p>Test tournament description</p>',
      startDate: '2026-05-16',
      endDate: '2026-05-16',
      registrationCutOff: '2026-05-15',
      events: [
        {
          m2EventId: 200,
          eventName: 'Marginalized Genders Single Rapier',
          priceInCents: 0,
          date: '2026-05-16',
          startTime: '12:00:00',
          participantsCount: 7,
          participantsCap: 24,
          weapon: 'MG Single Rapier',
        },
        {
          m2EventId: 201,
          eventName: 'Marginalized Genders Sword and Buckler',
          priceInCents: 0,
          date: '2026-05-16',
          startTime: '12:00:00',
          participantsCount: 6,
          participantsCap: 24,
          weapon: 'MG Sword & Buckler',
        },
        {
          m2EventId: 202,
          eventName: 'Marginalized Genders Longsword',
          priceInCents: 0,
          date: '2026-05-16',
          startTime: '14:00:00',
          participantsCount: 10,
          participantsCap: 24,
          weapon: 'MG Longsword',
        },
      ],
      address: {
        name: 'Columbus United Fencing Club',
        address1: '6475 E Main St Suite #111',
        city: 'Reynoldsburg',
        state: 'OH',
        zip: '43068',
      },
    },
  ];

  private readonly stubClubs: ClubDto[] = [
    { m2ClubId: 10, name: 'Columbus United Fencing Club' },
    { m2ClubId: 1, name: 'Test Club A' },
    { m2ClubId: 2, name: 'Test Club B' },
  ];

  public addedPersons: { eventId: number; person: M2AddPersonData }[] = [];

  async getClubTournaments(): Promise<TournamentDetailDto[]> {
    return this.stubTournaments;
  }

  async getTournament(tournamentId: number): Promise<TournamentDetailDto | null> {
    return this.stubTournaments.find(t => t.m2TournamentId === tournamentId) || null;
  }

  async getAllClubs(): Promise<ClubDto[]> {
    return this.stubClubs;
  }

  async addPersonToEvent(eventId: number, person: M2AddPersonData): Promise<void> {
    this.addedPersons.push({ eventId, person });
    console.log(`[M2 STUB] Added person to event ${eventId}:`, person);
  }

  clearAddedPersons(): void {
    this.addedPersons = [];
  }
}
