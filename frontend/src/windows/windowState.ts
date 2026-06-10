import { makeAutoObservable } from "mobx";
import { Connection } from "../connectivity/connection";
import { launcherState } from "../launcher";

export class WindowStateStore {
    count = 0;
    private connection: Promise<Connection>;
    messages: any[] = [];
    windows: any[] = [];
    pinnedApps: any[] = [];
    showConfig = false;
    showSettings = false;
    showConnectors = false;
    showLauncher = false;
    initialized = false;
    shareState: { active: boolean; imageDataUrl: string; windowTitle: string } | null = null;

    prompts!: { chatPrompt: string, uiActionPrompt: string, };

    constructor() {
        makeAutoObservable(this);
        this.connection = Connection.connect(this);
    }

    onWebsocketMessage(event: MessageEvent<any>) {
        console.log('msg', event);
        const eventData = JSON.parse(event.data);
        console.log(eventData);
        if (eventData.event === 'ui') {
            eventData.data.minimized = false;
            const existingWindow = this.windows.find(w => w.id === eventData.data.id);
            if (existingWindow) {
                existingWindow.content = eventData.data.content;
                existingWindow.title = eventData.data.title;
                existingWindow.loading = false;
                existingWindow.inputs = {};
                existingWindow.pinned = eventData.data.pinned;
            } else {
                this.windows.push(eventData.data);
            }
            return;
        }
        if (eventData.event === 'pinnedApps') {
            this.pinnedApps = eventData.data;
            return;
        }
        if (eventData.event === 'refresh') {
            window.location.reload();
            return;
        }
        if (eventData.event === 'settings') {
            this.prompts = eventData.data.prompts;
            this.initialized = true;
        }
        if (eventData.event === 'showConfig') {
            console.log('showconfig');
            this.showConfig = true;
            return;
        }
        if (eventData.event === 'closeWindow') {
            this.windows = this.windows.filter(w => w.id !== eventData.data.id);
            return;
        }
        if (eventData.event === 'log') {
            this.messages.push({ log: eventData.data.content, });
            return;
        }
        if (eventData.event === 'launcherOptions') {
            launcherState.setOptions(eventData.data.text, eventData.data.options);
        }

        if (eventData.event !== 'message') {
            return;
        }
        // console.log(eventData.data);
        this.messages.push(eventData.data);
    }

    minimize(data: any) {
        data.minimized = true;
    }

    increment() {
        this.count++;
    }

    showConfigWindow() {
        this.showConfig = true;
    }

    hideConfig() {
        this.showConfig = false;
    }

    sendChat(text: string) {
        this.connection.then(c => c.sendChat(text));
    }

    closeWindow(id: number) {
        this.connection.then(c => c.closeWindow(id));
    }

    restoreWindow(id: number) {
        this.windows.find(w => w.id === id).minimized = false;
    }

    saveConfig(config: { provider: string; apiKey: string; model: string }) {
        this.connection.then(c => c.saveConfig(config));
        this.showConfig = false;
    }

    setShowSettings(show: boolean) {
        this.showSettings = show;
    }

    setShowConnectors(show: boolean) {
        this.showConnectors = show;
    }

    setShowLauncher(show: boolean) {
        this.showLauncher = show;
    }

    doAction(activeWindowId: number, inputs: { [key: string]: string }, ...args: any[]) {
        this.connection.then(c => c.doAction(activeWindowId, inputs, ...args));
    }

    sendMessage(messageType: string, data: any) {
        this.connection.then(c => c.sendMessage(messageType, data));
    }

    pinWindow(windowId: number) {
        const w = this.windows.find(w => w.id === windowId);
        if (w) w.pinned = true;
        this.connection.then(c => c.sendMessage('pinWindow', { windowId }));
    }

    unpinWindow(windowId: number) {
        this.pinnedApps = this.pinnedApps.filter(a => a.id !== windowId);
        const w = this.windows.find(w => w.id === windowId);
        if (w) w.pinned = false;
        this.connection.then(c => c.sendMessage('unpinWindow', { windowId }));
    }

    reopenPinnedApp(app: any) {
        const existing = this.windows.find(w => w.id === app.id);
        if (existing) {
            existing.minimized = false;
            return;
        }
        this.windows.push({ ...app, minimized: false, loading: false, inputs: {} });
    }

    setShareState(s: typeof this.shareState) {
        this.shareState = s;
    }
}

export const windowStateStore = new WindowStateStore();
