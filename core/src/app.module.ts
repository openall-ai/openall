import { Module } from '@nestjs/common';
import { StateModule } from './state/state.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from './chat/chat.module';
import { ChatMessageEntity } from './chat/entities/chat-message.entity';
import { WindowStateEntity } from './chat/entities/window-state.entity';
import { join } from 'path';
import * as os from 'node:os';
import { ServeStaticModule } from '@nestjs/serve-static';
import { HttpModule } from '@nestjs/axios';
import { ChatConfigEntity } from './chat/entities/chat-config.entity';
import { McpModule } from './mcp/mcp.module';
import { McpServerEntity } from './mcp/entities/mcp-server.entity';

const isElectron = !!process.versions.electron;

const dataDir = isElectron ? join(os.homedir(), '.openall/data') : 'data';

@Module({
    imports: [
        HttpModule,
        StateModule,
        ChatModule,
        McpModule,
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'static'),
        }),
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: join(dataDir, 'chat.sqlite'),
            entities: [ChatConfigEntity, ChatMessageEntity, WindowStateEntity, McpServerEntity],
            synchronize: true,
        }),
        TypeOrmModule.forRoot({
            name: 'apps',
            type: 'sqlite',
            database: join(dataDir, 'apps.sqlite'),
            entities: [],
        }),
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
