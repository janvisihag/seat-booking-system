import { supabase } from './supabase';
import { getScheduledSquadsForDate, getUsersInSquad } from './batch-scheduling-service';

/**
 * Seat Allocation Service
 * Handles automatic allocation of designated seats to scheduled squads' users
 */

export interface SeatAllocation {
  id: string;
  date: string;
  seat_id: number;
  user_id: string;
  squad_id: number;
  status: 'allocated' | 'released' | 'blocked';
  release_reason?: string;
}

/**
 * Get designated seats for a squad (8 seats per squad)
 */
export function getDesignatedSeatsForSquad(squadId: number): number[] {
  const baseIndex = squadId - 1;
  const startSeat = baseIndex * 8 + 1;
  return Array.from({ length: 8 }, (_, i) => startSeat + i);
}

/**
 * Allocate seats for a specific date
 * Automatically assigns designated seats to scheduled squads' users
 */
export async function allocateSeatsForDate(date: Date): Promise<boolean> {
  try {
    // Format date in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    console.log(`[allocateSeatsForDate] Allocating for: ${dateStr}`);
    
    // Get scheduled squads for this date
    const scheduledSquads = await getScheduledSquadsForDate(date);
    
    if (scheduledSquads.length === 0) {
      console.log(`No squads scheduled for ${dateStr}`);
      return false;
    }
    
    console.log(`Scheduled squads for ${dateStr}:`, scheduledSquads);
    
    const allocations: any[] = [];
    
    // For each scheduled squad
    for (const squadId of scheduledSquads) {
      // Get users in squad
      const users = await getUsersInSquad(squadId);
      
      // Get designated seats for squad
      const seats = getDesignatedSeatsForSquad(squadId);
      
      // Create allocations: 1 user = 1 seat
      for (let i = 0; i < Math.min(users.length, seats.length); i++) {
        allocations.push({
          date: dateStr,
          seat_id: seats[i],
          user_id: users[i].id,
          squad_id: squadId,
          status: 'allocated',
        });
      }
    }
    
    // Insert allocations
    if (allocations.length > 0) {
      const { error } = await supabase
        .from('seat_allocations')
        .insert(allocations);
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Error allocating seats:', error);
        return false;
      }
    }
    
    // Block seats for non-scheduled squads
    await blockSeatsForNonScheduledSquads(dateStr, scheduledSquads);
    
    return true;
  } catch (error) {
    console.error('Error in allocateSeatsForDate:', error);
    return false;
  }
}

/**
 * Block designated seats for squads not scheduled on this date
 */
async function blockSeatsForNonScheduledSquads(
  dateStr: string,
  scheduledSquads: number[]
): Promise<void> {
  try {
    // Get all squads
    const { data: allSquads, error: squadsError } = await supabase
      .from('squads')
      .select('id');
    
    if (squadsError) {
      console.error('Error fetching squads:', squadsError);
      return;
    }
    
    const allSquadIds = allSquads?.map((s: any) => s.id) || [];
    const nonScheduledSquads = allSquadIds.filter((id: number) => !scheduledSquads.includes(id));
    
    // Block all seats for non-scheduled squads
    const blockings: any[] = [];
    for (const squadId of nonScheduledSquads) {
      const seats = getDesignatedSeatsForSquad(squadId);
      for (const seatId of seats) {
        blockings.push({
          date: dateStr,
          seat_id: seatId,
          reason: `Squad ${squadId} not scheduled`,
        });
      }
    }
    
    if (blockings.length > 0) {
      const { error } = await supabase
        .from('seat_blocking')
        .insert(blockings);
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Error blocking seats:', error);
      }
    }
  } catch (error) {
    console.error('Error in blockSeatsForNonScheduledSquads:', error);
  }
}

/**
 * Get all allocations for a specific date
 */
export async function getAllocationsForDate(date: Date): Promise<SeatAllocation[]> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('seat_allocations')
    .select('*')
    .eq('date', dateStr)
    .eq('status', 'allocated');
  
  if (error) {
    console.error('Error fetching allocations:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get allocation for a specific user on a specific date
 */
export async function getAllocationForUserOnDate(
  userId: string,
  date: Date
): Promise<SeatAllocation | null> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('seat_allocations')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .eq('status', 'allocated')
    .single();
  
  if (error) {
    // Not found is okay
    if (error.code !== 'PGRST116') {
      console.error('Error fetching allocation:', error);
    }
    return null;
  }
  
  return data;
}

/**
 * Get all allocated users for a date
 */
export async function getAllocatedUsersForDate(date: Date): Promise<any[]> {
  const dateStr = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('seat_allocations')
    .select('user_id')
    .eq('date', dateStr)
    .eq('status', 'allocated');
  
  if (error) {
    console.error('Error fetching allocated users:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get available allocated seats (designated) for a date
 */
export async function getAvailableDesignatedSeatsForDate(date: Date): Promise<number[]> {
  const dateStr = date.toISOString().split('T')[0];
  
  // Get all allocated seats
  const { data: allocated, error: allocError } = await supabase
    .from('seat_allocations')
    .select('seat_id')
    .eq('date', dateStr)
    .eq('status', 'allocated');
  
  if (allocError) {
    console.error('Error fetching allocated seats:', allocError);
    return [];
  }
  
  const allocatedSeatIds = new Set(allocated?.map((a: any) => a.seat_id) || []);
  
  // Get all designated seats
  const { data: seats, error: seatsError } = await supabase
    .from('seats')
    .select('id')
    .eq('type', 'designated');
  
  if (seatsError) {
    console.error('Error fetching seats:', seatsError);
    return [];
  }
  
  return (seats || [])
    .map((s: any) => s.id)
    .filter((id: number) => !allocatedSeatIds.has(id));
}
