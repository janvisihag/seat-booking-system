import { supabase } from './supabase';

/**
 * Seat Release Service
 * Handles releasing seats when users take leave or are absent
 */

export interface UserLeave {
  id: string;
  user_id: string;
  date: string;
  reason?: string;
}

/**
 * Record a user leave for a specific date
 */
export async function recordUserLeave(
  userId: string,
  date: Date,
  reason?: string
): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('user_leaves')
      .insert({
        user_id: userId,
        date: dateStr,
        reason: reason || 'Leave',
      });
    
    if (error && !error.message.includes('duplicate')) {
      console.error('Error recording leave:', error);
      return false;
    }
    
    // Release the seat
    await releaseSeatForUserOnDate(userId, date);
    
    return true;
  } catch (error) {
    console.error('Error in recordUserLeave:', error);
    return false;
  }
}

/**
 * Release a user's allocated seat for a specific date
 * Converts the seat to available/floater status
 */
export async function releaseSeatForUserOnDate(
  userId: string,
  date: Date
): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    // Find the allocation
    const { data: allocation, error: findError } = await supabase
      .from('seat_allocations')
      .select('id, seat_id, squad_id')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .eq('status', 'allocated')
      .single();
    
    if (findError) {
      console.error('Error finding allocation:', findError);
      return false;
    }
    
    if (!allocation) {
      return false;
    }
    
    // Update allocation status to released
    const { error: updateError } = await supabase
      .from('seat_allocations')
      .update({
        status: 'released',
        release_reason: 'User on leave',
      })
      .eq('id', allocation.id);
    
    if (updateError) {
      console.error('Error releasing seat:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in releaseSeatForUserOnDate:', error);
    return false;
  }
}

/**
 * Get user leaves for a date range
 */
export async function getUserLeavesForDateRange(
  startDate: Date,
  endDate: Date
): Promise<UserLeave[]> {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('user_leaves')
    .select('*')
    .gte('date', startStr)
    .lte('date', endStr);
  
  if (error) {
    console.error('Error fetching leaves:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Check if a user has leave on a specific date
 */
export async function hasUserLeavOnDate(userId: string, date: Date): Promise<boolean> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('user_leaves')
    .select('id')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .single();
  
  if (error && error.code === 'PGRST116') {
    return false;
  }
  
  if (error) {
    console.error('Error checking leave:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Cancel a user leave
 */
export async function cancelUserLeave(userId: string, date: Date): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    // Delete the leave record
    const { error } = await supabase
      .from('user_leaves')
      .delete()
      .eq('user_id', userId)
      .eq('date', dateStr);
    
    if (error) {
      console.error('Error cancelling leave:', error);
      return false;
    }
    
    // Note: Seat reallocation would need to happen separately if needed
    return true;
  } catch (error) {
    console.error('Error in cancelUserLeave:', error);
    return false;
  }
}

/**
 * Get released seats for a date
 */
export async function getReleasedSeatsForDate(date: Date): Promise<number[]> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('seat_allocations')
    .select('seat_id')
    .eq('date', dateStr)
    .eq('status', 'released');
  
  if (error) {
    console.error('Error fetching released seats:', error);
    return [];
  }
  
  return data?.map((r: any) => r.seat_id) || [];
}

/**
 * Get all available seats for floater booking (released + floater seats)
 */
export async function getAvailableSeatsForFloaterBooking(date: Date): Promise<number[]> {
  const dateStr = date.toISOString().split('T')[0];
  
  // Get released seats
  const releasedSeats = await getReleasedSeatsForDate(date);
  
  // Get floater seats that aren't booked
  const { data: floaterSeats, error } = await supabase
    .from('seats')
    .select('id')
    .eq('type', 'floater');
  
  if (error) {
    console.error('Error fetching floater seats:', error);
    return releasedSeats;
  }
  
  const floaterIds = floaterSeats?.map((s: any) => s.id) || [];
  
  // Get booked floater seats
  const { data: bookedFloaters, error: bookedError } = await supabase
    .from('floater_bookings')
    .select('seat_id')
    .eq('date', dateStr)
    .eq('status', 'booked');
  
  if (bookedError) {
    console.error('Error fetching booked floaters:', bookedError);
    return [...releasedSeats, ...floaterIds];
  }
  
  const bookedFloaterIds = new Set(bookedFloaters?.map((b: any) => b.seat_id) || []);
  
  return [
    ...releasedSeats,
    ...floaterIds.filter((id: number) => !bookedFloaterIds.has(id)),
  ];
}
