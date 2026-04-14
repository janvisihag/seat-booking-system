'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/booking-logic';
import { useUser } from '@/lib/UserContext';
import { User } from 'lucide-react';

interface User {
  id: string;
  name: string;
  squad_id: number;
  batch: number;
}

interface ScheduleDay {
  date: string;
  day_name: string;
  is_scheduled: boolean;
}

interface Booking {
  id: string;
  user_id: string;
  seat_id: number;
  date: string;
  status: string;
}

function SchedulePageContent() {
  const { selectedUser } = useUser();

  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch schedule when user changes
  useEffect(() => {
    if (!selectedUser) return;

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/schedule?user_id=${selectedUser.id}`);
        const data = await res.json();

        if (res.ok) {
          setSchedule(data.schedule || []);
          setBookings(data.bookings || []);
        } else {
          setError(data.error || 'Failed to load schedule');
        }
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError('Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedUser]);

  const handleReleaseBooking = async (bookingId: string) => {
    if (!selectedUser) return;

    try {
      const res = await fetch('/api/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          user_id: selectedUser.id,
        }),
      });

      if (res.ok) {
        // Refresh schedule
        const scheduleRes = await fetch(`/api/schedule?user_id=${selectedUser.id}`);
        const data = await scheduleRes.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Error releasing booking:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Weekly Schedule</h1>
              <p className="text-gray-600 text-sm mt-1 font-mono">View your weekly schedule and bookings</p>
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
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading schedule...</div>
            ) : (
              <>
                {/* User Info */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm card-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                      <p className="text-sm text-gray-600 mt-1 font-mono">
                        Squad {selectedUser.squad_id} • Batch {selectedUser.batch}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {schedule.map((day) => {
                      const dayBooking = bookings.find((b) => b.date === day.date);
                      return (
                        <div
                          key={day.date}
                          className={`
                            p-4 rounded-lg border-2 transition-colors
                            ${
                              day.is_scheduled
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                            }
                          `}
                        >
                          <div className="font-semibold text-sm text-gray-900">{day.day_name}</div>
                          <div className="text-xs text-gray-600 mb-2 font-mono">{day.date}</div>
                          {day.is_scheduled ? (
                            <div className="text-xs">
                              {dayBooking ? (
                                <span className="text-green-700 font-medium">
                                  Seat {dayBooking.seat_id}
                                </span>
                              ) : (
                                <span className="text-orange-700">No Booking</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-600">Off Schedule</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bookings */}
                {bookings.length > 0 && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Bookings</h3>
                    <div className="space-y-2">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg card-hover"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              Seat {booking.seat_id} — {booking.date}
                            </p>
                            <p className="text-xs text-gray-600">Status: {booking.status}</p>
                          </div>
                          <Button
                            onClick={() => handleReleaseBooking(booking.id)}
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Release
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No User Selected</h2>
            <p className="text-gray-600 text-lg mb-6">
              Please select a user from the dashboard to view their schedule.
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

export default function SchedulePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchedulePageContent />
    </Suspense>
  );
}
