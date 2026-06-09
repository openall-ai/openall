import { Injectable } from "@nestjs/common";
import { WindowStateEntity } from "./entities/window-state.entity";
import { openHtmlViewTool, queryDatabase } from "./tools";

@Injectable()
export class AnthropicService {
    async runAiAnthropic(messages: any[], activeWindows: WindowStateEntity[], apiKey: string, currentModel: string, chatPrompt: string) {
        const systemContent = [
            chatPrompt,
            'currently open windows: ' + JSON.stringify(activeWindows.map(w => ({ id: w.id, title: w.title, }))),
        ].join('\n\n');

        const anthropicMessages = this.convertToAnthropicMessages(messages);

        const requestBody = {
            model: currentModel,
            max_tokens: 8096,
            system: systemContent,
            messages: anthropicMessages,
            tools: this.convertToolsForAnthropic([openHtmlViewTool, queryDatabase]),
            tool_choice: { type: 'auto' },
        };
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const text = await response.text();
            let detail = text;
            try { detail = JSON.parse(text)?.error?.message ?? text; } catch { }
            throw new Error(`Anthropic ${response.status}: ${detail}`);
        }

        const data = await response.json();
        console.log(data);

        const contentBlocks: any[] = data.content || [];
        const textBlock = contentBlocks.find((b: any) => b.type === 'text');
        const toolUseBlocks = contentBlocks.filter((b: any) => b.type === 'tool_use');

        if (data.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
            messages.push({ role: 'assistant', content: textBlock?.text || '' });
            return { content: textBlock?.text || '' };
        }

        // Push to messages in OpenAI-like format so handleToolCall works unchanged
        const tool_calls = toolUseBlocks.map((b: any) => ({
            id: b.id,
            type: 'function',
            function: { name: b.name, arguments: JSON.stringify(b.input) },
        }));
        messages.push({ role: 'assistant', content: textBlock?.text || null, tool_calls });

        const toolResults: any[] = [];
        for (const b of toolUseBlocks) {
            if (b.name === openHtmlViewTool.function.name) {
                toolResults.push({ attachment: `\`${b.input.content}\``, title: b.input.title, windowId: b.input.windowId, callId: b.id });
            }
            if (b.name === queryDatabase.function.name) {
                toolResults.push({ query: b.input.query, callId: b.id });
            }
        }

        return { tools: toolResults };
    }

    private convertToAnthropicMessages(messages: any[]): any[] {
        const result: any[] = [];

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];

            // Skip system messages — handled via top-level system field
            if (msg.role === 'system') continue;

            // Group consecutive tool messages into a single user message with tool_result blocks
            if (msg.role === 'tool') {
                const toolResults: any[] = [];
                while (i < messages.length && messages[i].role === 'tool') {
                    toolResults.push({
                        type: 'tool_result',
                        tool_use_id: messages[i].tool_call_id,
                        content: messages[i].content || '(no output)',
                    });
                    i++;
                }
                i--; // compensate for the outer loop increment
                result.push({ role: 'user', content: toolResults });
                continue;
            }

            // Assistant message that made tool calls — convert to Anthropic tool_use blocks
            if (msg.role === 'assistant' && msg.tool_calls) {
                const content: any[] = [];
                if (msg.content) content.push({ type: 'text', text: msg.content });
                for (const tc of msg.tool_calls) {
                    content.push({
                        type: 'tool_use',
                        id: tc.id,
                        name: tc.function.name,
                        input: typeof tc.function.arguments === 'string'
                            ? JSON.parse(tc.function.arguments)
                            : tc.function.arguments,
                    });
                }
                result.push({ role: 'assistant', content });
                continue;
            }

            // Skip messages with empty content — Anthropic rejects them
            if (!msg.content) continue;

            // Regular user or assistant text message
            result.push({ role: msg.role, content: msg.content });
        }

        // Anthropic requires first message to be user — drop any leading assistant messages
        while (result.length > 0 && result[0].role === 'assistant') {
            result.shift();
        }

        // Merge consecutive same-role text messages (can happen after drops above)
        const merged: any[] = [];
        for (const msg of result) {
            const prev = merged[merged.length - 1];
            if (prev && prev.role === msg.role && typeof prev.content === 'string' && typeof msg.content === 'string') {
                prev.content += '\n\n' + msg.content;
            } else {
                merged.push({ ...msg });
            }
        }

        return merged;
    }

    private convertToolsForAnthropic(tools: any[]): any[] {
        return tools.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            input_schema: tool.function.parameters,
        }));
    }
}