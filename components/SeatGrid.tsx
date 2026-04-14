'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Seat {
  id: number;
  type: 'designated' | 'floater';
  squad_id: number | null;
  is_booked: boolean;
  booking_id?: string;
}

interface SeatGridProps {
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
  selectedSeat: Seat | null;
  isLoading?: boolean;
  userSquad?: number;
}

export function SeatGrid({ seats, onSeatClick, selectedSeat, isLoading, userSquad }: SeatGridProps) {
  const canBookSeat = (seat: Seat): boolean => {
    if (seat.is_booked) return false;
    if (seat.type === 'floater') return true;
    if (userSquad && seat.squad_id === userSquad) return true;
    return false;
  };

  const getSeatColor = (seat: Seat): string => {
    if (seat.is_booked) return 'bg-red-500 hover:bg-red-600';
    if (seat.type === 'floater') return 'bg-yellow-500 hover:bg-yellow-600';
    if (seat.type === 'designated') {
      if (userSquad && seat.squad_id === userSquad) {
        return 'bg-green-500 hover:bg-green-600';
      } else {
        return 'bg-gray-400 hover:bg-gray-500';
      }
    }
    return 'bg-green-500 hover:bg-green-600';
  };

  const getSeatLabel = (seat: Seat): string => {
    if (seat.type === 'floater') return 'F' + seat.id;
    return 'S' + seat.id;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Your Squad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Floater</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Other Squad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Booked</span>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2 p-4 bg-gray-50 rounded-lg">
        {seats.map((seat) => {
          const isBookable = canBookSeat(seat);
          return (
            <button
              key={seat.id}
              onClick={() => !isLoading && isBookable && onSeatClick(seat)}
              disabled={isLoading || !isBookable}
              className={`
                w-12 h-12 rounded font-semibold text-white text-xs
                transition-all duration-200
                ${getSeatColor(seat)}
                ${selectedSeat?.id === seat.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                ${!isBookable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                transform hover:scale-105 active:scale-95
              `}
              title={`${getSeatLabel(seat)} - ${seat.type === 'floater' ? 'Floater' : `Squad ${seat.squad_id}`}${!isBookable && !seat.is_booked ? ' (Cannot book - other squad)' : ''}${seat.is_booked ? ' (Booked)' : ''}`}
            >
              {getSeatLabel(seat)}
            </button>
          );
        })}
      </div>

      {selectedSeat && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p>
            Selected: <strong>{getSeatLabel(selectedSeat)}</strong>
            {selectedSeat.type === 'floater' && ' (Floater Seat)'}
            {selectedSeat.type === 'designated' && ` (Squad ${selectedSeat.squad_id})`}
          </p>
        </div>
      )}
    </div>
  );
}
