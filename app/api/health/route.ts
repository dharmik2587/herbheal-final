import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'herbheal-compass',
    timestamp: new Date().toISOString(),
    integrations: {
      plantId: Boolean(process.env.PLANT_ID_API_KEY),
      firebase: Boolean(process.env.FIREBASE_PROJECT_ID),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      googleSheets: Boolean(process.env.GOOGLE_SHEET_CSV_URL),
    },
  });
}
