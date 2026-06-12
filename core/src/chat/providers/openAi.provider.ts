import { McpService } from "../../mcp/mcp.service";
import { AiProvider } from "../ai.provider";
import { WindowStateEntity } from "../entities/window-state.entity";
import { openHtmlViewTool, queryDatabase } from "../tools";

export class OpenAiProvider extends AiProvider {
    constructor(private mcpService: McpService, private config: { endpoint: string, apiKeyHeader: string, defaultModel: string }) {
        super();
    }

    private async getMcpToolsDefinitions() {
        const mcpTools = await this.mcpService.getAllTools();

        return mcpTools.map((tool) => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description ?? "",
                parameters: this.normalizeInputSchema(tool.inputSchema),
            },
        }));
    }

    private normalizeInputSchema(schema?: any): any {
        // Missing schema entirely
        if (!schema) {
            return {
                type: "object",
                properties: {},
                additionalProperties: false,
            };
        }

        // Schema only contains metadata like $schema
        const meaningfulKeys = Object.keys(schema).filter(
            (k) => !["$schema", "$id", "title", "description"].includes(k)
        );

        if (meaningfulKeys.length === 0) {
            return {
                type: "object",
                properties: {},
                additionalProperties: false,
            };
        }

        // Some MCP servers forget type=object
        if (!schema.type) {
            return {
                type: "object",
                properties: schema.properties ?? {},
                required: schema.required ?? [],
                additionalProperties:
                    schema.additionalProperties ?? false,
            };
        }

        return schema;
    }

    override async runAi(messages: any[], activeWindows: WindowStateEntity[], apiKey: string, currentModel: string, chatPrompt: string)
        : Promise<{ content: any; tools?: undefined; } | { tools: ({ query: string, callId: string } | { attachment: string, title: string, windowId: number, callId: string })[]; content?: undefined; } | undefined> {
        const model = currentModel || this.config.defaultModel;

        const authValue = `Bearer ${apiKey}`;

        const response = await fetch(this.config.endpoint, {
            method: "POST",
            headers: {
                [this.config.apiKeyHeader]: authValue,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: chatPrompt, },
                    {
                        role: "system", content: 'currently open windows: ' + JSON.stringify(activeWindows.map(w => ({ id: w.id, title: w.title, })))
                    },
                    ...messages,
                ],
                tools: [
                    openHtmlViewTool,
                    queryDatabase,
                    ...(await this.getMcpToolsDefinitions()),
                ],
                tool_choice: "auto"
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Request failed: ${response.status} ${text}`);
        }

        const data = await response.json();
        console.log(data)
        const message = data.choices[0].message;
        messages.push(message);
        if (data.choices[0].finish_reason === 'stop') {
            console.log(message);
            return { content: message.content, };
        } else if (data.choices[0].finish_reason === 'tool_calls') {
            console.log(message.tool_calls);

            const toolResults: ({ query: string, callId: string } | { attachment: string, title: string, windowId: number, callId: string })[] = [];

            for (let toolCall of message.tool_calls) {

                if (toolCall.function.name === openHtmlViewTool.function.name) {
                    const attachmentJSON = toolCall.function.arguments;
                    const attachment = JSON.parse(attachmentJSON);
                    toolResults.push({ attachment: `\`${attachment.content}\``, title: attachment.title, windowId: attachment.windowId, callId: toolCall.id });
                } else if (toolCall.function.name === queryDatabase.function.name) {
                    const parametersJSON = toolCall.function.arguments;
                    const parameters = JSON.parse(parametersJSON);
                    toolResults.push({ query: parameters.query, callId: toolCall.id });
                } else {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);

                    const serverKey = this.mcpService.findServerForTool(functionName);

                    let toolContent: string;
                    if (!serverKey) {
                        toolContent = `Error: no running MCP server found for tool "${functionName}"`;
                    } else {
                        try {
                            const mcpResult = await this.mcpService.sendMessage(serverKey, 'tools/call', {
                                "name": functionName,
                                "arguments": args
                            });

                            // Use the text content array if present (avoids sending huge
                            // structuredContent blobs back to the LLM)
                            if (mcpResult?.content && Array.isArray(mcpResult.content)) {
                                toolContent = mcpResult.content
                                    .filter((c: any) => c.type === 'text')
                                    .map((c: any) => c.text)
                                    .join('\n') || 'no output';
                            } else {
                                toolContent = JSON.stringify(mcpResult || 'no output');
                            }
                        } catch (e: any) {
                            toolContent = `Error calling tool "${functionName}": ${e.message}`;
                        }
                    }

                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: toolContent,
                    });
                }
            }

            return { tools: toolResults };
        }
    }
}