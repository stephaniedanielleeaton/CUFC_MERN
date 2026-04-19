import { Link } from 'react-router-dom';
import { useTournaments } from '../hooks/useTournaments';
import { SmallHero } from '../../../components/common/SmallHero';
import type { TournamentDetailDto } from '@cufc/shared';

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

function formatDateParts(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return { month: '', day: 0, ordinal: '', year: '' };
  }
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear().toString();
  const ordinal = day === 1 || day === 21 || day === 31 ? 'st' 
    : day === 2 || day === 22 ? 'nd' 
    : day === 3 || day === 23 ? 'rd' : 'th';
  return { month, day, ordinal, year };
}

function formatCutoffDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TournamentRow({ tournament }: { tournament: TournamentDetailDto }) {
  const start = formatDateParts(tournament.startDate);
  const location = tournament.address?.city && tournament.address?.state
    ? `${tournament.address.city}, ${tournament.address.state}`
    : tournament.address?.city || tournament.address?.state || '';
  const cutoffDate = formatCutoffDate(tournament.registrationCutOff);

  return (
    <Link
      to={`/tournaments/${tournament.m2TournamentId}`}
      className="group block border-t border-gray-200 py-5 hover:bg-gray-50 transition-colors"
    >
      {/* Mobile layout */}
      <div className="flex gap-4 md:hidden items-center">
        <div className="w-14 flex-shrink-0 text-center">
          <div className="text-gray-400 text-xs">{start.month}</div>
          <div className="text-2xl font-light text-gray-700">
            {start.day}<sup className="text-sm">{start.ordinal}</sup>
          </div>
          <div className="text-gray-400 text-xs">{start.year}</div>
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="text-base font-medium text-gray-800 group-hover:text-navy">
            {tournament.name}
          </h3>
          {location && (
            <div className="text-xs text-gray-500 mt-1">{location}</div>
          )}
        </div>
        <div className="flex-shrink-0 text-gray-400 group-hover:text-navy transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex items-start gap-8">
        <div className="w-20 flex-shrink-0 text-center">
          <div className="text-gray-400 text-sm">{start.month}</div>
          <div className="text-3xl font-light text-gray-700">
            {start.day}<sup className="text-lg">{start.ordinal}</sup>
          </div>
          <div className="text-gray-400 text-sm">{start.year}</div>
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="text-lg font-medium text-gray-800 group-hover:text-navy transition-colors">
            {tournament.name}
          </h3>
          {tournament.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {stripHtml(tournament.description)}
            </p>
          )}
          <div className="text-sm text-gray-400 mt-2 flex items-center gap-1">
            <span>+</span>
            <span>Event Details</span>
          </div>
        </div>
        <div className="w-40 flex-shrink-0 text-right space-y-1">
          {location && (
            <div className="text-sm text-gray-500">{location}</div>
          )}
          {cutoffDate && (
            <div className="text-xs text-gray-400">
              Reg. closes {cutoffDate}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function TournamentListPage() {
  const { tournaments, loading, error } = useTournaments();

  if (loading) {
    return (
      <div className="bg-white min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-100 rounded w-1/4 mx-auto" />
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-8 py-6 border-t border-gray-100">
                  <div className="w-20 space-y-2">
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-8 bg-gray-100 rounded" />
                  </div>
                  <div className="flex-grow space-y-2">
                    <div className="h-5 bg-gray-100 rounded w-2/3" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                  </div>
                </div>
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
        </div>
      </div>
    );
  }

  // Normalize to start of day to avoid timezone edge cases
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Filter by startDate and sort chronologically
  const upcoming = tournaments
    .filter(t => {
      const startDate = new Date(t.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const past = tournaments
    .filter(t => {
      const startDate = new Date(t.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate < today;
    })
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); // Most recent first

  return (
    <div className="bg-white min-h-screen">
      <SmallHero pageTitle="Tournaments" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Upcoming */}
        <h2 className="text-lg font-light text-gray-500 mb-4">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No upcoming tournaments at this time.</p>
        ) : (
          <div>
            {upcoming.map(t => (
              <TournamentRow key={t.m2TournamentId} tournament={t} />
            ))}
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-light text-gray-400 mb-4">Past Tournaments</h2>
            <div className="opacity-50">
              {past.map(t => (
                <TournamentRow key={t.m2TournamentId} tournament={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
