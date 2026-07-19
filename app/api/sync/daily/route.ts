import { NextRequest, NextResponse } from 'next/server';
import { runDailySync } from '@/lib/daily-sync';

// FIX: draft 1's sync endpoint had zero auth — anyone who found the URL
// could trigger it repeatedly and hammer Wikipedia/PubChem/PubMed on your
// behalf. Kept draft 2's CRON_SECRET bearer check.
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  return Boolean(expected) && authHeader === `Bearer ${expected}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await runDailySync();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error) {
    console.error('Daily sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// Convenience GET for manual/browser testing with the same auth check.
// Vercel Cron itself sends GET requests with a special header, not POST —
// see README for the vercel.json note on this.
export async function GET(request: NextRequest) {
  return POST(request);
}
