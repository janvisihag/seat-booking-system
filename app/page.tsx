'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, getWeekDates, getDayName } from '@/lib/booking-logic';
import { getAuth, clearAuth } from '@/lib/auth';
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, LogOut } from 'lucide-react';
import { SeatGrid } from '@/components/SeatGrid';
import { BookingDialog } from '@/components/BookingDialog';
import { Button } from '@/components/ui/button';

interface DateCard {
  date: string;
  day_name: string;
  total_seats: number;
  allocated_seats: number;
  available_seats: number;
}

interface Seat {
  id: number;
  seat_number: number;
  type: 'designated' | 'floater';
  squad_id: number | null;
  status: 'allocated' | 'available' | 'blocked' | 'booked';
  user?: {
    id: string;
    squad_id?: number;
  };
}

interface UserBooking {
  id: string;
  seat_id: number;
  date: string;
  status: string;
  type: 'allocated' | 'floater';
}

export default function Dashboard() {
  const router = useRouter();
  const [auth, setAuth] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [dateStats, setDateStats] = useState<Record<string, DateCard>>({});
  const [seats, setSeats] = useState<Seat[]>([]);
  const [holidays, setHolidays] = useState<Array<{ date: string; reason?: string }>>([]);
  const [userBooking, setUserBooking] = useState<UserBooking | null>(null);
  const [weekBookings, setWeekBookings] = useState<Record<string, UserBooking>>({});
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const authData = getAuth();
    if (!authData || authData.role !== 'user') {
      router.push('/login');
      return;
    }
    setAuth(authData);
    setCurrentWeek(new Date());
    setMounted(true);
  }, [router]);

  // Fetch holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch('/api/holidays');
        const data = await res.json();
        if (data.holidays) {
          setHolidays(data.holidays);
        }
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };

    fetchHolidays();
  }, []);

  // Fetch date stats
  useEffect(() => {
    if (!currentWeek || !mounted || !auth) return;

    const fetchDateStats = async () => {
      try {
        setLoading(true);
        const weekDates = getWeekDates(currentWeek);
        const stats: Record<string, DateCard> = {};
        const bookings: Record<string, UserBooking> = {};
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        for (const date of weekDates) {
          const dateStr = formatDate(date);
          const dayName = getDayName(date);
          
          const dateOnly = new Date(date);
          dateOnly.setHours(0, 0, 0, 0);
          
          if (dateOnly >= tomorrow) {
            const res = await fetch(`/api/seats?date=${dateStr}`);
            const data = await res.json();

            stats[dateStr] = {
              date: dateStr,
              day_name: dayName,
              total_seats: data.total_seats || 0,
              allocated_seats: data.allocated_seats || 0,
              available_seats: data.available_seats || 0,
            };

            // Fetch user's booking for this date
            const bookingRes = await fetch(`/api/user-booking?user_id=${auth.user.id}&date=${dateStr}`);
            const bookingData = await bookingRes.json();
            if (bookingData.booking) {
              bookings[dateStr] = bookingData.booking;
            }
          }
        }

        setDateStats(stats);
        setWeekBookings(bookings);

        if (!selectedDate) {
          const firstAvailableDate = weekDates.find(d => {
            const dateOnly = new Date(d);
            dateOnly.setHours(0, 0, 0, 0);
            return dateOnly >= tomorrow;
          });
          if (firstAvailableDate) {
            setSelectedDate(formatDate(firstAvailableDate));
          }
        }
      } catch (error) {
        console.error('Error fetching date stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDateStats();
  }, [currentWeek, selectedDate, mounted, auth]);

  // Fetch seats and user booking for selected date
  useEffect(() => {
    if (!selectedDate || !auth?.user) return;

    const fetchSeatsAndBooking = async () => {
      try {
        setLoading(true);
        
        // Fetch seats
        const seatsRes = await fetch(`/api/seats?date=${selectedDate}`);
        const seatsData = await seatsRes.json();
        if (seatsData.seats) {
          setSeats(seatsData.seats);
        }

        // Fetch user's booking for this date (checks both allocated and floater)
        const bookingRes = await fetch(`/api/user-booking?user_id=${auth.user.id}&date=${selectedDate}`);
        const bookingData = await bookingRes.json();
        setUserBooking(bookingData.booking || null);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeatsAndBooking();
  }, [selectedDate, auth]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const goToPreviousWeek = () => {
    if (!currentWeek) return;
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    if (!currentWeek) return;
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeat(seat);
    setShowBookingDialog(true);
  };

  const handleBookingSuccess = async () => {
    if (selectedDate && auth?.user) {
      // Refresh seats
      const seatsRes = await fetch(`/api/seats?date=${selectedDate}`);
      const seatsData = await seatsRes.json();
      if (seatsData.seats) setSeats(seatsData.seats);
      
      // Refresh current date booking
      const bookingRes = await fetch(`/api/user-booking?user_id=${auth.user.id}&date=${selectedDate}`);
      const bookingData = await bookingRes.json();
      setUserBooking(bookingData.booking || null);

      // Refresh week bookings
      if (currentWeek) {
        const weekDates = getWeekDates(currentWeek);
        const bookings: Record<string, UserBooking> = {};
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        for (const date of weekDates) {
          const dateStr = formatDate(date);
          const dateOnly = new Date(date);
          dateOnly.setHours(0, 0, 0, 0);
          
          if (dateOnly >= tomorrow) {
            const res = await fetch(`/api/user-booking?user_id=${auth.user.id}&date=${dateStr}`);
            const data = await res.json();
            if (data.booking) {
              bookings[dateStr] = data.booking;
            }
          }
        }
        setWeekBookings(bookings);
      }
    }
    setShowBookingDialog(false);
  };

  const handleCancelBooking = async () => {
    if (!userBooking || !auth?.user) return;

    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const res = await fetch('/api/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: userBooking.id,
          user_id: auth.user.id,
        }),
      });

      if (res.ok) {
        // Refresh current booking
        setUserBooking(null);
        
        // Refresh seats
        if (selectedDate) {
          const seatsRes = await fetch(`/api/seats?date=${selectedDate}`);
          const seatsData = await seatsRes.json();
          if (seatsData.seats) setSeats(seatsData.seats);
        }

        // Refresh week bookings
        if (currentWeek) {
          const weekDates = getWeekDates(currentWeek);
          const bookings: Record<string, UserBooking> = {};
          
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          for (const date of weekDates) {
            const dateStr = formatDate(date);
            const dateOnly = new Date(date);
            dateOnly.setHours(0, 0, 0, 0);
            
            if (dateOnly >= tomorrow) {
              const bookingRes = await fetch(`/api/user-booking?user_id=${auth.user.id}&date=${dateStr}`);
              const bookingData = await bookingRes.json();
              if (bookingData.booking) {
                bookings[dateStr] = bookingData.booking;
              }
            }
          }
          setWeekBookings(bookings);
        }
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  if (!mounted || !currentWeek || !auth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(currentWeek);
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[4]);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const availableDates = weekDates.filter(date => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly >= tomorrow;
  });

  const isHoliday = (dateStr: string) => {
    return holidays.some(h => h.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SeatFlow</h1>
                <p className="text-xs text-gray-500">Welcome, {auth.user?.name}</p>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-3">
              <button
                onClick={goToPreviousWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">
                  {weekStart} - {weekEnd}
                </div>
              </div>
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={goToToday}
                className="ml-2 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Week Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">Week Overview</h2>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${availableDates.length}, minmax(0, 1fr))` }}>
            {availableDates.map((date) => {
              const dateStr = formatDate(date);
              const stats = dateStats[dateStr];
              const isSelected = selectedDate === dateStr;
              const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
              const actualDayIndex = weekDates.findIndex(d => formatDate(d) === dateStr);
              const dayNumber = date.getDate();
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const monthName = monthNames[date.getMonth()];
              const holiday = isHoliday(dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {dayNames[actualDayIndex]}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {monthName} {dayNumber}
                  </div>
                  
                  {holiday && (
                    <div className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full mb-2 font-medium">
                      Holiday
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    {weekBookings[dateStr] ? (
                      <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                        Seat #{weekBookings[dateStr].seat_id}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        {stats ? `${stats.available_seats} free` : 'Loading...'}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Floor Plan */}
        {selectedDate && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid className="w-5 h-5 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Floor Plan — {selectedDate}
              </h2>
            </div>

            <SeatGrid
              seats={seats}
              onSeatClick={handleSeatClick}
              selectedSeat={selectedSeat}
              isLoading={loading}
              userSquad={auth.user?.squad_id}
              isHoliday={isHoliday(selectedDate)}
            />
          </div>
        )}

        {/* User's Booking for Selected Date */}
        {selectedDate && userBooking && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Your Booking for {selectedDate}</h3>
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  userBooking.type === 'allocated' ? 'bg-blue-200' : 'bg-green-200'
                }`}>
                  <span className="text-lg font-bold text-gray-900">
                    {userBooking.seat_id}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Seat #{userBooking.seat_id}</div>
                  <div className="text-sm text-gray-600">
                    {userBooking.type === 'allocated' ? 'Designated Seat' : 'Floater Seat'}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleCancelBooking}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      {showBookingDialog && selectedSeat && auth.user && selectedDate && (
        <BookingDialog
          seat={selectedSeat}
          user={auth.user}
          date={selectedDate}
          onClose={() => {
            setShowBookingDialog(false);
            setSelectedSeat(null);
          }}
          onSuccess={handleBookingSuccess}
          userHasBooking={!!userBooking}
        />
      )}
    </div>
  );
}
