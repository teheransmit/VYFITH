import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { dispatchMultiAiChat } from '@/lib/multiAiRouter';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DataFileCheck {
  file: string;
  ok: boolean;
  sizeBytes: number;
  error?: string;
}

function inspectDataJsonFiles(cwd: string): DataFileCheck[] {
  const dataDir = path.join(cwd, 'data');
  if (!fs.existsSync(dataDir)) return [];

  const entries = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  return entries.map((file) => {
    const full = path.join(dataDir, file);
    try {
      const stat = fs.statSync(full);
      const raw = fs.readFileSync(full, 'utf-8').replace(/^\uFEFF/, '');
      JSON.parse(raw);
      return { file, ok: true, sizeBytes: stat.size };
    } catch (err: unknown) {
      return {
        file,
        ok: false,
        sizeBytes: 0,
        error: (err as Error)?.message || 'JSON inválido',
      };
    }
  });
}

async function getGitSummary(cwd: string) {
  try {
    const [statusRes, logRes] = await Promise.all([
      execAsync('git status --porcelain', { cwd, timeout: 10000 }),
      execAsync('git log -1 --format="%h||%s||%cr"', { cwd, timeout: 10000 }),
    ]);

    const modifiedFiles = (statusRes.stdout || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const logParts = (logRes.stdout || '').trim().split('||');
    return {
      ok: true,
      commitHash: logParts[0] || 'HEAD',
      lastMessage: logParts[1] || '',
      lastTime: logParts[2] || '',
      modifiedFiles,
      clean: modifiedFiles.length === 0,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      commitHash: 'unknown',
      lastMessage: (err as Error)?.message || 'Error consultando Git',
      lastTime: '',
      modifiedFiles: [],
      clean: false,
    };
  }
}

async function runTypeScriptCheck(cwd: string): Promise<{ passed: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
      cwd,
      timeout: 45000,
    });
    const combined = `${stdout || ''}\n${stderr || ''}`.trim();
    return { passed: true, output: combined || 'tsc --noEmit: 0 errores.' };
  } catch (err: unknown) {
    const execErr = err as { stdout?: string; stderr?: string; message?: string };
    const out = `${execErr.stdout || ''}\n${execErr.stderr || ''}\n${execErr.message || ''}`.trim();
    return { passed: false, output: out.slice(0, 3000) };
  }
}

async function executeGitSync(cwd: string, rawMessage?: string) {
  const safeMsg = (rawMessage || 'chore(self-heal): sincronización autónoma desde VYFITH Live')
    .replace(/["`$\\]/g, '')
    .slice(0, 120);

  const statusBefore = await execAsync('git status --porcelain', { cwd, timeout: 10000 });
  const hasChanges = Boolean((statusBefore.stdout || '').trim());

  let commitOutput = 'Sin cambios locales pendientes para commit.';
  if (hasChanges) {
    await execAsync('git add -A', { cwd, timeout: 15000 });
    const commitRes = await execAsync(`git commit -m "${safeMsg}"`, {
      cwd,
      timeout: 20000,
    });
    commitOutput = (commitRes.stdout || commitRes.stderr || 'Commit creado').trim();
  }

  const pushRes = await execAsync('git push origin main', {
    cwd,
    timeout: 30000,
  });
  const pushOutput = `${pushRes.stdout || ''}\n${pushRes.stderr || ''}`.trim();
  const gitAfter = await getGitSummary(cwd);

  return {
    hadChanges: hasChanges,
    commitOutput,
    pushOutput: pushOutput || 'Sincronizado con origin/main.',
    git: gitAfter,
  };
}

function resolveSafeRepoFile(cwd: string, relPath: string): string | null {
  const cleaned = relPath.trim().replace(/^[\\/]+/, '');
  if (!cleaned || cleaned.includes('..')) return null;
  const resolved = path.resolve(cwd, cleaned);
  const rootNormalized = path.resolve(cwd) + path.sep;
  if (!resolved.startsWith(rootNormalized)) {
    return null;
  }
  return resolved;
}

export async function GET() {
  const cwd = process.cwd();
  const dataFilesStatus = inspectDataJsonFiles(cwd);
  const git = await getGitSummary(cwd);
  const jsonErrors = dataFilesStatus.filter((f) => !f.ok);

  return NextResponse.json({
    success: true,
    healthy: jsonErrors.length === 0,
    errorCount: jsonErrors.length,
    dataFilesStatus,
    git,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const cwd = process.cwd();
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === 'typecheck') {
      const tsc = await runTypeScriptCheck(cwd);
      return NextResponse.json({
        success: tsc.passed,
        action: 'typecheck',
        passed: tsc.passed,
        output: tsc.output,
      });
    }

    if (action === 'git_sync') {
      // Verificar primero que TypeScript pase antes de subir a GitHub
      const tsc = await runTypeScriptCheck(cwd);
      if (!tsc.passed) {
        return NextResponse.json(
          {
            success: false,
            action: 'git_sync',
            error: 'Se abortó git push porque npx tsc --noEmit detectó errores de compilación.',
            tscOutput: tsc.output,
          },
          { status: 422 }
        );
      }

      const syncRes = await executeGitSync(cwd, body.commitMessage);
      return NextResponse.json({
        success: true,
        action: 'git_sync',
        ...syncRes,
      });
    }

    if (action === 'ai_diagnose_or_fix') {
      const errorLog = String(body.errorLog || '').trim();
      const userInstruction = String(body.userInstruction || '').trim();
      const targetFileRel = body.targetFile ? String(body.targetFile) : '';
      const applyFix = Boolean(body.applyFix);
      const autoCommit = Boolean(body.autoCommit);

      if (!errorLog && !userInstruction) {
        return NextResponse.json(
          {
            success: false,
            error: 'Debes proporcionar errorLog o userInstruction para diagnosticar.',
          },
          { status: 400 }
        );
      }

      let safeAbsPath: string | null = null;
      let originalCode = '';
      if (targetFileRel) {
        safeAbsPath = resolveSafeRepoFile(cwd, targetFileRel);
        if (!safeAbsPath || !fs.existsSync(safeAbsPath)) {
          return NextResponse.json(
            {
              success: false,
              error: `Archivo objetivo inválido o fuera del repositorio C:\\Proyectos\\VYFITH: ${targetFileRel}`,
            },
            { status: 400 }
          );
        }
        originalCode = fs.readFileSync(safeAbsPath, 'utf-8');
      }

      const systemPrompt = `
Eres el Ingeniero Sentinel Self-Healing de VYFITH (Next.js 15 / React 19 / TypeScript strict).
Reglas:
1. Diagnostica la causa raíz exacta con base en el log de error o instrucción de Santiago.
2. Si se solicita \`applyFix: true\` y recibes el código completo de un archivo, responde con JSON estricto:
{
  "diagnosis": "Explicación concisa técnica de la causa y solución.",
  "patchedFileContent": "CONTENIDO COMPLETO CORREGIDO DEL ARCHIVO (solo si applyFix es true, sino null)"
}
Si \`applyFix\` es false o no hay archivo objetivo, pon "patchedFileContent": null y entrega un plan concreto en "diagnosis".
`.trim();

      const promptBody = [
        errorLog ? `ERROR CAPTURADO EN VIVO:\n${errorLog}` : '',
        userInstruction ? `ORDEN / SOLICITUD DIRECTA DE SANTIAGO:\n${userInstruction}` : '',
        safeAbsPath ? `ARCHIVO OBJETIVO: ${targetFileRel}\n\`\`\`tsx\n${originalCode}\n\`\`\`` : '',
        `MODO APPLY_FIX: ${applyFix ? 'TRUE (generar código completo válido)' : 'FALSE (solo diagnóstico)'}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const aiRes = await dispatchMultiAiChat({
        systemInstruction: systemPrompt,
        messages: [{ role: 'user', text: promptBody }],
        requestedModel: body.model || 'auto',
        keys: {
          geminiKey: body.apiKey || req.headers.get('x-gemini-api-key'),
          nvidiaKey: body.nvidiaApiKey || req.headers.get('x-nvidia-api-key'),
          groqKey: body.groqApiKey || req.headers.get('x-groq-api-key'),
        },
        temperature: 0.2,
        maxTokens: 4096,
      });

      if (!aiRes.success || !aiRes.reply) {
        return NextResponse.json(
          {
            success: false,
            error: aiRes.error || 'Falla del proveedor de IA al diagnosticar.',
            status: aiRes.status,
            model: aiRes.model,
          },
          { status: aiRes.status >= 400 && aiRes.status < 600 ? aiRes.status : 500 }
        );
      }

      let diagnosis = aiRes.reply;
      let patchedContent: string | null = null;

      const cleaned = aiRes.reply
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const s = cleaned.indexOf('{');
      const e = cleaned.lastIndexOf('}');
      if (s !== -1 && e > s) {
        try {
          const parsed = JSON.parse(cleaned.slice(s, e + 1));
          if (typeof parsed.diagnosis === 'string') {
            diagnosis = parsed.diagnosis;
          }
          if (typeof parsed.patchedFileContent === 'string' && parsed.patchedFileContent.trim()) {
            patchedContent = parsed.patchedFileContent;
          }
        } catch {
          // Mantener respuesta textual directa en diagnosis
        }
      }

      let applied = false;
      let tscPassed: boolean | null = null;
      let tscOutput = '';
      let gitSyncResult = null;

      if (applyFix && safeAbsPath && patchedContent) {
        fs.writeFileSync(safeAbsPath, patchedContent, 'utf-8');
        const tsc = await runTypeScriptCheck(cwd);
        tscPassed = tsc.passed;
        tscOutput = tsc.output;

        if (!tsc.passed) {
          // Rollback inmediato para garantizar 0 roturas en localhost:3000
          fs.writeFileSync(safeAbsPath, originalCode, 'utf-8');
          return NextResponse.json(
            {
              success: false,
              action: 'ai_diagnose_or_fix',
              diagnosis,
              applied: false,
              rolledBack: true,
              error: 'El parche generado no pasó npx tsc --noEmit. Se revirtió automáticamente para proteger la app.',
              tscOutput,
              model: aiRes.model,
            },
            { status: 422 }
          );
        }

        applied = true;
        if (autoCommit) {
          gitSyncResult = await executeGitSync(
            cwd,
            `fix(self-heal): parche autónomo en ${targetFileRel}`
          );
        }
      }

      return NextResponse.json({
        success: true,
        action: 'ai_diagnose_or_fix',
        model: aiRes.model,
        source: aiRes.source,
        diagnosis,
        applied,
        tscPassed,
        tscOutput,
        gitSyncResult,
      });
    }

    return NextResponse.json(
      { success: false, error: `Acción desconocida: ${action}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error)?.message || 'Error en /api/system/self-heal',
      },
      { status: 500 }
    );
  }
}
