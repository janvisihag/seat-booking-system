import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { validateBookingEligibility, parseDate } from '@/lib/booking-logic';

interface BookRequest {
  user_id: string;
  seat_id: number;
  date: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookRequest = await request.json();
    const { user_id, seat_id, date } = body;

    if (!user_id || !seat_id || !date) {
      return NextResponse.json(
        { error: 'user_id, seat_id, and date are required' },
        { status: 400 }
      );
    }

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if auto-allocation has been done for this date
    // Floater seats can only be booked AFTER auto-allocation is complete
    const { data: autoLock } = await supabase
      .from('auto_locks')
      .select('*')
      .eq('locked_day', date)
      .single();

    if (!autoLock) {
      return NextResponse.json(
        { error: 'Floater seats can only be booked after 3 PM auto-allocation is complete for this date.' },
        { status: 400 }
      );
    }

    // Check if user already has a booking for this date (check both tables)
    const { data: allocation } = await supabase
      .from('seat_allocations')
      .select('*')
      .eq('user_id', user_id)
      .eq('date', date)
      .eq('status', 'allocated')
      .single();

    const { data: floaterBooking } = await supabase
      .from('floater_bookings')
      .select('*')
      .eq('user_id', user_id)
      .eq('date', date)
      .eq('status', 'booked')
      .single();

    if (allocation) {
      return NextResponse.json(
        { error: 'You already have a designated seat allocated for this date. You cannot book a floater seat.' },
        { status: 400 }
      );
    }

    if (floaterBooking) {
      return NextResponse.json(
        { error: 'You already have a floater seat booked for this date.' },
        { status: 400 }
      );
    }

    // Fetch holiday
    const { data: holiday } = await supabase
      .from('holidays')
      .select('*')
      .eq('date', date)
      .single();

    const bookingDate = parseDate(date);

    // Validate booking eligibility
    const validation = validateBookingEligibility(user, bookingDate, !!holiday);

    if (!validation.eligible) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    // Get seat info
    const { data: seat } = await supabase
      .from('seats')
      .select('*')
      .eq('id', seat_id)
      .single();

    if (!seat) {
      return NextResponse.json({ error: 'Seat not found' }, { status: 404 });
    }

    // Check if seat is already booked (check both tables)
    const { data: existingAllocation } = await supabase
      .from('seat_allocations')
      .select('*')
      .eq('seat_id', seat_id)
      .eq('date', date)
      .eq('status', 'allocated')
      .single();

    const { data: existingFloaterBooking } = await supabase
      .from('floater_bookings')
      .select('*')
      .eq('seat_id', seat_id)
      .eq('date', date)
      .eq('status', 'booked')
      .single();

    if (existingAllocation || existingFloaterBooking) {
      return NextResponse.json({ error: 'Seat already booked for this date' }, { status: 400 });
    }

    // Check if seat is blocked
    const { data: blocked } = await supabase
      .from('seat_blocking')
      .select('*')
      .eq('seat_id', seat_id)
      .eq('date', date)
      .single();

    if (blocked) {
      return NextResponse.json({ error: 'Seat is blocked for this date' }, { status: 400 });
    }

    // Book the seat in floater_bookings table
    // This includes:
    // 1. Floater seats (81-90)
    // 2. Released designated seats (1-80 that were cancelled by users)
    // Any available seat can be booked after auto-allocation
    const { data: newBooking, error: bookError } = await supabase
      .from('floater_bookings')
      .insert({
        user_id,
        seat_id,
        date,
        status: 'booked',
      })
      .select()
      .single();

    if (bookError) {
      console.error('Error booking seat:', bookError);
      throw bookError;
    }

    return NextResponse.json(
      {
        message: 'Seat booked successfully',
        booking: newBooking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error booking seat:', error);
    return NextResponse.json({ error: 'Failed to book seat' }, { status: 500 });
  }
}
