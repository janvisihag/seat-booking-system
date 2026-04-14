import { NextRequest, NextResponse } from 'next/server';
import { lockNextDayAllocation, hasAutoLockRunToday } from '@/lib/auto-lock-service';

/**
 * Cron Job Endpoint - Daily Seat Allocation Lock
 * 
 * This endpoint should be called daily at 3 PM by a cron service
 * 
 * Setup Options:
 * 1. Vercel Cron (vercel.json)
 * 2. External Cron Service (cron-job.org, EasyCron, etc.)
 * 3. GitHub Actions
 * 
 * Authorization: Use CRON_SECRET environment variable for security
 */
export async function GET(request: NextRequest) {
  try {
    // Security: Check authorization token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if already run today
    const alreadyRun = await hasAutoLockRunToday();
    if (alreadyRun) {
      return NextResponse.json({
        success: true,
        message: 'Auto-lock already executed today',
        skipped: true,
      });
    }

    // Execute the auto-lock
    const success = await lockNextDayAllocation();

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to execute auto-lock' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Daily allocation lock executed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual testing
 * Allows triggering the cron job manually
 */
export async function POST(request: NextRequest) {
  try {
    // For manual testing, we can be more lenient with auth
    // But still require some form of authentication
    const body = await request.json();
    const { secret } = body;
    
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    
    if (secret !== cronSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Execute the auto-lock (even if already run today - for testing)
    const success = await lockNextDayAllocation();

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to execute auto-lock' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Manual allocation lock executed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in manual trigger:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
