import { NextRequest, NextResponse } from 'next/server';
import { getScheduleInfo } from '@/lib/batch-scheduling-service';
import { getAllocationsForDate } from '@/lib/seat-allocation-service';
import { getFloaterBookingsForDate } from '@/lib/floater-booking-service';
import { isHoliday } from '@/lib/holiday-service';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/seats
 * Get seat information for a specific date
 * Query params: date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }
    
    const date = new Date(dateParam);
    
    // Check if date is a holiday
    const holiday = await isHoliday(date);
    if (holiday) {
      return NextResponse.json({
        success: true,
        date: dateParam,
        is_holiday: true,
        total_seats: 0,
        allocated_seats: 0,
        booked_floaters: 0,
        available_seats: 0,
      });
    }
    
    // Get schedule info
    const scheduleInfo = getScheduleInfo(date);
    if (!scheduleInfo.isWorkingDay) {
      return NextResponse.json({
        success: true,
        date: dateParam,
        is_working_day: false,
        message: 'Weekend - no seats available',
        total_seats: 0,
        allocated_seats: 0,
        booked_floaters: 0,
        available_seats: 0,
      });
    }
    
    // Get all seats
    const { data: allSeats, error: seatsError } = await supabase
      .from('seats')
      .select('*');
    
    if (seatsError) {
      throw new Error(`Failed to fetch seats: ${seatsError.message}`);
    }
    
    const seats = allSeats || [];
    
    // Get allocations for this date
    const allocations = await getAllocationsForDate(date);
    const allocatedSeatIds = new Set(allocations.map((a) => a.seat_id));
    
    // Get floater bookings for this date
    const floaterBookings = await getFloaterBookingsForDate(date);
    const bookedFloaterIds = new Set(floaterBookings.map((b) => b.seat_id));
    
    // Get blocked seats for this date
    const { data: blockedSeats } = await supabase
      .from('seat_blocking')
      .select('seat_id')
      .eq('date', dateParam);
    
    const blockedSeatIds = new Set((blockedSeats || []).map((b: any) => b.seat_id));
    
    // Build seat details
    const seatDetails = seats.map((seat) => {
      let status = 'available';
      let user: any = null;
      
      if (allocatedSeatIds.has(seat.id)) {
        const allocation = allocations.find((a) => a.seat_id === seat.id);
        status = 'allocated';
        user = {
          id: allocation?.user_id,
          squad_id: allocation?.squad_id,
        };
      } else if (bookedFloaterIds.has(seat.id)) {
        status = 'booked';
        const booking = floaterBookings.find((b) => b.seat_id === seat.id);
        user = {
          id: booking?.user_id,
        };
      } else if (blockedSeatIds.has(seat.id)) {
        status = 'blocked';
      }
      
      return {
        id: seat.id,
        seat_number: seat.seat_number,
        type: seat.type,
        squad_id: seat.squad_id,
        status,
        user,
      };
    });
    
    const totalSeats = seats.length;
    const allocatedCount = allocations.length;
    const bookedFloatersCount = floaterBookings.length;
    const blockedCount = blockedSeatIds.size;
    const availableCount = totalSeats - allocatedCount - bookedFloatersCount - blockedCount;
    
    return NextResponse.json({
      success: true,
      date: dateParam,
      total_seats: totalSeats,
      allocated_seats: allocatedCount,
      booked_floaters: bookedFloatersCount,
      blocked_seats: blockedCount,
      available_seats: availableCount,
      seats: seatDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/seats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seats' },
      { status: 500 }
    );
  }
}
