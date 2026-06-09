import { makeAutoObservable } from "mobx";

export type webSocketSubscriber = {
    onWebsocketMessage(message: MessageEvent<any>): void;
}

export class ConnectionStatus {
    constructor() {
        makeAutoObservable(this);
    }

    connected = false;
    connecting = true;
    connection!: Connection;

    setConnected(connected: boolean) {
        this.connected = connected;
        this.connecting = false;
    }

    setConnection(connection: Connection) {
        this.connection = connection;
    }
}

export const connectionStatus = new ConnectionStatus();

export class Connection {
    private ws!: WebSocket;
    private subscriber: webSocketSubscriber;

    private constructor(_subscriber: webSocketSubscriber) {
        this.subscriber = _subscriber;
    }

    private async periodicPing() {
        this.ws.send(JSON.stringify({
            event: 'ping',
            data: '',
        }));
    }

    static async connect(subscriber: webSocketSubscriber) {
        const connection = new Connection(subscriber);

        await connection.connect();

        return connection;
    }

    async connect() {
        const api = (window as any).api;
        if (api) {
            api.onMessage((e: any) => this.subscriber.onWebsocketMessage(e));
            await api.connect();
        } else {
            this.ws = new WebSocket('/api/chat', localStorage.getItem('auth_token')!);
            this.ws.addEventListener('message', (e) => this.subscriber.onWebsocketMessage(e));
            this.ws.addEventListener('close', () => {
                connectionStatus.setConnected(false);
                this.startReconnect();
            });

            const connectPromise = new Promise<void>(resolve => {
                this.ws.addEventListener('open', () => {
                    console.log('Connected');
                    resolve();
                });

            });
            await connectPromise;

            setInterval(this.periodicPing.bind(this), 30000);
        }
        connectionStatus.setConnected(true);
        connectionStatus.setConnection(this);
    }

    async startReconnect() {

    }

    async sendChat(text: string) {
        const api = (window as any).api;
        if (api) {
            await api.chat(text);
        } else {
            this.ws.send(JSON.stringify({
                event: 'chat',
                data: text
            }));
        }
    }

    async closeWindow(windowId: number) {
        const api = (window as any).api;
        if (api) {
            await api.close(windowId);
        } else {
            this.ws.send(JSON.stringify({
                event: 'close',
                data: windowId,
            }));
        }
    }

    async saveConfig(config: { provider: string, apiKey: string, model: string }) {
        console.log('saveConfig');
        const api = (window as any).api;
        if (api) {
            await api.config(config);
        } else {
            this.ws.send(JSON.stringify({
                event: 'config',
                data: config,
            }));
        }
    }

    async doAction(activeWindowId: number, inputs: { [key: string]: string }, ...args: any[]) {
        const api = (window as any).api;
        if (api) {
            await api.doAction({ activeWindowId, inputs: JSON.parse(JSON.stringify(inputs)), args });
        } else {
            this.ws.send(JSON.stringify({
                event: 'doAction',
                data: { activeWindowId, inputs, args },
            }));
        }
    }

    async sendMessage(messageType: string, data: any) {
        const api = (window as any).api;
        if (api) {
            await api.sendMessage(messageType, data);
        } else {
            this.ws.send(JSON.stringify({
                event: messageType,
                data,
            }));
        }
    }
}