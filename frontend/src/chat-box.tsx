import { connectionStatus } from "./connectivity/connection";
import { observer } from "mobx-react-lite";
import { marked } from "marked";
import { useState } from "react";
import DraggableWindow, { activeWindowStore } from "./draggable-window";
import React from "react";
import { ShareModal } from "./share/share-modal";
import { windowStateStore } from "./windows/windowState";



const MessageList = observer(() => {
    return (
        <div className="p-4 text-zinc-800">
            {windowStateStore.messages.map((m, i) => m.log ?
                // <DraggableWindow x={40} y={40}><div dangerouslySetInnerHTML={{ __html: m.content.trim('`') }}></div></DraggableWindow>
                <React.Fragment key={'msg' + i}>
                    <div className="px-2 text-light tracking-tight text-gray-400">{m.log}</div>
                </React.Fragment>
                : <React.Fragment key={'msg' + i}>
                    <div className="px-2 mt-2">{m.from}</div>
                    <div className="px-2 text-light tracking-tight" dangerouslySetInnerHTML={{ __html: marked.parse(m.content) }}></div>
                </React.Fragment>
            )}
        </div>
    );
});

(window as any).doAction = (...args: any[]) => {
    const win = windowStateStore.windows.find(w => w.id === activeWindowStore.activeWindow);
    win.loading = true;
    windowStateStore.doAction(activeWindowStore.activeWindow || 0, win.inputs, ...args);
}

(window as any).requestFileUpload = async () => {
    try {
        const api = (window as any).api;
        let result: { name: string; content: string } | { error: string } | null = null;

        if (api?.pickFile) {
            result = await api.pickFile();
        } else {
            result = await new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.onchange = () => {
                    const file = input.files?.[0];
                    if (!file) { resolve(null); return; }
                    if (file.size > 500_000) { resolve({ error: 'File exceeds 500 KB limit.' }); return; }
                    const isText = /\.(txt|csv|json|ts|js|py|md|html|css|xml|yaml|yml|docx)$/i.test(file.name) || file.type.startsWith('text/');
                    if (!isText) { resolve({ error: 'Only text files are supported (.txt, .csv, .json, .md, .py, .js, etc.)' }); return; }
                    const reader = new FileReader();
                    reader.onload = (e) => resolve({ name: file.name, content: e.target?.result as string });
                    reader.readAsText(file);
                };
                input.click();
            });
        }

        if (!result) return;
        if ('error' in result) { alert(result.error); return; }
        windowStateStore.sendChat(`[File: ${result.name}]\n\`\`\`\n${result.content}\n\`\`\``);
    } catch (e) {
        console.error('requestFileUpload error:', e);
    }
};

const WindowList = observer(() => {
    const onChange = (_: any, e: any) => console.log('change', e);
    const onInput = (m: any, e: any) => {
        console.log('input', e.target.id, e.target.value);
        if (!m.inputs) { m.inputs = {}; }
        m.inputs[e.target.id] = e.target.value;
    };

    return (<>
        {
            windowStateStore.windows.map((m) =>
                <DraggableWindow data={m} modal={false} minimized={m.minimized} windowKey={m.id} key={m.id} loading={m.loading} title={m.title}>
                    <div onInput={(e) => onInput(m, e)} onChange={(e) => onChange(m, e)} dangerouslySetInnerHTML={{ __html: m.content.replace(/`/g, '') }}></div>
                </DraggableWindow>
            )
        }
    </>
    );
});

export const ChatBox = observer(() => {
    const [message, setMessage] = useState('');
    const handleMessageChange = (event: any) => {
        setMessage(event.target.value);
    };
    const sendMessage = () => {
        windowStateStore.sendChat(message);
        setMessage('');
    };

    const handleChatBoxInput = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.code === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            sendMessage();
        }
    };

    const handleFocus = () => {
        activeWindowStore.setActiveWindow(null);
    }
    const connected = connectionStatus.connected;
    const connecting = connectionStatus.connecting;

    return <>
        <WindowList />
        <ShareModal />
        <div className="fixed bottom-6 left-1/2 w-full max-w-2xl px-4 group" style={{ transform: 'translateX(-50%)' }}>

            <div className="overflow-hidden group-focus-within:h-[400px] h-0 transition-[height,opacity] opacity-0 group-focus-within:opacity-100
              rounded-xl bg-white/90 border border-white/40 shadow-sm overflow-y-auto text-sm text-zinc-700 mb-4">
                <MessageList />
            </div>

            <div className="flex items-center gap-3 rounded-2xl group-focus-within:bg-white/70 bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl"
                style={{ backgroundColor: connected ? undefined : connecting ? 'rgba(128,128,255,0.2)' : 'rgba(255,64,64,0.2)' }}>
                {/* Text input */}
                <textarea value={message} onFocus={handleFocus} onChange={handleMessageChange} onKeyDown={handleChatBoxInput}
                    rows={1}
                    placeholder={connected ? "Let's change the world..." : connecting ? 'Connecting...' : 'Disconnected'}
                    className="flex-1 resize-none bg-transparent outline-none p-4 text-zinc-100 group-focus-within:text-zinc-900 placeholder:text-zinc-100/50 group-focus-within:placeholder:text-zinc-500 leading-relaxed max-h-32"
                    onInput={(e: any) => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                    }}
                />

                {/* Send button */}
                <button onClick={sendMessage} className="flex items-center justify-center mx-4 w-9 h-9 rounded-xl bg-black text-white hover:bg-zinc-800
          active:scale-95 transition shadow">
                    ↑
                </button>

            </div>
        </div>
    </>
});