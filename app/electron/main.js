import { app, BrowserWindow, Menu, ipcMain } from "electron";
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

    ipcMain.handle('chat-service:unload', async (_event) => {
        console.log('unload');
        return await chatGateway.handleDisconnect(client);
    });

    app.whenReady().then(() => {
        createWindow();
        // electronUpdater.default.autoUpdater.checkForUpdatesAndNotify();
    });
}

init();

