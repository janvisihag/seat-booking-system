import { NextRequest, NextResponse } from 'next/server';
import { addHoliday, removeHoliday, getAllHolidays, isHoliday } from '@/lib/holiday-service';

/**
 * POST /api/holidays
 * Add a new holiday
 * Body: { date, reason? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, reason } = body;
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }
    
    const success = await addHoliday(new Date(date), reason);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to add holiday' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Holiday added',
      date,
      reason: reason || 'Holiday',
    });
  } catch (error) {
    console.error('Error in POST /api/holidays:', error);
    return NextResponse.json(
      { error: 'Failed to add holiday' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/holidays
 * Get all holidays or check if a date is a holiday
 * Query params: date? (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get('date');
    
    if (dateParam) {
      // Check specific date
      const holiday = await isHoliday(new Date(dateParam));
      return NextResponse.json({
        success: true,
        date: dateParam,
        is_holiday: holiday,
      });
    }
    
    // Get all holidays
    const holidays = await getAllHolidays();
    return NextResponse.json({
      success: true,
      holidays,
      count: holidays.length,
    });
  } catch (error) {
    console.error('Error in GET /api/holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/holidays
 * Remove a holiday
 * Body: { date }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }
    
    const success = await removeHoliday(new Date(date));
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove holiday' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Holiday removed',
      date,
    });
  } catch (error) {
    console.error('Error in DELETE /api/holidays:', error);
    return NextResponse.json(
      { error: 'Failed to remove holiday' },
      { status: 500 }
    );
  }
}
