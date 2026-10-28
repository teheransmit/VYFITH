import { NextRequest, NextResponse } from 'next/server';
import {
  getDiagnosticLogs,
  clearDiagnosticLogs,
  crossReferencePath,
  recordDiagnosticLog,
  CANONICAL_HEALTH_ENDPOINTS,
  DEFINED_REDIRECTS,
  DEFINED_REWRITES,
} from '@/lib/diagnosticStore';
import { corsHeaders } from '@/lib/healthIngestHandler';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const testPath = searchParams.get('path') || searchParams.get('testPath');
  const clear = searchParams.get('clear') === 'true';

  if (clear) {
    clearDiagnosticLogs();
  }

  // Record this diagnostic check in the log buffer
  recordDiagnosticLog({
    method: 'GET',
    pathname: '/api/diagnostic',
    fullUrl: req.url,
    ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: req.headers.get('user-agent') || 'Browser/Client',
    status: 200,
  });

  const logs = getDiagnosticLogs();
  const candidate404s = logs.filter((l) => l.is404Candidate);
  const redirectMatches = logs.filter((l) => l.crossReference.matchedRedirect);
  const rewriteMatches = logs.filter((l) => l.crossReference.matchedRewrite);
  const canonicalMatches = logs.filter((l) => l.crossReference.isCanonicalEndpoint);

  let pathInspection = null;
  if (testPath) {
    pathInspection = {
      testedPath: testPath,
      ...crossReferencePath(testPath, 'POST'),
    };
  }

  return NextResponse.json(
    {
      success: true,
      service: 'MegaProyecto Routing & 404 Diagnostics Engine',
      serverTime: new Date().toISOString(),
      summary: {
        totalRequestsLogged: logs.length,
        potential404sDetected: candidate404s.length,
        redirectMatchesCount: redirectMatches.length,
        rewriteMatchesCount: rewriteMatches.length,
        canonicalMatchesCount: canonicalMatches.length,
      },
      diagnosticsGuide: {
        why404Occurs:
          "El error 'HTTP 404: Endpoint no encontrado' ocurre cuando un cliente móvil (como Retrofit en VYFITH_APP) invoca un host no resoluble (localhost/api.megaproyecto.com) o una ruta que no coincide con ninguno de los endpoints canónicos o reescrituras de next.config.ts.",
        canonicalUrlToUse:
          'https://ais-pre-2ihzxs7iiz7evj5q52apo5-472843269573.us-east1.run.app/api/sync/health',
        retrofitBaseUrlRule:
          "La Base URL en Retrofit DEBE terminar en slash '/' (ej: 'https://ais-pre-...run.app/'). Si la Base URL no tiene '/', Retrofit descarta el subdirectorio y produce un error 404.",
      },
      pathInspection,
      nextConfigCrossReference: {
        definedRedirects: DEFINED_REDIRECTS,
        definedRewrites: DEFINED_REWRITES,
        canonicalEndpoints: CANONICAL_HEALTH_ENDPOINTS,
      },
      recentRequestLogs: logs.slice(0, 30),
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const testPath = body.path || body.testPath || body.endpoint;

    if (testPath) {
      const evaluation = crossReferencePath(testPath, body.method || 'POST');
      const is404 = !evaluation.isCanonicalEndpoint && !evaluation.matchedRewrite;

      const logged = recordDiagnosticLog({
        method: (body.method || 'POST').toUpperCase(),
        pathname: testPath,
        fullUrl: req.url,
        ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || body.userAgent || 'External Client/Test',
        contentType: req.headers.get('content-type') || 'application/json',
        bodySnippet: JSON.stringify(body),
        status: is404 ? 404 : 200,
      });

      return NextResponse.json(
        {
          success: true,
          message: is404
            ? "Ruta evaluada: Generaría 'HTTP 404: Endpoint no encontrado en el servidor'"
            : 'Ruta evaluada: Válida o redirigida/reescrita exitosamente por next.config.ts',
          evaluation: logged.crossReference,
          loggedEntry: logged,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // Si es un log directo genérico
    const recorded = recordDiagnosticLog({
      method: 'POST',
      pathname: body.pathname || '/api/diagnostic',
      fullUrl: req.url,
      ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent') || 'Diagnostic-Logger',
      contentType: req.headers.get('content-type') || undefined,
      bodySnippet: JSON.stringify(body),
      status: 200,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Entrada de diagnóstico registrada correctamente',
        entry: recorded,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Error procesando solicitud diagnóstica',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE() {
  clearDiagnosticLogs();
  return NextResponse.json(
    {
      success: true,
      message: 'Historial de registros de diagnóstico vaciado con éxito.',
    },
    { status: 200, headers: corsHeaders }
  );
}
