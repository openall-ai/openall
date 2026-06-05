import { Injectable, Logger, OnApplicationShutdown, } from "@nestjs/common";
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
export class McpService implements OnApplicationShutdown {
    private readonly logger = new Logger(McpService.name);

    private readonly servers = new Map<string, RunningMcpServer>();

    private mcpConfig: McpConfig | undefined;

    constructor(@InjectRepository(McpServerEntity) private readonly mcpServerRepo: Repository<McpServerEntity>) {
        this.updateMcpConfiguration({
            'bravesearch': {
                type: 'stdio',
                command: 'npx',
                args: ["-y", "@brave/brave-search-mcp-server"],
                env: {
                    "BRAVE_API_KEY": "<placeholder>"
                }
            }
        });
    }

    async getMcpConfig() {
        if (this.mcpConfig) {
            return this.mcpConfig;
        }

        const configs = await this.mcpServerRepo.find();
        let result = {} as McpConfig;
        for (let config of configs) {
            result[config.key] = { type: 'stdio', args: config.args.split('|'), command: config.command, env: {}, };
        }

        this.mcpConfig = result;

        return result;
    }

    async updateMcpConfiguration(newConfig: McpConfig) {
        const currentConfig = this.getMcpConfig();

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
            await this.removeMcpServer(key);
        }

        // Restart changed servers
        for (const key of changed) {
            await this.removeMcpServer(key);
            await this.addMcpServer(key, newConfig[key]);

            const tools = await this.queryTools(key);
        }

        // Start added servers
        for (const key of added) {
            await this.addMcpServer(key, newConfig[key]);
            const tools = await this.queryTools(key);
        }

        // Save applied config
        this.mcpConfig = structuredClone(newConfig);
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