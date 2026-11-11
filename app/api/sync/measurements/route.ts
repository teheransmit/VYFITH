import { NextRequest, NextResponse } from 'next/server';
import { getBodyMeasurements, saveBodyMeasurement } from '@/lib/bodyMeasurementsStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const measurements = getBodyMeasurements();
    return NextResponse.json(
      {
        success: true,
        count: measurements.length,
        latest: measurements[measurements.length - 1] || null,
        data: measurements,
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching measurements' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const saved = saveBodyMeasurement(body);

    return NextResponse.json(
      {
        success: true,
        message: 'Medidas corporales guardadas y procesadas exitosamente',
        data: saved,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error saving body measurements' },
      { status: 500, headers: corsHeaders }
    );
  }
}
