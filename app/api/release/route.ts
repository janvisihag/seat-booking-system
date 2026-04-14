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

    // Try to find in seat_allocations first (designated seats)
    const { data: allocation, error: allocError } = await supabase
      .from('seat_allocations')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (allocation) {
      // Verify user owns this allocation
      if (allocation.user_id !== user_id) {
        return NextResponse.json(
          { error: 'You can only release your own bookings' },
          { status: 403 }
        );
      }

      // DELETE the allocation instead of marking as released
      // This makes the designated seat available for anyone to book (like a floater)
      const { error: deleteError } = await supabase
        .from('seat_allocations')
        .delete()
        .eq('id', booking_id);

      if (deleteError) throw deleteError;

      // Record as leave for tracking purposes
      const { error: leaveError } = await supabase
        .from('user_leaves')
        .insert({
          user_id: user_id,
          date: allocation.date,
          reason: 'Seat released by user'
        });

      // Ignore duplicate leave errors
      if (leaveError && !leaveError.message.includes('duplicate')) {
        console.error('Error recording leave:', leaveError);
      }

      return NextResponse.json(
        {
          message: 'Designated seat released successfully. This seat is now available for anyone to book.',
          type: 'allocated'
        },
        { status: 200 }
      );
    }

    // If not found in allocations, try floater_bookings
    const { data: floaterBooking, error: floaterError } = await supabase
      .from('floater_bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (floaterBooking) {
      // Verify user owns this booking
      if (floaterBooking.user_id !== user_id) {
        return NextResponse.json(
          { error: 'You can only release your own bookings' },
          { status: 403 }
        );
      }

      // DELETE the floater booking instead of marking as cancelled
      // This allows the seat to be rebooked by anyone
      const { error: deleteError } = await supabase
        .from('floater_bookings')
        .delete()
        .eq('id', booking_id);

      if (deleteError) throw deleteError;

      return NextResponse.json(
        {
          message: 'Floater seat released successfully',
          type: 'floater'
        },
        { status: 200 }
      );
    }

    // Not found in either table
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  } catch (error) {
    console.error('Error releasing seat:', error);
    return NextResponse.json({ error: 'Failed to release seat' }, { status: 500 });
  }
}
