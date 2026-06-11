/**
 * OpenAll E2E Screenshot Test Runner — CRM Demo
 *
 * Simulates a real user session end-to-end:
 *   1. Type a CRM build request and send it
 *   2. Wait for the LLM to generate a CRM window
 *   3. Add two customers via the generated form
 *   4. Request a customer count report
 *
 * Screenshots saved to:
 *   tests/screenshots/e2e-flows/<window-title>/<timestamp>/
 *
 * No baseline comparison — content is LLM-generated.
 * A manifest.json is written alongside the screenshots as an audit trail.
 *
 * Usage:
 *   npm run test:e2e
 *
 * Requirements:
 *   An API key must be configured in the running app before executing.
 *   If none is set the test will time out at waitForInit() after 60 s.
 */

import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bootstrap } from '@openall-ai/core/dist/in-proc.js';
import { ChatGateway } from '@openall-ai/core/dist/chat/chat.gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const APP_DIR = path.resolve(__dirname, '..');
const E2E_DIR = path.join(__dirname, 'screenshots', 'e2e-flows');
const RUN_TS  = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

// ─── Encryption (same as main.js) ────────────────────────────────────────────

const encryptionService = {
    encrypt: v => safeStorage.encryptString(v).toString('base64'),
    decrypt: v => safeStorage.decryptString(Buffer.from(v, 'base64')),
};

// ─── Window ───────────────────────────────────────────────────────────────────

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        title: 'openall – e2e test',
        width: 1280,
        height: 800,
        show: true,
        webPreferences: {
            preload: path.join(APP_DIR, 'electron', 'preload.mjs'),
        },
    });
    mainWindow.loadFile(path.join(APP_DIR, '..', 'frontend', 'dist', 'index.html'));
}

// ─── Screenshot state ─────────────────────────────────────────────────────────
//
// Screenshots 01–03 are captured before the window title is known.
// They are buffered in memory and flushed to disk once the LLM assigns a title.

let runDir   = null;           // set once the first window appears
let manifest = [];

const pendingCaptures = [];    // { name, description, png, ts }

function flushPendingCaptures() {
    for (const { name, description, png, ts } of pendingCaptures) {
        fs.writeFileSync(path.join(runDir, name), png);
        manifest.push({ screenshot: name, description, timestamp: ts });
        console.log(`  +  ${name.padEnd(36)} [saved]`);
    }
    pendingCaptures.length = 0;
}

function initRunDir(windowTitle) {
    const safe = (windowTitle || 'Customer Relationship Manager')
        .replace(/[\\/:*?"<>|]/g, '-')
        .trim() || 'Customer Relationship Manager';
    runDir = path.join(E2E_DIR, safe, RUN_TS);
    fs.mkdirSync(runDir, { recursive: true });
    flushPendingCaptures();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const wait = ms => new Promise(r => setTimeout(r, ms));

async function js(code) {
    return mainWindow.webContents.executeJavaScript(code);
}

async function capture(name, description) {
    const png = (await mainWindow.webContents.capturePage()).toPNG();
    const ts  = new Date().toISOString();

    if (!runDir) {
        pendingCaptures.push({ name, description, png, ts });
        console.log(`  …  ${name.padEnd(36)} [buffered]`);
        return;
    }

    fs.writeFileSync(path.join(runDir, name), png);
    console.log(`  +  ${name.padEnd(36)} [saved]`);
    manifest.push({ screenshot: name, description, timestamp: ts });
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

async function waitForWindow(prevCount) {
    console.log(`  Waiting for new window (currently ${prevCount})...`);
    for (let i = 0; i < 120; i++) {
        try {
            if (await js(`window.__store.windows.length > ${prevCount}`)) return;
        } catch (_) {}
        await wait(1000);
    }
    throw new Error('No new window appeared within 120 s');
}

async function waitForWindowLoaded(idx) {
    console.log(`  Waiting for window[${idx}] to finish loading...`);
    for (let i = 0; i < 120; i++) {
        try {
            if (await js(`window.__store.windows[${idx}]?.loading === false`)) return;
        } catch (_) {}
        await wait(1000);
    }
    throw new Error(`window[${idx}] did not finish loading within 120 s`);
}

// Waits for a new non-log message (actual LLM response, not a log/status line).
async function waitForNewMessage(prevNonLogCount) {
    console.log('  Waiting for new LLM response message...');
    for (let i = 0; i < 120; i++) {
        try {
            const n = await js(`window.__store.messages.filter(m => !m.log).length`);
            if (n > prevNonLogCount) return;
        } catch (_) {}
        await wait(1000);
    }
    throw new Error('No new message received within 120 s');
}

// ─── Chat input helpers ───────────────────────────────────────────────────────

async function typeInChat(text) {
    // Focus the textarea so Cmd+Enter reaches it later
    await js(`document.querySelector('textarea')?.focus()`);
    await wait(200);

    // Use the native setter so React's controlled-input onChange fires and
    // updates component state, then dispatch the synthetic input event.
    await js(`
        (() => {
            const ta = document.querySelector('textarea');
            if (!ta) return;
            const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
            setter.call(ta, ${JSON.stringify(text)});
            ta.dispatchEvent(new Event('input', { bubbles: true }));
        })()
    `);
    await wait(300);
}

async function sendChat() {
    // Re-focus the textarea so the keyDown event reaches handleChatBoxInput
    await js(`document.querySelector('textarea')?.focus()`);
    await wait(100);

    // Cmd+Enter triggers handleChatBoxInput → sendMessage() + setMessage('')
    mainWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return', modifiers: ['meta'] });
    mainWindow.webContents.sendInputEvent({ type: 'keyUp',   keyCode: 'Return', modifiers: ['meta'] });
    await wait(500);
}

// ─── CRM form helpers ─────────────────────────────────────────────────────────

const CUSTOMER_DATA = [
    { name: 'John Smith', email: 'john@example.com', phone: '+1-555-0100', company: 'Acme Corp', notes: 'VIP client' },
    { name: 'Jane Doe',   email: 'jane@example.com', phone: '+1-555-0200', company: 'Beta Ltd',  notes: 'New lead'  },
];

// Fill the CRM form by matching element id/name/placeholder against field patterns.
// Fires native setter + input event so the onInput handler in chat-box.tsx records
// the values in window.inputs (required for doAction to submit them).
async function fillCrmForm(customer) {
    await js(`
        (() => {
            const fieldMap = ${JSON.stringify(customer)};
            const patterns = {
                name:    /^name$|customer.?name|full.?name/i,
                email:   /email/i,
                phone:   /phone|tel/i,
                company: /company|org(anization)?/i,
                notes:   /notes?|comment|remark|desc/i,
            };

            const inputSetter  = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,  'value').set;
            const textaSetter  = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;

            const elems = Array.from(document.querySelectorAll(
                'input[type="text"], input:not([type]), textarea:not(.flex-1)'
            ));

            for (const el of elems) {
                const key = (el.id || el.name || el.placeholder || '').trim();
                for (const [field, pattern] of Object.entries(patterns)) {
                    if (pattern.test(key)) {
                        const val = fieldMap[field];
                        if (val === undefined) break;
                        if (el.tagName === 'TEXTAREA') {
                            textaSetter.call(el, val);
                        } else {
                            inputSetter.call(el, val);
                        }
                        el.dispatchEvent(new Event('input',  { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        break;
                    }
                }
            }
        })()
    `);
    await wait(400);
}

async function clickAddButton() {
    const clicked = await js(`
        (() => {
            const btn = Array.from(document.querySelectorAll('button'))
                .find(b => /\\b(add|save|create|submit)\\b/i.test(b.textContent?.trim() ?? ''));
            if (!btn) return false;
            btn.click();
            return true;
        })()
    `);
    if (!clicked) throw new Error('Could not find an Add / Save / Create / Submit button in the CRM window');
    await wait(300);
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const CRM_PROMPT =
    'Build me a customer relationship management (CRM) tool for my day-to-day use.\n' +
    'Make the UI as sophisticated and beautiful as possible — modern design, clear layout,\n' +
    'with a form to add customers (name, email, phone, company, notes) and a table\n' +
    'listing all existing customers.';

const REPORT_PROMPT =
    'How many customers are currently in the database? Please show me a full report.';

// ─── Main scenario ────────────────────────────────────────────────────────────

async function runE2E() {
    await waitForInit();
    console.log('\n  Running E2E CRM scenario — 12 screenshots\n');

    // ── 01  App ready ─────────────────────────────────────────────────────────
    await wait(500);
    await capture('01-app-ready.png', 'App initialized — empty chat, ready for input');

    // ── 02  Type CRM request ──────────────────────────────────────────────────
    await typeInChat(CRM_PROMPT);
    await capture('02-crm-request-typed.png', 'CRM build prompt typed in textarea, not yet sent');

    // ── 03  Send CRM request ──────────────────────────────────────────────────
    const winCountBefore = await js('window.__store.windows.length');
    await sendChat();
    await capture('03-crm-request-sent.png', 'Textarea cleared after Cmd+Enter; request sent to LLM');

    // ── 04  Window appears (may still be loading) ─────────────────────────────
    await waitForWindow(winCountBefore);

    // Now we have the LLM-assigned window title — initialise the run directory
    // and flush the three buffered screenshots to disk.
    const windowTitle = await js(
        `window.__store.windows[${winCountBefore}]?.title || 'Customer Relationship Manager'`
    );
    initRunDir(windowTitle);
    console.log(`  Window title: "${windowTitle}"`);

    await wait(300);
    await capture('04-crm-window-loading.png', 'CRM window appeared — may still show loading spinner');

    // ── 05  CRM UI fully generated ────────────────────────────────────────────
    await waitForWindowLoaded(winCountBefore);
    await wait(500);
    await capture('05-crm-ui-generated.png', 'Full CRM UI rendered by the LLM — form and customer table visible');

    // ── 06  Fill Customer 1 ───────────────────────────────────────────────────
    await fillCrmForm(CUSTOMER_DATA[0]);
    await capture('06-customer-1-entered.png', 'CRM form pre-filled with John Smith details');

    // ── 07  Add Customer 1 ────────────────────────────────────────────────────
    await clickAddButton();
    await waitForWindowLoaded(winCountBefore);
    await wait(500);
    await capture('07-customer-1-added.png', 'CRM refreshed after adding John Smith — customer visible in table');

    // ── 08  Fill Customer 2 ───────────────────────────────────────────────────
    await fillCrmForm(CUSTOMER_DATA[1]);
    await capture('08-customer-2-entered.png', 'CRM form pre-filled with Jane Doe details');

    // ── 09  Add Customer 2 ────────────────────────────────────────────────────
    await clickAddButton();
    await waitForWindowLoaded(winCountBefore);
    await wait(500);
    await capture('09-customer-2-added.png', 'CRM shows both customers after adding Jane Doe');

    // ── 10  Type report request ───────────────────────────────────────────────
    await typeInChat(REPORT_PROMPT);
    await capture('10-report-request-typed.png', 'Customer report request typed in textarea, not yet sent');

    // ── 11  Send report request ───────────────────────────────────────────────
    // Count only non-log messages so we don't trigger on tool-call status lines
    const nonLogCountBefore = await js(`window.__store.messages.filter(m => !m.log).length`);
    await sendChat();
    await capture('11-report-request-sent.png', 'Textarea cleared; report request sent to LLM');

    // ── 12  Report response ───────────────────────────────────────────────────
    await waitForNewMessage(nonLogCountBefore);
    await wait(1000);   // let any trailing render settle
    await capture('12-report-response.png', 'Chat shows LLM customer count / full report response');

    // ── Manifest ──────────────────────────────────────────────────────────────
    fs.writeFileSync(
        path.join(runDir, 'manifest.json'),
        JSON.stringify({ runAt: RUN_TS, windowTitle, screenshots: manifest }, null, 2)
    );

    console.log('\n  ─────────────────────────────────────────');
    console.log(`  Run saved → ${runDir}`);
    console.log('\n  ✓  All 12 screenshots captured.');
    app.exit(0);
}

// ─── Bootstrap (mirrors main.js) ─────────────────────────────────────────────

async function init() {
    // The packaged app encrypts the API key with safeStorage, which ties the
    // ciphertext to the app's macOS Keychain entry (bundle ID com.openall-ai.app).
    // A dev Electron process has a different bundle ID and cannot access that
    // entry. OPENROUTER_API_KEY bypasses safeStorage entirely (loadApiKey checks
    // this env var first), so it is REQUIRED to run this test.
    if (!process.env.OPENROUTER_API_KEY) {
        console.error(
            '\n  ✖  OPENROUTER_API_KEY is not set.\n\n' +
            '     The test cannot decrypt the API key stored by the packaged app\n' +
            '     (macOS Keychain entries are bound to the bundle that created them).\n\n' +
            '     Re-run with:\n' +
            '       OPENROUTER_API_KEY=<your-key> npm run test:e2e\n'
        );
        app.whenReady().then(() => app.exit(1));
        return;
    }

    const nestApp     = await bootstrap();
    const chatGateway = await nestApp.resolve(ChatGateway);
    chatGateway.setEncryptionService(encryptionService);

    const client = { send: s => mainWindow?.webContents.send('ws:event', s) };

    ipcMain.handle('chat-service:chat',        async (_e, p)                 => chatGateway.handleEvent(p));
    ipcMain.handle('chat-service:config',      async (_e, p)                 => chatGateway.handleConfig(p, client));
    ipcMain.handle('chat-service:connect',     async ()                      => chatGateway.handleConnection(client));
    ipcMain.handle('chat-service:close',       async (_e, p)                 => chatGateway.handleClose(p, client));
    ipcMain.handle('chat-service:doAction',    async (_e, p)                 => chatGateway.handleAction(p));
    ipcMain.handle('chat-service:sendMessage', async (_e, { msgType, data }) => chatGateway.handleMessage(msgType, data, client));
    ipcMain.handle('shell:openExternal',       async ()                      => {});
    ipcMain.handle('clipboard:writeImage',     ()                            => {});
    ipcMain.handle('file:pick',               async ()                      => null);

    app.whenReady().then(() => {
        createWindow();
        mainWindow.webContents.once('did-finish-load', () => {
            runE2E().catch(err => {
                console.error('\n  ✖  E2E capture failed:', err.message);
                app.exit(1);
            });
        });
    });
}

init();
