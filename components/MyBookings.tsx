'use client';

import { useState, useEffect } from 'react';
import { Calendar, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

interface Booking {
  id: string;
  seat_id: number;
  date: string;
  status: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  squad_id: number;
  batch: number;
}

interface MyBookingsProps {
  user: User | null;
}

export function MyBookings({ user }: MyBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }

    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/schedule?user_id=${user.id}`);
      const data = await res.json();

      if (res.ok) {
        // Filter only active bookings for today and future
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeBookings = (data.bookings || []).filter((b: Booking) => {
          const bookingDate = new Date(b.date);
          bookingDate.setHours(0, 0, 0, 0);
          return b.status === 'booked' && bookingDate >= today;
        });

        setBookings(activeBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (bookingId: string, date: string) => {
    if (!user) return;

    // Confirm before releasing
    if (!confirm(`Are you sure you want to release the booking for ${date}?`)) {
      return;
    }

    try {
      setReleasing(bookingId);
      setMessage(null);

      const res = await fetch('/api/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          user_id: user.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Booking released successfully!' });
        // Refresh bookings
        fetchBookings();
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to release booking' });
      }
    } catch (error) {
      console.error('Error releasing booking:', error);
      setMessage({ type: 'error', text: 'Failed to release booking' });
    } finally {
      setReleasing(null);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          My Bookings
        </h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">Select a user to view bookings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          My Bookings
        </h3>
        {bookings.length > 0 && (
          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded-full font-medium">
            {bookings.length} active
          </span>
        )}
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${
            message.type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-1">No active bookings</p>
          <p className="text-xs text-gray-500">Book a seat to see it here</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {bookings.map((booking) => {
            const isReleasing = releasing === booking.id;
            const bookingDate = new Date(booking.date);
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dayName = dayNames[bookingDate.getDay()];
            const monthName = monthNames[bookingDate.getMonth()];
            const dayNumber = bookingDate.getDate();

            return (
              <div
                key={booking.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-cyan-700">
                          {booking.seat_id}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          Seat #{booking.seat_id}
                        </div>
                        <div className="text-xs text-gray-600">
                          {dayName}, {monthName} {dayNumber}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {booking.date}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRelease(booking.id, booking.date)}
                    disabled={isReleasing}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Release booking"
                  >
                    {isReleasing ? (
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> You can release bookings anytime before the scheduled date. 
          Released seats become available for others to book.
        </p>
      </div>
    </div>
  );
}