import { observer } from 'mobx-react-lite';
import { activeWindowStore } from './draggable-window';
import { ChatBox } from './chat-box';
import Navbar from './navbar';
import { ConfigBox } from './config/config-box';
import { SettingsBox } from './settings/settings-box';
import { ConnectorsScreen } from './connectors/connectors-screen';
import { windowStateStore } from './windows/windowState';
import { Launcher } from './launcher';

const MinimizedList = observer(() => {
    const onRestore = (w: any) => {
        windowStateStore.restoreWindow(w.id);
        activeWindowStore.setActiveWindow(w.id);
    }

    const onClose = (w: any) => {
        windowStateStore.closeWindow(w.id);
    }

    return <div className="fixed z-30 right-4 bottom-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 p-2 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl">
            {windowStateStore.windows.filter(w => w.minimized).map(w =>
                <div key={w.id} className="group relative flex items-center">

                    <div className="flex items-center gap-3 px-3 py-2 pr-10 rounded-xl bg-white/70 border border-white/40 shadow-sm text-sm text-zinc-700 min-w-40 w-full hover:shadow-md transition">
                        {w.title}
                    </div>

                    <div className="absolute right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => onRestore(w)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-200/70 text-zinc-600 transition">
                            ⤢
                        </button>

                        <button onClick={() => onClose(w)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500 hover:text-white text-zinc-500 transition">
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
});

let App = observer(() => {
    return (
        <>
            {/* <DraggableWindow x={40} y={40} >
                <div className="p-6" >

                    <h1 className="text-xl font-semibold">Welcome</h1>

                    <p className="text-sm text-zinc-600 leading-relaxed">
                        This is a modern hybrid window design combining the softness of macOS with the structure of Windows UI.
                        It uses subtle transparency, refined spacing, and minimal controls.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-4 rounded-xl bg-white/70 border border-white/40 shadow-sm hover:shadow-md transition">
                            <div className="font-medium">Card One</div>
                            <div className="text-sm text-zinc-500 mt-1">Clean, minimal content block</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/70 border border-white/40 shadow-sm hover:shadow-md transition">
                            <div className="font-medium">Card Two</div>
                            <div className="text-sm text-zinc-500 mt-1">Subtle hover interactions</div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button className="px-4 py-2 text-sm rounded-lg bg-zinc-200/70 hover:bg-zinc-300 transition">
                            Cancel
                        </button>
                        <button className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-zinc-800 transition shadow">
                            Confirm
                        </button>
                    </div>
                </div>
            </DraggableWindow> */}
            <div className="fixed left-4 top-4 text-4xl text-zinc-300/20 font-black pointer-events-none select-none">
                openall
            </div>
            {windowStateStore.initialized ? <Navbar /> : <></>}
            {windowStateStore.showConfig ? <ConfigBox /> : <></>}
            {windowStateStore.initialized ? <ChatBox /> : <></>}
            {windowStateStore.showSettings ? <SettingsBox /> : <></>}
            {windowStateStore.showConnectors ? <ConnectorsScreen /> : <></>}
            {<Launcher />}
            {/* <MessageList /> */}
            <MinimizedList />

        </>
    )
});

export default App
