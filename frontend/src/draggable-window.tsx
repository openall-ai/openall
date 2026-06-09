import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { ShareButton } from "./share/share-button";
import { windowStateStore } from "./windows/windowState";

export class ActiveWindowStore {
    activeWindow: number | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    setActiveWindow(activeWindow: number | null) {
        this.activeWindow = activeWindow;
    }
}

export const activeWindowStore = new ActiveWindowStore();

const DraggableWindow = observer(({ children, windowKey, title, data, minimized, modal, h, w, loading }:
    { children: any, windowKey: React.Key, title: string, data: any, modal: boolean, minimized: boolean, h?: number, w?: number, loading: boolean }) => {

    const width = Math.min(w || (modal ? 400 : 720), window.innerWidth);
    const height = Math.min(h || 400, window.innerHeight);

    // export default function DraggableWindow({ x, y, children }: { x: number, y: number, children: any }) {
    const [position, setPosition] = useState({ x: window.innerWidth / 2 - width / 2, y: window.innerHeight / 2 - height / 2, });

    const [size, setSize] = useState({ width, height });

    const windowFrameRef = useRef<HTMLDivElement>(null);

    const resizing = useRef(false);
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

    const dragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    const onResizePointerDown = (e: any) => {
        e.stopPropagation();
        resizing.current = true;

        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
        };

        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onResizePointerMove = (e: any) => {
        if (!resizing.current) return;

        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;

        setSize({
            width: Math.max(300, resizeStart.current.width + dx),
            height: Math.max(200, resizeStart.current.height + dy),
        });
    };

    const onResizePointerUp = () => {
        resizing.current = false;
    };

    const onPointerDown = (e: any) => {
        dragging.current = true;

        const rect = e.currentTarget.parentElement.parentElement.parentElement.parentElement.getBoundingClientRect();

        offset.current = {
            x: e.clientX - rect.left - position.x,
            y: e.clientY - rect.top - position.y,
        };

        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: any) => {
        if (!dragging.current) return;

        setPosition({
            x: e.clientX - offset.current.x,
            y: e.clientY - offset.current.y,
        });
    };

    const onPointerUp = () => {
        dragging.current = false;
    };

    const windowPointerDown = () => {
        activeWindowStore.setActiveWindow(Number(windowKey));
    }

    const onMinimize = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        windowStateStore.minimize(data);
    }

    const onClose = () => {
        windowStateStore.closeWindow(data.id);
    }

    const isWindowCurrentlyActive = activeWindowStore.activeWindow === windowKey;

    const attention = false;

    return (
        minimized ? <></> :
            <div className="fixed group" onPointerDown={windowPointerDown} style={{
                width: size.width,
                height: size.height,
                zIndex: modal ? 50 : (isWindowCurrentlyActive ? 10 : 0),
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}>
                {attention && (
                    <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
                        <div className="w-[110%] h-[110%] rounded-3xl bg-orange-400/60 blur-2xl animate-pulse" />
                    </div>
                )}
                <div ref={windowFrameRef} className="rounded-2xl shadow-2xl bg-white/50 backdrop-blur-xl overflow-hidden w-full h-full flex flex-col " >
                    {/* Title Bar */}
                    < div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                        className="flex items-center justify-between px-4 py-3 bg-white/40 cursor-move select-none"
                        style={{
                            'backgroundColor': isWindowCurrentlyActive ? 'rgba(255,255,255,0.4)' : 'transparent',
                        }}>
                        {/* <div className="flex gap-2" >
                            <div className="w-3 h-3 rounded-full bg-red-500"> </div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"> </div>
                            <div className="w-3 h-3 rounded-full bg-green-500"> </div>
                        </div> */}

                        <div className="text-sm text-zinc-700 font-medium">{title}</div>

                        <div className="flex items-center gap-1 text-zinc-500">
                            {
                                !modal ? <>
                                    <ShareButton title={title} windowFrameRef={windowFrameRef} />
                                    <button onPointerDown={onMinimize} className="w-6 h-6 rounded hover:bg-zinc-300/80 flex items-center justify-center transition">
                                        &minus;
                                    </button>
                                    <button onPointerDown={onClose} className="w-6 h-6 rounded hover:bg-red-500/80 hover:text-white flex items-center justify-center transition">
                                        &times;
                                    </button>
                                </> : <></>
                            }
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto flex-1 flex flex-col relative">
                        {children}

                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center z-50">
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

                                <div className="relative flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">

                                    <div className="absolute w-24 h-24 rounded-full bg-blue-100/60 blur-2xl animate-pulse" />

                                    <div className="relative h-12 w-12">
                                        <div className="absolute inset-0 rounded-full border border-white/30" />
                                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-400 animate-spin" />
                                    </div>

                                    <div className="text-sm text-zinc-700/80 font-medium tracking-wide">
                                        Loading...
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {
                    !modal ?
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 transition-opacity duration-200 cursor-se-resize"
                            onPointerDown={onResizePointerDown} onPointerMove={onResizePointerMove} onPointerUp={onResizePointerUp}>
                            <div className="w-full h-full rounded-br-3xl opacity-0 group-hover:opacity-100 border-white/40 hover:border-white/70 border-r-2 border-b-2" />
                        </div> : <></>
                }
            </div>
    )
});

export default DraggableWindow;