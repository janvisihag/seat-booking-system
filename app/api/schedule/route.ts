import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getWeekDates, isUserAllowedOnDay, formatDate } from '@/lib/booking-logic';

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
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get this week's dates
    const today = new Date();
    const weekDates = getWeekDates(today);

    // Build schedule
    const schedule = weekDates.map((date) => ({
      date: formatDate(date),
      day_name: date.toLocaleString('en-US', { weekday: 'long' }),
      is_scheduled: isUserAllowedOnDay(user, date),
    }));

    // Fetch bookings for the week
    const startDate = formatDate(weekDates[0]);
    const endDate = formatDate(weekDates[4]);

    const { data: bookings } = await supabase
      .from('bookings')
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
        batch: user.batch,
      },
      schedule,
      bookings: bookings || [],
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
