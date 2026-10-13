import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'real_calendar_events.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const events = JSON.parse(raw);
      return NextResponse.json({
        success: true,
        account: 'santiagosmitttt@gmail.com',
        events,
      });
    }

    return NextResponse.json({
      success: true,
      account: 'santiagosmitttt@gmail.com',
      events: [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener eventos' },
      { status: 500 }
    );
  }
}
