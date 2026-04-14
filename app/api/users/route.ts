import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { data: users, error } = await supabase.from('users').select('id, name, squad_id, batch');

    if (error) {
      console.error('Supabase error:', error);
      if (error.message.includes('Invalid API key')) {
        return NextResponse.json({ 
          error: 'Database connection error. Please check Supabase configuration.',
          users: [] 
        }, { status: 500 });
      }
      throw error;
    }

    return NextResponse.json({
      users: users || [],
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users. Please check database connection.',
      users: [] 
    }, { status: 500 });
  }
}
