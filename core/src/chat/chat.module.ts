import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { StateModule } from '../state/state.module';
import { WindowStateEntity } from './entities/window-state.entity';
import { ChatConfigEntity } from './entities/chat-config.entity';
import { ChatService } from './chat.service';
import { AnthropicService } from './anthropic.service';
import { McpModule } from '../mcp/mcp.module';

@Module({
    imports: [
        StateModule,
        McpModule,
        TypeOrmModule.forFeature([ChatConfigEntity, ChatMessageEntity, WindowStateEntity]),
    ],
    providers: [AnthropicService, ChatService, ChatGateway],
})
export class ChatModule { }