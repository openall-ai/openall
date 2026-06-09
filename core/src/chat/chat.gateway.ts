import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { ChatService, EncryptionService } from './chat.service';

@WebSocketGateway({ path: '/api/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

    constructor(
        private chatService: ChatService,
    ) {
    }

    async setEncryptionService(encryptionService: EncryptionService) {
        this.chatService.setEncryptionService(encryptionService);
    }

    async handleConnection(client: WebSocket) {
        this.chatService.handleConnection(client);
    }

    handleDisconnect(client: WebSocket) {
        this.chatService.handleDisconnect(client);
    }

    @SubscribeMessage('config')
    async handleConfig(@MessageBody() data: { provider: string, apiKey: string }, @ConnectedSocket() client: WebSocket) {
        this.chatService.handleMessage(client, { event: 'config', data, });
    }

    @SubscribeMessage('doAction')
    async handleAction(@MessageBody() data: { activeWindowId: number, inputs: { [key: string]: string }, args: any[], }, @ConnectedSocket() client: WebSocket) {
        this.chatService.handleMessage(client, { event: 'doAction', data, });
    }

    @SubscribeMessage('close')
    async handleClose(@MessageBody() data: { activeWindowId: number, inputs: { [key: string]: string }, args: any[], }, @ConnectedSocket() client: WebSocket) {
        this.chatService.handleMessage(client, { event: 'close', data, });
    }

    @SubscribeMessage('chat')
    async handleEvent(@MessageBody() data: string, @ConnectedSocket() client: WebSocket) {
        this.chatService.handleMessage(client, { event: 'chat', data, });
    }

    @SubscribeMessage('resetData')
    async handleResetData(@MessageBody() data: string, @ConnectedSocket() client: WebSocket) {
        this.chatService.handleMessage(client, { event: 'resetData', data, });
    }

    @SubscribeMessage('loadModels')
    async handleLoadModels(@MessageBody() data: string, @ConnectedSocket() client: WebSocket) {
        this.chatService.handleMessage(client, { event: 'loadModels', data, });
    }

    @SubscribeMessage('loadLauncherOptions')
    async handleLoadLauncherOptions(@MessageBody() data: { text: string }, @ConnectedSocket() client: WebSocket) {
        this.chatService.handleMessage(client, { event: 'loadLauncherOptions', data, });
    }

    @SubscribeMessage('launchOption')
    async handleLaunchOption(@MessageBody() data: { text: string }, @ConnectedSocket() client: WebSocket) {
        this.chatService.handleMessage(client, { event: 'launchOption', data, });
    }

    async handleMessage(msgType: string, data: any, client: WebSocket) {
        this.chatService.handleMessage(client, { event: msgType, data, });
    }
}
