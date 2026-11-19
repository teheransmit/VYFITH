import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { resolveConfiguredAiKeys } from '@/lib/multiAiRouter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function upsertEnvLocalKey(keyName: string, value: string): void {
  const envPath = path.join(process.cwd(), '.env.local');
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = existing ? existing.split(/\r?\n/) : [];
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return true;
    const eqIdx = trimmed.indexOf('=');
    return eqIdx <= 0 || trimmed.slice(0, eqIdx).trim() !== keyName;
  });

  if (value.trim()) {
    filtered.push(`${keyName}=${value.trim()}`);
  }

  const normalized = `${filtered.join('\n').replace(/\n+$/, '')}\n`;
  fs.writeFileSync(envPath, normalized, 'utf8');
  if (value.trim()) {
    process.env[keyName] = value.trim();
  } else {
    delete process.env[keyName];
  }
}

export async function GET() {
  const { statusFlags } = resolveConfiguredAiKeys();
  const activeSquadLabels: string[] = [];
  if (statusFlags.nvidiaReady) {
    activeSquadLabels.push('NVIDIA NIM (Nemotron 3 Ultra 550B + Super 120B + Bolt)');
  }
  if (statusFlags.geminiReady) {
    activeSquadLabels.push(
      statusFlags.nvidiaReady
        ? 'Google Gemini 3.5 Flash Lite'
        : 'Gemini 3.5 + Gemini 3 Flash + Gemini 3.1 Lite'
    );
  }
  if (statusFlags.groqReady) {
    activeSquadLabels.push('Groq Llama 3.3 70B');
  }

  return NextResponse.json({
    success: true,
    ...statusFlags,
    activeSquadLabels,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (typeof body.nvidiaApiKey === 'string') {
      const k = body.nvidiaApiKey.trim();
      if (k && !k.startsWith('nvapi-')) {
        return NextResponse.json(
          {
            success: false,
            error: 'La clave de NVIDIA NIM debe iniciar con nvapi-...',
          },
          { status: 400 }
        );
      }
      upsertEnvLocalKey('NVIDIA_API_KEY', k);
    }

    if (typeof body.groqApiKey === 'string') {
      const k = body.groqApiKey.trim();
      if (k && !k.startsWith('gsk_')) {
        return NextResponse.json(
          {
            success: false,
            error: 'La clave de Groq debe iniciar con gsk_...',
          },
          { status: 400 }
        );
      }
      upsertEnvLocalKey('GROQ_API_KEY', k);
    }

    const { statusFlags } = resolveConfiguredAiKeys();
    return NextResponse.json({
      success: true,
      ...statusFlags,
      message: statusFlags.nvidiaReady
        ? 'NVIDIA NIM activado en servidor (.env.local) y unido al Consejo Multi-IA en paralelo.'
        : 'Configuración de motores actualizada en servidor (.env.local).',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || 'Error guardando configuración de IAs en servidor',
      },
      { status: 500 }
    );
  }
}
