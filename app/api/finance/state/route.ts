import { NextResponse } from 'next/server';
import { readStoredFinanceState } from '@/lib/financeServerStore';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function GET() {
  const state = readStoredFinanceState();
  return NextResponse.json(
    {
      success: true,
      serverTime: new Date().toISOString(),
      data: state,
    },
    { headers: CORS_HEADERS }
  );
}
