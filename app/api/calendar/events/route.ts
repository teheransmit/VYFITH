import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let lastLiveFetchMs = 0;

export async function GET(req: NextRequest) {
  const jsonPath = path.join(process.cwd(), 'data', 'real_calendar_events.json');
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get('refresh') === 'true';
  const nowMs = Date.now();
  // Siempre refresca en vivo desde Google Calendar si pasaron >5s o si se pide refresh=true
  const shouldRefresh = forceRefresh || !fs.existsSync(jsonPath) || nowMs - lastLiveFetchMs > 5000;

  if (shouldRefresh) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endWindow = new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString();
      const gcalendarCmd = `"C:\\Users\\Luis\\.gemini\\config\\plugins\\gcalendar\\skills\\gcalendar\\scripts\\gcalendar.cmd" readonly events --start "${startOfMonth}" --end "${endWindow}" --max 250 --json`;
      const { stdout } = await execAsync(gcalendarCmd, {
        maxBuffer: 15 * 1024 * 1024,
        timeout: 15000,
      });

      const cleanedOut = (stdout || '').replace(/^\uFEFF/, '').trim();
      if (cleanedOut.startsWith('[')) {
        const freshEvents = JSON.parse(cleanedOut);
        lastLiveFetchMs = Date.now();
        // Guardar copia local limpia en data/real_calendar_events.json
        fs.writeFileSync(jsonPath, JSON.stringify(freshEvents, null, 2), 'utf8');

        return NextResponse.json(
          {
            success: true,
            account: 'santiagosmitttt@gmail.com',
            refreshed: true,
            timestamp: new Date().toISOString(),
            events: freshEvents,
          },
          {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              Pragma: 'no-cache',
              Expires: '0',
            },
          }
        );
      }
    } catch (execErr: any) {
      console.warn('Live gcalendar fetch failed, falling back to local file:', execErr?.message || execErr);
    }
  }

  // Lectura rápida de caché local
  try {
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '');
      const events = JSON.parse(raw);
      return NextResponse.json(
        {
          success: true,
          account: 'santiagosmitttt@gmail.com',
          refreshed: false,
          events,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        account: 'santiagosmitttt@gmail.com',
        refreshed: false,
        events: [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener eventos' },
      { status: 500 }
    );
  }
}
