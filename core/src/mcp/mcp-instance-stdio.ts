import { Logger } from "@nestjs/common";
import { McpInstance } from "./mcp-instance";
import { ChildProcess, spawn } from "child_process";
import { randomUUID } from "crypto";
import * as readline from "readline";

type McpServerStatus = "notstarted" | "starting" | "running" | "stopped" | "error";
type EnvConfig = { [key: string]: string, };

export class McpInstanceStdio implements McpInstance {
    private process: ChildProcess | undefined;
    private readonly logger = new Logger(McpInstanceStdio.name);
    public status: McpServerStatus = 'notstarted';
    private readonly pendingCommands = new Map<string, { resolve: (res: any) => void, reject: (e: Error) => void, }>();
    public tools: any[] = [];

    constructor(private key: string, private command: string, private args: string[], private env: EnvConfig) { }

    public async startServer() {
        this.logger.log(`Starting MCP server: ${this.command} ${this.args.join(" ")}`);

        const child = spawn(this.command, this.args, {
            stdio: ["pipe", "pipe", "pipe"],
            shell: process.platform === "win32",
            env: { ...process.env, ...this.env },
        });

        this.process = child;
        this.status = 'starting';

        const stdoutRl = readline.createInterface({ input: child.stdout!, });
        stdoutRl.on("line", (line) => {
            this.logger.debug(`[MCP:${this.key}] ${line?.substring(0, 100)}`);
            this.handleServerMessage(line);
        });

        const stderrRl = readline.createInterface({ input: child.stderr!, });
        stderrRl.on("line", (line) => {
            this.logger.debug(`[MCP:${this.key}:stderr] ${line?.substring(0, 100)}`);
        });

        child.on("exit", (code, signal) => {
            this.status = "stopped";
            this.logger.warn(`MCP server exited: ${this.key} (code=${code}, signal=${signal})`);
        });

        child.on("error", (err) => {
            this.status = "error";
            this.logger.error(`MCP server error: ${this.key}`, err.stack);
        });

        // Wait for the process to actually be running before sending anything
        await new Promise<void>((resolve, reject) => {
            child.once('spawn', resolve);
            child.once('error', reject);
        });

        this.status = 'running';
        this.logger.log(`MCP server started: ${this.key}`);

        // MCP initialization handshake — required before any other method
        await this.doInitialize();
    }

    private async doInitialize() {
        await this.doSendRpc('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'openall', version: '0.2.0' },
        });

        // initialized is a notification (no id, no response expected)
        this.process!.stdin!.write(
            JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'
        );
    }

    public async stopServer() {
        return new Promise<boolean>(resolve => {
            if (!this.process) {
                return false;
            }

            this.process.on('exit', resolve);
            this.process.on('exit', () => this.process = undefined);

            this.logger.log(`Stopping MCP server: ${this.key}`);

            this.process.kill("SIGTERM");

            const processSnapshot = this.process;
            this.process = undefined;

            setTimeout(() => {
                if (!processSnapshot.killed) {
                    this.logger.warn(`Force killing MCP server: ${this.key}`);
                    processSnapshot.kill("SIGKILL");
                }
            }, 5000);

            return true;
        });
    }

    private handleServerMessage(line: string) {
        try {
            const message = JSON.parse(line);

            const commandResult = this.pendingCommands.get(message.id);
            if (commandResult) {
                if (message.result !== undefined) {
                    commandResult.resolve(message.result);
                } else if (message.error) {
                    commandResult.reject(new Error(message.error.message ?? JSON.stringify(message.error)));
                }
                this.pendingCommands.delete(message.id);
            }

            if (message?.result?.tools && Array.isArray(message.result.tools)) {
                this.tools = message.result.tools;
                this.logger.log(`MCP tools loaded: ${this.tools.map(t => t.name).join(", ")}`);
            }
        } catch {
            // Ignore non-JSON output
        }
    }

    // Internal: send a JSON-RPC request and await its response
    private async doSendRpc(method: string, params: unknown): Promise<any> {
        const message = {
            jsonrpc: "2.0",
            id: randomUUID(),
            method,
            params,
        };

        const promise = new Promise<any>((resolve, reject) => {
            this.pendingCommands.set(message.id, { resolve, reject });
        });

        this.process!.stdin!.write(JSON.stringify(message) + "\n");

        return await promise;
    }

    async sendMessage(method: string, params: unknown) {
        if (this.status === 'notstarted' || this.status === 'stopped') {
            await this.startServer();
        }

        return await this.doSendRpc(method, params);
    }
}
