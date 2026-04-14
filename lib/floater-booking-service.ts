import { supabase } from './supabase';
import { getAvailableSeatsForFloaterBooking } from './seat-release-service';

/**
 * Floater Seat Booking Service
 * Handles flexible booking for non-designated users and released seats
 */

export interface FloaterBooking {
  id: string;
  date: string;
  seat_id: number;
  user_id?: string;
  status: 'booked' | 'cancelled';
  created_at?: string;
}

/**
 * Book a floater/released seat for a user
 */
export async function bookFloaterSeat(
  userId: string,
  seatId: number,
  date: Date
): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if seat is available
    const available = await getAvailableSeatsForFloaterBooking(date);
    if (!available.includes(seatId)) {
      console.error('Seat is not available for booking');
      return false;
    }
    
    // Book the seat
    const { error } = await supabase
      .from('floater_bookings')
      .insert({
        date: dateStr,
        seat_id: seatId,
        user_id: userId,
        status: 'booked',
      });
    
    if (error && !error.message.includes('duplicate')) {
      console.error('Error booking floater seat:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in bookFloaterSeat:', error);
    return false;
  }
}

/**
 * Cancel a floater booking
 */
export async function cancelFloaterBooking(bookingId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('floater_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    
    if (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in cancelFloaterBooking:', error);
    return false;
  }
}

/**
 * Get floater bookings for a user
 */
export async function getUserFloaterBookings(
  userId: string
): Promise<FloaterBooking[]> {
  const { data, error } = await supabase
    .from('floater_bookings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'booked');
  
  if (error) {
    console.error('Error fetching user floater bookings:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get floater bookings for a date
 */
export async function getFloaterBookingsForDate(date: Date): Promise<FloaterBooking[]> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('floater_bookings')
    .select('*')
    .eq('date', dateStr)
    .eq('status', 'booked');
  
  if (error) {
    console.error('Error fetching floater bookings:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get available floater seats count for a date
 */
export async function getAvailableFloaterSeatsCount(date: Date): Promise<number> {
  const available = await getAvailableSeatsForFloaterBooking(date);
  return available.length;
}

/**
 * Check if a specific seat is booked for a date
 */
export async function isSeatBookedForDate(seatId: number, date: Date): Promise<boolean> {
  const dateStr = date.toISOString().split('T')[0];
  
  // Check in seat allocations
  const { data: allocation } = await supabase
    .from('seat_allocations')
    .select('id')
    .eq('seat_id', seatId)
    .eq('date', dateStr)
    .eq('status', 'allocated')
    .single();
  
  if (allocation) return true;
  
  // Check in floater bookings
  const { data: booking } = await supabase
    .from('floater_bookings')
    .select('id')
    .eq('seat_id', seatId)
    .eq('date', dateStr)
    .eq('status', 'booked')
    .single();
  
  return !!booking;
}

/**
 * Get booking for a specific seat on a date
 */
export async function getBookingForSeat(
  seatId: number,
  date: Date
): Promise<FloaterBooking | null> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('floater_bookings')
    .select('*')
    .eq('seat_id', seatId)
    .eq('date', dateStr)
    .eq('status', 'booked')
    .single();
  
  if (error && error.code === 'PGRST116') {
    return null;
  }
  
  if (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
  
  return data;
}

/**
 * Get all booked floater seats for a date
 */
export async function getBookedFloaterSeatsForDate(date: Date): Promise<number[]> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('floater_bookings')
    .select('seat_id')
    .eq('date', dateStr)
    .eq('status', 'booked');
  
  if (error) {
    console.error('Error fetching booked floaters:', error);
    return [];
  }
  
  return data?.map((b: any) => b.seat_id) || [];
}
