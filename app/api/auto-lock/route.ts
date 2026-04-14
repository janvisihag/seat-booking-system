import { NextRequest, NextResponse } from 'next/server';
import { lockNextDayAllocation, isNextDayLocked } from '@/lib/auto-lock-service';

/**
 * POST /api/auto-lock
 * Lock next day's allocation (should be called at 3 PM)
 */
export async function POST(request: NextRequest) {
  try {
    const success = await lockNextDayAllocation();
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to lock next day allocation' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Next day allocation locked',
    });
  } catch (error) {
    console.error('Error in POST /api/auto-lock:', error);
    return NextResponse.json(
      { error: 'Failed to lock allocation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auto-lock
 * Check if a date is locked
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
    
    const locked = await isNextDayLocked(new Date(dateParam));
    
    return NextResponse.json({
      success: true,
      date: dateParam,
      is_locked: locked,
    });
  } catch (error) {
    console.error('Error in GET /api/auto-lock:', error);
    return NextResponse.json(
      { error: 'Failed to check lock status' },
      { status: 500 }
    );
  }
}
