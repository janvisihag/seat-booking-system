import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user in auth_users table
    const { data: authUser, error } = await supabase
      .from('auth_users')
      .select('*, users(*)')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !authUser) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Get user's squad info if regular user
    let userData = null;
    if (authUser.role === 'user' && authUser.user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('*, squads(batch)')
        .eq('id', authUser.user_id)
        .single();

      userData = user ? {
        id: user.id,
        name: user.name,
        squad_id: user.squad_id,
        batch: user.squads?.batch || 1,
      } : null;
    }

    return NextResponse.json({
      success: true,
      role: authUser.role,
      username: authUser.username,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
