#!/usr/bin/env node
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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

fs.mkdirSync(PROFILE_DIR, { recursive: true });
fs.mkdirSync(IMPORTS_DIR, { recursive: true });

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
        'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq \'chrome.exe\' -or $_.Name -eq \'chromium.exe\' -or $_.Name -eq \'chrome-headless-shell.exe\') -and $_.CommandLine -like \'*hevy-chrome-profile*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"',
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
    return 'La ventana de Chrome de Hevy Web se cerró o ya había otra sesión abierta en segundo plano. Vuelve a pulsar «Conectar Hevy Web» o «Sync en Vivo».';
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

async function openContext(headless = true, cmd = 'status') {
  // 1. Verificar si ya hay otro proceso de hevy_web_bridge.mjs activo
  let activeLock = readBridgeLock();
  if (activeLock) {
    if (activeLock.cmd === 'login' && cmd !== 'login') {
      throw new Error(
        'Ya tienes abierta la ventana de Google Chrome para iniciar sesión en Hevy Web. Completa el login en esa ventana primero.'
      );
    }
    // Esperar brevemente si es una operación corta (status / export-csv)
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

  // Si no hay ningún proceso de bridge vivo, limpiar cualquier proceso huérfano de Chrome que haya retenido .hevy-chrome-profile
  if (!readBridgeLock()) {
    cleanupOrphanProfileChrome();
  }

  writeBridgeLock(cmd);

  let bundledExe = '';
  try {
    bundledExe = chromium.executablePath();
  } catch {
    bundledExe = '';
  }
  const useBundled = Boolean(bundledExe && fs.existsSync(bundledExe));

  const launchOpts = {
    ...(useBundled ? {} : { channel: 'chrome' }),
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
  } catch (firstErr) {
    // Reintento automático tras limpiar procesos huérfanos sobre .hevy-chrome-profile
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

async function handleLogin() {
  let ctx;
  try {
    ctx = await openContext(false, 'login');
    const page = ctx.pages()[0] || (await ctx.newPage());
    await page.bringToFront().catch(() => {});
    // Si ya tiene sesión activa, irá directo; si no, Hevy redirige a login o abre login
    const initialCheck = await isLoggedIn(page);
    if (!initialCheck.authenticated) {
      await page.goto('https://hevy.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.bringToFront().catch(() => {});
    }
    const deadline = Date.now() + 180000;
    let logged = false;
    while (Date.now() < deadline) {
      if (page.isClosed() || ctx.pages().length === 0) {
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
      const current = page.url();
      if (!current.includes('/login') && !current.includes('/signup') && current.includes('hevy.com')) {
        await page.waitForTimeout(1500);
        const verify = await isLoggedIn(page);
        if (verify.authenticated) {
          logged = true;
          let csvResult = null;
          try {
            csvResult = await exportCsvFromAuthenticatedPage(page, DEFAULT_EXPORT_CSV);
          } catch {
            csvResult = null;
          }
          console.log(
            JSON.stringify({
              ok: true,
              authenticated: true,
              accountName: verify.accountName,
              csvPath: csvResult?.outPath || null,
              bytes: csvResult?.bytes || 0,
            })
          );
          break;
        }
      }
      await page.waitForTimeout(1000);
    }
    if (!logged) {
      console.log(JSON.stringify({ ok: false, authenticated: false, error: 'Tiempo de espera de inicio de sesión agotado (180s).' }));
      process.exitCode = 1;
    }
  } catch (err) {
    console.log(JSON.stringify({ ok: false, authenticated: false, error: formatCleanBridgeError(err) }));
    process.exitCode = 1;
  } finally {
    if (ctx) await ctx.close().catch(() => {});
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

    const exportBtn = page.getByRole('button', { name: /Exportar datos de entrenamiento|Export workout data/i }).first();
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

    console.log(
      JSON.stringify({
        ok: true,
        csvPath: outPath,
        suggestedFilename: download.suggestedFilename(),
        bytes,
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

    await page.waitForTimeout(1500);
    const editBtn = page.getByRole('button', { name: /Editar rutina|Edit Routine/i }).first();
    if ((await editBtn.count()) === 0) {
      const editLink = page.locator('a[href*="/edit-routine/"]').first();
      await editLink.waitFor({ state: 'visible', timeout: 15000 });
      await editLink.click();
    } else {
      await editBtn.click();
    }

    await page.waitForURL(/\/edit-routine\//, { timeout: 20000 });
    await page.waitForTimeout(2000);
    const editUrl = page.url();

    // Actualizar campos de peso/repeticiones por ejercicio dentro del editor
    const result = await page.evaluate((updates) => {
      const modified = [];
      const notFound = [];

      const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

      for (const item of updates) {
        const candidates = [item.exerciseName, item.esTitle].filter(Boolean).map(normalize);
        // Buscar botón/encabezado de ejercicio en el DOM de edit-routine
        const headings = Array.from(document.querySelectorAll('button, h4, h5, span, a'));
        const matchEl = headings.find((el) => {
          const t = normalize(el.textContent);
          return t && candidates.some((c) => t === c || (c.length > 5 && t.includes(c)));
        });

        if (!matchEl) {
          notFound.push(item.exerciseName || item.esTitle);
          continue;
        }

        // Subir hasta el contenedor de tarjeta del ejercicio que contiene los inputs y el botón "Agregar Serie"/"Add Set"
        let card = matchEl.parentElement;
        while (card && card.parentElement && card.querySelectorAll('input').length < 2) {
          card = card.parentElement;
        }
        if (!card) {
          notFound.push(item.exerciseName);
          continue;
        }

        // Actualizar nota fijada si existe input con placeholder de nota
        if (item.pinnedNote) {
          const noteInput = card.querySelector('input[placeholder*="nota" i], textarea[placeholder*="nota" i], input[placeholder*="note" i], textarea[placeholder*="note" i]');
          if (noteInput) {
            const nativeSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(noteInput), 'value').set;
            nativeSetter.call(noteInput, item.pinnedNote);
            noteInput.dispatchEvent(new Event('input', { bubbles: true }));
            noteInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }

        // Actualizar inputs numéricos de peso en las series (primer input numérico de cada fila de serie, cuando hay peso objetivo)
        const targetWeightLbs = item.targetWeightLbs;
        if (targetWeightLbs && Number(targetWeightLbs) > 0) {
          const noteEl = card.querySelector('input[placeholder*="nota" i], input[placeholder*="note" i]');
          const allInputs = Array.from(card.querySelectorAll('input')).filter((inp) => inp !== noteEl && inp.type !== 'checkbox');
          // En Hevy edit-routine, típicamente por fila hay: peso (lbs) + reps (o min-max reps)
          // Localizamos filas que contienen heading de número de serie o inputs cortos de carga
          let updatedSets = 0;
          const rows = Array.from(card.querySelectorAll('div')).filter((d) => {
            const directInputs = Array.from(d.children).filter((ch) => ch.tagName === 'INPUT' || ch.querySelector?.('input'));
            const hasSetNum = d.querySelector('h5, span')?.textContent?.trim().match(/^\d+$/);
            return hasSetNum && directInputs.length >= 2;
          });

          if (rows.length > 0) {
            for (const row of rows) {
              const weightInput = row.querySelector('input');
              if (weightInput) {
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeSetter.call(weightInput, String(targetWeightLbs));
                weightInput.dispatchEvent(new Event('input', { bubbles: true }));
                weightInput.dispatchEvent(new Event('change', { bubbles: true }));
                weightInput.dispatchEvent(new Event('blur', { bubbles: true }));
                updatedSets++;
              }
            }
          } else if (allInputs.length > 0) {
            // Fallback seguro al primer input de peso visible de la tarjeta
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(allInputs[0], String(targetWeightLbs));
            allInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            allInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
            updatedSets = 1;
          }

          modified.push({ exerciseName: item.exerciseName, targetWeightLbs, updatedSets });
        }
      }

      return { modified, notFound };
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

    const updateBtn = page.getByRole('button', { name: /Actualizar rutina|Update Routine|Save/i }).first();
    await updateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await updateBtn.click();
    await page.waitForTimeout(3000);

    console.log(
      JSON.stringify({
        ok: true,
        routineName,
        editUrl,
        postSaveUrl: page.url(),
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
else if (args.cmd === 'login') await handleLogin();
else if (args.cmd === 'export-csv') await handleExportCsv(args.out || DEFAULT_EXPORT_CSV);
else if (args.cmd === 'update-routine') await handleUpdateRoutine(args);
else {
  console.log(JSON.stringify({ ok: false, error: `Comando desconocido: ${args.cmd}` }));
  process.exitCode = 1;
}
