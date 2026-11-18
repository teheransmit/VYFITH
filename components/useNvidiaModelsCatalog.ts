'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  NVIDIA_KNOWN_CATALOG,
  NvidiaModelCatalogItem,
} from '@/lib/nvidiaCatalog';

export function useNvidiaModelsCatalog(nvidiaApiKey?: string) {
  const [models, setModels] = useState<NvidiaModelCatalogItem[]>(NVIDIA_KNOWN_CATALOG);
  const [liveApiCount, setLiveApiCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCatalog = useCallback(
    async (force = false) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/nvidia/models${force ? '?refresh=true' : ''}`,
          {
            cache: 'no-store',
            headers: nvidiaApiKey?.trim()
              ? { 'x-nvidia-api-key': nvidiaApiKey.trim() }
              : undefined,
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            setModels(data.models);
            setLiveApiCount(Number(data.liveApiCount || 0));
          }
        }
      } catch (err) {
        console.warn('[useNvidiaModelsCatalog] Error cargando catálogo NVIDIA:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [nvidiaApiKey]
  );

  useEffect(() => {
    refreshCatalog(false);
  }, [refreshCatalog]);

  const chatModels = models.filter((m) => m.chatCompatible);
  const utilityModels = models.filter((m) => !m.chatCompatible);

  return {
    models,
    chatModels,
    utilityModels,
    liveApiCount,
    totalCount: models.length,
    chatCount: chatModels.length,
    isLoading,
    refreshCatalog,
  };
}
