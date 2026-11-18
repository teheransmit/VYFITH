import { NextRequest, NextResponse } from 'next/server';
import {
  classifyDynamicNvidiaModel,
  NVIDIA_KNOWN_CATALOG,
  NvidiaModelCatalogItem,
} from '@/lib/nvidiaCatalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cachedResponse: {
  fetchedAt: number;
  liveCount: number;
  models: NvidiaModelCatalogItem[];
} | null = null;

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get('refresh') === 'true';
  const nvidiaKey =
    req.headers.get('x-nvidia-api-key')?.trim() ||
    process.env.NVIDIA_API_KEY?.trim() ||
    '';

  if (
    !forceRefresh &&
    cachedResponse &&
    Date.now() - cachedResponse.fetchedAt < CACHE_TTL_MS
  ) {
    return NextResponse.json({
      success: true,
      cached: true,
      liveApiCount: cachedResponse.liveCount,
      totalCount: cachedResponse.models.length,
      chatModelsCount: cachedResponse.models.filter((m) => m.chatCompatible).length,
      models: cachedResponse.models,
      fetchedAt: new Date(cachedResponse.fetchedAt).toISOString(),
    });
  }

  let liveIds: string[] = [];
  let liveApiOk = false;
  let liveApiError: string | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(nvidiaKey ? { Authorization: `Bearer ${nvidiaKey}` } : {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        liveIds = json.data
          .map((item: { id?: string }) => item.id)
          .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);
        liveApiOk = true;
      }
    } else {
      liveApiError = `HTTP ${res.status} (${res.statusText})`;
    }
  } catch (err: unknown) {
    liveApiError = (err as Error)?.message || 'Error consultando /v1/models';
  }

  const mergedMap = new Map<string, NvidiaModelCatalogItem>();

  // 1. Insertar todos los modelos vivos devueltos por https://integrate.api.nvidia.com/v1/models
  for (const id of liveIds) {
    const item = classifyDynamicNvidiaModel(id);
    mergedMap.set(item.id.toLowerCase(), item);
  }

  // 2. Completar con modelos adicionales activos de https://build.nvidia.com/models (si no vinieron en el listado sin auth)
  for (const known of NVIDIA_KNOWN_CATALOG) {
    const key = known.id.toLowerCase();
    if (!mergedMap.has(key)) {
      mergedMap.set(key, { ...known, inLiveApi: false });
    }
  }

  // Ordenar: chatCompatible primero, luego por categoría (flagship -> coding -> fast -> multimodal -> utility), luego inLiveApi
  const catOrder: Record<NvidiaModelCatalogItem['category'], number> = {
    flagship: 1,
    coding: 2,
    fast: 3,
    multimodal: 4,
    utility: 5,
  };

  const models = Array.from(mergedMap.values()).sort((a, b) => {
    if (a.chatCompatible !== b.chatCompatible) return a.chatCompatible ? -1 : 1;
    if (catOrder[a.category] !== catOrder[b.category]) {
      return catOrder[a.category] - catOrder[b.category];
    }
    if (Boolean(a.inLiveApi) !== Boolean(b.inLiveApi)) {
      return a.inLiveApi ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  });

  if (liveApiOk) {
    cachedResponse = {
      fetchedAt: Date.now(),
      liveCount: liveIds.length,
      models,
    };
  }

  return NextResponse.json({
    success: true,
    cached: false,
    liveApiOk,
    liveApiError,
    liveApiCount: liveIds.length,
    totalCount: models.length,
    chatModelsCount: models.filter((m) => m.chatCompatible).length,
    models,
    fetchedAt: new Date().toISOString(),
  });
}
