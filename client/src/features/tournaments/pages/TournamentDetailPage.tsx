import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTournament, useRegistration } from '../hooks';
import { EventSelection, RegistrationForm } from '../components';
import { SmallHero } from '../../../components/common/SmallHero';
import type { SelectedEventDto, RegistrationRequestDto } from '@cufc/shared';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

export default function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const m2TournamentId = tournamentId ? Number.parseInt(tournamentId, 10) : undefined;
  const { tournament, loading, error } = useTournament(m2TournamentId);
  const { register, loading: registering, error: regError } = useRegistration();
  const [selectedEvents, setSelectedEvents] = useState<SelectedEventDto[]>([]);
  const [showForm, setShowForm] = useState(false);

  const handleRegistrationSubmit = async (request: RegistrationRequestDto) => {
    try {
      const response = await register(request);
      // Redirect to M2 landing page
      window.location.href = response.paymentUrl;
    } catch {
      // Error is handled by useRegistration hook
    }
  };

  // Check if registration is still open
  const isRegistrationOpen = tournament 
    ? new Date(tournament.registrationCutOff) > new Date() 
    : false;

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <SmallHero pageTitle="Loading..." />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="bg-white min-h-screen">
        <SmallHero pageTitle="Tournament" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
            {error || 'Tournament not found.'}
          </div>
          <Link to="/tournaments" className="text-navy hover:underline">
            ← Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const location = tournament.address?.city && tournament.address?.state
    ? `${tournament.address.city}, ${tournament.address.state}`
    : tournament.address?.city || tournament.address?.state || '';

  const m2Url = `https://meyersquared.com/tournaments/${tournament.m2TournamentId}`;

  return (
    <div className="bg-white min-h-screen">
      <SmallHero pageTitle={tournament.name} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/tournaments" className="text-navy hover:underline text-sm mb-6 inline-block">
          ← Back to Tournaments
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-navy mb-8 text-center md:text-left">{tournament.name}</h1>

        {/* About This Event */}
        <div className="border border-gray-200 p-6 mb-8">
          <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
            About This Event
          </span>
          <div className="mt-4 space-y-3 text-gray-700">
            <div>
              <span className="font-semibold text-navy">Date:</span> {formatDate(tournament.startDate)}
            </div>
            {location && (
              <div>
                <span className="font-semibold text-navy">Location:</span> {location}
              </div>
            )}
          </div>
          {tournament.description && (
            <div 
              className="prose prose-sm max-w-none mt-6 pt-6 border-t border-gray-100 text-gray-600"
              dangerouslySetInnerHTML={{ __html: tournament.description }}
            />
          )}
        </div>

        {/* M2 Link */}
        <div className="border border-gray-200 p-6 mb-8 text-center">
          <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
            Full Event Details
          </span>
          <p className="text-gray-600 mt-4 mb-6">
            View full event details, rules, schedule, rosters, pools, brackets, and results:
          </p>
          <a
            href={m2Url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-navy text-white px-8 py-3 uppercase tracking-wider text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            View on Meyer Squared
          </a>
          <p className="text-sm text-gray-500 mt-6">
            Questions? <Link to="/contact" className="text-navy hover:underline">Contact us</Link>
          </p>
        </div>

        {/* Registration Section */}
        {isRegistrationOpen && tournament.events && tournament.events.length > 0 && (
          <div className="border border-gray-200 p-6 mb-8">
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Registration
            </span>
            
            {!showForm ? (
              <div className="mt-4">
                <p className="text-gray-600 mb-4">Select the events you want to register for:</p>
                <EventSelection
                  events={tournament.events}
                  selectedEvents={selectedEvents}
                  onSelectionChange={setSelectedEvents}
                />
                {selectedEvents.length > 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-6 w-full bg-navy text-white py-3 uppercase tracking-wider text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Continue to Registration
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="text-navy hover:underline text-sm mb-4 inline-block"
                >
                  ← Back to Event Selection
                </button>
                <RegistrationForm
                  m2TournamentId={tournament.m2TournamentId}
                  selectedEvents={selectedEvents}
                  onSubmit={handleRegistrationSubmit}
                  loading={registering}
                  error={regError}
                />
              </div>
            )}
          </div>
        )}

        {/* Registration Closed Notice */}
        {!isRegistrationOpen && (
          <div className="border border-gray-200 p-6 bg-gray-50">
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Registration
            </span>
            <p className="text-gray-600 mt-4">
              Registration for this event has closed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
