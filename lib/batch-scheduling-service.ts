import { supabase } from './supabase';

/**
 * Batch Scheduling Service
 * Determines if a batch is scheduled for a given date
 * 
 * Schedule Logic:
 * Batch 1: Week 1 (Mon-Wed), Week 2 (Thu-Fri)
 * Batch 2: Week 1 (Thu-Fri), Week 2 (Mon-Wed)
 * Weekends are non-working days
 */

interface ScheduleInfo {
  batch: 1 | 2;
  weekType: 'week1' | 'week2';
  dayOfWeek: number;
  isWorkingDay: boolean;
  scheduledBatches: (1 | 2)[];
}

/**
 * Get the week type for a given date (Week 1 or Week 2 of the 2-week cycle)
 * Weeks start from July 1st each year
 */
export function getWeekType(date: Date): 'week1' | 'week2' {
  const year = date.getFullYear();
  const julyFirst = new Date(year, 6, 1); // July 1st
  
  const diff = date.getTime() - julyFirst.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNumber = Math.floor(diff / oneWeek);
  
  return weekNumber % 2 === 0 ? 'week1' : 'week2';
}

/**
 * Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Check if a day is a working day (Mon-Fri)
 */
function isWorkingDay(dayOfWeek: number): boolean {
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Get scheduled batches for a given date
 */
export function getScheduledBatchesForDate(date: Date): (1 | 2)[] {
  const dayOfWeek = getDayOfWeek(date);
  const weekType = getWeekType(date);
  
  // Non-working days (weekends)
  if (!isWorkingDay(dayOfWeek)) {
    return [];
  }
  
  // Monday-Wednesday (days 1-3)
  if (dayOfWeek >= 1 && dayOfWeek <= 3) {
    return weekType === 'week1' ? [1] : [2];
  }
  
  // Thursday-Friday (days 4-5)
  if (dayOfWeek >= 4 && dayOfWeek <= 5) {
    return weekType === 'week1' ? [2] : [1];
  }
  
  return [];
}

/**
 * Check if a specific batch is scheduled for a date
 */
export function isBatchScheduledForDate(batch: 1 | 2, date: Date): boolean {
  return getScheduledBatchesForDate(date).includes(batch);
}

/**
 * Get squads scheduled for a date
 */
export async function getScheduledSquadsForDate(date: Date): Promise<number[]> {
  const scheduledBatches = getScheduledBatchesForDate(date);
  
  if (scheduledBatches.length === 0) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('squads')
    .select('id')
    .in('batch', scheduledBatches);
  
  if (error) {
    console.error('Error fetching squads:', error);
    return [];
  }
  
  return data?.map((squad: any) => squad.id) || [];
}

/**
 * Get users in a squad
 */
export async function getUsersInSquad(squadId: number): Promise<any[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('squad_id', squadId);
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get schedule info for a date
 */
export function getScheduleInfo(date: Date): ScheduleInfo {
  const dayOfWeek = getDayOfWeek(date);
  const weekType = getWeekType(date);
  const working = isWorkingDay(dayOfWeek);
  
  return {
    batch: weekType === 'week1' ? (dayOfWeek <= 3 ? 1 : 2) : (dayOfWeek <= 3 ? 2 : 1),
    weekType,
    dayOfWeek,
    isWorkingDay: working,
    scheduledBatches: working ? getScheduledBatchesForDate(date) : [],
  };
}

/**
 * Check if today at 3 PM has passed (for auto-lock check)
 */
export function has3PMPassed(date: Date): boolean {
  const now = new Date();
  const target = new Date(date);
  target.setHours(15, 0, 0, 0);
  
  return now >= target;
}

/**
 * Check if it's currently 3 PM or past 3 PM (within a time window)
 */
export function isAt3PM(): boolean {
  const now = new Date();
  return now.getHours() >= 15;
}
