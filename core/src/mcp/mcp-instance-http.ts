import { Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { McpInstance } from "./mcp-instance";

type McpServerStatus =
    | "notstarted"
    | "starting"
    | "running"
    | "stopped"
    | "error";

export class McpInstanceHttp implements McpInstance {
    private readonly logger = new Logger(McpInstanceHttp.name);

    public status: McpServerStatus = "notstarted";

    public tools: any[] = [];

    constructor(
        private readonly key: string,
        private readonly endpoint: string,
        private readonly headers: Record<string, string> = {},
    ) {}

    private get requestHeaders() {
        return {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            ...this.headers,
        };
    }

    public async startServer() {
        if (this.status === "running") {
            return;
        }

        this.status = "starting";

        try {
            // MCP initialization handshake
            const initResult = await this.doPost('initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'openall', version: '0.2.0' },
            });

            this.logger.log(`MCP HTTP server initialized: ${this.key} (${initResult?.serverInfo?.name ?? this.endpoint})`);

            // Send initialized notification (no id, no response expected)
            await fetch(this.endpoint, {
                method: "POST",
                headers: this.requestHeaders,
                body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
            }).catch(() => {});

            this.status = "running";

            this.logger.log(`Connected to MCP server: ${this.endpoint}`);
        } catch (err) {
            this.status = "error";

            this.logger.error(
                `Failed to connect MCP server: ${this.key}`,
                err instanceof Error ? err.stack : String(err),
            );

            throw err;
        }
    }

    public async stopServer() {
        this.status = "stopped";

        this.logger.log(`Disconnected MCP server: ${this.key}`);

        return true;
    }

    private async doPost(method: string, params: unknown): Promise<any> {
        const body = {
            jsonrpc: "2.0",
            id: randomUUID(),
            method,
            params,
        };

        const response = await fetch(this.endpoint, {
            method: "POST",
            headers: this.requestHeaders,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.message ?? JSON.stringify(result.error));
        }

        if (result?.result?.tools && Array.isArray(result.result.tools)) {
            this.tools = result.result.tools;
            this.logger.log(`MCP tools loaded: ${this.tools.map((t: any) => t.name).join(", ")}`);
        }

        return result.result;
    }

    async sendMessage(method: string, params: unknown) {
        if (this.status === "notstarted" || this.status === "stopped") {
            await this.startServer();
        }

        return await this.doPost(method, params);
    }
}
