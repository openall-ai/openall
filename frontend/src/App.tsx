import { observer } from 'mobx-react-lite';
import { activeWindowStore } from './draggable-window';
import { ChatBox } from './chat-box';
import Navbar from './navbar';
import { ConfigBox } from './config/config-box';
import { SettingsBox } from './settings/settings-box';
import { ConnectorsScreen } from './connectors/connectors-screen';
import { windowStateStore } from './windows/windowState';
import { connectionStatus } from './connectivity/connection';
import { Launcher } from './launcher';
import { OnboardingModal } from './onboarding/onboarding-modal';

// Expose stores for Playwright visual tests
(window as any).__store = windowStateStore;
(window as any).__connectionStatus = connectionStatus;

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
            <div className="fixed left-4 top-4 text-4xl text-zinc-300/20 font-black pointer-events-none select-none flex items-center">
                <svg id="openall-icon" className="w-12 h-12" width="192" height="192" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OpenAll">
                    <title>OpenAll</title>
                    <line stroke="currentColor" style={{ strokeWidth: 13, strokeLinecap: 'round', fill: 'none', strokeDasharray: 77, }} x1="114" y1="32" x2="168" y2="86"></line>
                    <line stroke="currentColor" style={{ strokeWidth: 13, strokeLinecap: 'round', fill: 'none', strokeDasharray: 77, }} x1="168" y1="114" x2="114" y2="168"></line>
                    <line stroke="currentColor" style={{ strokeWidth: 13, strokeLinecap: 'round', fill: 'none', strokeDasharray: 77, }} x1="86" y1="168" x2="32" y2="114"></line>
                    <line stroke="currentColor" style={{ strokeWidth: 13, strokeLinecap: 'round', fill: 'none', strokeDasharray: 77, }} x1="32" y1="86" x2="86" y2="32"></line>
                    <polygon fill="currentColor" points="100,58 142,100 100,142 58,100"></polygon>
                </svg>
                <div className="pb-2 pl-1">
                    openall
                </div>
            </div >
            {windowStateStore.initialized ? <Navbar /> : <></>}
            {windowStateStore.showConfig ? <ConfigBox /> : <></>}
            {windowStateStore.initialized ? <ChatBox /> : <></>}
            {windowStateStore.initialized ? <OnboardingModal /> : <></>}
            {windowStateStore.showSettings ? <SettingsBox /> : <></>}
            {windowStateStore.showConnectors ? <ConnectorsScreen /> : <></>}
            {<Launcher />}
            {/* <MessageList /> */}
            <MinimizedList />

        </>
    )
});

export default App
