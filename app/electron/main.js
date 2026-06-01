import { app, BrowserWindow, Menu, ipcMain, shell, clipboard, nativeImage, dialog } from "electron";
import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import * as electronUpdater from 'electron-updater';

import { bootstrap } from '@openall-ai/core/dist/in-proc.js';
import { ChatGateway } from '@openall-ai/core/dist/chat/chat.gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Menu.setApplicationMenu(null);

let mainWindow = null;

function createWindow() {
    const win = new BrowserWindow({
        title: 'openall',
        width: 1000,
        height: 700,
        // icon: path.join(__dirname, '../frontend/dist/favicon.svg'),
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
        },
    });

    mainWindow = win;
    win.loadFile("../frontend/dist/index.html");
}

let client = {
    send: (s) => { mainWindow.webContents.send('ws:event', s); },
};

async function init() {
    const app2 = await bootstrap();

    const chatGateway = await app2.resolve(ChatGateway);

    ipcMain.handle('chat-service:chat', async (_event, payload) => {
        return await chatGateway.handleEvent(payload);
    });

    ipcMain.handle('chat-service:config', async (_event, payload) => {
        return await chatGateway.handleConfig(payload, client);
    });

    ipcMain.handle('chat-service:connect', async (_event, payload) => {
        return await chatGateway.handleConnection(client);
    });

    ipcMain.handle('chat-service:close', async (_event, payload) => {
        return await chatGateway.handleClose(payload, client);
    });

    ipcMain.handle('chat-service:doAction', async (_event, payload) => {
        return await chatGateway.handleAction(payload);
    });

    ipcMain.handle('chat-service:sendMessage', async (_event, { msgType, data, }) => {
        return await chatGateway.handleMessage(msgType, data, client);
    });

    ipcMain.handle('shell:openExternal', async (_event, url) => {
        await shell.openExternal(url);
    });

    ipcMain.handle('clipboard:writeImage', (_event, dataUrl) => {
        const img = nativeImage.createFromDataURL(dataUrl);
        clipboard.writeImage(img);
    });

    ipcMain.handle('file:pick', async (_event) => {
        const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'] });
        if (result.canceled || !result.filePaths.length) return null;
        const filePath = result.filePaths[0];
        const name = filePath.split(/[\\/]/).pop();
        const ext = name.split('.').pop()?.toLowerCase();

        if (ext === 'docx') {
            const unzip = spawnSync('unzip', ['-p', filePath, 'word/document.xml']);
            if (unzip.status !== 0) return { error: 'Failed to read .docx file.' };
            const xml = unzip.stdout.toString('utf-8');
            const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (!text) return { error: 'Could not extract text from this .docx file.' };
            if (text.length > 500_000) return { error: 'File content exceeds 500 KB limit.' };
            return { name, content: text };
        }

        const buffer = readFileSync(filePath);
        if (buffer.length > 500_000) return { error: 'File exceeds 500 KB limit.' };
        const text = buffer.toString('utf-8');
        if (text.includes('\0')) return { error: 'Binary files (images, PDFs, etc.) are not supported. Please upload a text file (.txt, .csv, .json, .md, .py, .js, etc.) or a Word document (.docx).' };
        return { name, content: text };
    });

    app.whenReady().then(() => {
        createWindow();
        // electronUpdater.default.autoUpdater.checkForUpdatesAndNotify();
    });
}

init();

