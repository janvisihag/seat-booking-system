'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserSelector } from '@/components/UserSelector';
import { DateCards } from '@/components/DateCards';
import { formatDate, getWeekDates } from '@/lib/booking-logic';
import { useUser } from '@/lib/UserContext';
import { User } from 'lucide-react';

interface DateCard {
  date: string;
  day_name: string;
  total_seats: number;
  available_seats: number;
  booked_seats: number;
}

export default function Dashboard() {
  const { selectedUser, setSelectedUser } = useUser();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateStats, setDateStats] = useState<Record<string, DateCard>>({});
  const [loading, setLoading] = useState(false);

  // Fetch date statistics on component mount
  useEffect(() => {
    const fetchDateStats = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const weekDates = getWeekDates(today);

        // Fetch stats for current week
        const stats: Record<string, DateCard> = {};

        for (const date of weekDates) {
          const dateStr = formatDate(date);
          const dayName = date.toLocaleString('en-US', { weekday: 'long' });

          const res = await fetch(`/api/seats?date=${dateStr}`);
          const data = await res.json();

          stats[dateStr] = {
            date: dateStr,
            day_name: dayName,
            total_seats: data.total_seats || 0,
            available_seats: data.available_seats || 0,
            booked_seats: data.booked_seats || 0,
          };
        }

        setDateStats(stats);

        // Auto-select first available date (today or next available)
        const today2 = new Date();
        today2.setHours(0, 0, 0, 0);
        const firstFutureDate = weekDates.find((d) => {
          const dOnly = new Date(d);
          dOnly.setHours(0, 0, 0, 0);
          return dOnly >= today2;
        });
        if (firstFutureDate) setSelectedDate(formatDate(firstFutureDate));
      } catch (error) {
        console.error('Error fetching date stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDateStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-mono">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seat Booking</h1>
              <p className="text-gray-600 text-sm mt-1 font-mono">Hybrid Office Management System</p>
            </div>
            <UserSelector onSelect={setSelectedUser} selectedUser={selectedUser} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {selectedUser ? (
          <div className="space-y-8">
            {/* User Info Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm card-hover">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-sm text-gray-600 mt-2 font-mono">
                    Squad {selectedUser.squad_id} • Batch {selectedUser.batch}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-blue-600">
                    {selectedUser.batch === 1 ? 'Schedule 1' : 'Schedule 2'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Current Batch</p>
                </div>
              </div>
            </div>

            {/* Date Cards */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Dates</h3>
              <DateCards
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                dateStats={dateStats}
                isLoading={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link href={`/booking?date=${selectedDate}`}>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-medium">
                  Book a Seat
                </Button>
              </Link>
              <Link href={`/schedule?user_id=${selectedUser.id}`}>
                <Button variant="outline" className="px-6 py-2 font-medium">
                  View Schedule
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Seat Booking</h2>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Select a user from the dropdown at the top to get started with booking your seats
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
