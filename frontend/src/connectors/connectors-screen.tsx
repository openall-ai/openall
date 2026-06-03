import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import DraggableWindow from "../draggable-window";
import { windowStateStore } from "../windows/windowState";

export type McpConfigEntry =
    | {
        command: string;
        args: string[];
        env: { [key: string]: string };
        type: "stdio";
    }
    | {
        url: string;
        headers: { [key: string]: string };
        type: "http";
    };

export type McpServer = {
    name: string;
    config: McpConfigEntry;
};

const secretPrefix = "SECRET:";

function parseSecrets(obj: { [key: string]: string }): { [key: string]: { value: string; secret: boolean } } {
    const result: any = {};
    for (const key in obj) {
        if (obj[key].startsWith(secretPrefix)) {
            result[key] = { value: obj[key].slice(secretPrefix.length), secret: true };
        } else {
            result[key] = { value: obj[key], secret: false };
        }
    }
    return result;
}

function formatSecrets(obj: { [key: string]: { value: string; secret: boolean } }): { [key: string]: string } {
    const result: any = {};
    for (const key in obj) {
        result[key] = obj[key].secret ? secretPrefix + obj[key].value : obj[key].value;
    }
    return result;
}

// --- Components ---
type KeyValue = { key: string; value: string; secret: boolean };

const KeyValueList = ({ title, data, onChange }: { title: string; data: KeyValue[]; onChange: (newData: KeyValue[]) => void }) => {
    const updateItem = (index: number, field: "key" | "value" | "secret", value: any) => {
        const newData = [...data];
        newData[index] = { ...newData[index], [field]: value };
        onChange(newData);
    };

    const addItem = () => onChange([...data, { key: "", value: "", secret: false }]);
    const deleteItem = (index: number) => onChange(data.filter((_, i) => i !== index));

    return (
        <div className="my-2">
            <h4 className="mb-1">{title}</h4>
            {data.map((pair, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-1">
                    <input
                        placeholder="Key"
                        className="px-2 py-1 rounded-lg flex-1 bg-white/70"
                        value={pair.key}
                        onChange={(e) => updateItem(idx, "key", e.target.value)}
                    />
                    <input
                        placeholder="Value"
                        type={pair.secret ? "password" : "text"}
                        className="px-2 py-1 rounded-lg flex-1 bg-white/70"
                        value={pair.value}
                        onChange={(e) => updateItem(idx, "value", e.target.value)}
                    />
                    <label className="flex items-center gap-1">
                        Secret
                        <input type="checkbox" checked={pair.secret} onChange={(e) => updateItem(idx, "secret", e.target.checked)} />
                    </label>
                    <button className="text-red-600" onClick={() => deleteItem(idx)}>
                        ✕
                    </button>
                </div>
            ))}
            <button className="text-blue-600 mt-1" onClick={addItem}>
                + Add
            </button>
        </div>
    );
};

const McpCard = ({ server, onChange, onDelete }: { server: McpServer; onChange: (s: McpServer) => void; onDelete: () => void }) => {
    const [envData, setEnvData] = useState<KeyValue[]>(() => {
        if (server.config.type === "stdio") return Object.entries(parseSecrets(server.config.env)).map(([k, v]) => ({ key: k, ...v }));
        else return [];
    });
    const [headerData, setHeaderData] = useState<KeyValue[]>(() => {
        if (server.config.type === "http") return Object.entries(parseSecrets(server.config.headers)).map(([k, v]) => ({ key: k, ...v }));
        else return [];
    });

    useEffect(() => {
        if (server.config.type === "stdio") {
            onChange({
                ...server,
                config: { ...server.config, env: formatSecrets(Object.fromEntries(envData.map((kv) => [kv.key, { value: kv.value, secret: kv.secret }]))) },
            });
        } else {
            onChange({
                ...server,
                config: { ...server.config, headers: formatSecrets(Object.fromEntries(headerData.map((kv) => [kv.key, { value: kv.value, secret: kv.secret }]))) },
            });
        }
    }, [envData, headerData]);

    const updateField = (field: string, value: any) => {
        onChange({
            ...server,
            config: { ...server.config, [field]: value },
        });
    };

    const switchType = (type: "stdio" | "http") => {
        if (type === "stdio")
            onChange({ ...server, config: { type: "stdio", command: "", args: [], env: {} } });
        else
            onChange({ ...server, config: { type: "http", url: "", headers: {} } });
    };

    return (
        <div className="rounded-lg p-3 mb-3 shadow-sm bg-white/20">
            <div className="flex items-center mb-2 gap-1">
                <input
                    className="rounded-lg px-2 py-1 bg-white/70"
                    value={server.name}
                    placeholder="Server Name"
                    onChange={(e) => onChange({ ...server, name: e.target.value })}
                />
                <div className="ml-1">
                    Type:
                    <select className="rounded-lg px-2 py-1 bg-white/70 ml-1" value={server.config.type} onChange={(e) => switchType(e.target.value as "stdio" | "http")}>
                        <option value="stdio">STDIO</option>
                        <option value="http">HTTP</option>
                    </select>
                </div>
                <div className="flex-1"></div>
                <button className="text-red-600" onClick={onDelete}>
                    Delete
                </button>
            </div>

            {server.config.type === "stdio" ? (
                <div>
                    <div className="mb-1">
                        <label>Command</label>
                        <input
                            className="rounded-lg px-2 py-1 w-full bg-white/70"
                            value={server.config.command}
                            onChange={(e) => updateField("command", e.target.value)}
                        />
                    </div>
                    <div className="mb-1">
                        <label>Arguments</label>
                        {server.config.args.map((arg, idx) => (
                            <div key={idx} className="flex gap-1 mb-1">
                                <input
                                    className="px-2 py-1 rounded-lg flex-1 bg-white/70"
                                    value={arg}
                                    onChange={(e) =>
                                        updateField(
                                            "args",
                                            (server.config as any).args.map((a: any, i: any) => (i === idx ? e.target.value : a))
                                        )
                                    }
                                />
                                <button className="text-red-600" onClick={() => updateField("args", (server.config as any).args.filter((_: any, i: any) => i !== idx))}>
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button className="text-blue-600 mt-1" onClick={() => updateField("args", [...(server.config as any).args, ""])}>
                            + Add Argument
                        </button>
                    </div>
                    <KeyValueList title="Environment Variables" data={envData} onChange={setEnvData} />
                </div>
            ) : (
                <div>
                    <div className="mb-1">
                        <label>URL</label>
                        <input
                            className="rounded-lg bg-white/70 px-2 py-1 w-full"
                            value={server.config.url}
                            onChange={(e) => updateField("url", e.target.value)}
                        />
                    </div>
                    <KeyValueList title="Headers" data={headerData} onChange={setHeaderData} />
                </div>
            )}
        </div>
    );
};

const SettingsContent = observer(() => {
    const [servers, setServers] = useState<McpServer[]>([
        {
            name: "fetch",
            config: {
                type: "stdio",
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-fetch"],
                env: {},
            },
        },
    ]);

    const [mode, setMode] = useState<"visual" | "json">("visual");
    const [jsonText, setJsonText] = useState("");
    const [jsonError, setJsonError] = useState("");

    useEffect(() => {
        if (mode !== "json") return;

        const config = {
            mcpServers: Object.fromEntries(
                servers.map((s) => [s.name, s.config])
            ),
        };

        setJsonText(JSON.stringify(config, null, 2));
    }, [mode]);

    const addServer = () => {
        setServers([
            ...servers,
            {
                name: `server-${servers.length + 1}`,
                config: {
                    type: "stdio",
                    command: "",
                    args: [],
                    env: {},
                },
            },
        ]);
    };

    const updateServer = (index: number, server: McpServer) => {
        const next = [...servers];
        next[index] = server;
        setServers(next);
    };

    const deleteServer = (index: number) => {
        setServers(servers.filter((_, i) => i !== index));
    };

    const switchToVisual = () => {
        try {
            const parsed = JSON.parse(jsonText);

            const nextServers: McpServer[] = Object.entries(
                parsed.mcpServers ?? {}
            ).map(([name, config]) => ({
                name,
                config: config as McpConfigEntry,
            }));

            setServers(nextServers);
            setJsonError("");
            setMode("visual");
        } catch (err: any) {
            setJsonError(err.message);
        }
    };

    const save = async () => {
        let config;

        if (mode === "json") {
            try {
                config = JSON.parse(jsonText);
            } catch (err: any) {
                setJsonError(err.message);
                return;
            }
        } else {
            config = {
                mcpServers: Object.fromEntries(
                    servers.map((s) => [s.name, s.config])
                ),
            };
        }

        console.log("Saving MCP config", config);

        // TODO:
        // await api.saveMcpConfig(config);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Mode Switch */}
            <div className="flex justify-end mb-2">
                <button className={`px-4 py-2 rounded-l-lg ${mode === "visual"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200"
                    }`}
                    onClick={() => {
                        if (mode === "json") {
                            switchToVisual();
                        } else {
                            setMode("visual");
                        }
                    }}>
                    Visual Configurator
                </button>

                <button className={`px-4 py-2 rounded-r-lg ${mode === "json"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200"
                    }`} onClick={() => setMode("json")} >
                    JSON
                </button>
            </div>

            {/* Visual Mode */}
            {mode === "visual" && (
                <div className="flex-1">
                    {servers.map((server, idx) => (
                        <McpCard
                            key={idx}
                            server={server}
                            onChange={(s) => updateServer(idx, s)}
                            onDelete={() => deleteServer(idx)}
                        />
                    ))}
                </div>
            )}

            {/* JSON Mode */}
            {mode === "json" && (
                <div className="flex-1 flex flex-col">
                    <div className="text-sm text-gray-600 mb-2">
                        Edit the raw MCP configuration JSON.
                    </div>

                    <div
                        spellCheck={false}
                        contentEditable
                        suppressContentEditableWarning
                        className="flex-1 overflow-auto rounded-xl bg-white/20 text-gray-700 border border-gray-400 p-3 whitespace-pre font-mono text-sm outline-none"
                        onInput={(e) =>
                            setJsonText(e.currentTarget.textContent ?? "")
                        }
                    >
                        {jsonText}
                    </div>

                    {jsonError && (
                        <div className="mt-2 text-red-600 text-sm">
                            {jsonError}
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-end mt-4 py-3">
                {mode === "visual" && (
                    <button onClick={addServer} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                        + Add Connector
                    </button>
                )}
                <div className="flex-1"></div>

                <button onClick={save} className="w-32 mr-1 py-2 rounded-lg bg-gray-900/80 hover:bg-gray-900 text-white shadow-md transition">
                    Save
                </button>

                <button onClick={() =>
                    windowStateStore.setShowConnectors(false)
                } className="w-32 ml-1 py-2 rounded-lg bg-gray-300/80 hover:bg-gray-300 text-black shadow-md transition">
                    Cancel
                </button>
            </div>
        </div>
    );
});



export const ConnectorsScreen = observer(() => {
    const m = { minimized: false, title: 'MCPs & Connectors', id: -1, };

    return (<>
        <div>
            <DraggableWindow loading={false} data={m} modal={true} minimized={m.minimized} windowKey={'win' + m.id} key={'win' + m.id} title={m.title} h={610} w={800}>
                <SettingsContent />
            </DraggableWindow>
        </div>
    </>);
});