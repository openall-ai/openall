import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';

@Module({
    imports: [
    ],
    providers: [McpService],
    exports: [McpService],
})
export class McpModule { }