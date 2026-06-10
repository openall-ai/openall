import { useState } from "react";
import { observer } from "mobx-react-lite";
import { windowStateStore } from "./windows/windowState";

const Navbar = observer(function Navbar() {
    const [expanded, setExpanded] = useState(false);

    const showSettings = () => windowStateStore.setShowSettings(true);
    const showConnectors = () => windowStateStore.setShowConnectors(true);

    const items = [
        { click: showConnectors, icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"/></svg>`, label: "MCP & Connectors" },
        { click: showSettings, icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>`, label: "Settings" },
    ];

    return (
        <div onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}
            className={`fixed z-30 left-4 top-1/2 -translate-y-1/2 ${expanded ? "w-64" : "w-16"} p-2 rounded-2xl bg-white/60 backdrop-blur-2xl 
                border border-white/40 shadow-2xl transition-all duration-300 ease-out flex flex-col gap-2`}>
            {/* Header */}
            <div className={`flex items-center ${expanded ? "justify-between px-3" : "justify-center"} py-2 h-10 rounded-xl bg-white/40 border border-white/30 transition-all`}>
                {expanded ? (
                    <>
                        <span className="text-sm font-medium text-zinc-700 select-none">
                            Workspace
                        </span>

                        <div className="flex gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        </div>
                    </>
                ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                )}
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2">
                {items.map((item) => (
                    <div key={item.label} className="group relative flex items-center">
                        <div onClick={item.click} className={`flex items-center ${expanded ? "justify-start px-3 gap-3" : "justify-center"} w-full py-2 overflow-hidden rounded-xl
              bg-white/70 border border-white/40 shadow-sm text-sm text-zinc-700 hover:bg-white/80 hover:shadow-md transition-all cursor-pointer`}>
                            <span className="text-lg" dangerouslySetInnerHTML={{ __html: item.icon }}></span>

                            {/* Label */}
                            <span className={`whitespace-nowrap transition-all duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
                                {item.label}
                            </span>
                        </div>

                        {/* Hover actions (only when expanded) */}
                        {expanded && (
                            <div className="absolute right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-200/70 transition">
                                    →
                                </button>
                                <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500 hover:text-white transition">
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="group relative flex items-center">
                <div onClick={() => { windowStateStore.setShowLauncher(true) }} className={`flex items-center ${expanded ? "justify-start px-3 gap-3" : "justify-center"} py-2 w-full overflow-hidden rounded-xl
              bg-white/70 border border-white/40 shadow-sm text-sm text-zinc-700 hover:bg-white/80 hover:shadow-md transition-all cursor-pointer`}>
                    <span className="text-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" /></svg>
                    </span>

                    <div className={`whitespace-nowrap transition-all duration-200 ${expanded ? "opacity-100 w-full" : "opacity-0 w-0 overflow-hidden"}`}>
                        Search
                    </div>
                </div>
            </div>

            {/* Apps & Utilities section */}
            {(expanded || windowStateStore.pinnedApps.length > 0) && (
                <div className="flex flex-col gap-1">
                    {expanded && (
                        <div className="px-3 pt-1 pb-0.5">
                            <div className="border-t border-white/30" />
                            <span className={`block pt-2 text-xs font-semibold uppercase tracking-wider select-none ${windowStateStore.pinnedApps.length === 0 ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                {expanded ? 'Apps & Utilities' : ''}
                            </span>
                        </div>
                    )}
                    {windowStateStore.pinnedApps.map(app => (
                        <div key={app.id} className="group/app relative flex items-center">
                            <div
                                onClick={() => windowStateStore.reopenPinnedApp(app)}
                                className={`flex items-center ${expanded ? "justify-start px-3 gap-2" : "justify-center"} py-2 w-full overflow-hidden rounded-xl
                                    bg-blue-50/60 border border-blue-200/40 shadow-sm text-sm text-zinc-700 hover:bg-blue-100/70 hover:shadow-md transition-all cursor-pointer`}
                            >
                                <span className="text-blue-400 shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                                        <path d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z" />
                                    </svg>
                                </span>
                                <span className={`whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0"}`}>
                                    {app.title}
                                </span>
                            </div>

                            {/* Unpin button — only when expanded */}
                            {expanded && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); windowStateStore.unpinWindow(app.id); }}
                                    title="Remove from sidebar"
                                    className="absolute right-1 w-5 h-5 flex items-center justify-center rounded-md text-zinc-400 hover:bg-red-500/80 hover:text-white opacity-0 group-hover/app:opacity-100 transition text-xs"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

export default Navbar;