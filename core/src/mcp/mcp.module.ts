import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { McpServerEntity } from './entities/mcp-server.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forFeature([McpServerEntity]),
    ],
    providers: [McpService],
    exports: [McpService],
})
export class McpModule { }