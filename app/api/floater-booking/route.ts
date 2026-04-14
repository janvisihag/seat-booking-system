import { NextRequest, NextResponse } from 'next/server';
import { bookFloaterSeat, cancelFloaterBooking } from '@/lib/floater-booking-service';
import { getAvailableSeatsForFloaterBooking } from '@/lib/seat-release-service';

/**
 * POST /api/floater-booking
 * Book a floater seat
 * Body: { user_id, seat_id, date }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, seat_id, date } = body;
    
    if (!user_id || !seat_id || !date) {
      return NextResponse.json(
        { error: 'user_id, seat_id, and date are required' },
        { status: 400 }
      );
    }
    
    const success = await bookFloaterSeat(user_id, seat_id, new Date(date));
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to book floater seat' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Floater seat booked successfully',
      user_id,
      seat_id,
      date,
    });
  } catch (error) {
    console.error('Error in POST /api/floater-booking:', error);
    return NextResponse.json(
      { error: 'Failed to book floater seat' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/floater-booking
 * Cancel a floater booking
 * Body: { booking_id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id } = body;
    
    if (!booking_id) {
      return NextResponse.json(
        { error: 'booking_id is required' },
        { status: 400 }
      );
    }
    
    const success = await cancelFloaterBooking(booking_id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking_id,
    });
  } catch (error) {
    console.error('Error in DELETE /api/floater-booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/floater-booking
 * Get available floater seats for a date
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
    
    const available = await getAvailableSeatsForFloaterBooking(new Date(dateParam));
    
    return NextResponse.json({
      success: true,
      date: dateParam,
      available_seats: available,
      available_count: available.length,
    });
  } catch (error) {
    console.error('Error in GET /api/floater-booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available seats' },
      { status: 500 }
    );
  }
}
