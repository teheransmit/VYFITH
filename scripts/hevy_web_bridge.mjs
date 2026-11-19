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
const DRIVE_BACKUP_CSV = 'G:\\Mi unidad\\Panel_de_Vida\\Hevy\\hevy_workouts_latest.csv';
const LOGIN_CDP_PORT = 9229;

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
    page.waitForSelector('button:has-text("Export"), button:has-text("Exportar")', { timeout: 8000 }).catch(() => null),
    page.waitForURL(/\/(login|signup)/, { timeout: 8000 }).catch(() => null),
    page.waitForTimeout(4500),
  ]);
  const url = page.url();
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
  const hasExportBtn =
    (await page.getByRole('button', { name: /Exportar datos de entrenamiento|Export workout data|Export/i }).count()) > 0;
  const hasAuthNav = (await page.locator('a[href*="/user/"], a[href="/routines"]').count()) > 0;
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
    // 1. Verificar primero si ya existe una sesión autenticada válida en .hevy-chrome-profile (headless)
    const desktopName = getWindowsDesktopName();
    if (desktopName && desktopName.toLowerCase() !== 'default') {
      // Antes de reportar escritorio aislado, verificar si ya inició sesión (ej. vía Conectar_Hevy_Web.bat)
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
            'El servidor localhost:3000 fue iniciado desde el escritorio aislado de Antigravity (sin ventanas visibles). Haz doble clic UNA SOLA VEZ en C:\\Proyectos\\VYFITH\\Conectar_Hevy_Web.bat para iniciar sesión visible en Hevy Web; después «Sync en Vivo» y «Aplicar Cargas a Hevy App» funcionarán solos sin Antigravity.',
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

    // En escritorio Windows "Default", Start-Process -WindowStyle Normal + CDP abre ventana 100% VISIBLE en primer plano
    launchedPid = launchVisibleChromiumForLogin(exePath, 'https://hevy.com/settings?export');
    await waitForCdpReady(LOGIN_CDP_PORT, 15000);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${LOGIN_CDP_PORT}`);

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
          let csvResult = null;
          try {
            csvResult = await exportCsvFromAuthenticatedPage(activePage, DEFAULT_EXPORT_CSV);
          } catch {
            csvResult = null;
          }
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

async function handleUpdateRoutine(args) {
  const routineName = args['routine-name'] || '';
  const routineUrlArg = args['routine-url'] || '';
  const payloadFile = args['payload-file'] || '';
  if (!routineName && !routineUrlArg) {
    console.log(JSON.stringify({ ok: false, error: 'Se requiere --routine-name o --routine-url' }));
    process.exitCode = 1;
    return;
  }
  if (!payloadFile || !fs.existsSync(payloadFile)) {
    console.log(JSON.stringify({ ok: false, error: 'No se encontró --payload-file' }));
    process.exitCode = 1;
    return;
  }

  const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));
  const exercisesToUpdate = Array.isArray(payload.exercises) ? payload.exercises : [];

  let ctx;
  try {
    ctx = await openContext(true, 'update-routine');
    const page = ctx.pages()[0] || (await ctx.newPage());
    const auth = await isLoggedIn(page);
    if (!auth.authenticated) {
      console.log(JSON.stringify({ ok: false, requiresLogin: true, error: 'Sesión Chrome de Hevy Web no iniciada.' }));
      return;
    }

    if (routineUrlArg) {
      await page.goto(routineUrlArg, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } else {
      await page.goto('https://hevy.com/routines', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      const targetLink = page.locator('a[href*="/routine/"]').filter({ hasText: routineName }).first();
      if ((await targetLink.count()) === 0) {
        console.log(JSON.stringify({ ok: false, error: `No se encontró la rutina '${routineName}' en hevy.com/routines` }));
        process.exitCode = 1;
        return;
      }
      await targetLink.click();
    }

    await page.waitForTimeout(1800);
    if (!page.url().includes('/edit-routine/')) {
      const editBtn = page.getByRole('button', { name: /Editar rutina|Edit Routine/i }).first();
      if ((await editBtn.count()) > 0) {
        await editBtn.click();
      } else {
        const editLink = page.locator('a[href*="/edit-routine/"]').first();
        await editLink.waitFor({ state: 'visible', timeout: 15000 });
        await editLink.click();
      }
      await page.waitForURL(/\/edit-routine\//, { timeout: 20000 });
    }

    await page.waitForTimeout(2200);
    const editUrl = page.url();

    // Actualizar campos de peso/notas por ejercicio dentro del editor (detecta automáticamente KG vs LBS)
    const result = await page.evaluate((updates) => {
      const modified = [];
      const notFound = [];

      const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

      // Detectar unidad global configurada en Hevy Web (KG vs LBS)
      const bodyText = (document.body.innerText || '').toUpperCase();
      const usesKg = /\bKG\b/.test(bodyText) && !/\bLBS\b/.test(bodyText);

      const setReactInputValue = (el, val) => {
        const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, String(val));
        else el.value = String(val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      };

      for (const item of updates) {
        const candidates = [item.exerciseName, item.esTitle].filter(Boolean).map(normalize);
        const headings = Array.from(document.querySelectorAll('button, h4, h5, span, a'));
        const matchEl = headings.find((el) => {
          const t = normalize(el.textContent);
          return t && candidates.some((c) => t === c || (c.length > 5 && t.includes(c)));
        });

        if (!matchEl) {
          notFound.push(item.exerciseName || item.esTitle);
          continue;
        }

        let card = matchEl.parentElement;
        while (card && card.parentElement && card.querySelectorAll('input').length < 2) {
          card = card.parentElement;
        }
        if (!card) {
          notFound.push(item.exerciseName);
          continue;
        }

        // Verificar unidad específica dentro de la tarjeta (encabezado KG vs LBS)
        const cardTextUpper = (card.innerText || '').toUpperCase();
        const cardUsesKg = /\bKG\b/.test(cardTextUpper) ? true : /\bLBS\b/.test(cardTextUpper) ? false : usesKg;
        const targetWeight = cardUsesKg && Number(item.targetWeightKg) > 0
          ? Number(item.targetWeightKg)
          : Number(item.targetWeightLbs || 0);

        if (item.pinnedNote) {
          const noteInput = card.querySelector(
            'input[placeholder*="nota" i], textarea[placeholder*="nota" i], input[placeholder*="note" i], textarea[placeholder*="note" i]'
          );
          if (noteInput) {
            setReactInputValue(noteInput, item.pinnedNote);
          }
        }

        if (targetWeight > 0) {
          const noteEl = card.querySelector('input[placeholder*="nota" i], input[placeholder*="note" i]');
          const allInputs = Array.from(card.querySelectorAll('input')).filter((inp) => inp !== noteEl && inp.type !== 'checkbox');
          let updatedSets = 0;

          // Identificar filas de series efectivas (1, 2, 3...) ignorando calentamiento (W)
          const rows = Array.from(card.querySelectorAll('div')).filter((d) => {
            const directInputs = Array.from(d.children).filter((ch) => ch.tagName === 'INPUT' || ch.querySelector?.('input'));
            const setLabel = d.querySelector('h5, span, button')?.textContent?.trim() || '';
            const isWorkingSet = /^\d+$/.test(setLabel);
            return isWorkingSet && directInputs.length >= 2;
          });

          if (rows.length > 0) {
            for (const row of rows) {
              const weightInput = row.querySelector('input');
              if (weightInput) {
                setReactInputValue(weightInput, targetWeight);
                updatedSets++;
              }
            }
          } else if (allInputs.length > 0) {
            setReactInputValue(allInputs[0], targetWeight);
            updatedSets = 1;
          }

          modified.push({
            exerciseName: item.exerciseName,
            unitUsed: cardUsesKg ? 'kg' : 'lbs',
            targetWeight,
            updatedSets,
          });
        }
      }

      return { modified, notFound, unitDetected: usesKg ? 'kg' : 'lbs' };
    }, exercisesToUpdate);

    if (result.modified.length === 0) {
      console.log(
        JSON.stringify({
          ok: false,
          editUrl,
          error: 'No se modificó ningún ejercicio coincidente en el DOM del editor de Hevy.',
          notFound: result.notFound,
        })
      );
      process.exitCode = 1;
      return;
    }

    const updateBtn = page.getByRole('button', { name: /Actualizar rutina|Update Routine|Guardar cambios|Save/i }).first();
    await updateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await updateBtn.click();
    await page.waitForTimeout(3500);

    console.log(
      JSON.stringify({
        ok: true,
        routineName,
        editUrl,
        postSaveUrl: page.url(),
        unitDetected: result.unitDetected,
        modifiedExercises: result.modified,
        notFound: result.notFound,
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
else if (args.cmd === 'update-routine') await handleUpdateRoutine(args);
else {
  console.log(JSON.stringify({ ok: false, error: `Comando desconocido: ${args.cmd}` }));
  process.exitCode = 1;
}
