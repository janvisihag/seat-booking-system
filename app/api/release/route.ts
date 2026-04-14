import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface ReleaseRequest {
  booking_id: string;
  user_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReleaseRequest = await request.json();
    const { booking_id, user_id } = body;

    if (!booking_id || !user_id) {
      return NextResponse.json({ error: 'booking_id and user_id are required' }, { status: 400 });
    }

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user owns this booking
    if (booking.user_id !== user_id) {
      return NextResponse.json(
        { error: 'You can only release your own bookings' },
        { status: 403 }
      );
    }

    // Update booking status to released
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'released' })
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(
      {
        message: 'Seat released successfully',
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error releasing seat:', error);
    return NextResponse.json({ error: 'Failed to release seat' }, { status: 500 });
  }
}
