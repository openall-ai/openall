import { WindowStateEntity } from "./entities/window-state.entity";

export abstract class AiProvider {
    abstract runAi(messages: any[], activeWindows: WindowStateEntity[], apiKey: string, currentModel: string, chatPrompt: string)
        : Promise<{ content: any; tools?: undefined; } | { tools: any[]; content?: undefined; } | undefined>;
}