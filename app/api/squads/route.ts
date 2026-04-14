import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch all users grouped by squad
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, squad_id, batch')
      .order('squad_id', { ascending: true })
      .order('batch', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching squads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group users by squad_id
    const squadMap: Record<number, any[]> = {};
    users?.forEach(user => {
      if (!squadMap[user.squad_id]) {
        squadMap[user.squad_id] = [];
      }
      squadMap[user.squad_id].push(user);
    });

    // Convert to array format
    const squads = Object.keys(squadMap).map(squadId => ({
      squad_id: parseInt(squadId),
      members: squadMap[parseInt(squadId)],
      member_count: squadMap[parseInt(squadId)].length,
      batch1_count: squadMap[parseInt(squadId)].filter(u => u.batch === 1).length,
      batch2_count: squadMap[parseInt(squadId)].filter(u => u.batch === 2).length,
    }));

    return NextResponse.json({ squads });
  } catch (error: any) {
    console.error('Error in squads API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
