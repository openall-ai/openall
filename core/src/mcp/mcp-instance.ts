export interface McpInstance {
    sendMessage(method: string, params: unknown): Promise<any>;
    stopServer(): Promise<boolean>;
    status: string;
    tools: any[];
}