#!/usr/bin/env node
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { execSync, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PROFILE_DIR = path.join(ROOT_DIR, '.hevy-chrome-profile');
const SESSION_STATE_FILE = path.join(PROFILE_DIR, 'session_state.json');
const BRIDGE_LOCK_FILE = path.join(PROFILE_DIR, 'bridge.lock');
const IMPORTS_DIR = path.join(ROOT_DIR, 'data', 'imports');
const DEFAULT_EXPORT_CSV = path.join(IMPORTS_DIR, 'workouts_live_export.csv');
const ROUTINES_DATA_FILE = path.join(ROOT_DIR, 'data', 'real_hevy_routines.json');
const ROUTINES_BACKUP_FILE = path.join(ROOT_DIR, 'data', 'hevy_routines_backup.json');
const DRIVE_BACKUP_CSV = 'G:\\Mi unidad\\Panel_de_Vida\\Hevy\\hevy_workouts_latest.csv';
const LOGIN_CDP_PORT = 9229;
const LBS_TO_KG = 0.45359237;

const KNOWN_ROUTINES = [
  {
    name: 'Horizontal Torso (Chest & Back)',
    shortId: 'DsaJ9O9Ed4U',
    uuid: 'b0f00c93-41ba-41b3-91dd-06b503028635',
  },
  {
    name: 'Vertical & Incline Torso (Chest & Back)',
    shortId: 'xEaFx8bgFGw',
    uuid: '7b393ba1-625d-465d-8478-8126cc7a8db1',
  },
  {
    name: 'Arms & Shoulders',
    shortId: 'EqZ9Xs9vRnO',
    uuid: '11929d35-c80b-417f-9b60-fe18b99a98c7',
  },
  {
    name: 'Full Legs',
    shortId: 'LZhgyR0nGZB',
    uuid: '7e2e1b53-9b71-4df6-8d2f-88e34681ddf0',
  },
];

fs.mkdirSync(PROFILE_DIR, { recursive: true });
fs.mkdirSync(IMPORTS_DIR, { recursive: true });

/**
 * Encuentra el ejecutable de Chromium aislado (ms-playwright) para jamás colisionar
 * con el Google Chrome personal abierto por el usuario.
 */
function resolveChromiumExecutable() {
  try {
    const defaultExe = chromium.executablePath();
    if (defaultExe && fs.existsSync(defaultExe)) return defaultExe;
  } catch {
    // ignore
  }

  // Buscar cualquier versión instalada en %LOCALAPPDATA%\ms-playwright\chromium-*\chrome-win64\chrome.exe
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\Luis', 'AppData', 'Local');
  const pwDir = path.join(localAppData, 'ms-playwright');
  try {
    if (fs.existsSync(pwDir)) {
      const dirs = fs
        .readdirSync(pwDir)
        .filter((d) => /^chromium-\d+$/i.test(d))
        .sort((a, b) => {
          const na = parseInt(a.replace(/\D/g, ''), 10) || 0;
          const nb = parseInt(b.replace(/\D/g, ''), 10) || 0;
          return nb - na;
        });
      for (const dir of dirs) {
        const candidates = [
          path.join(pwDir, dir, 'chrome-win64', 'chrome.exe'),
          path.join(pwDir, dir, 'chrome-win', 'chrome.exe'),
        ];
        for (const c of candidates) {
          if (fs.existsSync(c)) return c;
        }
      }
    }
  } catch {
    // ignore
  }

  // Respaldo: Microsoft Edge o Google Chrome del sistema
  const fallbacks = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const fb of fallbacks) {
    if (fs.existsSync(fb)) return fb;
  }
  return '';
}

function isPidAlive(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readBridgeLock() {
  try {
    if (!fs.existsSync(BRIDGE_LOCK_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(BRIDGE_LOCK_FILE, 'utf8'));
    if (data && isPidAlive(Number(data.pid)) && Number(data.pid) !== process.pid) {
      return data;
    }
    fs.unlinkSync(BRIDGE_LOCK_FILE);
  } catch {
    // ignore
  }
  return null;
}

function writeBridgeLock(cmd) {
  try {
    fs.writeFileSync(
      BRIDGE_LOCK_FILE,
      JSON.stringify({ pid: process.pid, cmd, startedAt: new Date().toISOString() }),
      'utf8'
    );
  } catch {
    // ignore
  }
}

function releaseBridgeLock() {
  try {
    if (fs.existsSync(BRIDGE_LOCK_FILE)) {
      const data = JSON.parse(fs.readFileSync(BRIDGE_LOCK_FILE, 'utf8'));
      if (!data || Number(data.pid) === process.pid) {
        fs.unlinkSync(BRIDGE_LOCK_FILE);
      }
    }
  } catch {
    // ignore
  }
}

function cleanupOrphanProfileChrome() {
  try {
    if (process.platform === 'win32') {
      execSync(
        'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq \'chrome.exe\' -or $_.Name -eq \'chromium.exe\' -or $_.Name -eq \'msedge.exe\' -or $_.Name -eq \'chrome-headless-shell.exe\') -and $_.CommandLine -like \'*hevy-chrome-profile*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"',
        { stdio: 'ignore', timeout: 8000 }
      );
    }
  } catch {
    // ignore
  }

  for (const lockName of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    const p = path.join(PROFILE_DIR, lockName);
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {
      // ignore
    }
  }
}

function killPreviousBridgeProcess() {
  const active = readBridgeLock();
  if (active && active.pid && Number(active.pid) !== process.pid) {
    try {
      process.kill(Number(active.pid), 'SIGTERM');
    } catch {
      // ignore
    }
    try {
      if (fs.existsSync(BRIDGE_LOCK_FILE)) fs.unlinkSync(BRIDGE_LOCK_FILE);
    } catch {
      // ignore
    }
  }
  cleanupOrphanProfileChrome();
}

function formatCleanBridgeError(err) {
  const raw = String(err?.message || err || 'Error en navegador Chrome Hevy Web');
  const noAnsi = raw
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\[\d+m/g, '');

  if (
    /Abriendo en una sesi/i.test(noAnsi) ||
    /existing browser session/i.test(noAnsi) ||
    /Target page, context or browser has been closed/i.test(noAnsi)
  ) {
    return 'La ventana de Hevy Web se cerró antes de completar la operación. Vuelve a pulsar «Conectar Hevy Web» o «Sync en Vivo».';
  }

  const firstLine = noAnsi.split(/Browser logs:|Call log:|\r?\n/)[0].trim();
  return firstLine.slice(0, 220) || 'Error ejecutando puente Chrome Hevy Web.';
}

function parseArgs(argv) {
  const args = { cmd: argv[2] || 'status' };
  for (let i = 3; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) {
      const key = k.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = val;
    }
  }
  return args;
}

/**
 * Verifica si el proceso corre en el escritorio interactivo real de Windows ("Default")
 * o en un escritorio aislado/servicio sin interfaz visible (ej. "exebox-..." de un daemon).
 */
function getWindowsDesktopName() {
  if (process.platform !== 'win32') return 'Default';
  try {
    const ps = `
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class VyfithDesk {
  [DllImport("user32.dll")] public static extern IntPtr GetThreadDesktop(uint dwThreadId);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool GetUserObjectInformation(IntPtr hObj, int nIndex, StringBuilder pvInfo, int nLength, out int lpnLengthNeeded);
  public static string Name() {
    IntPtr d = GetThreadDesktop(GetCurrentThreadId());
    var sb = new StringBuilder(256); int need;
    GetUserObjectInformation(d, 2, sb, 256, out need);
    return sb.ToString();
  }
}
"@
Write-Output ([VyfithDesk]::Name())
`;
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      { encoding: 'utf8', timeout: 12000, windowsHide: true }
    );
    return String(out || '').trim().split(/\r?\n/).pop() || 'Default';
  } catch {
    return 'Default';
  }
}

/**
 * Lanza Chromium VISIBLE en primer plano en Windows usando Start-Process -WindowStyle Normal
 * + AppActivate, cuando el proceso corre en el escritorio interactivo "Default".
 */
function launchVisibleChromiumForLogin(executablePath, startUrl) {
  const psQuote = (s) => `'${String(s).replace(/'/g, "''")}'`;
  const psScript = `
$ErrorActionPreference = 'Stop'
$exe = ${psQuote(executablePath)}
$prof = ${psQuote(PROFILE_DIR)}
$url = ${psQuote(startUrl)}
$argsList = @(
  "--user-data-dir=\`"$prof\`"",
  "--remote-debugging-port=${LOGIN_CDP_PORT}",
  "--new-window",
  "--window-size=1220,840",
  "--window-position=110,60",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-mode",
  $url
)
$proc = Start-Process -FilePath $exe -ArgumentList $argsList -WindowStyle Normal -PassThru
Start-Sleep -Milliseconds 1200
try {
  $wshell = New-Object -ComObject WScript.Shell
  $wshell.AppActivate($proc.Id) | Out-Null
} catch {}
Write-Output $proc.Id
`;
  const out = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript],
    { encoding: 'utf8', timeout: 20000, windowsHide: true }
  );
  const pid = parseInt(String(out || '').trim().split(/\r?\n/).pop() || '0', 10);
  return pid || null;
}

async function waitForCdpReady(port, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.webSocketDebuggerUrl) return json;
      }
    } catch {
      // still starting
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error('No se pudo conectar al puerto de depuración de Chromium para Hevy Web.');
}

async function openContext(headless = true, cmd = 'status') {
  let activeLock = readBridgeLock();
  if (activeLock) {
    if (activeLock.cmd === 'login' && cmd !== 'login') {
      throw new Error(
        'Ya tienes abierta la ventana de Chromium para iniciar sesión en Hevy Web. Completa el login en esa ventana primero.'
      );
    }
    const waitDeadline = Date.now() + 8000;
    while (activeLock && Date.now() < waitDeadline) {
      await new Promise((r) => setTimeout(r, 600));
      activeLock = readBridgeLock();
    }
    if (activeLock && activeLock.cmd === 'login') {
      throw new Error(
        'La ventana de login de Hevy Web sigue abierta. Inicia sesión allí o ciérrala antes de sincronizar.'
      );
    }
  }

  if (!readBridgeLock()) {
    cleanupOrphanProfileChrome();
  }

  writeBridgeLock(cmd);

  const exePath = resolveChromiumExecutable();
  const launchOpts = {
    ...(exePath ? { executablePath: exePath } : { channel: 'chrome' }),
    headless,
    acceptDownloads: true,
    ignoreDefaultArgs: ['--enable-automation'],
    viewport: { width: 1366, height: 860 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-mode',
    ],
  };

  try {
    return await chromium.launchPersistentContext(PROFILE_DIR, launchOpts);
  } catch {
    cleanupOrphanProfileChrome();
    await new Promise((r) => setTimeout(r, 700));
    return await chromium.launchPersistentContext(PROFILE_DIR, launchOpts);
  }
}

async function isLoggedIn(page) {
  await page.goto('https://hevy.com/settings?export', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await Promise.race([
    page
      .waitForSelector('button:has-text("Export"), button:has-text("Exportar"), a[href="/routines"], a[href*="/user/"]', {
        timeout: 12000,
      })
      .catch(() => null),
    page.waitForURL(/\/(login|signup)/, { timeout: 12000 }).catch(() => null),
  ]);
  let url = page.url();
  if (url.includes('/login') || url.includes('/signup')) {
    try {
      fs.writeFileSync(
        SESSION_STATE_FILE,
        JSON.stringify({ authenticated: false, url, checkedAt: new Date().toISOString() }, null, 2),
        'utf8'
      );
    } catch {
      // ignore
    }
    return { authenticated: false, url };
  }
  let hasExportBtn =
    (await page.getByRole('button', { name: /Exportar datos de entrenamiento|Export workout data|Export/i }).count()) > 0;
  let hasAuthNav = (await page.locator('a[href*="/user/"], a[href="/routines"]').count()) > 0;

  // Si la SPA aún estaba hidratando y seguimos en /settings (no redirigió a /login), dar 5s extra
  if (!hasExportBtn && !hasAuthNav && !url.includes('/login') && !url.includes('/signup')) {
    await Promise.race([
      page
        .waitForSelector('button:has-text("Export"), button:has-text("Exportar"), a[href="/routines"]', { timeout: 5000 })
        .catch(() => null),
      page.waitForURL(/\/(login|signup)/, { timeout: 5000 }).catch(() => null),
    ]);
    url = page.url();
    hasExportBtn =
      (await page.getByRole('button', { name: /Exportar datos de entrenamiento|Export workout data|Export/i }).count()) > 0;
    hasAuthNav = (await page.locator('a[href*="/user/"], a[href="/routines"]').count()) > 0;
  }

  const userName = await page
    .locator('aside h5, nav h5, h5')
    .first()
    .textContent()
    .catch(() => null);
  const authenticated = (hasExportBtn || hasAuthNav) && !url.includes('/login') && !url.includes('/signup');
  const accountName = userName ? userName.trim() : undefined;
  try {
    fs.writeFileSync(
      SESSION_STATE_FILE,
      JSON.stringify({ authenticated, accountName: accountName || null, checkedAt: new Date().toISOString() }, null, 2),
      'utf8'
    );
  } catch {
    // ignore
  }
  return {
    authenticated,
    url,
    accountName,
    hasExportBtn,
  };
}

async function handleStatus() {
  let ctx;
  try {
    ctx = await openContext(true, 'status');
    const page = ctx.pages()[0] || (await ctx.newPage());
    const res = await isLoggedIn(page);
    console.log(JSON.stringify({ ok: true, ...res }));
  } catch (err) {
    console.log(JSON.stringify({ ok: false, authenticated: false, error: formatCleanBridgeError(err) }));
    process.exitCode = 1;
  } finally {
    if (ctx) await ctx.close().catch(() => {});
    releaseBridgeLock();
  }
}

async function exportCsvFromAuthenticatedPage(page, outPath = DEFAULT_EXPORT_CSV) {
  await page.goto('https://hevy.com/settings?export', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const exportBtn = page
    .getByRole('button', { name: /Exportar datos de entrenamiento|Export workout data/i })
    .or(page.locator('button:has-text("Exportar datos"), button:has-text("Export workout data")'))
    .first();
  await exportBtn.waitFor({ state: 'visible', timeout: 15000 });

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 90000 }),
    exportBtn.click(),
  ]);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await download.saveAs(outPath);
  const bytes = fs.statSync(outPath).size;
  try {
    if (fs.existsSync(path.dirname(DRIVE_BACKUP_CSV))) {
      fs.copyFileSync(outPath, DRIVE_BACKUP_CSV);
    }
  } catch {
    // Respaldo opcional en Drive
  }
  return { outPath, bytes, suggestedFilename: download.suggestedFilename() };
}

async function handleLogin(args = {}) {
  let browser = null;
  let launchedPid = null;
  try {
    // 1. Verificar primero si el proceso corre en escritorio aislado (exebox-* / service-*)
    const desktopName = getWindowsDesktopName();
    const isIsolatedDesktop = /^(exebox-|service-)/i.test(desktopName || '');
    if (isIsolatedDesktop) {
      // Comprobar primero si ya hay sesión autenticada guardada (ej. recién conectado con Conectar_Hevy_Web.bat)
      let quickCtx = null;
      try {
        quickCtx = await openContext(true, 'status');
        const qPage = quickCtx.pages()[0] || (await quickCtx.newPage());
        const quickAuth = await isLoggedIn(qPage);
        if (quickAuth.authenticated) {
          let csvResult = null;
          try {
            csvResult = await exportCsvFromAuthenticatedPage(qPage, DEFAULT_EXPORT_CSV);
          } catch {
            csvResult = null;
          }
          console.log(
            JSON.stringify({
              ok: true,
              authenticated: true,
              accountName: quickAuth.accountName || '@teheransmit',
              csvPath: csvResult?.outPath || null,
              bytes: csvResult?.bytes || 0,
            })
          );
          return;
        }
      } catch {
        // continuar al reporte claro de escritorio aislado
      } finally {
        if (quickCtx) await quickCtx.close().catch(() => {});
        releaseBridgeLock();
      }

      const launcherPath = path.join(ROOT_DIR, 'Conectar_Hevy_Web.bat');
      console.log(
        JSON.stringify({
          ok: false,
          authenticated: false,
          sandboxedDesktop: true,
          desktopName,
          launcherScript: launcherPath,
          error:
            'No se puede abrir la ventana desde el servidor en segundo plano de Antigravity (escritorio aislado). Ejecuta UNA SOLA VEZ C:\\Proyectos\\VYFITH\\Conectar_Hevy_Web.bat (o presiona Win+R, pega esa ruta y pulsa Enter) para iniciar sesión visible en Hevy Web; después «Sync en Vivo» y «Aplicar Cargas a Hevy App» funcionarán solos.',
        })
      );
      process.exitCode = 1;
      return;
    }

    if (args.force === 'true' || readBridgeLock()) {
      killPreviousBridgeProcess();
      await new Promise((r) => setTimeout(r, 600));
    } else {
      cleanupOrphanProfileChrome();
    }

    writeBridgeLock('login');
    const exePath = resolveChromiumExecutable();
    if (!exePath) {
      throw new Error('No se encontró Chromium ni Chrome instalado en el equipo.');
    }

    console.error('[1/3] Abriendo ventana visible de Chromium en https://hevy.com/login ...');
    launchedPid = launchVisibleChromiumForLogin(exePath, 'https://hevy.com/settings?export');
    await waitForCdpReady(LOGIN_CDP_PORT, 15000);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${LOGIN_CDP_PORT}`);
    console.error('[2/3] Ventana lista. Inicia sesión en Hevy Web en la ventana que se abrió (esperando hasta 5 min)...');

    const defaultCtx = browser.contexts()[0];
    const page = defaultCtx?.pages()?.[0];
    if (!page) {
      throw new Error('No se encontró pestaña activa en la ventana de Hevy Web.');
    }

    await page.bringToFront().catch(() => {});

    // Esperar a que cargue /settings?export o redirija a /login
    await Promise.race([
      page.waitForURL(/\/(login|signup)/, { timeout: 6000 }).catch(() => null),
      page.waitForSelector('button:has-text("Export"), button:has-text("Exportar")', { timeout: 6000 }).catch(() => null),
    ]);

    const deadline = Date.now() + 290000; // casi 5 minutos para que el usuario inicie sesión tranquilo
    let logged = false;

    while (Date.now() < deadline) {
      // Si el usuario cerró la ventana manualmente, detectar de inmediato sin quedarse colgado
      if (!browser.isConnected() || (launchedPid && !isPidAlive(launchedPid))) {
        console.log(
          JSON.stringify({
            ok: false,
            authenticated: false,
            error: 'La ventana de inicio de sesión se cerró antes de completar el login en Hevy Web.',
          })
        );
        process.exitCode = 1;
        return;
      }

      const pages = defaultCtx.pages().filter((p) => !p.isClosed());
      if (pages.length === 0) {
        console.log(
          JSON.stringify({
            ok: false,
            authenticated: false,
            error: 'La ventana de inicio de sesión se cerró antes de completar el login en Hevy Web.',
          })
        );
        process.exitCode = 1;
        return;
      }

      const activePage = pages.find((p) => p.url().includes('hevy.com')) || pages[0];
      const current = activePage.url();
      const onAuthPage =
        current.includes('/login') ||
        current.includes('/signup') ||
        current.includes('accounts.google.com') ||
        current.includes('appleid.apple.com') ||
        current === 'about:blank';

      if (!onAuthPage && current.includes('hevy.com')) {
        await activePage.waitForTimeout(1800);
        const verify = await isLoggedIn(activePage);
        if (verify.authenticated) {
          logged = true;
          console.error(`[3/3] ¡Sesión confirmada (${verify.accountName || '@teheransmit'})! Exportando entrenamientos y guardando sesión permanente...`);
          let csvResult = null;
          try {
            csvResult = await exportCsvFromAuthenticatedPage(activePage, DEFAULT_EXPORT_CSV);
          } catch {
            csvResult = null;
          }
          console.error('✅ ¡CONECTADO A HEVY WEB! Ya puedes volver a http://localhost:3000/ y pulsar "Aplicar Cargas a Hevy App" o "Sync en Vivo".');
          console.log(
            JSON.stringify({
              ok: true,
              authenticated: true,
              accountName: verify.accountName || '@teheransmit',
              csvPath: csvResult?.outPath || null,
              bytes: csvResult?.bytes || 0,
            })
          );
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!logged) {
      console.log(
        JSON.stringify({
          ok: false,
          authenticated: false,
          error: 'Tiempo de espera de inicio de sesión agotado (5 min). Pulsa «Conectar Hevy Web» nuevamente.',
        })
      );
      process.exitCode = 1;
    }
  } catch (err) {
    console.log(JSON.stringify({ ok: false, authenticated: false, error: formatCleanBridgeError(err) }));
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (launchedPid && isPidAlive(launchedPid)) {
      try {
        process.kill(launchedPid, 'SIGTERM');
      } catch {
        // ignore
      }
    }
    cleanupOrphanProfileChrome();
    releaseBridgeLock();
  }
}

async function handleExportCsv(outPath = DEFAULT_EXPORT_CSV) {
  let ctx;
  try {
    ctx = await openContext(true, 'export-csv');
    const page = ctx.pages()[0] || (await ctx.newPage());
    const auth = await isLoggedIn(page);
    if (!auth.authenticated) {
      console.log(JSON.stringify({ ok: false, requiresLogin: true, url: auth.url, error: 'Sesión Chrome de Hevy Web no iniciada.' }));
      return;
    }

    const res = await exportCsvFromAuthenticatedPage(page, outPath);
    console.log(
      JSON.stringify({
        ok: true,
        csvPath: res.outPath,
        suggestedFilename: res.suggestedFilename,
        bytes: res.bytes,
        accountName: auth.accountName || null,
        exportedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.log(JSON.stringify({ ok: false, error: formatCleanBridgeError(err) }));
    process.exitCode = 1;
  } finally {
    if (ctx) await ctx.close().catch(() => {});
    releaseBridgeLock();
  }
}

function normalizeTitle(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatRestSecondsLabel(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return 'Desactivado';
  const clamped = Math.max(5, Math.min(300, Math.round(n / 5) * 5));
  const mm = String(Math.floor(clamped / 60)).padStart(2, '0');
  const ss = String(clamped % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function formatWeightForHevyInput(value, usesCommaDecimal) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '';
  const rounded = Math.round(num * 4) / 4; // incrementos limpios de 0.25
  const raw = Number.isInteger(rounded) ? String(rounded) : String(Number(rounded.toFixed(2)));
  return usesCommaDecimal ? raw.replace('.', ',') : raw;
}

function resolveRoutineMeta(args, payload = {}) {
  const nameQ = normalizeTitle(args['routine-name'] || payload.routineTitle || payload.routineName || '');
  const shortIdQ = String(args['routine-id'] || payload.routineShortId || '').trim();
  const uuidQ = String(args['routine-uuid'] || payload.routineUuid || '').trim();
  const urlQ = String(args['routine-url'] || payload.routineUrl || '').trim();
  const editUrlQ = String(args['edit-url'] || payload.editUrl || '').trim();

  let matched = KNOWN_ROUTINES.find(
    (r) =>
      (shortIdQ && r.shortId === shortIdQ) ||
      (uuidQ && r.uuid === uuidQ) ||
      (urlQ && urlQ.includes(r.shortId)) ||
      (editUrlQ && editUrlQ.includes(r.uuid)) ||
      (nameQ &&
        (normalizeTitle(r.name) === nameQ ||
          normalizeTitle(r.name).includes(nameQ) ||
          nameQ.includes(normalizeTitle(r.name).split('(')[0].trim())))
  );

  // También consultar data/real_hevy_routines.json si existe
  if (!matched && fs.existsSync(ROUTINES_DATA_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(ROUTINES_DATA_FILE, 'utf8'));
      const found = (saved?.routines || []).find(
        (r) =>
          (shortIdQ && r.shortId === shortIdQ) ||
          (uuidQ && r.uuid === uuidQ) ||
          (nameQ && normalizeTitle(r.title) === nameQ)
      );
      if (found) {
        matched = { name: found.title, shortId: found.shortId, uuid: found.uuid };
      }
    } catch {
      // ignore
    }
  }

  return {
    name: args['routine-name'] || payload.routineTitle || matched?.name || '',
    shortId: shortIdQ || matched?.shortId || '',
    uuid: uuidQ || matched?.uuid || '',
    routineUrl: urlQ || (matched?.shortId ? `https://hevy.com/routine/${matched.shortId}` : ''),
    editUrl: editUrlQ || (matched?.uuid ? `https://hevy.com/edit-routine/${matched.uuid}` : ''),
  };
}

function normalizeHevyRoutinePayload(rawRoutine, unitMap = {}) {
  const r = rawRoutine?.routine || rawRoutine;
  if (!r || !Array.isArray(r.exercises)) return null;
  return {
    uuid: r.id,
    shortId: r.short_id,
    title: (r.title || '').trim(),
    folderId: r.folder_id ?? null,
    notes: r.notes || '',
    routineUrl: r.short_id ? `https://hevy.com/routine/${r.short_id}` : '',
    editUrl: r.id ? `https://hevy.com/edit-routine/${r.id}` : '',
    updatedAt: r.updated_at || new Date().toISOString(),
    exerciseCount: r.exercises.length,
    exercises: r.exercises.map((ex, idx) => {
      const unit = unitMap[ex.exercise_template_id] || 'kg';
      return {
        index: idx,
        id: ex.id,
        exerciseTemplateId: ex.exercise_template_id,
        title: ex.title || '',
        esTitle: ex.es_title || ex.title || '',
        muscleGroup: ex.muscle_group || 'other',
        exerciseType: ex.exercise_type || 'weight_reps',
        equipmentCategory: ex.equipment_category || 'none',
        unit,
        restSeconds: Number.isFinite(Number(ex.rest_seconds)) ? Number(ex.rest_seconds) : 0,
        inputModifier: ex.input_modifier || 'reps',
        notes: ex.notes || '',
        pinnedNotes: Array.isArray(ex.pinned_notes) ? ex.pinned_notes : [],
        supersetId: ex.superset_id ?? null,
        sets: (ex.sets || []).map((s, sIdx) => {
          const wKg = Number(s.weight_kg ?? 0) || 0;
          return {
            index: sIdx,
            type: s.indicator || s.type || 'normal',
            weightKg: Math.round(wKg * 100) / 100,
            weightLbs: wKg > 0 ? Math.round((wKg / LBS_TO_KG) * 10) / 10 : 0,
            reps: s.reps ?? null,
            repRangeStart: s.rep_range_start ?? s.rep_range?.start ?? null,
            repRangeEnd: s.rep_range_end ?? s.rep_range?.end ?? null,
            durationSeconds: s.duration_seconds ?? null,
            rpe: s.rpe ?? null,
          };
        }),
      };
    }),
  };
}

async function fetchRoutineViaPage(page, shortId) {
  let captured = null;
  const onResp = async (res) => {
    const u = res.url();
    if (u.includes('routine_with_short_id') && u.includes(shortId) && res.status() === 200) {
      try {
        captured = await res.json();
      } catch {
        // ignore
      }
    }
  };
  page.on('response', onResp);
  try {
    await page.goto(`https://hevy.com/routine/${shortId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const deadline = Date.now() + 9000;
    while (!captured && Date.now() < deadline) {
      await page.waitForTimeout(250);
    }
  } finally {
    page.off('response', onResp);
  }
  return captured;
}

async function fetchTemplateUnitsViaPage(page, sampleEditUrl) {
  const unitMap = {};
  let captured = null;
  const onResp = async (res) => {
    if (res.url().includes('exercise_template_units') && res.status() === 200) {
      try {
        captured = await res.json();
      } catch {
        // ignore
      }
    }
  };
  page.on('response', onResp);
  try {
    await page.goto(sampleEditUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const deadline = Date.now() + 8000;
    while (!captured && Date.now() < deadline) {
      await page.waitForTimeout(250);
    }
    if (Array.isArray(captured)) {
      for (const row of captured) {
        if (row?.exercise_template_id && row?.weight_unit) {
          unitMap[row.exercise_template_id] = String(row.weight_unit).toLowerCase() === 'lbs' ? 'lbs' : 'kg';
        }
      }
    }
  } finally {
    page.off('response', onResp);
  }
  return unitMap;
}

function appendRoutineBackup(normalizedRoutine, reason = 'pre_apply_plan') {
  try {
    fs.mkdirSync(path.dirname(ROUTINES_BACKUP_FILE), { recursive: true });
    let backups = [];
    if (fs.existsSync(ROUTINES_BACKUP_FILE)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(ROUTINES_BACKUP_FILE, 'utf8'));
        backups = Array.isArray(parsed?.backups) ? parsed.backups : [];
      } catch {
        backups = [];
      }
    }
    backups.unshift({
      backedUpAt: new Date().toISOString(),
      reason,
      routineShortId: normalizedRoutine.shortId,
      routineUuid: normalizedRoutine.uuid,
      routineTitle: normalizedRoutine.title,
      exerciseCount: normalizedRoutine.exerciseCount,
      routine: normalizedRoutine,
    });
    fs.writeFileSync(
      ROUTINES_BACKUP_FILE,
      JSON.stringify({ updatedAt: new Date().toISOString(), backups: backups.slice(0, 30) }, null, 2),
      'utf8'
    );
    return true;
  } catch {
    return false;
  }
}

function upsertRoutineInSavedFile(normalizedRoutine, accountName = null) {
  fs.mkdirSync(path.dirname(ROUTINES_DATA_FILE), { recursive: true });
  let existing = { exportedAt: new Date().toISOString(), accountName, routines: [] };
  if (fs.existsSync(ROUTINES_DATA_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(ROUTINES_DATA_FILE, 'utf8'));
      if (parsed && Array.isArray(parsed.routines)) existing = parsed;
    } catch {
      // ignore
    }
  }
  const idx = existing.routines.findIndex(
    (r) => r.shortId === normalizedRoutine.shortId || r.uuid === normalizedRoutine.uuid
  );
  if (idx >= 0) existing.routines[idx] = normalizedRoutine;
  else existing.routines.push(normalizedRoutine);
  existing.exportedAt = new Date().toISOString();
  if (accountName) existing.accountName = accountName;
  existing.routineCount = existing.routines.length;
  fs.writeFileSync(ROUTINES_DATA_FILE, JSON.stringify(existing, null, 2), 'utf8');
}

async function handleExportRoutines() {
  let ctx;
  try {
    ctx = await openContext(true, 'export-routines');
    const page = ctx.pages()[0] || (await ctx.newPage());
    const auth = await isLoggedIn(page);
    if (!auth.authenticated) {
      console.log(
        JSON.stringify({
          ok: false,
          requiresLogin: true,
          url: auth.url,
          error: 'Sesión Chrome de Hevy Web no iniciada.',
        })
      );
      return;
    }

    // 1. Capturar unidades reales por ejercicio (kg vs lbs) desde /edit-routine
    const unitMap = await fetchTemplateUnitsViaPage(
      page,
      `https://hevy.com/edit-routine/${KNOWN_ROUTINES[0].uuid}`
    );

    // 2. Descubrir cualquier rutina adicional en hevy.com/routines
    const shortIds = new Set(KNOWN_ROUTINES.map((r) => r.shortId));
    try {
      await page.goto('https://hevy.com/routines', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2200);
      const discovered = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="/routine/"]'))
          .map((a) => {
            const m = (a.getAttribute('href') || '').match(/\/routine\/([A-Za-z0-9_-]+)/);
            return m ? m[1] : null;
          })
          .filter(Boolean);
      });
      for (const sid of discovered) shortIds.add(sid);
    } catch {
      // continuar con las 4 rutinas conocidas
    }

    // 3. Capturar el JSON oficial completo de cada rutina
    const routines = [];
    for (const sid of shortIds) {
      const raw = await fetchRoutineViaPage(page, sid);
      const norm = normalizeHevyRoutinePayload(raw, unitMap);
      if (norm) routines.push(norm);
    }

    fs.mkdirSync(path.dirname(ROUTINES_DATA_FILE), { recursive: true });
    const outPayload = {
      exportedAt: new Date().toISOString(),
      accountName: auth.accountName || '@teheransmit',
      routineCount: routines.length,
      templateUnitsCount: Object.keys(unitMap).length,
      templateUnits: unitMap,
      routines,
    };
    fs.writeFileSync(ROUTINES_DATA_FILE, JSON.stringify(outPayload, null, 2), 'utf8');

    console.log(
      JSON.stringify({
        ok: true,
        accountName: outPayload.accountName,
        routinesFile: ROUTINES_DATA_FILE,
        routineCount: routines.length,
        templateUnitsCount: outPayload.templateUnitsCount,
        routinesSummary: routines.map((r) => ({
          shortId: r.shortId,
          uuid: r.uuid,
          title: r.title,
          exerciseCount: r.exerciseCount,
        })),
        exportedAt: outPayload.exportedAt,
      })
    );
  } catch (err) {
    console.log(JSON.stringify({ ok: false, error: formatCleanBridgeError(err) }));
    process.exitCode = 1;
  } finally {
    if (ctx) await ctx.close().catch(() => {});
    releaseBridgeLock();
  }
}

async function getLiveCardTitles(page) {
  return await page.evaluate(() => {
    const cards = Array.from(
      document.querySelectorAll('[data-rbd-droppable-id="exercise-area"] > [data-rbd-draggable-id]')
    );
    return cards.map((c, idx) => {
      const title = c.querySelector('p')?.textContent?.trim() || '';
      const rbdId = c.getAttribute('data-rbd-draggable-id') || '';
      return { idx, rbdId, title };
    });
  });
}

function findMatchingCardIndex(liveCards, candidates, usedRbdIds = new Set()) {
  const normCandidates = candidates.filter(Boolean).map(normalizeTitle).filter(Boolean);
  if (normCandidates.length === 0) return -1;

  // 1. Exact match first (preferring unused cards)
  let idx = liveCards.findIndex(
    (c) => !usedRbdIds.has(c.rbdId) && normCandidates.includes(normalizeTitle(c.title))
  );
  if (idx >= 0) return idx;

  // 2. Partial substring match for length >= 6
  idx = liveCards.findIndex((c) => {
    if (usedRbdIds.has(c.rbdId)) return false;
    const t = normalizeTitle(c.title);
    return normCandidates.some((cand) => cand.length >= 6 && (t.includes(cand) || cand.includes(t)));
  });
  return idx;
}

async function setCardRestTimer(page, cardLocator, targetSeconds) {
  const desiredLabel = formatRestSecondsLabel(targetSeconds);
  const currentLabel = (
    await cardLocator.locator('div[class*="singleValue"]').first().textContent().catch(() => '')
  ).trim();

  if (currentLabel === desiredLabel) {
    return { changed: false, from: currentLabel, to: desiredLabel };
  }

  const restControl = cardLocator
    .locator('input[aria-label="Temporizador de descanso:"]')
    .first()
    .locator('xpath=ancestor::div[contains(@class,"control")][1]');

  if ((await restControl.count()) === 0) {
    return { changed: false, error: 'No se encontró control de temporizador de descanso' };
  }

  await restControl.scrollIntoViewIfNeeded();
  await restControl.click();
  await page.waitForTimeout(300);

  const optionLocator = page
    .locator('[role="option"], div[id*="react-select"][id*="-option-"]')
    .filter({ hasText: new RegExp(`^${desiredLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })
    .first();

  if ((await optionLocator.count()) === 0) {
    await page.keyboard.press('Escape').catch(() => {});
    return { changed: false, error: `Opción de descanso '${desiredLabel}' no encontrada` };
  }

  await optionLocator.scrollIntoViewIfNeeded();
  await optionLocator.click();
  await page.waitForTimeout(200);

  const afterLabel = (
    await cardLocator.locator('div[class*="singleValue"]').first().textContent().catch(() => '')
  ).trim();

  return {
    changed: afterLabel === desiredLabel,
    from: currentLabel,
    to: afterLabel,
  };
}

async function handleApplyRoutinePlan(args) {
  const payloadFile = args['payload-file'] || '';
  if (!payloadFile || !fs.existsSync(payloadFile)) {
    console.log(JSON.stringify({ ok: false, error: 'No se encontró --payload-file' }));
    process.exitCode = 1;
    return;
  }

  const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));
  const meta = resolveRoutineMeta(args, payload);
  if (!meta.editUrl && !meta.routineUrl && !meta.name) {
    console.log(JSON.stringify({ ok: false, error: 'Se requiere identificar la rutina (--routine-name / --routine-id / --edit-url)' }));
    process.exitCode = 1;
    return;
  }

  const applyOptions = {
    weightsAndReps: payload.applyOptions?.weightsAndReps !== false,
    restTimers: Boolean(payload.applyOptions?.restTimers),
    notes: payload.applyOptions?.notes !== false,
    reorder: Boolean(payload.applyOptions?.reorder),
    removeMarked: Boolean(payload.applyOptions?.removeMarked),
  };

  const exercisesInput = Array.isArray(payload.exercises) ? payload.exercises : [];

  let ctx;
  try {
    ctx = await openContext(true, 'apply-routine-plan');
    const page = ctx.pages()[0] || (await ctx.newPage());
    const auth = await isLoggedIn(page);
    if (!auth.authenticated) {
      console.log(JSON.stringify({ ok: false, requiresLogin: true, error: 'Sesión Chrome de Hevy Web no iniciada.' }));
      return;
    }

    // 1. Snapshot previo + respaldo automático en data/hevy_routines_backup.json
    let backupSaved = false;
    let unitMap = {};
    if (meta.shortId) {
      const preRaw = await fetchRoutineViaPage(page, meta.shortId);
      const preNorm = normalizeHevyRoutinePayload(preRaw, unitMap);
      if (preNorm) {
        if (!meta.uuid && preNorm.uuid) {
          meta.uuid = preNorm.uuid;
          meta.editUrl = `https://hevy.com/edit-routine/${preNorm.uuid}`;
        }
        backupSaved = appendRoutineBackup(preNorm, 'before_apply_routine_plan');
      }
    }

    // 2. Abrir el editor oficial /edit-routine/{uuid} y capturar unidades
    const capturedUnitsPromise = new Promise((resolve) => {
      const onUnits = async (res) => {
        if (res.url().includes('exercise_template_units') && res.status() === 200) {
          try {
            const arr = await res.json();
            page.off('response', onUnits);
            resolve(arr);
          } catch {
            // ignore
          }
        }
      };
      page.on('response', onUnits);
      setTimeout(() => {
        page.off('response', onUnits);
        resolve(null);
      }, 9000);
    });

    if (meta.editUrl) {
      await page.goto(meta.editUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } else if (meta.routineUrl) {
      await page.goto(meta.routineUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1800);
      const editBtn = page.getByRole('button', { name: /Editar rutina|Edit Routine/i }).first();
      if ((await editBtn.count()) > 0) await editBtn.click();
      else await page.locator('a[href*="/edit-routine/"]').first().click();
      await page.waitForURL(/\/edit-routine\//, { timeout: 20000 });
    } else {
      await page.goto('https://hevy.com/routines', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      const targetLink = page.locator('a[href*="/routine/"]').filter({ hasText: meta.name }).first();
      if ((await targetLink.count()) === 0) {
        console.log(JSON.stringify({ ok: false, error: `No se encontró la rutina '${meta.name}' en hevy.com/routines` }));
        process.exitCode = 1;
        return;
      }
      await targetLink.click();
      await page.waitForTimeout(1500);
      const editBtn = page.getByRole('button', { name: /Editar rutina|Edit Routine/i }).first();
      if ((await editBtn.count()) > 0) await editBtn.click();
      else await page.locator('a[href*="/edit-routine/"]').first().click();
      await page.waitForURL(/\/edit-routine\//, { timeout: 20000 });
    }

    await page
      .locator('[data-rbd-droppable-id="exercise-area"] > [data-rbd-draggable-id]')
      .first()
      .waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(800);

    const unitsArr = await capturedUnitsPromise;
    if (Array.isArray(unitsArr)) {
      for (const row of unitsArr) {
        if (row?.exercise_template_id && row?.weight_unit) {
          unitMap[row.exercise_template_id] = String(row.weight_unit).toLowerCase() === 'lbs' ? 'lbs' : 'kg';
        }
      }
    }

    const editUrl = page.url();
    const cardsLocator = page.locator('[data-rbd-droppable-id="exercise-area"] > [data-rbd-draggable-id]');

    const modifiedExercises = [];
    const restTimersUpdated = [];
    const notesUpdated = [];
    const removedExercises = [];
    const notFound = [];
    let reorderedCount = 0;

    // 3. Eliminación opcional de ejercicios redundantes (SOLO si el usuario activó removeMarked)
    if (applyOptions.removeMarked) {
      const toRemove = exercisesInput.filter((ex) => ex.keepExercise === false);
      for (const item of toRemove) {
        const liveCards = await getLiveCardTitles(page);
        const matchIdx = findMatchingCardIndex(liveCards, [item.esTitle, item.exerciseName]);
        if (matchIdx < 0) continue;
        const card = cardsLocator.nth(matchIdx);
        const optBtn = card.locator('button[aria-label="Opciones del ejercicio"]').first();
        if ((await optBtn.count()) > 0) {
          await optBtn.scrollIntoViewIfNeeded();
          await optBtn.click();
          await page.waitForTimeout(300);
          const delItem = page
            .locator('[role="menuitem"], button, div')
            .filter({ hasText: /^Eliminar ejercicio$|^Delete Exercise$|^Remove Exercise$/i })
            .first();
          if ((await delItem.count()) > 0) {
            await delItem.click();
            await page.waitForTimeout(350);
            removedExercises.push(item.exerciseName || item.esTitle);
          } else {
            await page.keyboard.press('Escape').catch(() => {});
          }
        }
      }
    }

    // 4. Actualizar pesos, repeticiones/rangos, temporizadores de descanso y notas fijadas
    const usedRbdIds = new Set();
    for (const item of exercisesInput) {
      if (applyOptions.removeMarked && item.keepExercise === false) continue;

      const liveCards = await getLiveCardTitles(page);
      const matchIdx = findMatchingCardIndex(liveCards, [item.esTitle, item.exerciseName], usedRbdIds);
      if (matchIdx < 0) {
        notFound.push(item.exerciseName || item.esTitle);
        continue;
      }

      const matchedCardInfo = liveCards[matchIdx];
      usedRbdIds.add(matchedCardInfo.rbdId);
      const card = cardsLocator.nth(matchIdx);
      await card.scrollIntoViewIfNeeded();

      let setsUpdated = 0;
      let cardUnit = 'kg';
      let cardMode = 'reps';
      let restChange = null;
      let noteApplied = false;

      // 4A. Pesos & Repeticiones / Rangos de Repeticiones
      if (applyOptions.weightsAndReps) {
        // Detectar estructura de la tarjeta y marcar inputs de series efectivas (saltando W)
        const cardMeta = await page.evaluate(
          ({ rbdId }) => {
            const c = document.querySelector(`[data-rbd-draggable-id="${rbdId}"]`);
            if (!c) return null;

            // Limpiar marcas previas
            c.querySelectorAll('[data-vyfith-cell]').forEach((el) => el.removeAttribute('data-vyfith-cell'));

            const ps = Array.from(c.querySelectorAll('p')).map((p) => (p.textContent || '').trim().toUpperCase());
            const isDuration = ps.includes('TIEMPO') || ps.includes('TIME');
            const isRepRange = ps.includes('INTERVALO DE REPETICIONES') || ps.includes('REP RANGE');
            const unit = ps.includes('LBS') ? 'lbs' : 'kg';

            if (isDuration) {
              return { unit, mode: 'duration', usesCommaDecimal: false, workingRows: [] };
            }

            const allSetInputs = Array.from(c.querySelectorAll('input')).filter(
              (inp) => inp.getAttribute('aria-label') !== 'Temporizador de descanso:' && inp.type !== 'checkbox'
            );

            // Agrupar inputs en filas reales (que tienen etiqueta W, 1, 2, 3, F, D en su primer hijo)
            const seenRows = new Set();
            const workingRows = [];
            let usesCommaDecimal = false;

            for (const inp of allSetInputs) {
              if ((inp.value || '').includes(',')) usesCommaDecimal = true;
              let r = inp.parentElement;
              while (r && r !== c) {
                const firstTxt = (r.children?.[0]?.textContent || '').trim();
                const inpsInRow = Array.from(r.querySelectorAll('input')).filter(
                  (i) => i.getAttribute('aria-label') !== 'Temporizador de descanso:'
                );
                if (/^(W|\d+|F|D)$/i.test(firstTxt) && inpsInRow.length >= 2) {
                  if (!seenRows.has(r)) {
                    seenRows.add(r);
                    if (!/^W$/i.test(firstTxt)) {
                      const rowIdx = workingRows.length;
                      inpsInRow[0].setAttribute('data-vyfith-cell', `w-${rowIdx}`);
                      if (inpsInRow[1]) inpsInRow[1].setAttribute('data-vyfith-cell', `rmin-${rowIdx}`);
                      if (inpsInRow[2]) inpsInRow[2].setAttribute('data-vyfith-cell', `rmax-${rowIdx}`);
                      workingRows.push({
                        rowIdx,
                        label: firstTxt,
                        inputCount: inpsInRow.length,
                        currentWeight: inpsInRow[0].value,
                        currentRepMin: inpsInRow[1]?.value ?? '',
                        currentRepMax: inpsInRow[2]?.value ?? '',
                      });
                    }
                  }
                  break;
                }
                r = r.parentElement;
              }
            }

            // En Hevy Web en español, las tarjetas en KG usan coma decimal ("42,5")
            const langIsEs = (document.documentElement.lang || '').toLowerCase().startsWith('es') ||
              (document.body.innerText || '').includes('Actualizar rutina');
            if (langIsEs && !usesCommaDecimal && allSetInputs.every((i) => !(i.value || '').includes('.'))) {
              usesCommaDecimal = true;
            }

            return {
              unit,
              mode: isRepRange ? 'rep-range' : 'reps',
              usesCommaDecimal,
              workingRows,
            };
          },
          { rbdId: matchedCardInfo.rbdId }
        );

        if (cardMeta && cardMeta.mode !== 'duration' && cardMeta.workingRows.length > 0) {
          cardUnit = cardMeta.unit;
          cardMode = cardMeta.mode;
          const nonWarmupSuggestions = Array.isArray(item.setSuggestions)
            ? item.setSuggestions.filter((s) => !s.isWarmup)
            : [];

          for (let rIdx = 0; rIdx < cardMeta.workingRows.length; rIdx++) {
            const rowMeta = cardMeta.workingRows[rIdx];
            const setPlan = nonWarmupSuggestions[rIdx] || nonWarmupSuggestions[nonWarmupSuggestions.length - 1] || null;

            const desiredKg = Number(setPlan?.suggestedWeightKg ?? item.targetWeightKg ?? 0);
            const desiredLbs = Number(
              setPlan?.suggestedWeightLbs ??
                (desiredKg > 0 ? Math.round((desiredKg / LBS_TO_KG) * 10) / 10 : item.targetWeightLbs ?? 0)
            );
            const targetWeightVal = cardMeta.unit === 'lbs' ? desiredLbs : desiredKg;

            let touchedRow = false;

            if (targetWeightVal > 0) {
              const formattedWeight = formatWeightForHevyInput(targetWeightVal, cardMeta.usesCommaDecimal);
              const wLoc = card.locator(`[data-vyfith-cell="w-${rIdx}"]`).first();
              if (formattedWeight && (await wLoc.count()) > 0 && rowMeta.currentWeight !== formattedWeight) {
                await wLoc.fill(formattedWeight);
                await wLoc.blur().catch(() => {});
                touchedRow = true;
              } else if (formattedWeight && rowMeta.currentWeight === formattedWeight) {
                touchedRow = true; // ya estaba en el objetivo
              }
            }

            // Repeticiones o Rango de Repeticiones
            const repRangeStr = String(setPlan?.suggestedRepRange || '').trim();
            const rangeMatch = repRangeStr.match(/(\d+)\s*[-–]\s*(\d+)/);
            const singleReps = Number(setPlan?.suggestedReps ?? 0);

            if (cardMeta.mode === 'rep-range' && rowMeta.inputCount >= 3) {
              let minVal = '';
              let maxVal = '';
              if (rangeMatch) {
                minVal = rangeMatch[1];
                maxVal = rangeMatch[2];
              } else if (singleReps > 0) {
                minVal = String(Math.round(singleReps));
                maxVal = rowMeta.currentRepMax ? String(Math.max(Math.round(singleReps) + 2, Number(rowMeta.currentRepMax) || Math.round(singleReps) + 2)) : String(Math.round(singleReps) + 2);
              }
              if (minVal) {
                const rMinLoc = card.locator(`[data-vyfith-cell="rmin-${rIdx}"]`).first();
                if ((await rMinLoc.count()) > 0 && rowMeta.currentRepMin !== minVal) {
                  await rMinLoc.fill(minVal);
                  await rMinLoc.blur().catch(() => {});
                  touchedRow = true;
                }
              }
              if (maxVal) {
                const rMaxLoc = card.locator(`[data-vyfith-cell="rmax-${rIdx}"]`).first();
                if ((await rMaxLoc.count()) > 0 && rowMeta.currentRepMax !== maxVal) {
                  await rMaxLoc.fill(maxVal);
                  await rMaxLoc.blur().catch(() => {});
                  touchedRow = true;
                }
              }
            } else if (singleReps > 0) {
              const rMinLoc = card.locator(`[data-vyfith-cell="rmin-${rIdx}"]`).first();
              const repStr = String(Math.round(singleReps));
              if ((await rMinLoc.count()) > 0 && rowMeta.currentRepMin !== repStr) {
                await rMinLoc.fill(repStr);
                await rMinLoc.blur().catch(() => {});
                touchedRow = true;
              }
            }

            if (touchedRow) setsUpdated++;
          }
        }
      }

      // 4B. Temporizador de descanso
      if (applyOptions.restTimers && Number.isFinite(Number(item.suggestedRestSeconds)) && Number(item.suggestedRestSeconds) >= 0) {
        restChange = await setCardRestTimer(page, card, Number(item.suggestedRestSeconds));
        if (restChange?.changed) {
          restTimersUpdated.push({
            exerciseName: item.exerciseName || matchedCardInfo.title,
            from: restChange.from,
            to: restChange.to,
          });
        }
      }

      // 4C. Nota fijada de la rutina
      if (applyOptions.notes && item.pinnedNote && String(item.pinnedNote).trim()) {
        const noteArea = card.locator('textarea[aria-label="Nota fijada de la rutina"]').first();
        if ((await noteArea.count()) > 0) {
          const cleanNote = String(item.pinnedNote).trim().slice(0, 280);
          const curNote = await noteArea.inputValue().catch(() => '');
          if (curNote.trim() !== cleanNote) {
            await noteArea.scrollIntoViewIfNeeded();
            await noteArea.fill(cleanNote);
            await noteArea.blur().catch(() => {});
            noteApplied = true;
            notesUpdated.push(item.exerciseName || matchedCardInfo.title);
          }
        }
      }

      if (setsUpdated > 0 || restChange?.changed || noteApplied) {
        modifiedExercises.push({
          exerciseName: item.exerciseName || matchedCardInfo.title,
          esTitle: matchedCardInfo.title,
          unitUsed: cardUnit,
          mode: cardMode,
          updatedSets: setsUpdated,
          restChanged: restChange?.changed ? `${restChange.from} -> ${restChange.to}` : null,
          noteUpdated: noteApplied,
        });
      }
    }

    // 5. Reordenamiento opcional con react-beautiful-dnd (teclado nativo determinista)
    let finalOrderTitles = [];
    if (applyOptions.reorder) {
      const sortableDesired = exercisesInput
        .filter((ex) => !(applyOptions.removeMarked && ex.keepExercise === false))
        .filter((ex) => Number.isFinite(Number(ex.suggestedOrderIndex)))
        .sort((a, b) => Number(a.suggestedOrderIndex) - Number(b.suggestedOrderIndex));

      const placedRbdIds = new Set();
      let targetSlot = 0;

      for (const item of sortableDesired) {
        const liveCards = await getLiveCardTitles(page);
        const curIdx = findMatchingCardIndex(liveCards, [item.esTitle, item.exerciseName], placedRbdIds);
        if (curIdx < 0) continue;

        const rbdId = liveCards[curIdx].rbdId;
        placedRbdIds.add(rbdId);

        if (curIdx !== targetSlot) {
          const handle = page
            .locator(`[data-rbd-draggable-id="${rbdId}"] [data-rbd-drag-handle-draggable-id]`)
            .first();
          if ((await handle.count()) > 0) {
            await handle.scrollIntoViewIfNeeded();
            await handle.focus();
            await page.waitForTimeout(120);
            await page.keyboard.press('Space');
            await page.waitForTimeout(180);

            const steps = Math.abs(curIdx - targetSlot);
            const arrow = curIdx > targetSlot ? 'ArrowUp' : 'ArrowDown';
            for (let s = 0; s < steps; s++) {
              await page.keyboard.press(arrow);
              await page.waitForTimeout(55);
            }
            await page.keyboard.press('Space');
            await page.waitForTimeout(260);
            reorderedCount++;
          }
        }
        targetSlot++;
      }
      finalOrderTitles = (await getLiveCardTitles(page)).map((c) => c.title);
    }

    if (
      modifiedExercises.length === 0 &&
      restTimersUpdated.length === 0 &&
      notesUpdated.length === 0 &&
      removedExercises.length === 0 &&
      reorderedCount === 0
    ) {
      console.log(
        JSON.stringify({
          ok: false,
          editUrl,
          backupSaved,
          error: 'No se detectó ningún cambio efectivo para aplicar en el editor de Hevy (verifica coincidencias de ejercicios).',
          notFound,
        })
      );
      process.exitCode = 1;
      return;
    }

    // 6. Pulsar «Actualizar rutina» e INTERCEPTAR respuesta HTTP 200 real de api.hevyapp.com
    let saveNetworkResult = null;
    const onSaveResp = async (res) => {
      const method = res.request().method();
      const url = res.url();
      if (
        url.includes('api.hevyapp.com') &&
        ['PUT', 'POST', 'PATCH'].includes(method) &&
        /routine/i.test(url)
      ) {
        let bodySnippet = '';
        try {
          bodySnippet = (await res.text()).slice(0, 280);
        } catch {
          // ignore
        }
        saveNetworkResult = {
          status: res.status(),
          method,
          url,
          bodySnippet,
        };
      }
    };
    page.on('response', onSaveResp);

    const updateBtn = page.getByRole('button', { name: /Actualizar rutina|Update Routine|Guardar cambios|Save/i }).first();
    await updateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await updateBtn.scrollIntoViewIfNeeded();
    await updateBtn.click();

    const saveDeadline = Date.now() + 16000;
    while (!saveNetworkResult && Date.now() < saveDeadline) {
      await page.waitForTimeout(250);
    }
    page.off('response', onSaveResp);

    if (!saveNetworkResult) {
      console.log(
        JSON.stringify({
          ok: false,
          editUrl,
          backupSaved,
          error: 'Se pulsó «Actualizar rutina» pero Hevy no emitió respuesta de guardado HTTP. No se puede confirmar la modificación.',
        })
      );
      process.exitCode = 1;
      return;
    }

    if (saveNetworkResult.status < 200 || saveNetworkResult.status >= 300) {
      console.log(
        JSON.stringify({
          ok: false,
          editUrl,
          backupSaved,
          httpStatus: saveNetworkResult.status,
          saveEndpoint: saveNetworkResult.url,
          error: `Hevy rechazó el guardado con HTTP ${saveNetworkResult.status}: ${saveNetworkResult.bodySnippet}`,
        })
      );
      process.exitCode = 1;
      return;
    }

    // 7. Re-lectura antifraude desde servidores de Hevy para comprobar persistencia real
    let verifiedRoutine = null;
    if (meta.shortId) {
      await page.waitForTimeout(900);
      const postRaw = await fetchRoutineViaPage(page, meta.shortId);
      verifiedRoutine = normalizeHevyRoutinePayload(postRaw, unitMap);
      if (verifiedRoutine) {
        upsertRoutineInSavedFile(verifiedRoutine, auth.accountName || '@teheransmit');
      }
    }

    console.log(
      JSON.stringify({
        ok: true,
        verifiedHttp200: true,
        httpStatus: saveNetworkResult.status,
        saveMethod: saveNetworkResult.method,
        saveEndpoint: saveNetworkResult.url,
        routineName: verifiedRoutine?.title || meta.name,
        routineShortId: meta.shortId,
        editUrl,
        routineUrl: meta.routineUrl,
        backupSaved,
        backupFile: backupSaved ? ROUTINES_BACKUP_FILE : null,
        applyOptions,
        modifiedExercises,
        restTimersUpdated,
        notesUpdated,
        removedExercises,
        reorderedCount,
        finalOrderTitles,
        notFound,
        verifiedExerciseCount: verifiedRoutine?.exerciseCount ?? null,
        verifiedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.log(JSON.stringify({ ok: false, error: formatCleanBridgeError(err) }));
    process.exitCode = 1;
  } finally {
    if (ctx) await ctx.close().catch(() => {});
    releaseBridgeLock();
  }
}

const args = parseArgs(process.argv);
if (args.cmd === 'status') await handleStatus();
else if (args.cmd === 'login') await handleLogin(args);
else if (args.cmd === 'export-csv') await handleExportCsv(args.out || DEFAULT_EXPORT_CSV);
else if (args.cmd === 'export-routines') await handleExportRoutines();
else if (args.cmd === 'apply-routine-plan' || args.cmd === 'update-routine') await handleApplyRoutinePlan(args);
else {
  console.log(JSON.stringify({ ok: false, error: `Comando desconocido: ${args.cmd}` }));
  process.exitCode = 1;
}
