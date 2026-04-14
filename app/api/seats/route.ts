import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { formatDate, parseDate } from '@/lib/booking-logic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');

  if (!dateStr) {
    return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
  }

  try {
    // Get all seats
    const { data: seats, error: seatsError } = await supabase.from('seats').select('*');

    if (seatsError) {
      console.error('Supabase error:', seatsError);
      if (seatsError.message.includes('Invalid API key')) {
        return NextResponse.json({ 
          error: 'Database connection error. Please check Supabase configuration.',
          date: dateStr,
          total_seats: 0,
          available_seats: 0,
          booked_seats: 0,
          seats: []
        }, { status: 500 });
      }
      throw seatsError;
    }

    // Get bookings for the specific date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', dateStr)
      .eq('status', 'booked');

    if (bookingsError) {
      console.error('Bookings error:', bookingsError);
      // Continue with empty bookings if there's an error
    }

    // Map bookings to seat IDs
    const bookedSeatIds = new Set(bookings?.map((b) => b.seat_id) || []);

    // Enrich seat data with booking status
    const enrichedSeats = seats?.map((seat) => ({
      ...seat,
      is_booked: bookedSeatIds.has(seat.id),
      booking_id: bookings?.find((b) => b.seat_id === seat.id)?.id,
    }));

    return NextResponse.json({
      date: dateStr,
      total_seats: enrichedSeats?.length || 0,
      available_seats: (enrichedSeats?.filter((s) => !s.is_booked) || []).length,
      booked_seats: bookedSeatIds.size,
      seats: enrichedSeats,
    });
  } catch (error) {
    console.error('Error fetching seats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch seats. Please check database connection.',
      date: dateStr,
      total_seats: 0,
      available_seats: 0,
      booked_seats: 0,
      seats: []
    }, { status: 500 });
  }
}
