'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SeatGrid } from '@/components/SeatGrid';
import { formatDate } from '@/lib/booking-logic';
import { useUser } from '@/lib/UserContext';
import { User } from 'lucide-react';

interface Seat {
  id: number;
  type: 'designated' | 'floater';
  squad_id: number | null;
  is_booked: boolean;
  booking_id?: string;
}

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedUser } = useUser();

  const [dateParam] = useState(searchParams.get('date') || '');
  const [selectedDate, setSelectedDate] = useState(dateParam);
  const [selectedTime, setSelectedTime] = useState('15:00'); // Default 3 PM
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Fetch seats when date changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSeats = async () => {
      try {
        setLoading(true);
        setMessage('');
        setError('');
        setSelectedSeat(null);

        const res = await fetch(`/api/seats?date=${selectedDate}`);
        const data = await res.json();

        if (data.seats) {
          setSeats(data.seats);
        } else {
          setError('Failed to load seats');
        }
      } catch (err) {
        console.error('Error fetching seats:', err);
        setError('Failed to load seats');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [selectedDate]);

  const handleBookSeat = async () => {
    if (!selectedUser || !selectedSeat || !selectedDate) {
      setError('Please select a user, date, and seat');
      return;
    }

    // Validate time is 3 PM or later
    const [hours] = selectedTime.split(':').map(Number);
    if (hours < 13) {
      setError('Bookings can only be made from 1 PM (13:00) onwards');
      return;
    }

    if (selectedSeat.is_booked) {
      setError('This seat is already booked');
      return;
    }

    if (selectedSeat.type === 'designated' && selectedSeat.squad_id !== selectedUser.squad_id) {
      setError('You can only book seats designated for your squad');
      return;
    }

    try {
      setBookingInProgress(true);
      setMessage('');
      setError('');

      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          seat_id: selectedSeat.id,
          date: selectedDate,
          booking_time: selectedTime,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Seat booked successfully!`);
        setSelectedSeat(null);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setError(data.error || 'Failed to book seat');
      }
    } catch (err) {
      console.error('Error booking seat:', err);
      setError('Failed to book seat');
    } finally {
      setBookingInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Book a Seat</h1>
              <p className="text-gray-600 text-sm mt-1 font-mono">Select date and seat</p>
            </div>
            <Link href="/">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {selectedUser ? (
          <div className="space-y-6">
            {/* Date Input */}
            {/* Date & Time Input */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📅 Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tomorrow onwards only</p>
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🕐 Booking Time</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    min="15:00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">3 PM onwards</p>
                </div> */}
              </div>
            </div>

            {/* Seat Grid */}
            {selectedDate && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Seats</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Your Squad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <span>Floater</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span>Other Squad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Booked</span>
                  </div>
                </div>
                {loading ? (
                  <div className="text-center py-8 text-gray-600">Loading seats...</div>
                ) : (
                  <SeatGrid
                    seats={seats}
                    onSeatClick={setSelectedSeat}
                    selectedSeat={selectedSeat}
                    isLoading={bookingInProgress}
                    userSquad={selectedUser?.squad_id}
                  />
                )}
              </div>
            )}

            {/* Messages */}
            {message && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {message}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleBookSeat}
                disabled={!selectedSeat || bookingInProgress}
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {bookingInProgress ? 'Booking...' : 'Confirm Booking'}
              </Button>
              <Link href="/">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No User Selected</h2>
            <p className="text-gray-600 text-lg mb-6">
              Please select a user from the dashboard to book a seat.
            </p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingPageContent />
    </Suspense>
  );
}
