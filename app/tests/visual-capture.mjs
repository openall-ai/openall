/**
 * OpenAll Visual Screenshot Test Runner
 *
 * Usage:
 *   npm run test:visual            — capture & compare against baseline
 *   npm run test:visual:approve    — capture & set as new baseline
 *
 * Screenshots saved to:
 *   tests/screenshots/baseline/   — approved reference images (committed)
 *   tests/screenshots/runs/<ts>/  — every run for audit history (gitignored)
 */

import { app, BrowserWindow, ipcMain, clipboard, nativeImage, dialog, safeStorage } from 'electron';
import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bootstrap } from '@openall-ai/core/dist/in-proc.js';
import { ChatGateway } from '@openall-ai/core/dist/chat/chat.gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR    = path.resolve(__dirname, '..');
const BASE_DIR   = path.join(__dirname, 'screenshots', 'baseline');
const RUNS_DIR   = path.join(__dirname, 'screenshots', 'runs');
const IS_APPROVE = process.argv.includes('--approve');

const RUN_TS  = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
const RUN_DIR = path.join(RUNS_DIR, RUN_TS);
const manifest = [];

// ─── Encryption (same as main.js) ────────────────────────────────────────────

const encryptionService = {
    encrypt: v  => safeStorage.encryptString(v).toString('base64'),
    decrypt: v  => safeStorage.decryptString(Buffer.from(v, 'base64')),
};

// ─── Window ───────────────────────────────────────────────────────────────────

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        title: 'openall – visual test',
        width: 1000,
        height: 700,
        show: true,
        webPreferences: {
            preload: path.join(APP_DIR, 'electron', 'preload.mjs'),
        },
    });
    mainWindow.loadFile(path.join(APP_DIR, '..', 'frontend', 'dist', 'index.html'));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const wait = ms => new Promise(r => setTimeout(r, ms));

async function js(code) {
    return mainWindow.webContents.executeJavaScript(code);
}

async function waitForInit() {
    console.log('  Waiting for app to initialize...');
    for (let i = 0; i < 60; i++) {
        try {
            if (await js('window.__store?.initialized === true')) return;
        } catch (_) {}
        await wait(1000);
    }
    throw new Error('App did not initialize within 60 s');
}

async function clearState() {
    await js(`
        (() => {
            const s  = window.__store;
            const cs = window.__connectionStatus;
            s.windows        = [];
            s.pinnedApps     = [];
            s.showConfig     = false;
            s.showSettings   = false;
            s.showConnectors = false;
            s.setShowLauncher(false);
            s.shareState     = null;
            if (cs && !cs.connected) cs.setConnected(true);
        })()
    `);
    // Click neutral centre to collapse chat panel
    mainWindow.webContents.sendInputEvent({ type: 'mouseDown', x: 200, y: 200, button: 'left', clickCount: 1 });
    mainWindow.webContents.sendInputEvent({ type: 'mouseUp',   x: 200, y: 200, button: 'left', clickCount: 1 });
    await wait(250);
}

async function capture(name, description) {
    const png          = (await mainWindow.webContents.capturePage()).toPNG();
    const runPath      = path.join(RUN_DIR,  name);
    const baselinePath = path.join(BASE_DIR, name);

    fs.writeFileSync(runPath, png);

    let status = 'new';
    if (fs.existsSync(baselinePath)) {
        status = fs.readFileSync(baselinePath).equals(png) ? 'pass' : 'changed';
    }

    if (IS_APPROVE || status === 'new') {
        fs.writeFileSync(baselinePath, png);
        if (IS_APPROVE && status === 'changed') status = 'approved';
    }

    const icon = { pass: '✓', new: '+', changed: '≠', approved: '✔' }[status] ?? '?';
    console.log(`  ${icon}  ${name.padEnd(36)} [${status}]`);
    manifest.push({ screenshot: name, description, status, timestamp: new Date().toISOString() });
    return status;
}

// ─── Fake window HTML (injected for window-related screens) ───────────────────

const FAKE_WINDOW_HTML = `
    <div style="padding:24px;font-family:sans-serif;color:#111">
        <h2 style="margin:0 0 12px;font-size:16px;font-weight:600">Sales Overview</h2>
        <p style="color:#555;font-size:13px">Revenue this month: <strong>$42,800</strong></p>
        <button style="margin-top:14px;padding:8px 18px;background:#111;color:#fff;border:none;border-radius:6px;font-size:13px">Refresh</button>
    </div>`.replace(/`/g, "'");

// ─── Screenshot scenarios ─────────────────────────────────────────────────────

async function runScreenshots() {
    fs.mkdirSync(RUN_DIR,  { recursive: true });
    fs.mkdirSync(BASE_DIR, { recursive: true });

    await waitForInit();
    console.log('\n  Capturing 12 screens...\n');

    // 01 — Main screen
    await clearState();
    await wait(300);
    await capture('01-main-screen.png',
        'Main app screen after initialization — sidebar and background, no modals');

    // 02 — Chat panel expanded
    await clearState();
    await js(`document.querySelector('textarea')?.focus()`);
    await wait(450);
    await capture('02-chat-expanded.png',
        'Chat input panel expanded on textarea focus, showing message history area');

    // 03 — Config modal
    await clearState();
    await js(`window.__store.showConfig = true`);
    await wait(200);
    await capture('03-config-modal.png',
        'Provider / API key configuration modal (OpenRouter, OpenAI, Anthropic, Gemini)');

    // 04 — Settings modal
    await clearState();
    await js(`window.__store.showSettings = true`);
    await wait(200);
    await capture('04-settings-modal.png',
        'Settings modal — chat system prompt and UI action prompt editors');

    // 05 — Connectors screen
    await clearState();
    await js(`window.__store.showConnectors = true`);
    await wait(200);
    await capture('05-connectors-screen.png',
        'MCP & Connectors screen — configure external tool integrations');

    // 06 — Launcher overlay
    await clearState();
    await js(`window.__store.setShowLauncher(true)`);
    await wait(200);
    await capture('06-launcher-overlay.png',
        'App launcher search overlay (Cmd+K) for opening pinned or recent apps');

    // 07 — Draggable window
    await clearState();
    await js(`window.__store.windows.push({ id:9999, title:'Sales Overview', content:\`${FAKE_WINDOW_HTML}\`, minimized:false, loading:false, inputs:{}, pinned:false })`);
    await wait(300);
    await capture('07-draggable-window.png',
        'LLM-generated draggable window with rendered HTML content and title bar controls');

    // 08 — Minimized window
    await clearState();
    await js(`window.__store.windows.push({ id:9999, title:'Sales Overview', content:'', minimized:true, loading:false, inputs:{}, pinned:false })`);
    await wait(300);
    await capture('08-minimized-window.png',
        'Minimized window card in the bottom-right corner with restore and close buttons');

    // 09 — Share modal
    await clearState();
    await js(`
        window.__store.setShareState({
            active: true,
            imageDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            windowTitle: 'Sales Overview',
        })
    `);
    await wait(200);
    await capture('09-share-modal.png',
        'Share modal with social platform buttons (Twitter, LinkedIn, WhatsApp, etc.) and preview');

    // 10 — Pinned app in sidebar
    await clearState();
    await js(`window.__store.pinnedApps = [{ id:9997, title:'Sales Dashboard', content:'', pinned:true }]`);
    await wait(300);
    await capture('10-pinned-app-sidebar.png',
        'Sidebar showing a pinned app entry in the Apps & Utilities section');

    // 11 — Window loading state
    await clearState();
    await js(`window.__store.windows.push({ id:9999, title:'Sales Overview', content:'', minimized:false, loading:true, inputs:{}, pinned:false })`);
    await wait(300);
    await capture('11-window-loading-state.png',
        'Draggable window in loading/generating state (spinner visible)');

    // 12 — Disconnected state
    await clearState();
    await js(`document.querySelector('textarea')?.focus()`);
    await wait(450);
    await js(`
        (() => {
            const cs = window.__connectionStatus;
            cs.connected  = false;
            cs.connecting = false;
        })()
    `);
    await wait(200);
    await capture('12-disconnected-state.png',
        'Chat bar turns red and shows "Disconnected" when the backend connection is lost');

    // ─── Summary ────────────────────────────────────────────────────────────
    fs.writeFileSync(
        path.join(RUN_DIR, 'manifest.json'),
        JSON.stringify({ runAt: RUN_TS, approved: IS_APPROVE, screenshots: manifest }, null, 2)
    );

    const changed = manifest.filter(m => m.status === 'changed');
    const isNew   = manifest.filter(m => m.status === 'new' || m.status === 'approved');

    console.log('\n  ─────────────────────────────────────────');
    console.log(`  Run saved → ${RUN_DIR}`);

    if (changed.length) {
        console.log(`\n  ⚠  ${changed.length} screen(s) changed vs baseline:`);
        changed.forEach(m => console.log(`     • ${m.screenshot}`));
        console.log('\n  Run  npm run test:visual:approve  to accept these as the new baseline.');
        app.exit(1);
    } else {
        if (isNew.length) console.log(`\n  +  ${isNew.length} new baseline(s) saved.`);
        else              console.log('\n  ✓  All screens match baseline.');
        app.exit(0);
    }
}

// ─── Bootstrap (mirrors main.js) ─────────────────────────────────────────────

async function init() {
    const nestApp    = await bootstrap();
    const chatGateway = await nestApp.resolve(ChatGateway);
    chatGateway.setEncryptionService(encryptionService);

    const client = { send: s => mainWindow?.webContents.send('ws:event', s) };

    ipcMain.handle('chat-service:chat',        async (_e, p)          => chatGateway.handleEvent(p));
    ipcMain.handle('chat-service:config',      async (_e, p)          => chatGateway.handleConfig(p, client));
    ipcMain.handle('chat-service:connect',     async ()               => chatGateway.handleConnection(client));
    ipcMain.handle('chat-service:close',       async (_e, p)          => chatGateway.handleClose(p, client));
    ipcMain.handle('chat-service:doAction',    async (_e, p)          => chatGateway.handleAction(p));
    ipcMain.handle('chat-service:sendMessage', async (_e, { msgType, data }) => chatGateway.handleMessage(msgType, data, client));
    ipcMain.handle('shell:openExternal',       async ()               => {});
    ipcMain.handle('clipboard:writeImage',     ()                     => {});
    ipcMain.handle('file:pick',               async ()               => null);

    app.whenReady().then(() => {
        createWindow();
        mainWindow.webContents.once('did-finish-load', () => {
            runScreenshots().catch(err => {
                console.error('\n  ✖  Screenshot capture failed:', err.message);
                app.exit(1);
            });
        });
    });
}

init();
