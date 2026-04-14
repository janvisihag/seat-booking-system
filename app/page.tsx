'use client';

import { useState, useEffect } from 'react';
import { UserSearch } from '@/components/UserSearch';
import { SeatGrid } from '@/components/SeatGrid';
import { BookingDialog } from '@/components/BookingDialog';
import { MyBookings } from '@/components/MyBookings';
import { formatDate, getWeekDates, getDayName } from '@/lib/booking-logic';
import { useUser } from '@/lib/UserContext';
import { ChevronLeft, ChevronRight, Calendar, Users, Building2 } from 'lucide-react';

interface DateCard {
  date: string;
  day_name: string;
  total_seats: number;
  available_seats: number;
  booked_seats: number;
}

interface Seat {
  id: number;
  type: 'designated' | 'floater';
  squad_id: number | null;
  is_booked: boolean;
  booking_id?: string;
}

interface Holiday {
  id: string;
  date: string;
}

export default function Dashboard() {
  const { selectedUser, setSelectedUser } = useUser();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [dateStats, setDateStats] = useState<Record<string, DateCard>>({});
  const [seats, setSeats] = useState<Seat[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize current week only on client side
  useEffect(() => {
    setCurrentWeek(new Date());
    setMounted(true);
  }, []);

  // Fetch holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch('/api/holidays');
        const data = await res.json();
        setHolidays(data.holidays || []);
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };
    fetchHolidays();
  }, []);

  // Fetch date statistics when currentWeek changes
  useEffect(() => {
    if (!currentWeek) return;

    const fetchDateStats = async () => {
      try {
        setLoading(true);
        const weekDates = getWeekDates(currentWeek);
        const stats: Record<string, DateCard> = {};
        
        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const date of weekDates) {
          const dateStr = formatDate(date);
          const dayName = getDayName(date);
          
          // Only fetch stats for today and future dates
          const dateOnly = new Date(date);
          dateOnly.setHours(0, 0, 0, 0);
          
          if (dateOnly >= today) {
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
        }

        setDateStats(stats);

        // Auto-select first available date (today or later)
        if (!selectedDate) {
          const firstAvailableDate = weekDates.find(d => {
            const dateOnly = new Date(d);
            dateOnly.setHours(0, 0, 0, 0);
            return dateOnly >= today;
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
  }, [currentWeek, selectedDate]);

  // Fetch seats when date changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSeats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/seats?date=${selectedDate}`);
        const data = await res.json();

        if (data.seats) {
          setSeats(data.seats);
        }
      } catch (err) {
        console.error('Error fetching seats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [selectedDate]);

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

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || !currentWeek) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <p className="text-gray-600">Loading SeatFlow...</p>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(currentWeek);
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[4]);
  
  // Filter dates to show only today and future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const availableDates = weekDates.filter(date => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly >= today;
  });

  const isHoliday = (dateStr: string) => {
    return holidays.some(h => h.date === dateStr);
  };

  const handleSeatClick = (seat: Seat) => {
    if (!selectedUser) {
      alert('Please select a user first!');
      return;
    }
    setSelectedSeat(seat);
    setShowBookingDialog(true);
  };

  const handleBookingSuccess = () => {
    // Refresh seats data
    if (selectedDate) {
      fetch(`/api/seats?date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          if (data.seats) {
            setSeats(data.seats);
          }
        });
    }
    
    // Refresh date stats
    if (currentWeek) {
      const weekDates = getWeekDates(currentWeek);
      weekDates.forEach(date => {
        const dateStr = formatDate(date);
        fetch(`/api/seats?date=${dateStr}`)
          .then(res => res.json())
          .then(data => {
            setDateStats(prev => ({
              ...prev,
              [dateStr]: {
                date: dateStr,
                day_name: getDayName(date),
                total_seats: data.total_seats || 0,
                available_seats: data.available_seats || 0,
                booked_seats: data.booked_seats || 0,
              }
            }));
          });
      });
    }
    
    // Trigger refresh of MyBookings component by updating a key
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SeatFlow</h1>
                <p className="text-xs text-gray-500">Smart Seat Booking System</p>
              </div>
            </div>

            {/* Date Range and Navigation */}
            <div className="flex-1 flex items-center justify-center gap-3">
              <button
                onClick={goToPreviousWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Previous week"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">
                  {weekStart} - {weekEnd}, {currentWeek.getFullYear()}
                </div>
                <div className="text-xs text-gray-500">Cycle Week 1</div>
              </div>
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Next week"
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

          {/* Week Days */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${availableDates.length}, minmax(0, 1fr))` }}>
            {availableDates.map((date, index) => {
              const dateStr = formatDate(date);
              const stats = dateStats[dateStr];
              const isSelected = selectedDate === dateStr;
              const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
              const actualDayIndex = weekDates.findIndex(d => formatDate(d) === dateStr);
              const dayNumber = date.getDate();
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const monthName = monthNames[date.getMonth()];
              const holiday = isHoliday(dateStr);
              
              const availabilityPercent = stats && stats.total_seats > 0 ? 
                Math.round((stats.available_seats / stats.total_seats) * 100) : 0;

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
                    <div className="text-xs text-gray-600 font-medium">B1</div>
                    <div className="flex items-center gap-1">
                      <div className="text-sm font-bold text-cyan-600">
                        {availabilityPercent}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats ? `${stats.available_seats} free, ${stats.booked_seats} used` : 'Loading...'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {availableDates.map((date, index) => {
            const dateStr = formatDate(date);
            const isActive = selectedDate === dateStr;
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            const actualDayIndex = weekDates.findIndex(d => formatDate(d) === dateStr);
            const dayNumber = date.getDate();
            
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {dayNames[actualDayIndex]} {dayNumber}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Floor Plan */}
            {selectedDate && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Floor Plan — Monday, {selectedDate}
                  </h2>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded"></div>
                    <span className="text-gray-600">Designated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
                    <span className="text-gray-600">Floater (Available)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
                    <span className="text-gray-600">Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></div>
                    <span className="text-gray-600">Vacation/Release</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 border border-gray-400 rounded"></div>
                    <span className="text-gray-600">Blocked</span>
                  </div>
                </div>

                <SeatGrid
                  seats={seats}
                  onSeatClick={handleSeatClick}
                  selectedSeat={selectedSeat}
                  isLoading={loading}
                  userSquad={selectedUser?.squad_id}
                  isHoliday={isHoliday(selectedDate)}
                />
              </div>
            )}
          </div>

          {/* Squad Schedule Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Select User</h3>
              <UserSearch onSelect={setSelectedUser} selectedUser={selectedUser} />
              
              {selectedUser && (
                <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <div className="text-xs text-cyan-700">
                    <div className="font-semibold mb-1">Selected User</div>
                    <div>Squad {selectedUser.squad_id} • Batch {selectedUser.batch}</div>
                  </div>
                </div>
              )}
            </div>

            {/* My Bookings */}
            <MyBookings key={refreshKey} user={selectedUser} />

            {/* Squad Schedule */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Squad Schedule — Week 1</h3>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((squad, index) => {
                  const memberCounts = [8, 6, 7, 9, 8, 7, 8, 6, 9, 7];
                  const seatRanges = [
                    '1-8', '9-16', '17-24', '25-32', '33-40',
                    '41-48', '49-56', '57-64', '65-72', '73-80'
                  ];
                  const squadNumber = index + 1;
                  
                  return (
                    <div key={squad} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">Squad {squad}</h4>
                        <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs rounded-full font-medium">
                          Batch {index < 5 ? '1' : '2'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1 mb-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dayIndex) => (
                          <div
                            key={day}
                            className={`text-xs text-center py-1 rounded font-medium ${
                              (index < 5 && dayIndex < 3) || (index >= 5 && dayIndex >= 3)
                                ? 'bg-cyan-100 text-cyan-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        Seats: {seatRanges[index]} • {memberCounts[index]} members
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      {showBookingDialog && selectedSeat && selectedUser && selectedDate && (
        <BookingDialog
          seat={selectedSeat}
          user={selectedUser}
          date={selectedDate}
          onClose={() => {
            setShowBookingDialog(false);
            setSelectedSeat(null);
          }}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}