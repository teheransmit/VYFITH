import { NextRequest, NextResponse } from 'next/server';
import { recordDiagnosticLog, crossReferencePath, CANONICAL_HEALTH_ENDPOINTS } from '@/lib/diagnosticStore';
import { handleHealthPost, corsHeaders, handleOptions } from '@/lib/healthIngestHandler';

export async function OPTIONS() {
  return handleOptions();
}

async function handleCatchAll(req: NextRequest, { params }: { params: Promise<{ catchall?: string[] }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.catchall?.join('/') || '';
  const pathname = `/api/${slug}`;
  const method = req.method;

  let body: any = null;
  let bodyText = '';
  if (method === 'POST' || method === 'PUT') {
    try {
      bodyText = await req.text();
      body = JSON.parse(bodyText);
    } catch {
      body = null;
    }
  }

  // Cross-reference this unmapped path
  const crossRef = crossReferencePath(pathname, method);

  // If the request contains Health / Sync biometric payload, salvage and ingest it!
  const isHealthPayload =
    body &&
    (body.source === 'VYFITH_APP' ||
      body.health ||
      body.simulateVyfith ||
      body.readinessScore ||
      body.roomMetrics ||
      body.steps);

  if (isHealthPayload) {
    // Record in diagnostic log as intercepted & rescued
    recordDiagnosticLog({
      method,
      pathname,
      fullUrl: req.url,
      ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent') || 'Mobile Client',
      contentType: req.headers.get('content-type') || 'application/json',
      bodySnippet: bodyText,
      status: 200,
    });

    // Reconstruct request for health handler
    const simulatedReq = new Request(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(body),
    });

    const res = await handleHealthPost(simulatedReq as any);
    return res;
  }

  // Otherwise, record as a 404 candidate
  const logged = recordDiagnosticLog({
    method,
    pathname,
    fullUrl: req.url,
    ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: req.headers.get('user-agent') || 'External Client',
    contentType: req.headers.get('content-type') || undefined,
    bodySnippet: bodyText || undefined,
    status: 404,
  });

  return NextResponse.json(
    {
      success: false,
      error: 'Error MegaProyecto:HTTP 404: Endpoint no encontrado en el servidor',
      requestedPath: pathname,
      method,
      diagnosticId: logged.id,
      explanation: crossRef.diagnosticExplanation,
      canonicalUrl: 'https://ais-pre-2ihzxs7iiz7evj5q52apo5-472843269573.us-east1.run.app/api/sync/health',
      availableCanonicalEndpoints: CANONICAL_HEALTH_ENDPOINTS.map((e) => e.path),
      diagnosticsEndpoint: '/api/diagnostic',
    },
    {
      status: 404,
      headers: corsHeaders,
    }
  );
}

export async function GET(req: NextRequest, context: { params: Promise<{ catchall?: string[] }> }) {
  return handleCatchAll(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ catchall?: string[] }> }) {
  return handleCatchAll(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ catchall?: string[] }> }) {
  return handleCatchAll(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ catchall?: string[] }> }) {
  return handleCatchAll(req, context);
}
