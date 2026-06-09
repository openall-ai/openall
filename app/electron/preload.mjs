// import { contextBridge, ipcRenderer } from "electron";
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("api", {
    chat: (payload) => ipcRenderer.invoke('chat-service:chat', payload),
    config: (payload) => ipcRenderer.invoke('chat-service:config', payload),
    connect: (payload) => ipcRenderer.invoke('chat-service:connect', payload),
    close: (payload) => ipcRenderer.invoke('chat-service:close', payload),
    doAction: (payload) => ipcRenderer.invoke('chat-service:doAction', payload),

    sendMessage: (msgType, data) => ipcRenderer.invoke('chat-service:sendMessage', { msgType, data }),
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
    clipboardWriteImage: (dataUrl) => ipcRenderer.invoke('clipboard:writeImage', dataUrl),
    pickFile: () => ipcRenderer.invoke('file:pick'),

    onMessage: (callback) => {
        ipcRenderer.on('ws:event', (_event, data) => {
            console.log(data);
            callback({ data: data, });
        });
    },
});