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

    public async startServer() {
        if (this.status === "running") {
            return;
        }

        this.status = "starting";

        try {
            //
            // Optional health check
            //
            const response = await fetch(this.endpoint, {
                method: "OPTIONS",
                headers: this.headers,
            }).catch(() => undefined);

            if (response && !response.ok) {
                throw new Error(
                    `Health check failed (${response.status})`,
                );
            }

            this.status = "running";

            this.logger.log(
                `Connected to MCP server: ${this.endpoint}`,
            );
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

        this.logger.log(
            `Disconnected MCP server: ${this.key}`,
        );

        return true;
    }

    async sendMessage(method: string, params: unknown) {
        if (
            this.status === "notstarted" ||
            this.status === "stopped"
        ) {
            await this.startServer();
        }

        const message = {
            jsonrpc: "2.0",
            id: randomUUID(),
            method,
            params,
        };

        const response = await fetch(this.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.headers,
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
            );
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(
                result.error.message ??
                JSON.stringify(result.error),
            );
        }

        //
        // Detect tools/list response
        //
        if (
            result?.result?.tools &&
            Array.isArray(result.result.tools)
        ) {
            this.tools = result.result.tools;

            this.logger.log(
                `MCP tools loaded: ${this.tools
                    .map((t: any) => t.name)
                    .join(", ")}`,
            );
        }

        return result.result;
    }
}