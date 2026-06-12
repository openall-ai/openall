import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { McpInstance } from "./mcp-instance";
import { McpInstanceStdio } from "./mcp-instance-stdio";
import { McpInstanceHttp } from "./mcp-instance-http";
import { Repository } from "typeorm";
import { McpServerEntity } from "./entities/mcp-server.entity";
import { InjectRepository } from "@nestjs/typeorm";

interface RunningMcpServer {
    key: string;
    instance: McpInstance;
}

export interface McpConfig {
    [key: string]: McpConfigEntry;
}

export type McpConfigEntry = {
    command: string;
    args: string[];
    env: { [key: string]: string, };
    type: 'stdio',
} | {
    url: string;
    headers: { [key: string]: string, };
    type: 'http',
}

@Injectable()
export class McpService implements OnApplicationShutdown, OnModuleInit {
    private readonly logger = new Logger(McpService.name);

    private readonly servers = new Map<string, RunningMcpServer>();

    private mcpConfig: McpConfig | undefined;

    constructor(@InjectRepository(McpServerEntity) private readonly mcpServerRepo: Repository<McpServerEntity>) {
    }

    async onModuleInit() {
        const config = await this.getMcpConfig();
        for (const [key, entry] of Object.entries(config)) {
            try {
                await this.addMcpServer(key, entry);
                await this.queryTools(key);
            } catch (e) {
                this.logger.warn(`Failed to start server ${key} on init: ${e}`);
            }
        }
    }

    async getMcpConfig(): Promise<McpConfig> {
        if (this.mcpConfig) {
            return this.mcpConfig;
        }

        const rows = await this.mcpServerRepo.find();
        const result: McpConfig = {};
        for (const row of rows) {
            try {
                result[row.key] = JSON.parse(row.configJson);
            } catch {
                this.logger.warn(`Could not parse configJson for key ${row.key}`);
            }
        }

        this.mcpConfig = result;
        return result;
    }

    async updateMcpConfiguration(newConfig: McpConfig) {
        const currentConfig = await this.getMcpConfig();

        // Persist and update in-memory config first so a server startup
        // failure cannot prevent the user's changes from being saved.
        this.mcpConfig = structuredClone(newConfig);
        await this.persistMcpConfig(newConfig);

        const currentKeys = new Set(Object.keys(currentConfig));
        const newKeys = new Set(Object.keys(newConfig));

        // Added
        const added = [...newKeys].filter(k => !currentKeys.has(k));

        // Removed
        const removed = [...currentKeys].filter(k => !newKeys.has(k));

        // Changed
        const changed = [...newKeys].filter(k =>
            currentKeys.has(k) &&
            !this.configEquals(currentConfig[k], newConfig[k])
        );

        // Stop removed servers
        for (const key of removed) {
            try { await this.removeMcpServer(key); } catch (e) { this.logger.warn(`Failed to stop server ${key}: ${e}`); }
        }

        // Restart changed servers
        for (const key of changed) {
            try {
                await this.removeMcpServer(key);
                await this.addMcpServer(key, newConfig[key]);
                await this.queryTools(key);
            } catch (e) { this.logger.warn(`Failed to restart server ${key}: ${e}`); }
        }

        // Start added servers
        for (const key of added) {
            try {
                await this.addMcpServer(key, newConfig[key]);
                await this.queryTools(key);
            } catch (e) { this.logger.warn(`Failed to start server ${key}: ${e}`); }
        }
    }

    private async persistMcpConfig(config: McpConfig) {
        const existingRows = await this.mcpServerRepo.find();
        const existingKeys = new Set(existingRows.map(r => r.key));
        const newKeys = new Set(Object.keys(config));

        // Delete removed keys
        for (const key of existingKeys) {
            if (!newKeys.has(key)) {
                await this.mcpServerRepo.delete(key);
            }
        }

        // Upsert remaining/new keys
        for (const [key, entry] of Object.entries(config)) {
            await this.mcpServerRepo.save({ key, configJson: JSON.stringify(entry) });
        }
    }

    private configEquals(a: unknown, b: unknown): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    private async addMcpServer(key: string, configEntry: McpConfigEntry) {
        let instance: McpInstance;
        if (configEntry.type === 'stdio') {
            instance = new McpInstanceStdio(key, configEntry.command, configEntry.args, configEntry.env);
        } else if (configEntry.type === 'http') {
            instance = new McpInstanceHttp(key, configEntry.url, configEntry.headers);
        } else {
            throw new Error('unknown MCP type ' + (configEntry as any).type);
        }

        const server: RunningMcpServer = {
            key,
            instance,
        };

        this.servers.set(key, server);
        return server;
    }

    private async removeMcpServer(key: string) {
        const server = this.servers.get(key);

        if (!server || !server.instance) {
            throw new Error(`MCP server not found: ${key}`);
        }

        await server.instance.stopServer();

        this.servers.delete(key);
    }

    listRunningServers() {
        return Array.from(this.servers.values()).map((server) => ({
            key: server.key,
            status: server.instance.status,
            tools: server.instance.tools,
        }));
    }

    getServer(id: string) {
        return this.servers.get(id);
    }

    async sendMessage(key: string, method: string, params: unknown) {
        const server = this.servers.get(key);

        if (!server || !server.instance) {
            throw new Error(`MCP server not found: ${key}`);
        }

        return await server.instance.sendMessage(method, params);
    }

    getAllTools() {
        return [...this.servers.values()].map(s => s.instance.tools).flat();
    }

    findServerForTool(toolName: string): string | undefined {
        for (const [key, server] of this.servers.entries()) {
            if (server.instance.tools.some((t: any) => t.name === toolName)) {
                return key;
            }
        }
        return undefined;
    }

    async queryTools(key: string) {
        return await this.sendMessage(key, "tools/list", {});
    }

    async onApplicationShutdown() {
        this.logger.log("Stopping MCP servers...");

        await Promise.all(
            Array.from(this.servers.values()).map((server) =>
                server.instance.stopServer()
            ),
        );
    }
}
