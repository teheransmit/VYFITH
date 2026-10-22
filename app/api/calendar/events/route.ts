import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const jsonPath = path.join(process.cwd(), 'data', 'real_calendar_events.json');
  const url = new URL(req.url);
  const shouldRefresh = url.searchParams.get('refresh') === 'true';

  // Si se solicita refrescar en vivo o el archivo no existe
  if (shouldRefresh || !fs.existsSync(jsonPath)) {
    try {
      const gcalendarCmd = `"C:\\Users\\Luis\\.gemini\\config\\plugins\\gcalendar\\skills\\gcalendar\\scripts\\gcalendar.cmd" readonly events --max 100 --json`;
      const { stdout } = await execAsync(gcalendarCmd, {
        maxBuffer: 15 * 1024 * 1024,
        timeout: 15000,
      });

      if (stdout && stdout.trim().startsWith('[')) {
        const freshEvents = JSON.parse(stdout.trim());
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
      // Caída elegante a la copia local si la ejecución CLI tarda o falla
    }
  }

  // Lectura rápida de caché local
  try {
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
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
