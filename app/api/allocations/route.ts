import { NextRequest, NextResponse } from 'next/server';
import { getScheduledSquadsForDate, getUsersInSquad } from '@/lib/batch-scheduling-service';
import { getAllocationsForDate, getDesignatedSeatsForSquad } from '@/lib/seat-allocation-service';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/allocations
 * Get seat allocations for a specific date
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
    
    const date = new Date(dateParam);
    const allocations = await getAllocationsForDate(date);
    
    // Fetch full details for each allocation
    const details = await Promise.all(
      allocations.map(async (alloc) => {
        const user = await supabase
          .from('users')
          .select('name')
          .eq('id', alloc.user_id)
          .single();
        
        return {
          ...alloc,
          user_name: user.data?.name || 'Unknown',
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      date: dateParam,
      allocations: details,
      total_allocated: details.length,
    });
  } catch (error) {
    console.error('Error in GET /api/allocations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocations' },
      { status: 500 }
    );
  }
}
