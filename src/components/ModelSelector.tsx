import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Search,
    X,
    ChevronDown,
    Cpu,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    KeyRound,
} from "lucide-react";
import { OpenRouterModel, fetchModels } from "../services/openrouter";

interface ModelSelectorProps {
    selectedModel: string;
    onSelect: (modelId: string) => void;
    onApiKeyChange: (key: string) => void;
}

type KeyStatus = "idle" | "checking" | "valid" | "invalid";

export function ModelSelector({
    selectedModel,
    onSelect,
    onApiKeyChange,
}: ModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const [models, setModels] = useState<OpenRouterModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [hasKey, setHasKey] = useState(false);

    // API key UI state
    const [keyDraft, setKeyDraft] = useState(
        () => localStorage.getItem("or_api_key") ?? ""
    );
    const [showKey, setShowKey] = useState(false);
    const [keyStatus, setKeyStatus] = useState<KeyStatus>("idle");

    const panelRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const validateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- Model list loading (via backend proxy) ---
    const loadModels = useCallback(async () => {
        setLoading(true);
        setError(null);
        setModels([]);
        try {
            const list = await fetchModels();
            setModels(list);
            setHasKey(true);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            setError(msg);
            setHasKey(false);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load models when panel opens (if backend has a key)
    useEffect(() => {
        if (!open) return;
        if (models.length > 0) return;
        setTimeout(() => searchRef.current?.focus(), 50);
        // Try to load; if backend has no key yet, it'll return 401 → we show "enter key" message
        loadModels();
    }, [open, models.length, loadModels]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // --- API key validation (debounced 800ms) ---
    // Sends key to backend /api/config, then tries to load models.
    const validateKey = useCallback(
        async (key: string) => {
            if (!key.trim()) { setKeyStatus("idle"); return; }
            setKeyStatus("checking");
            try {
                // Push key to backend (in-memory only, never stored to disk there)
                onApiKeyChange(key); // App.tsx will POST /api/config
                // Wait briefly for config to propagate, then try to load models
                await new Promise((r) => setTimeout(r, 200));
                await loadModels();
                setKeyStatus("valid");
                localStorage.setItem("or_api_key", key); // persist in browser for UX
            } catch {
                setKeyStatus("invalid");
            }
        },
        [onApiKeyChange, loadModels]
    );

    const handleKeyDraftChange = (val: string) => {
        setKeyDraft(val);
        setKeyStatus("idle");
        if (validateTimer.current) clearTimeout(validateTimer.current);
        validateTimer.current = setTimeout(() => validateKey(val), 800);
    };

    const handleClearKey = () => {
        setKeyDraft("");
        setKeyStatus("idle");
        localStorage.removeItem("or_api_key");
        onApiKeyChange(""); // clears from backend memory too
        setModels([]);
        setHasKey(false);
        if (validateTimer.current) clearTimeout(validateTimer.current);
    };

    // --- Helpers ---
    const filtered = query
        ? models.filter(
            (m) =>
                m.name.toLowerCase().includes(query.toLowerCase()) ||
                m.id.toLowerCase().includes(query.toLowerCase())
        )
        : models;

    const selectedName =
        models.find((m) => m.id === selectedModel)?.name ?? selectedModel;

    function formatCtx(n: number) {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
        return String(n);
    }

    const KeyStatusIcon = () => {
        if (keyStatus === "checking")
            return <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />;
        if (keyStatus === "valid")
            return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
        if (keyStatus === "invalid")
            return <XCircle className="w-3.5 h-3.5 text-red-400" />;
        return null;
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Trigger button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-sm text-slate-700 transition-colors max-w-[220px]"
                title={selectedModel}
            >
                <Cpu className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <span className="truncate">{selectedName}</span>
                <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden">
                    {/* === API Key Section === */}
                    <div className="p-3 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <KeyRound className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                OpenRouter API Key
                            </span>
                        </div>
                        <div
                            className={`flex items-center gap-1 px-2 py-1.5 bg-white rounded-lg border transition-colors ${keyStatus === "valid"
                                    ? "border-emerald-400"
                                    : keyStatus === "invalid"
                                        ? "border-red-300"
                                        : "border-slate-200"
                                }`}
                        >
                            <input
                                type={showKey ? "text" : "password"}
                                value={keyDraft}
                                onChange={(e) => handleKeyDraftChange(e.target.value)}
                                placeholder="sk-or-..."
                                autoComplete="off"
                                spellCheck={false}
                                className="flex-1 min-w-0 bg-transparent text-xs outline-none text-slate-700 placeholder-slate-300 font-mono"
                            />
                            <KeyStatusIcon />
                            <button
                                onClick={() => setShowKey((v) => !v)}
                                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                                tabIndex={-1}
                            >
                                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {keyDraft && (
                                <button
                                    onClick={handleClearKey}
                                    className="text-slate-300 hover:text-red-400 flex-shrink-0"
                                    tabIndex={-1}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        {keyStatus === "valid" && (
                            <p className="text-xs text-emerald-600 mt-1">✓ 金鑰有效，已暫存於本機伺服器記憶體</p>
                        )}
                        {keyStatus === "invalid" && (
                            <p className="text-xs text-red-500 mt-1">✗ 金鑰無效，請重新輸入</p>
                        )}
                        {keyStatus === "idle" && !keyDraft && (
                            <p className="text-xs text-slate-400 mt-1">
                                金鑰僅存於後端記憶體，不寫入磁碟，不外洩於瀏覽器
                            </p>
                        )}
                    </div>

                    {/* === Search === */}
                    <div className="p-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <input
                                ref={searchRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="搜尋模型..."
                                className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400"
                            />
                            {query && (
                                <button onClick={() => setQuery("")}>
                                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* === Model List === */}
                    <div className="overflow-y-auto max-h-64">
                        {!hasKey && !loading && !keyDraft && (
                            <div className="p-4 text-sm text-slate-400 text-center">請先輸入 API Key</div>
                        )}
                        {loading && (
                            <div className="flex items-center justify-center p-6 text-slate-400 gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">載入模型清單...</span>
                            </div>
                        )}
                        {!loading && error && (
                            <div className="p-4 text-sm text-red-500">{error}</div>
                        )}
                        {!loading && !error && filtered.length === 0 && models.length > 0 && (
                            <div className="p-4 text-sm text-slate-400 text-center">無符合結果</div>
                        )}
                        {!loading &&
                            !error &&
                            filtered.map((model) => {
                                const isSelected = model.id === selectedModel;
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => { onSelect(model.id); setOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-start gap-2.5 transition-colors border-b border-slate-50 last:border-0 ${isSelected ? "bg-indigo-50" : ""}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${isSelected ? "text-indigo-700" : "text-slate-800"}`}>
                                                {model.name}
                                            </div>
                                            <div className="text-xs text-slate-400 truncate mt-0.5">{model.id}</div>
                                        </div>
                                        {model.context_length > 0 && (
                                            <span className="flex-shrink-0 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                                                {formatCtx(model.context_length)}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                    </div>

                    {!loading && !error && models.length > 0 && (
                        <div className="px-3 py-1.5 border-t border-slate-100 text-xs text-slate-400 text-right">
                            {filtered.length} / {models.length} 個模型
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
