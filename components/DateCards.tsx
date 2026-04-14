'use client';

import { Button } from '@/components/ui/button';
import { getWeekDates, formatDate, getDayName } from '@/lib/booking-logic';

interface DateCard {
  date: string;
  day_name: string;
  total_seats: number;
  available_seats: number;
  booked_seats: number;
}

interface DateCardsProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  dateStats: Record<string, DateCard>;
  isLoading?: boolean;
}

export function DateCards({
  selectedDate,
  onDateSelect,
  dateStats,
  isLoading,
}: DateCardsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const weekDates = getWeekDates(today);

  // Only show dates from tomorrow onwards (excluding today)
  const futureDates = weekDates.filter((date) => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly.getTime() >= tomorrow.getTime();
  });

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(futureDates.length, 1), 5)}, minmax(0, 1fr))` }}>
      {futureDates.map((date) => {
        const dateStr = formatDate(date);
        const stats = dateStats[dateStr];
        const isSelected = selectedDate === dateStr;

        return (
          <button
            key={dateStr}
            onClick={() => !isLoading && onDateSelect(dateStr)}
            disabled={isLoading}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="font-semibold text-sm text-gray-700">{getDayName(date)}</div>
            <div className="text-xs text-gray-500 mb-2">{dateStr}</div>
            {stats ? (
              <div className="space-y-1 text-xs">
                <div className="text-green-600">Available: {stats.available_seats}</div>
                <div className="text-red-600">Booked: {stats.booked_seats}</div>
                <div className="text-gray-600">Total: {stats.total_seats}</div>
              </div>
            ) : (
              <div className="text-gray-400">Loading...</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
