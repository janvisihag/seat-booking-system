import { supabase } from './supabase';
import { allocateSeatsForDate } from './seat-allocation-service';

/**
 * Auto-Lock Service
 * Tracks and enforces 3 PM daily auto-lock of next day's seat allocation
 * 
 * IMPORTANT: This should run daily at 3 PM via cron job
 * Manual trigger available via API for testing
 */

export interface AutoLock {
  id: string;
  lock_date: string;
  locked_day: string;
  locked_at: string;
}

/**
 * Check if next day's seats are locked
 */
export async function isNextDayLocked(currentDate: Date): Promise<boolean> {
  try {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('auto_locks')
      .select('id')
      .eq('locked_day', nextDateStr)
      .single();
    
    if (error && error.code === 'PGRST116') {
      return false;
    }
    
    if (error) {
      console.error('Error checking lock:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in isNextDayLocked:', error);
    return false;
  }
}

/**
 * Lock next day's allocation (create auto lock record)
 * This should be called at 3 PM daily
 */
export async function lockNextDayAllocation(): Promise<boolean> {
  try {
    // Get ACTUAL current date in local timezone (not hardcoded April 15)
    const now = new Date();
    
    // Create a clean date object for today (no time component)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = formatDateLocal(today);
    
    // Get next WORKING day (skip weekends)
    const nextDate = getNextWorkingDay(today);
    const nextDateStr = formatDateLocal(nextDate);
    
    // Log with actual current timestamp
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    console.log(`[${timestamp}] ACTUAL Current date: ${todayStr} (${now.toDateString()})`);
    console.log(`[${timestamp}] Allocating seats for next working day: ${nextDateStr}`);
    
    // First, allocate seats if not already done
    const allocated = await allocateSeatsForDate(nextDate);
    
    if (!allocated) {
      console.error('Failed to allocate seats');
      return false;
    }
    
    // Record the lock
    const { error } = await supabase
      .from('auto_locks')
      .insert({
        lock_date: todayStr,
        locked_day: nextDateStr,
      });
    
    if (error && !error.message.includes('duplicate')) {
      console.error('Error creating auto lock:', error);
      return false;
    }
    
    console.log(`✅ Locked allocation for ${nextDateStr}`);
    return true;
  } catch (error) {
    console.error('Error in lockNextDayAllocation:', error);
    return false;
  }
}

/**
 * Format date to YYYY-MM-DD in local timezone
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if it's 3 PM time to run auto-lock
 */
export function shouldRunAutoLock(): boolean {
  const now = new Date();
  return now.getHours() >= 15 && now.getHours() < 16; // Between 3 PM and 4 PM
}

/**
 * Get next working day (skip weekends)
 */
export function getNextWorkingDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  
  // Skip weekends
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

/**
 * Check if auto lock has already run today
 */
export async function hasAutoLockRunToday(): Promise<boolean> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = formatDateLocal(today);
    
    const { data, error } = await supabase
      .from('auto_locks')
      .select('id') 
      .eq('lock_date', todayStr)
      .single();
    
    if (error && error.code === 'PGRST116') {
      return false;
    }
    
    if (error) {
      console.error('Error checking if auto lock ran:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in hasAutoLockRunToday:', error);
    return false;
  }
}

/**
 * Get all auto locks for a date range
 */
export async function getAutoLocksForDateRange(
  startDate: Date,
  endDate: Date
): Promise<AutoLock[]> {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('auto_locks')
    .select('*')
    .gte('lock_date', startStr)
    .lte('lock_date', endStr);
  
  if (error) {
    console.error('Error fetching auto locks:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Manual unlock (admin only) - remove an auto lock
 */
export async function manualUnlock(lockedDay: Date): Promise<boolean> {
  try {
    const lockedDayStr = lockedDay.toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('auto_locks')
      .delete()
      .eq('locked_day', lockedDayStr);
    
    if (error) {
      console.error('Error unlocking:', error);
      return false;
    }
    
    console.log(`Unlocked allocation for ${lockedDayStr}`);
    return true;
  } catch (error) {
    console.error('Error in manualUnlock:', error);
    return false;
  }
}
