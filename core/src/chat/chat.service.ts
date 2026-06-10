import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { WindowStateEntity } from "./entities/window-state.entity";
import { ChatMessageEntity } from "./entities/chat-message.entity";
import { ChatConfigEntity } from "./entities/chat-config.entity";
import { Repository } from "typeorm";
import { DatabaseService } from "../state/database.service";
import { AnthropicService } from "./anthropic.service";
import { McpService } from "../mcp/mcp.service";
import { OpenAiProvider } from "./providers/openAi.provider";

export type Client = {
    send: (s: string) => void;
}

const PROVIDER_CONFIGS: Record<string, { endpoint: string; apiKeyHeader: string; defaultModel: string }> = {
    openrouter: { endpoint: 'https://openrouter.ai/api/v1/chat/completions', apiKeyHeader: 'Authorization', defaultModel: 'openai/gpt-5.4-nano' },
    openai: { endpoint: 'https://api.openai.com/v1/chat/completions', apiKeyHeader: 'Authorization', defaultModel: 'gpt-5.4-mini' },
    anthropic: { endpoint: 'https://api.anthropic.com/v1/messages', apiKeyHeader: 'x-api-key', defaultModel: 'claude-opus-4-7' },
    google: { endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', apiKeyHeader: 'Authorization', defaultModel: 'gemini-3.5-flash' },
};

export interface EncryptionService {
    encrypt(value: string): string;
    decrypt(value: string): string;
}

const passthroughEncryptionService = {
    encrypt(value) {
        return value;
    },

    decrypt(value) {
        return value;
    },
};


@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatConfigEntity) private readonly chatConfigRepo: Repository<ChatConfigEntity>,
        @InjectRepository(ChatMessageEntity) private readonly chatHistoryRepo: Repository<ChatMessageEntity>,
        @InjectRepository(WindowStateEntity) private readonly windowStateRepo: Repository<WindowStateEntity>,
        private databaseService: DatabaseService,
        private anthropicService: AnthropicService,
        private mcpService: McpService,
    ) {
    }

    private clients: Client[] = [];
    private conversationId = 'jmcuc';
    private currentProvider = 'openrouter';
    private currentModel = 'openai/gpt-5.4-nano'; // legacy fallback
    private encryptionService: EncryptionService = passthroughEncryptionService;
    private encryptedApiKey: string | undefined;

    private prompts = {
        chatPrompt: `You are role-playing as an operating system. The user will ask you to do stuff as a computer.
        For example, if the user requests to add a user to its contact list, you might show (using the tool) a contact card from a CRM system that\'s
        editable with the content he already provided. Use the content tool to show HTML do not output it directly. The html you display with the
        content tool can be interactive to allow the user shortcuts to perform actions on entities listed etc. Don't ask questions unless you really
        need to. Go with the flow, especially creating UIs using the tool and if needed the user will correct it to what they want. Only show data from
        the database. If you show sample data, be sure to add it to the db first (including creating tables if needed). If you don't store the sample
        data in the DB it won't persist and the experience will be confusing.
        When you need the user to provide a file, render a button in your HTML using the tool: <button onclick="requestFileUpload()">Upload file</button>. 
        When the user clicks it, the file content will arrive as a new chat message in the format [File: name]\\n\`\`\`\\n...content...\\n\`\`\`. 
        Read and process that content directly — you have full ability to analyze any file content sent this way. As soon as you receive a file message, 
        immediately use the attach_artifact tool to update the window that contained the upload button: first show a brief "Analyzing [filename]..." state, 
        then replace it with the full analysis result. Never just reply in text — always update the UI window with the output.`,
        uiActionPrompt: `The user has performed an action using doAction() with the following args. You'll need to decide what to do. Most likely you'll update the
            currently active window but not necessarily. The active window has ID %ACTIVEWINDOWID% and its current HTML content is %WINDOWCONTENT%. The user performed an action with
            payload %DATAPAYLOAD%. The current form inputs for the window (their current state is): %FORMINPUTS%. Always ground your answers in real data from the database. If a table doesn't exist you may need to create it.`,
        launcherPrompt: `The user is running a launcher search (similar to MacOS's spotlight). I will provide you with the text the user has entered. Provide 3-5 results in JSON format for possible apps
        the user might want to run given their input. These apps do not necessarily need to exist, the system can generate them on-the-fly. Try and reverese engineer the user's intent with their search 
        phrase and offer options for apps the user might be intending to run. Ideally the options would not be too repetitive. Output JSON only (no leading \` or anything other than a json array, start with the
        character [) with two properties per item: title - the text for the spotlight entry to show. This is the app name. AND icon - the ID of a Material Icons icon (such as trending_up or whatever fits the app best)
        to display as the app-icon. Do not output anything else, do not ask questions, do not use icons that don't exist. Only output this JSON as it's going straight into the launcher results.`,
        launchOptionPrompt: `You are role-playing as an operating system. The user has selected an option to launch from a spotlight-like menu. I'll tell you which option the user selected.
        You need to show the UI of the app the user selected using the tool. Use the content tool to show HTML do not output it directly. The html you display with the
        content tool can be interactive to allow the user shortcuts to perform actions on entities listed etc. Don't ask questions unless you really
        need to. Go with the flow, especially creating UIs using the tool and if needed the user will correct it to what they want. Only show data from
        the database. If you show sample data, be sure to add it to the db first (including creating tables if needed). If you don't store the sample
        data in the DB it won't persist and the experience will be confusing.
        When you need the user to provide a file, render a button in your HTML using the tool: <button onclick="requestFileUpload()">Upload file</button>. 
        When the user clicks it, the file content will arrive as a new chat message in the format [File: name]\\n\`\`\`\\n...content...\\n\`\`\`. 
        Read and process that content directly — you have full ability to analyze any file content sent this way. As soon as you receive a file message, 
        immediately use the attach_artifact tool to update the window that contained the upload button: first show a brief "Analyzing [filename]..." state, 
        then replace it with the full analysis result. Never just reply in text — always update the UI window with the output.`,
    }


    async setEncryptionService(encryptionService: EncryptionService) {
        this.encryptionService = encryptionService;
    }

    async handleConnection(client: Client) {
        console.log('client connected');

        const existingConfig = await this.chatConfigRepo.findOne({
            where: {
                id: 0,
            }
        });

        if (!existingConfig) {
            client.send(JSON.stringify({ event: 'showConfig', data: {} }));
        } else {
            this.currentProvider = existingConfig.provider;
            this.encryptedApiKey = existingConfig.encryptedApiKey;
            this.currentModel = existingConfig.model || PROVIDER_CONFIGS[existingConfig.provider]?.defaultModel || 'openai/gpt-5.4-nano';
            this.initializeState(client);
        }

        return;
    }

    handleDisconnect(client: Client) {
        this.clients = this.clients.filter(c => c !== client);
    }

    async handleMessage(client: Client, message: { event: string, data: any, }) {
        switch (message.event) {
            case 'config':
                await this.handleConfig(client, message.data);
                break;
            case 'doAction':
                await this.handleDoAction(message.data);
                break;
            case 'chat':
                await this.handleChat(message.data);
                break;
            case 'close':
                await this.handleClose(message.data);
                break;
            case 'pinWindow':
                await this.handlePin(message.data.windowId, true);
                break;
            case 'unpinWindow':
                await this.handlePin(message.data.windowId, false);
                break;
            case 'resetData':
                await this.handleResetData();
                break;
            case 'loadLauncherOptions':
                await this.handleLoadLauncherOptions(message.data.text, client);
                break;
            case 'launchOption':
                await this.handleLaunchOption(message.data);
                break;
            default:
                console.log('unknown message ', message.event, message.data);
                break;
        }
    }

    async initializeState(client: Client) {
        const prompts = await this.getPrompts();
        client.send(JSON.stringify({ event: 'settings', data: { prompts, } }));

        const history = await this.getChatHistory();
        for (let item of history) {
            client.send(JSON.stringify({ event: 'message', data: { content: item.content, from: item.user === null ? 'James' : item.user, } }));
        }

        let windows = await this.windowStateRepo.find({
            where: { conversationId: this.conversationId, isOpen: true },
        });

        for (let window of windows) {
            client.send(JSON.stringify({ event: 'ui', data: { id: window.id, content: window.content, title: window.title, pinned: window.pinned } }));
        }

        const pinnedApps = await this.getPinnedApps();
        client.send(JSON.stringify({ event: 'pinnedApps', data: pinnedApps }));

        this.clients.push(client);
    }

    async handleConfig(client: Client, data: any) {
        this.currentProvider = data.provider;
        this.currentModel = data.model || PROVIDER_CONFIGS[data.provider]?.defaultModel;
        const encryptedApiKey = data.apiKey ? this.encryptionService!.encrypt(data.apiKey) : undefined;

        if (encryptedApiKey) {
            this.encryptedApiKey = encryptedApiKey;
        }

        const existingConfig = await this.chatConfigRepo.findOne({ where: { id: 0, }, });
        if (existingConfig) {
            existingConfig.provider = data.provider;
            existingConfig.model = data.model;
            if (encryptedApiKey) {
                existingConfig.encryptedApiKey = encryptedApiKey;
            }
            await this.chatConfigRepo.save(existingConfig);
        } else {
            const newConfig = this.chatConfigRepo.create({ id: 0, provider: data.provider, model: data.model, encryptedApiKey, });
            await this.chatConfigRepo.save(newConfig);
        }
        if (!this.clients.includes(client)) {
            await this.initializeState(client);
        }
    }

    getDoActionPrompt(activeWindowId: number, windowContent: string, dataArgsJson: string, dataInputJson: string) {
        let prompt = this.prompts.uiActionPrompt;

        prompt = prompt.replace(/\%ACTIVEWINDOWID\%/g, activeWindowId.toString());
        prompt = prompt.replace(/\%WINDOWCONTENT\%/g, windowContent);
        prompt = prompt.replace(/\%DATAPAYLOAD\%/g, dataArgsJson);
        prompt = prompt.replace(/\%FORMINPUTS\%/g, dataInputJson);

        return prompt;
    }

    async handleResetData() {
        await this.chatHistoryRepo.deleteAll();
        await this.windowStateRepo.deleteAll();

        await this.databaseService.dropDb();

        this.clients.forEach(c => c.send(JSON.stringify({ event: 'refresh', data: {} })));
    }

    async handleDoAction(data: { activeWindowId: number, inputs: { [key: string]: string }, args: any[], }) {
        console.log(data);
        const windowContent = await this.getWindowContent(data.activeWindowId);

        console.log(windowContent?.length);

        const history = await this.getChatHistory();

        let messages = history.map(h => ({ role: h.user ? 'user' : 'assistant', content: h.content, }));

        const uiActionPrompt = this.getDoActionPrompt(data.activeWindowId, windowContent || '<empty />', JSON.stringify(data.args), JSON.stringify(data.inputs));
        messages.push({
            role: 'user', content: uiActionPrompt,
        })

        let hadContentUpdate = false;

        for (let i = 0; i < 10; ++i) {
            const response = await this.run(messages);

            if (response && response.tools) {
                console.log('tool call', response.tools);
                for (let toolResponse of response.tools) {
                    if (toolResponse.attachment) {
                        hadContentUpdate = true;
                    }
                    await this.handleToolCall(toolResponse, messages, this.clients);
                }
            } else {
                if (!hadContentUpdate) {
                    messages.push({
                        role: 'user', content: 'The user has performed a click but window content was not updated. Ensure you send a tool call to update the window contents following the action the user performed.',
                    });

                    continue;
                }

                const responseItem = { content: response!.content, from: 'James' };
                const agentMessage = this.chatHistoryRepo.create({ content: responseItem.content, user: undefined, conversationId: this.conversationId, });
                await this.chatHistoryRepo.save(agentMessage);
                this.clients.forEach(c => c.send(JSON.stringify({ event: 'message', data: responseItem })));

                console.log(response!.content);
                break;
            }
        }
    }

    async handleChat(data: string) {
        console.log(data);

        const userMessage = this.chatHistoryRepo.create({ content: data, conversationId: this.conversationId, user: 'You', });
        await this.chatHistoryRepo.save(userMessage);
        this.clients.forEach(c => c.send(JSON.stringify({ event: 'message', data: { content: data, from: 'You' } })));
        this.clients.forEach(c => c.send(JSON.stringify({ event: 'typing', data: ['James'], })));

        const history = await this.getChatHistory();

        let messages = history.map(h => ({ role: h.user ? 'user' : 'assistant', content: h.content, }));

        try {
            for (let i = 0; i < 10; ++i) {
                const response = await this.run(messages);

                if (response && response.tools) {
                    for (let toolResponse of response.tools) {
                        await this.handleToolCall(toolResponse, messages, this.clients);
                    }
                } else {
                    const responseItem = { content: response!.content, from: 'James' };
                    history.push(this.chatHistoryRepo.create({ content: responseItem.content, user: undefined, }));
                    const agentMessage = this.chatHistoryRepo.create({ content: responseItem.content, user: undefined, conversationId: this.conversationId, });
                    await this.chatHistoryRepo.save(agentMessage);
                    this.clients.forEach(c => c.send(JSON.stringify({ event: 'message', data: responseItem })));

                    break;
                }
            }
        } catch (e: any) {
            console.error('handleChat error:', e);
            this.clients.forEach(c => c.send(JSON.stringify({ event: 'message', data: { content: `Error: ${e.message}`, from: 'System' } })));
        }
    }

    async handleClose(data: number) {
        console.log('close', data);

        const existingWindow = await this.windowStateRepo.findOneBy({ id: data });
        if (existingWindow) {
            if (existingWindow.pinned) {
                // Keep in DB for sidebar; just mark as not open so it won't reopen on reconnect
                await this.windowStateRepo.update(existingWindow.id, { isOpen: false });
            } else {
                await this.windowStateRepo.remove(existingWindow);
            }
            this.clients.forEach(c => c.send(JSON.stringify({ event: 'closeWindow', data: { id: data } })));
        }
    }

    async getPinnedApps() {
        return this.windowStateRepo.find({
            where: { pinned: true },
            select: { id: true, title: true, content: true },
        });
    }

    async broadcastPinnedApps() {
        const apps = await this.getPinnedApps();
        this.clients.forEach(c => c.send(JSON.stringify({ event: 'pinnedApps', data: apps })));
    }

    async handlePin(windowId: number, pinned: boolean) {
        const existingWindow = await this.windowStateRepo.findOneBy({ id: windowId });
        if (!existingWindow) return;

        if (!pinned && !existingWindow.isOpen) {
            // Unpinning a window that was already closed: delete it entirely
            await this.windowStateRepo.delete(windowId);
        } else {
            existingWindow.pinned = pinned;
            await this.windowStateRepo.save(existingWindow);
        }

        await this.broadcastPinnedApps();
    }

    async getPrompts() {
        return this.prompts;
    }

    async loadApiKey() {
        const encryptedApiKey = this.encryptedApiKey;

        return process.env.OPENROUTER_API_KEY
            || (encryptedApiKey && this.encryptionService?.decrypt(encryptedApiKey))
            || '';
    }

    async run(messages: any[]) {
        const apiKey = await this.loadApiKey();
        const activeWindows = await this.getWindowsSummary();

        const config = PROVIDER_CONFIGS[this.currentProvider] || PROVIDER_CONFIGS['openrouter'];
        const model = this.currentModel || config.defaultModel;

        if (this.currentProvider === 'anthropic') {
            return this.anthropicService.runAiAnthropic(messages, activeWindows, apiKey, model, this.prompts.chatPrompt);
        } else {
            const provider = new OpenAiProvider(this.mcpService, config);
            return provider.runAi(messages, activeWindows, apiKey, this.currentModel, this.prompts.chatPrompt);
        }
    }

    async getWindowContent(windowId: number,) {
        const window = await this.windowStateRepo.findOne({ where: { id: windowId, } });
        return window?.content;
    }

    async getWindowsSummary() {
        const windowsSummary = await this.windowStateRepo.find({ where: { conversationId: this.conversationId, }, select: { title: true, id: true, } });

        return windowsSummary;
    }

    async handleToolCall(toolResponse: any, messages: any[], clients: Client[]) {
        if (toolResponse.query) {

            clients.forEach(c => c.send(JSON.stringify({ event: 'log', data: { content: toolResponse.query }, })));
            try {
                let result = await this.databaseService.query(toolResponse.query);

                const newMessage = {
                    role: "tool",
                    tool_call_id: toolResponse.callId,
                    content: JSON.stringify(result || 'no output'),
                };

                console.log(newMessage, toolResponse.query, result);

                messages.push(newMessage);
            } catch (e: any) {
                const newMessage = {
                    role: "tool",
                    tool_call_id: toolResponse.callId,
                    content: JSON.stringify(e.message || e),
                };

                messages.push(newMessage);
            }
        } else {
            if (typeof toolResponse.windowId === 'number' && toolResponse.windowId > 0) {
                const existingWindow = await this.windowStateRepo.findOneBy({ id: Number(toolResponse.windowId) });

                if (!existingWindow) {
                    // ???
                    throw new Error('invalid window Id');
                }

                // If this window was closed while pinned, mark it open again now that the LLM is updating it
                if (!existingWindow.isOpen) {
                    await this.windowStateRepo.update(existingWindow.id, { isOpen: true });
                    existingWindow.isOpen = true;
                }

                existingWindow.content = toolResponse.attachment;
                existingWindow.title = toolResponse.title;

                await this.windowStateRepo.save(existingWindow);
                clients.forEach(c => c.send(JSON.stringify({ event: 'ui', data: { content: toolResponse.attachment, title: toolResponse.title, id: existingWindow.id, pinned: existingWindow.pinned } })));
            } else {
                const newWindow = this.windowStateRepo.create({ content: toolResponse.attachment, title: toolResponse.title, conversationId: this.conversationId, });
                await this.windowStateRepo.save(newWindow);

                // const agentMessage = this.chatHistoryRepo.create({ content: toolResponse.attachment, user: undefined, conversationId: this.conversationId, });
                // await this.chatHistoryRepo.save(agentMessage);

                clients.forEach(c => c.send(JSON.stringify({ event: 'ui', data: { content: toolResponse.attachment, title: toolResponse.title, id: newWindow.id, pinned: false } })));

            }
            const newMessage = {
                role: "tool",
                tool_call_id: toolResponse.callId,
                content: "success. The UI has been displayed to the user. No need to return it again.",
            };

            messages.push(newMessage);
        }
    }

    async getChatHistory() {
        let history = await this.chatHistoryRepo.find({
            where: { conversationId: this.conversationId, },
            select: { content: true, user: true, createdAt: true, },
            order: { createdAt: 'DESC', },
            take: 30,
        });

        history = history.reverse();

        return history;
    }

    async handleLoadLauncherOptions(text: string, client: Client) {
        const messages = [{ role: 'user', content: 'The user has entered the following text in the spotlight search box: ' + text }];

        const apiKey = await this.loadApiKey();
        const activeWindows = await this.getWindowsSummary();

        const config = PROVIDER_CONFIGS[this.currentProvider] || PROVIDER_CONFIGS['openrouter'];
        const model = this.currentModel || config.defaultModel;

        let result;

        if (this.currentProvider === 'anthropic') {
            result = await this.anthropicService.runAiAnthropic(messages, activeWindows, apiKey, model, this.prompts.launcherPrompt);
        } else {
            const provider = new OpenAiProvider(this.mcpService, config);
            result = await provider.runAi(messages, activeWindows, apiKey, this.currentModel, this.prompts.launcherPrompt);
        }

        client.send(JSON.stringify({ event: 'launcherOptions', data: { text, options: JSON.parse(result.content), } }));
    }

    async handleLaunchOption(option: { title: string, icon: string }) {
        const messages = [{ role: 'user', content: 'The user has selected to run the following spotlight search item: ' + JSON.stringify(option), }];


        const apiKey = await this.loadApiKey();
        const activeWindows = await this.getWindowsSummary();

        const config = PROVIDER_CONFIGS[this.currentProvider] || PROVIDER_CONFIGS['openrouter'];
        const model = this.currentModel || config.defaultModel;

        try {
            for (let i = 0; i < 10; ++i) {
                let response;

                if (this.currentProvider === 'anthropic') {
                    response = await this.anthropicService.runAiAnthropic(messages, activeWindows, apiKey, model, this.prompts.launchOptionPrompt);
                } else {
                    const provider = new OpenAiProvider(this.mcpService, config);
                    response = await provider.runAi(messages, activeWindows, apiKey, this.currentModel, this.prompts.launchOptionPrompt);
                }

                if (response && response.tools) {
                    for (let toolResponse of response.tools) {
                        await this.handleToolCall(toolResponse, messages, this.clients);
                    }
                } else {
                    const responseItem = { content: response!.content, from: 'James' };
                    const agentMessage = this.chatHistoryRepo.create({ content: responseItem.content, user: undefined, conversationId: this.conversationId, });
                    await this.chatHistoryRepo.save(agentMessage);
                    this.clients.forEach(c => c.send(JSON.stringify({ event: 'message', data: responseItem })));

                    break;
                }
            }
        } catch (e: any) {
            console.error('handleChat error:', e);
            this.clients.forEach(c => c.send(JSON.stringify({ event: 'message', data: { content: `Error: ${e.message}`, from: 'System' } })));
        }
    }
}
