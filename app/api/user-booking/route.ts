import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const date = searchParams.get('date');

  if (!userId || !date) {
    return NextResponse.json(
      { error: 'user_id and date are required' },
      { status: 400 }
    );
  }

  try {
    // Check seat_allocations first
    const { data: allocation } = await supabase
      .from('seat_allocations')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('status', 'allocated')
      .single();

    if (allocation) {
      return NextResponse.json({
        booking: {
          id: allocation.id,
          seat_id: allocation.seat_id,
          date: allocation.date,
          status: allocation.status,
          type: 'allocated',
        },
      });
    }

    // Check floater_bookings
    const { data: floaterBooking } = await supabase
      .from('floater_bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('status', 'booked')
      .single();

    if (floaterBooking) {
      return NextResponse.json({
        booking: {
          id: floaterBooking.id,
          seat_id: floaterBooking.seat_id,
          date: floaterBooking.date,
          status: floaterBooking.status,
          type: 'floater',
        },
      });
    }

    // No booking found
    return NextResponse.json({ booking: null });
  } catch (error) {
    console.error('Error fetching user booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}
