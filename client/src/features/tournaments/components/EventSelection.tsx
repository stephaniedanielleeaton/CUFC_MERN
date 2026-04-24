import type { EventDto, SelectedEventDto } from '@cufc/shared';

interface EventSelectionProps {
  readonly events: EventDto[];
  readonly selectedEvents: SelectedEventDto[];
  readonly onSelectionChange: (events: SelectedEventDto[]) => void;
  readonly basePriceInCents: number;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatEventDate(dateStr: string, timeStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  });
  return timeStr ? `${formattedDate} at ${timeStr}` : formattedDate;
}

export function EventSelection({ events, selectedEvents, onSelectionChange, basePriceInCents }: EventSelectionProps) {
  const selectedIds = new Set(selectedEvents.map(e => e.m2EventId));

  const handleToggle = (event: EventDto) => {
    if (selectedIds.has(event.m2EventId)) {
      onSelectionChange(selectedEvents.filter(e => e.m2EventId !== event.m2EventId));
    } else {
      onSelectionChange([
        ...selectedEvents,
        {
          m2EventId: event.m2EventId,
          eventName: event.eventName,
          priceInCents: event.priceInCents,
        },
      ]);
    }
  };

  const eventsTotal = selectedEvents.reduce((sum, e) => sum + e.priceInCents, 0);
  const totalPrice = eventsTotal + basePriceInCents;

  if (!events || events.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No events available for registration.
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {events.map(event => {
          const isSelected = selectedIds.has(event.m2EventId);
          return (
            <label
              key={event.m2EventId}
              className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                isSelected 
                  ? 'border-navy bg-light-navy' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(event)}
                className="mt-1 h-5 w-5 text-navy rounded border-gray-300 focus:ring-navy"
              />
              <div className="flex-grow min-w-0">
                <div className="font-medium text-gray-800">{event.eventName}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {event.weapon} • {formatEventDate(event.date, event.startTime)}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {event.participantsCount} registered
                  {event.participantsCap && ` / ${event.participantsCap} max`}
                </div>
              </div>
              <div className="text-navy font-semibold whitespace-nowrap">
                {formatPrice(event.priceInCents)}
              </div>
            </label>
          );
        })}
      </div>

      {selectedEvents.length >= 1 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="space-y-2 text-sm text-gray-600">
            {basePriceInCents > 0 && (
              <div className="flex justify-between">
                <span>Registration Fee</span>
                <span>{formatPrice(basePriceInCents)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{selectedEvents.length} event{selectedEvents.length === 1 ? '' : 's'}</span>
              <span>{formatPrice(eventsTotal)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="text-xl font-bold text-navy">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
