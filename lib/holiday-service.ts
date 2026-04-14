import { supabase } from './supabase';

/**
 * Holiday Service
 * Manages holidays and restricts bookings on those days
 */

export interface Holiday {
  id: string;
  date: string;
  reason?: string;
}

/**
 * Add a holiday
 */
export async function addHoliday(date: Date, reason?: string): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('holidays')
      .insert({
        date: dateStr,
        reason: reason || 'Holiday',
      });
    
    if (error && !error.message.includes('duplicate')) {
      console.error('Error adding holiday:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in addHoliday:', error);
    return false;
  }
}

/**
 * Remove a holiday
 */
export async function removeHoliday(date: Date): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('date', dateStr);
    
    if (error) {
      console.error('Error removing holiday:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in removeHoliday:', error);
    return false;
  }
}

/**
 * Check if a date is a holiday
 */
export async function isHoliday(date: Date): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('holidays')
      .select('id')
      .eq('date', dateStr)
      .single();
    
    if (error && error.code === 'PGRST116') {
      return false;
    }
    
    if (error) {
      console.error('Error checking holiday:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in isHoliday:', error);
    return false;
  }
}

/**
 * Get all holidays for a date range
 */
export async function getHolidaysForDateRange(
  startDate: Date,
  endDate: Date
): Promise<Holiday[]> {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .gte('date', startStr)
    .lte('date', endStr);
  
  if (error) {
    console.error('Error fetching holidays:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get all holidays
 */
export async function getAllHolidays(): Promise<Holiday[]> {
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Error fetching all holidays:', error);
    return [];
  }
  
  return data || [];
}
