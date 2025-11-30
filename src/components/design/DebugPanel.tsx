"use client";

import { useRef, useEffect, useState } from "react";

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
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const copyToClipboard = async () => {
    const logText = logs
      .map((log) => {
        const time = new Date(log.timestamp).toISOString().split("T")[1].slice(0, -1);
        const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : "";
        return `[${time}] [${log.type.toUpperCase()}] ${log.message}${dataStr}`;
      })
      .join("\n");
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(logText);
        setCopyStatus("success");
      } else {
        // Fallback for older browsers / iOS
        const textArea = document.createElement("textarea");
        textArea.value = logText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        
        if (success) {
          setCopyStatus("success");
        } else {
          throw new Error("execCommand copy failed");
        }
      }
      
      // Reset status after 2 seconds
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error("Copy to clipboard failed:", err);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
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

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case "success":
        return "✓ Copied!";
      case "error":
        return "✗ Failed";
      default:
        return "📋 Copy";
    }
  };

  const getCopyButtonClass = () => {
    switch (copyStatus) {
      case "success":
        return "bg-green-600 text-white";
      case "error":
        return "bg-red-600 text-white";
      default:
        return "bg-slate-700 hover:bg-slate-600 text-white";
    }
  };

  return (
    <div className="fixed bottom-20 left-2 right-2 sm:left-auto sm:right-4 sm:w-[500px] h-64 sm:h-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[100] flex flex-col">
      {/* Header - fixed at top */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-700 bg-slate-800 rounded-t-lg">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-base sm:text-lg">🐛</span>
          <span className="text-xs sm:text-sm font-semibold text-white">Debug</span>
          <span className="text-xs text-slate-400">({logs.length})</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={copyToClipboard}
            className={`px-2 py-1 text-xs rounded transition-colors ${getCopyButtonClass()}`}
            title="Copy all logs to clipboard"
          >
            {getCopyButtonText()}
          </button>
          <button
            onClick={onClear}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
            title="Clear logs"
          >
            🗑️
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

      {/* Log Content - scrollable area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-2 font-mono text-xs"
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

      {/* Footer - fixed at bottom */}
      <div className="flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 border-t border-slate-700 bg-slate-800 rounded-b-lg">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-400">
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

