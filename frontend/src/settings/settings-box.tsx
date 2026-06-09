import { observer } from "mobx-react-lite";
import DraggableWindow from "../draggable-window";
import { windowStateStore } from "../windows/windowState";

export const SettingsContent = observer(() => {

    const chatPrompt = windowStateStore.prompts.chatPrompt;
    const uiActionPrompt = windowStateStore.prompts.uiActionPrompt;

    const resetData = () => {
        let confirmed = confirm('Delete all app data? This cannot be undone.');
        if (confirmed) {
            windowStateStore.sendMessage('resetData', {});
        }
    };

    return <>
        <div className="flex-1">
            <button onClick={() => { windowStateStore.setShowSettings(false); windowStateStore.showConfigWindow(); }}
                className="mb-2 px-6 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-800 text-white font-medium shadow-md transition">
                Configure LLM Provider
            </button>

            <div className="font-bold">Chat Prompt</div>
            <div className="rounded-xl bg-white/80 border-gray-400 border p-2 my-2" contentEditable="true">{chatPrompt}</div>
            <div className="mt-4 font-bold">UI Action Prompt</div>
            <div className="rounded-xl bg-white/80 border-gray-400 border p-2 my-2" contentEditable="true">{uiActionPrompt}</div>

            <div className="py-2 font-bold">Danger Zone</div>
            <div className="pb-2">Delete all chat history, open windows, application data</div>
            <button onClick={resetData}
                className="px-6 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-medium shadow-md transition">
                Reset app data
            </button>
        </div>

        <div className="pt-2">
            <button onClick={() => windowStateStore.setShowSettings(false)}
                className="w-full py-2 rounded-xl bg-gray-900/80 hover:bg-gray-900 text-white font-medium shadow-md transition">
                Close
            </button>
        </div>
    </>;
});

export const SettingsBox = observer(() => {
    const m = { minimized: false, title: 'Settings', id: -1, };

    return (<>
        <div>
            <DraggableWindow loading={false} data={m} modal={true} minimized={m.minimized} windowKey={'win' + m.id} key={'win' + m.id} title={m.title} h={610} w={800}>
                <SettingsContent />
            </DraggableWindow>
        </div>
    </>);
});