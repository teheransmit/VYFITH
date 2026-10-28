import { NextRequest } from 'next/server';
import { handleHealthGet, handleHealthPost, handleOptions } from '@/lib/healthIngestHandler';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  return handleHealthGet();
}

export async function POST(req: NextRequest) {
  return handleHealthPost(req);
}
