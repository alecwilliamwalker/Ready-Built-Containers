/*
  DEV-ONLY CrashOverlay
  - Disable by removing installCrashOverlay() in main.tsx or building with DEV=false
  - No side effects on import. Call installCrashOverlay() to wire it up.
*/

type LogEntry = {
  ts: number;
  level: 'log' | 'warn' | 'error';
  args: any[];
};

type BootMark = { ts: number; label: string };

let ringBuffer: LogEntry[] = [];
let bootMarks: BootMark[] = [];
let overlayEl: HTMLDivElement | null = null;
let overlayPreEl: HTMLPreElement | null = null;
let mounted = false;
let timeoutId: number | null = null;
let patched = false;
// let warnedPreReady = false;

function ensureOverlay() {
  if (overlayEl) return;
  overlayEl = document.createElement('div');
  overlayEl.id = 'crash-overlay';
  overlayEl.style.position = 'fixed';
  overlayEl.style.top = '8px';
  overlayEl.style.right = '8px';
  overlayEl.style.maxWidth = '50vw';
  overlayEl.style.maxHeight = '70vh';
  overlayEl.style.overflow = 'auto';
  overlayEl.style.zIndex = '2147483647';
  overlayEl.style.background = 'rgba(0,0,0,0.85)';
  overlayEl.style.color = '#ffe8e8';
  overlayEl.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  overlayEl.style.fontSize = '12px';
  overlayEl.style.padding = '10px';
  overlayEl.style.border = '1px solid #ff5555';
  overlayEl.style.borderRadius = '6px';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '6px';
  const title = document.createElement('strong');
  title.textContent = 'Crash Overlay (DEV)';
  const btns = document.createElement('div');
  const hideBtn = document.createElement('button');
  hideBtn.textContent = 'Hide';
  hideBtn.style.marginLeft = '6px';
  hideBtn.onclick = () => hide();
  btns.appendChild(hideBtn);
  header.appendChild(title); header.appendChild(btns);

  overlayPreEl = document.createElement('pre');
  overlayPreEl.style.margin = '0';
  overlayPreEl.style.whiteSpace = 'pre-wrap';

  overlayEl.appendChild(header);
  overlayEl.appendChild(overlayPreEl);
  document.body.appendChild(overlayEl);
}

function dumpBuffer(extra?: string) {
  if (!overlayPreEl) return;
  const lines: string[] = [];
  if (extra) lines.push(extra, '');
  const last = ringBuffer.slice(-200);
  for (const e of last) {
    const ts = new Date(e.ts).toISOString().slice(11, 23);
    const msg = e.args.map(stringify).join(' ');
    lines.push(`[${ts}] ${e.level.toUpperCase()}: ${msg}`);
  }
  const marks = getBootReport();
  if (marks.marks.length) {
    lines.push('', 'Boot marks:');
    const t0 = marks.marks[0].ts;
    for (const m of marks.marks) {
      lines.push(` +${(m.ts - t0).toString().padStart(4)}ms ${m.label}`);
    }
  }
  overlayPreEl.textContent = lines.join('\n');
}

function show(err?: any, ctx?: any) {
  ensureOverlay();
  const parts: string[] = [];
  if (err) parts.push('Error:', stringify(err));
  if (ctx) parts.push('Context:', stringify(ctx));
  dumpBuffer(parts.join('\n'));
}

function hide() {
  if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
  overlayEl = null; overlayPreEl = null;
}

function pushLog(level: LogEntry['level'], args: any[]) {
  ringBuffer.push({ ts: Date.now(), level, args });
  if (ringBuffer.length > 200) ringBuffer.shift();
}

function stringify(x: any): string {
  if (x instanceof Error) return `${x.name}: ${x.message}\n${x.stack || ''}`;
  try { return typeof x === 'string' ? x : JSON.stringify(x); }
  catch { return String(x); }
}

export function installCrashOverlay(opts?: { mountTimeoutMs?: number; showOnWarn?: boolean }) {
  if (!import.meta.env.DEV) return;
  const mountTimeoutMs = opts?.mountTimeoutMs ?? 2000;
  const showOnWarn = opts?.showOnWarn ?? false;

  // Patch console
  if (!patched) {
    patched = true;
    const orig = { error: console.error, warn: console.warn, log: console.log };
    console.error = (...args: any[]) => { pushLog('error', args); orig.error.apply(console, args); show(args[0]); };
    console.warn = (...args: any[]) => { pushLog('warn', args); orig.warn.apply(console, args); if (showOnWarn) show(args[0]); };
    console.log = (...args: any[]) => { pushLog('log', args); orig.log.apply(console, args); };
  }

  // Resource and runtime errors
  const onResourceError = (e: Event) => {
    const target = e.target as any;
    const tag = target?.tagName || 'unknown';
    const src = target?.src || target?.href || '';
    show(`Resource load error: <${tag.toLowerCase()}> ${src}`);
  };
  const onUnhandled = (ev: PromiseRejectionEvent) => {
    show('Unhandled rejection', ev.reason);
  };
  const onWindowError = (msg: string | Event, src?: string, line?: number, col?: number, err?: Error) => {
    show('window.onerror', { msg, src, line, col, err });
  };
  window.addEventListener('error', onResourceError, true);
  window.addEventListener('unhandledrejection', onUnhandled);
  window.onerror = onWindowError as any;

  // Mount watchdog
  if (timeoutId) { clearTimeout(timeoutId); }
  timeoutId = window.setTimeout(() => {
    if (!mounted) {
      const report = getBootReport();
      show('App did not mount in time', report);
    }
  }, mountTimeoutMs);

  // Testing helper
  (window as any).__crash = (msg = 'manual crash') => { throw new Error(msg); };
  (window as any).__recordBoot = (label: string) => recordBootMark(label);
}

export function signalAppMounted() {
  mounted = true;
  if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
}

export function recordBootMark(label: string) {
  bootMarks.push({ ts: Date.now(), label });
  if (bootMarks.length > 200) bootMarks.shift();
}

export function getBootReport(): { marks: BootMark[]; last?: BootMark; duration?: number } {
  const marks = bootMarks.slice();
  const last = marks[marks.length - 1];
  const duration = marks.length >= 2 ? (marks[marks.length - 1].ts - marks[0].ts) : undefined;
  return { marks, last, duration };
}


