import { NextRequest, NextResponse } from 'next/server';
import { recordUserLeave, getReleasedSeatsForDate } from '@/lib/seat-release-service';

/**
 * POST /api/leaves
 * Record a user leave
 * Body: { user_id, date, reason? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, date, reason } = body;
    
    if (!user_id || !date) {
      return NextResponse.json(
        { error: 'user_id and date are required' },
        { status: 400 }
      );
    }
    
    const success = await recordUserLeave(user_id, new Date(date), reason);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to record leave' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Leave recorded and seat released',
      user_id,
      date,
    });
  } catch (error) {
    console.error('Error in POST /api/leaves:', error);
    return NextResponse.json(
      { error: 'Failed to record leave' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leaves
 * Get released seats for a date
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
    
    const releasedSeats = await getReleasedSeatsForDate(new Date(dateParam));
    
    return NextResponse.json({
      success: true,
      date: dateParam,
      released_seats: releasedSeats,
      released_count: releasedSeats.length,
    });
  } catch (error) {
    console.error('Error in GET /api/leaves:', error);
    return NextResponse.json(
      { error: 'Failed to fetch released seats' },
      { status: 500 }
    );
  }
}
