import { useParams, Link } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { SmallHero } from '../../../components/common/SmallHero';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const m2TournamentId = tournamentId ? Number.parseInt(tournamentId, 10) : undefined;
  const { tournament, loading, error } = useTournament(m2TournamentId);

  if (loading) {
    return (
      <div className="bg-white min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="space-y-3 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
          <Link to="/tournaments" className="text-Navy hover:underline mt-4 inline-block">
            ← Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="bg-white min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-gray-500">Tournament not found.</div>
          <Link to="/tournaments" className="text-Navy hover:underline mt-4 inline-block">
            ← Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const location = tournament.address?.city && tournament.address?.state
    ? `${tournament.address.city}, ${tournament.address.state}`
    : tournament.address?.city || tournament.address?.state || '';

  return (
    <div className="bg-white min-h-screen">
      <SmallHero pageTitle={tournament.name} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/tournaments" className="text-Navy hover:underline text-sm mb-6 inline-block">
          ← Back to Tournaments
        </Link>

        {/* Tournament Info */}
        <div className="space-y-4 mb-8">
          <div className="text-gray-600">
            <span className="font-medium">Date:</span> {formatDate(tournament.startDate)}
            {tournament.endDate !== tournament.startDate && (
              <> – {formatDate(tournament.endDate)}</>
            )}
          </div>
          {location && (
            <div className="text-gray-600">
              <span className="font-medium">Location:</span> {location}
            </div>
          )}
          {tournament.address && (
            <div className="text-gray-500 text-sm">
              {tournament.address.name && <div>{tournament.address.name}</div>}
              {tournament.address.address1 && <div>{tournament.address.address1}</div>}
              {tournament.address.zip && (
                <div>{tournament.address.city}, {tournament.address.state} {tournament.address.zip}</div>
              )}
            </div>
          )}
          <div className="text-gray-600">
            <span className="font-medium">Registration closes:</span> {formatDate(tournament.registrationCutOff)}
          </div>
          {tournament.primaryContact && (
            <div className="text-gray-600">
              <span className="font-medium">Contact:</span> {tournament.primaryContact}
            </div>
          )}
        </div>

        {/* Description */}
        {tournament.description && (
          <div 
            className="prose prose-sm max-w-none mb-8 text-gray-600"
            dangerouslySetInnerHTML={{ __html: tournament.description }}
          />
        )}

        {/* Events */}
        {tournament.events && tournament.events.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Events</h2>
            <div className="border rounded-lg divide-y">
              {tournament.events.map(event => (
                <div key={event.m2EventId} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">{event.eventName}</div>
                    <div className="text-sm text-gray-500">
                      {event.weapon} • {event.participantsCount} registered
                    </div>
                  </div>
                  <div className="text-gray-600">{formatCurrency(event.priceInCents)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
