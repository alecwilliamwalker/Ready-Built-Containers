"use client";

import { useRef, useEffect } from "react";

export type DebugLog = {
  timestamp: number;
  type: "click" | "action" | "state" | "coord" | "error" | "info";
  message: string;
  data?: Record<string, unknown>;
};

export type DebugPanelProps = {
  logs: DebugLog[];
  onClear: () => void;
  onClose: () => void;
};

export function DebugPanel({ logs, onClear, onClose }: DebugPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const copyToClipboard = () => {
    const logText = logs
      .map((log) => {
        const time = new Date(log.timestamp).toISOString().split("T")[1].slice(0, -1);
        const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : "";
        return `[${time}] [${log.type.toUpperCase()}] ${log.message}${dataStr}`;
      })
      .join("\n");
    navigator.clipboard.writeText(logText);
  };

  const getLogColor = (type: DebugLog["type"]) => {
    switch (type) {
      case "click":
        return "text-cyan-400";
      case "action":
        return "text-green-400";
      case "state":
        return "text-yellow-400";
      case "coord":
        return "text-purple-400";
      case "error":
        return "text-red-400";
      case "info":
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="fixed bottom-10 right-4 w-[500px] h-[400px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐛</span>
          <span className="text-sm font-semibold text-white">Debug Log</span>
          <span className="text-xs text-slate-400">({logs.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
            title="Copy all logs to clipboard"
          >
            📋 Copy
          </button>
          <button
            onClick={onClear}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
            title="Clear logs"
          >
            🗑️ Clear
          </button>
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-red-600 text-white rounded transition-colors"
            title="Close debug panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-4">
            No logs yet. Interact with the canvas to see debug output.
          </div>
        ) : (
          logs.map((log, index) => {
            const time = new Date(log.timestamp)
              .toISOString()
              .split("T")[1]
              .slice(0, -1);
            return (
              <div
                key={index}
                className="py-1 border-b border-slate-800 last:border-0"
              >
                <span className="text-slate-500">[{time}]</span>{" "}
                <span className={`font-semibold ${getLogColor(log.type)}`}>
                  [{log.type.toUpperCase()}]
                </span>{" "}
                <span className="text-white">{log.message}</span>
                {log.data && (
                  <div className="ml-4 mt-1 text-slate-400 bg-slate-800/50 rounded px-2 py-1">
                    {Object.entries(log.data).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-slate-500">{key}:</span>{" "}
                        <span className="text-amber-300">
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-800 rounded-b-lg">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="text-cyan-400">● click</span>
          <span className="text-green-400">● action</span>
          <span className="text-yellow-400">● state</span>
          <span className="text-purple-400">● coord</span>
          <span className="text-red-400">● error</span>
        </div>
      </div>
    </div>
  );
}

