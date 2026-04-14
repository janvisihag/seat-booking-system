import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getWeekDates, formatDate } from '@/lib/booking-logic';
import { isBatchScheduledForDate } from '@/lib/batch-scheduling-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id parameter required' }, { status: 400 });
  }

  try {
    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, squads(batch)')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get this week's dates
    const today = new Date();
    const weekDates = getWeekDates(today);

    // Get user's squad batch
    const { data: squad } = await supabase
      .from('squads')
      .select('batch')
      .eq('id', user.squad_id)
      .single();

    const userBatch = squad?.batch as 1 | 2;

    // Build schedule
    const schedule = weekDates.map((date) => ({
      date: formatDate(date),
      day_name: date.toLocaleString('en-US', { weekday: 'long' }),
      is_scheduled: isBatchScheduledForDate(userBatch, date),
    }));

    // Fetch allocations for the week
    const startDate = formatDate(weekDates[0]);
    const endDate = formatDate(weekDates[weekDates.length - 1]); // Use last index instead of hardcoded 6

    const { data: allocations } = await supabase
      .from('seat_allocations')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('status', 'allocated');

    // Also fetch floater bookings
    const { data: floaterBookings } = await supabase
      .from('floater_bookings')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('status', 'booked');

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        squad_id: user.squad_id,
        batch: userBatch,
      },
      schedule,
      allocations: allocations || [],
      bookings: [...(allocations || []), ...(floaterBookings || [])],
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
