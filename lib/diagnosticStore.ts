/**
 * lib/diagnosticStore.ts
 * In-memory diagnostic store and cross-referencing engine for Next.js routes,
 * next.config.ts redirects/rewrites, and mobile client request tracing.
 */

export interface ConfigRule {
  source: string;
  destination: string;
  permanent?: boolean;
  type: 'redirect' | 'rewrite';
  description?: string;
}

export interface RequestLogEntry {
  id: string;
  timestamp: string;
  method: string;
  pathname: string;
  fullUrl: string;
  ip?: string;
  userAgent?: string;
  contentType?: string;
  bodySnippet?: string;
  status: number;
  is404Candidate: boolean;
  crossReference: {
    matchedRedirect: ConfigRule | null;
    matchedRewrite: ConfigRule | null;
    isCanonicalEndpoint: boolean;
    canonicalSuggestion: string;
    diagnosticExplanation: string;
  };
}

// Canonical endpoints supported by MegaProyecto
export const CANONICAL_HEALTH_ENDPOINTS = [
  {
    path: '/api/sync/health',
    description: 'Endpoint principal canónico (HL7 FHIR R4 + VYFITH_APP)',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  },
  {
    path: '/api/health/sync',
    description: 'Alias canónico estándar para clientes móviles',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  },
  {
    path: '/api/health-connect',
    description: 'Ruta dedicada para Health Connect Android SDK',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  },
  {
    path: '/api/healthconnect',
    description: 'Variante sin guión para compatibilidad con librerías cliente',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  },
  {
    path: '/api/v1/health/sync',
    description: 'Ruta versionada v1 recomendada para Retrofit',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  },
  {
    path: '/api/v1/sync/health',
    description: 'Variante versionada v1 de sincronización',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  },
  {
    path: '/api/biometrics',
    description: 'Ingesta de métricas biométricas brutas',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  },
  {
    path: '/api/healthdata',
    description: 'Alias de paquete com.google.android.apps.healthdata',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  },
  {
    path: '/api/fhir',
    description: 'Observaciones puras HL7 FHIR Observation Bundles',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  },
  {
    path: '/api/finance',
    description: 'Gestor y asistente de finanzas personales (Cajita Nu)',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  },
  {
    path: '/api/scientific-references',
    description: 'Búsqueda de papers biomédicos (OpenAlex & arXiv)',
    supportedMethods: ['GET', 'OPTIONS'],
  },
  {
    path: '/api/diagnostic',
    description: 'Monitor y diagnóstico de rutas, 404s y redirecciones',
    supportedMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  },
];

// Defined redirects in next.config.ts
export const DEFINED_REDIRECTS: ConfigRule[] = [
  {
    source: '/api/v0/:path*',
    destination: '/api/sync/health',
    permanent: false,
    type: 'redirect',
    description: 'Redirige llamadas obsoletas de la API v0 hacia el endpoint unificado',
  },
  {
    source: '/v1/health/:path*',
    destination: '/api/sync/health',
    permanent: false,
    type: 'redirect',
    description: 'Corrige llamadas que omiten el prefijo /api/ en v1/health',
  },
  {
    source: '/v1/sync/:path*',
    destination: '/api/sync/health',
    permanent: false,
    type: 'redirect',
    description: 'Corrige llamadas que omiten el prefijo /api/ en v1/sync',
  },
  {
    source: '/api/legacy/health',
    destination: '/api/sync/health',
    permanent: false,
    type: 'redirect',
    description: 'Redirección de retrocompatibilidad con scripts antiguos',
  },
  {
    source: '/api/health-check',
    destination: '/api/sync/health',
    permanent: false,
    type: 'redirect',
    description: 'Corrige llamadas de healthcheck hacia el monitor de sincronización',
  },
];

// Defined rewrites in next.config.ts
export const DEFINED_REWRITES: ConfigRule[] = [
  {
    source: '/ingest/health',
    destination: '/api/sync/health',
    type: 'rewrite',
    description: 'Reescritura interna transparente para clientes que llaman /ingest/health',
  },
  {
    source: '/ingest',
    destination: '/api/sync/health',
    type: 'rewrite',
    description: 'Reescritura interna para POST raíz de ingesta',
  },
  {
    source: '/sync/health',
    destination: '/api/sync/health',
    type: 'rewrite',
    description: 'Reescritura transparente sin prefijo /api/',
  },
  {
    source: '/health/sync',
    destination: '/api/sync/health',
    type: 'rewrite',
    description: 'Reescritura de ruta canónica móvil sin prefijo /api/',
  },
  {
    source: '/health',
    destination: '/api/sync/health',
    type: 'rewrite',
    description: 'Reescritura de ruta /health hacia el monitor',
  },
];

// Global in-memory log singleton
declare global {
  var __DIAGNOSTIC_LOGS: RequestLogEntry[] | undefined;
}

export function getDiagnosticLogs(): RequestLogEntry[] {
  if (!global.__DIAGNOSTIC_LOGS) {
    global.__DIAGNOSTIC_LOGS = [];
  }
  return global.__DIAGNOSTIC_LOGS;
}

export function clearDiagnosticLogs(): void {
  global.__DIAGNOSTIC_LOGS = [];
}

/**
 * Normaliza y compara rutas para coincidencia simple y comodines tipo :path*
 */
export function matchPattern(pattern: string, path: string): boolean {
  if (pattern === path) return true;
  if (pattern.includes(':path*')) {
    const base = pattern.replace('/:path*', '').replace(':path*', '');
    return path.startsWith(base);
  }
  return false;
}

/**
 * Cruza una ruta entrante contra canonical endpoints, redirects y rewrites
 */
export function crossReferencePath(pathname: string, method = 'GET'): RequestLogEntry['crossReference'] {
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';

  // 1. Verificar si es exactamente un endpoint canónico
  const canonicalMatch = CANONICAL_HEALTH_ENDPOINTS.find(
    (e) => e.path.toLowerCase() === cleanPath.toLowerCase()
  );

  // 2. Verificar coincidencia con Redirecciones de next.config.ts
  const matchedRedirect =
    DEFINED_REDIRECTS.find((rule) => matchPattern(rule.source, cleanPath)) || null;

  // 3. Verificar coincidencia con Reescrituras de next.config.ts
  const matchedRewrite =
    DEFINED_REWRITES.find((rule) => matchPattern(rule.source, cleanPath)) || null;

  // Determinar explicación diagnóstica
  let diagnosticExplanation = '';
  const canonicalSuggestion = '/api/sync/health';

  if (canonicalMatch) {
    diagnosticExplanation = `Ruta válida y canónica registrada (${canonicalMatch.description}). Responde HTTP 200.`;
  } else if (matchedRedirect) {
    diagnosticExplanation = `Esta ruta activa una regla de Redirección HTTP 307 en next.config.ts ('${matchedRedirect.source}' -> '${matchedRedirect.destination}').`;
  } else if (matchedRewrite) {
    diagnosticExplanation = `Esta ruta activa una Reescritura interna transparente en next.config.ts ('${matchedRewrite.source}' -> '${matchedRewrite.destination}'). El servidor la atiende sin cambiar la URL externa.`;
  } else if (cleanPath.includes('health') || cleanPath.includes('sync') || cleanPath.includes('ingest')) {
    diagnosticExplanation = `Ruta no reconocida directamente que contiene términos de sincronización. Dispararía HTTP 404 en el cliente móvil si no se usa la URL canónica: ${canonicalSuggestion}`;
  } else {
    diagnosticExplanation = `Ruta no mapeada en el servidor. Provoca HTTP 404 ('Endpoint no encontrado').`;
  }

  return {
    matchedRedirect,
    matchedRewrite,
    isCanonicalEndpoint: Boolean(canonicalMatch),
    canonicalSuggestion,
    diagnosticExplanation,
  };
}

/**
 * Registra una solicitud entrante en el buffer de diagnósticos
 */
export function recordDiagnosticLog(entry: {
  method: string;
  pathname: string;
  fullUrl?: string;
  ip?: string;
  userAgent?: string;
  contentType?: string;
  bodySnippet?: string;
  status: number;
}): RequestLogEntry {
  const logs = getDiagnosticLogs();
  const crossRef = crossReferencePath(entry.pathname, entry.method);
  const is404 = entry.status === 404 || (!crossRef.isCanonicalEndpoint && !crossRef.matchedRewrite);

  const newEntry: RequestLogEntry = {
    id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    method: entry.method.toUpperCase(),
    pathname: entry.pathname,
    fullUrl: entry.fullUrl || entry.pathname,
    ip: entry.ip || '127.0.0.1',
    userAgent: entry.userAgent || 'Unknown Agent',
    contentType: entry.contentType,
    bodySnippet: entry.bodySnippet ? entry.bodySnippet.slice(0, 300) : undefined,
    status: entry.status,
    is404Candidate: is404,
    crossReference: crossRef,
  };

  // Mantener últimos 100 registros en memoria
  logs.unshift(newEntry);
  if (logs.length > 100) {
    logs.length = 100;
  }

  return newEntry;
}
