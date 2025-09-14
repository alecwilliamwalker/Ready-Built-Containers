import React, { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'katex/dist/katex.min.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { installCrashOverlay, recordBootMark, signalAppMounted } from './debug/CrashOverlay'

// Global error logging during boot to catch silent failures
function installGlobalErrorLogging() {
  if ((window as any).__errInstalled) return;
  (window as any).__errInstalled = true;
  window.onerror = (msg, src, line, col, err) => {
    // eslint-disable-next-line no-console
    console.error('window.onerror:', { msg, src, line, col, err });
  };
  window.onunhandledrejection = (ev) => {
    // eslint-disable-next-line no-console
    console.error('window.onunhandledrejection:', ev.reason || ev);
  };
}

if (import.meta.env.DEV) {
  installCrashOverlay({ mountTimeoutMs: 2000 });
  recordBootMark('[BOOT] entry bundle executed');
}

function Boot() {
  useEffect(() => { installGlobalErrorLogging(); }, []);
  return (
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

function safeRender() {
  try {
    recordBootMark('[BOOT] createRoot');
    const root = createRoot(document.getElementById('root')!);
    recordBootMark('[BOOT] render <App/>' );
    root.render(<Boot />);
    recordBootMark('[BOOT] render complete');
    signalAppMounted();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Root render failed:', e);
  }
}

safeRender();
