import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Fetch users with their squad's batch information
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, squad_id, squads(batch)');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch users. Please check database connection.',
        users: [] 
      }, { status: 500 });
    }

    // Transform the data to include batch at the top level
    const transformedUsers = (users || []).map((user: any) => ({
      id: user.id,
      name: user.name,
      squad_id: user.squad_id,
      batch: user.squads?.batch || 1, // Default to batch 1 if not found
    }));

    return NextResponse.json({
      users: transformedUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users. Please check database connection.',
      users: [] 
    }, { status: 500 });
  }
}
