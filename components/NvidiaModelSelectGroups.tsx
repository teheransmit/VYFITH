'use client';

import React from 'react';
import { NvidiaModelCatalogItem } from '@/lib/nvidiaCatalog';

interface NvidiaModelSelectGroupsProps {
  chatModels: NvidiaModelCatalogItem[];
}

const CATEGORY_LABELS: Array<{
  key: NvidiaModelCatalogItem['category'];
  label: string;
}> = [
  { key: 'flagship', label: '🟢 NVIDIA NIM — Flagship & Razonamiento (2026)' },
  { key: 'coding', label: '💻 NVIDIA NIM — Código & Agentes (Self-Heal)' },
  { key: 'fast', label: '⚡ NVIDIA NIM — Ultra-Rápidos / Baja Latencia' },
  { key: 'multimodal', label: '👁️ NVIDIA NIM — Multimodal, Omni & Físico' },
  { key: 'utility', label: '🌐 NVIDIA NIM — Traducción & Especializados' },
];

export default function NvidiaModelSelectGroups({
  chatModels,
}: NvidiaModelSelectGroupsProps) {
  return (
    <>
      <optgroup label="🟢 NVIDIA NIM — Cascada Automática (2026)">
        <option value="nvidia-auto">
          ⚡ NVIDIA NIM Automático (Lightning → GLM 5.3 → Kimi K3.1 → Mistral Large 4 → Nemotron Ultra)
        </option>
      </optgroup>

      {CATEGORY_LABELS.map(({ key, label }) => {
        const items = chatModels.filter((m) => m.category === key);
        if (items.length === 0) return null;
        return (
          <optgroup key={key} label={label}>
            {items.map((m) => (
              <option key={m.id} value={`nvidia:${m.id}`}>
                {m.inLiveApi ? '● ' : '○ '}
                {m.label}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );
}
