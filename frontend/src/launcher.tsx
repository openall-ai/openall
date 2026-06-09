import { observer } from "mobx-react-lite";
import { windowStateStore } from "./windows/windowState";
import { makeAutoObservable } from "mobx";
import React from "react";
import { connectionStatus } from "./connectivity/connection";

class LauncherState {
    constructor() {
        makeAutoObservable(this);
    }

    searchContent = '';
    options: { title: string, icon: string }[] = [];
    selectedOption = -1;

    setSearchContent(s: string) {
        this.searchContent = s;

        setTimeout(() => {
            if (this.searchContent === s) {
                if (s.trim()) {
                    connectionStatus.connection.sendMessage('loadLauncherOptions', { text: this.searchContent, });
                } else {
                    this.setOptions('', []);
                }
            }
        }, 400);
    }

    setOptions(text: string, options: { title: string, icon: string }[]) {
        if (this.searchContent === text) {
            this.options = options;
            this.selectedOption = -1;
        } else {
            // ignore out of date options...
        }
    }
    setSelectedOption(index: number) {
        console.log(index);
        this.selectedOption = index;
    }
}

export const launcherState = new LauncherState();

export const Launcher = observer(() => {
    const inputRef = React.useRef<HTMLDivElement>(null);

    if (windowStateStore.showLauncher) {
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    }

    const hideLauncher = () => {
        windowStateStore.setShowLauncher(false);
        launcherState.setSearchContent('');
        inputRef.current?.blur();
        inputRef.current!.textContent = '';
    }

    const launchOption = (option: { title: string, icon: string, }) => {
        connectionStatus.connection.sendMessage('launchOption', option);
        hideLauncher();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        console.log(e);
        if (e.code === 'Escape') {
            hideLauncher();
        }
        if (e.code === 'ArrowDown') {
            if (launcherState.selectedOption + 1 < launcherState.options.length) {
                launcherState.setSelectedOption(launcherState.selectedOption + 1);
            }
        }
        if (e.code === 'ArrowUp') {
            if (launcherState.selectedOption > 0) {
                launcherState.setSelectedOption(launcherState.selectedOption - 1);
            }
        }
        if (e.code === 'Enter') {
            if (launcherState.options[launcherState.selectedOption]) {
                launchOption(launcherState.options[launcherState.selectedOption]);
            }
        }
    };

    return <div onClick={hideLauncher} className={`absolute inset-0 bg-black/50 z-40 w-full h-full transition-[opacity] duration-500 ${windowStateStore.showLauncher ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.bubbles = false; }} className="top-1/2 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-200/80 rounded-xl min-h-16 w-1/2 text-xl transition-all duration-500">
            {!launcherState.searchContent ? <div className="absolute p-4 text-gray-500 select-none pointer-events-none">
                Try me...
            </div> : <></>}
            <div ref={inputRef} className="outline-none p-4 text-black w-full" contentEditable="plaintext-only" onKeyDown={onKeyDown} onInput={(e) => launcherState.setSearchContent(e.currentTarget.textContent)}>
            </div>
            <div className="">
                {launcherState.options.map((o, i) => <div onClick={() => launchOption(o)} className={`rounded-xl p-2 m-2 cursor-pointer hover:bg-white/20 flex gap-2 items-center border  ${launcherState.selectedOption === i ? 'border-gray-800' : 'border-transparent'}`}>
                    <div>
                        <span className="material-symbols-outlined pt-1">
                            {o.icon}
                        </span>
                    </div>
                    <div>
                        {o.title}
                    </div>
                </div>)}
            </div>
        </div>
    </div>
});