import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { validateBookingEligibility, parseDate } from '@/lib/booking-logic';

interface BookRequest {
  user_id: string;
  seat_id: number;
  date: string;
  booking_time?: string;
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

    // Check if user already has a booking for this date
    const { data: userDayBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user_id)
      .eq('date', date)
      .eq('status', 'booked');

    if (userDayBooking && userDayBooking.length > 0) {
      return NextResponse.json(
        { error: 'You already have a booking for this date. A user can only book one seat per day.' },
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

    // Check if seat is already booked for this date (only active bookings)
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('seat_id', seat_id)
      .eq('date', date)
      .eq('status', 'booked')
      .single();

    if (existingBooking) {
      return NextResponse.json({ error: 'Seat already booked for this date' }, { status: 400 });
    }

    // Check if there's a released booking for this seat and date
    const { data: releasedBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('seat_id', seat_id)
      .eq('date', date)
      .eq('status', 'released')
      .single();

    // Check user permissions for this seat
    const { data: seat } = await supabase.from('seats').select('*').eq('id', seat_id).single();

    if (!seat) {
      return NextResponse.json({ error: 'Seat not found' }, { status: 404 });
    }

    // If seat is designated, user must be from that squad
    if (seat.type === 'designated' && seat.squad_id !== user.squad_id) {
      return NextResponse.json(
        { error: 'You cannot book seats designated for other squads' },
        { status: 400 }
      );
    }

    let newBooking;

    // If there's a released booking, update it instead of creating new
    if (releasedBooking) {
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          user_id,
          status: 'booked',
        })
        .eq('id', releasedBooking.id)
        .select()
        .single();

      if (updateError) throw updateError;
      newBooking = updatedBooking;
    } else {
      // Create new booking
      const { data: createdBooking, error: bookError } = await supabase
        .from('bookings')
        .insert({
          user_id,
          seat_id,
          date,
          status: 'booked',
        })
        .select()
        .single();

      if (bookError) throw bookError;
      newBooking = createdBooking;
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
