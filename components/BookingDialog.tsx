'use client';

import { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';

interface Seat {
  id: number;
  type: 'designated' | 'floater';
  squad_id: number | null;
  is_booked: boolean;
}

interface User {
  id: string;
  name: string;
  squad_id: number;
  batch: number;
}

interface BookingDialogProps {
  seat: Seat;
  user: User;
  date: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingDialog({ seat, user, date, onClose, onSuccess }: BookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBooking = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          seat_id: seat.id,
          date: date,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to book seat');
      }
    } catch (err) {
      console.error('Error booking seat:', err);
      setError('Failed to book seat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canBook = () => {
    if (seat.is_booked) return false;
    if (seat.type === 'floater') return true;
    if (seat.squad_id === user.squad_id) return true;
    return false;
  };

  const isBookable = canBook();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Booking</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Seat Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Seat Number</div>
                <div className="font-semibold text-gray-900">#{seat.id}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Type</div>
                <div className="font-semibold text-gray-900">
                  {seat.type === 'floater' ? 'Floater' : `Squad ${seat.squad_id}`}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Date</div>
                <div className="font-semibold text-gray-900">{date}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">User</div>
                <div className="font-semibold text-gray-900">{user.name}</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-red-900 mb-1">Booking Failed</div>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          {/* Warning for non-bookable seats */}
          {!isBookable && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-900 mb-1">Cannot Book</div>
                <div className="text-sm text-yellow-700">
                  {seat.is_booked
                    ? 'This seat is already booked.'
                    : 'You can only book seats designated for your squad or floater seats.'}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {!loading && !error && isBookable && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-green-900 mb-1">Ready to Book</div>
                <div className="text-sm text-green-700">
                  Click confirm to book this seat for {date}.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBooking}
            disabled={loading || !isBookable}
            className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Booking...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm Booking
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}