import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  RotateCw,
  FilePlus2,
  Trash2,
  Download,
  Upload,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Terminal,
  Columns2,
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  ChevronDown,
  LayoutTemplate,
  Sparkles,
  WrapText,
  Pencil,
  Files,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Minus,
  Plus,
  Eye,
} from 'lucide-react';
import { Fluent3DHtmlWriterIcon } from '../components/Fluent3DIcons';
import { flyoutPanelClassName, flyoutPanelStyle, contextMenuMotionProps } from '../components/FlyoutDropdown';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';
import { showAppToast } from '../utils/toast';
import { useIsMobile } from '../hooks/useIsMobile';

interface HtmlDocumentItem {
  id: string;
  name: string;
  content: string;
  updatedAt: number;
}

interface ConsoleEntry {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

type ViewMode = 'split' | 'code' | 'preview';
type ViewportPreset = 'full' | 'desktop' | 'tablet' | 'mobile';

const STORAGE_KEY = 'sparkle_html_writer_files_v1';
const ACTIVE_ID_KEY = 'sparkle_html_writer_active_id_v1';

interface HtmlTemplate {
  id: string;
  name: string;
  description: string;
  filename: string;
  content: string;
}

const HTML_TEMPLATES: HtmlTemplate[] = [
  {
    id: 'winui-welcome',
    name: 'WinUI 3 Welcome Card',
    description: 'Thẻ giao diện Fluent UI hiện đại với nút tương tác JS',
    filename: 'index.html',
    content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WinUI 3 Demo Card</title>
  <style>
    :root {
      --accent: #0067b8;
      --accent-hover: #005a9e;
      --bg: #f3f3f3;
      --card: rgba(255, 255, 255, 0.88);
      --text: #1b1b1b;
      --muted: #5d5d5d;
      --border: rgba(0, 0, 0, 0.08);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --accent: #4cc2ff;
        --accent-hover: #70ceff;
        --bg: #1e2024;
        --card: rgba(44, 48, 55, 0.88);
        --text: #f3f3f3;
        --muted: #a8b0bc;
        --border: rgba(255, 255, 255, 0.09);
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      font-family: "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
      background:
        radial-gradient(circle at 15% 20%, rgba(76, 194, 255, 0.22), transparent 42%),
        radial-gradient(circle at 85% 80%, rgba(0, 103, 184, 0.18), transparent 45%),
        var(--bg);
      color: var(--text);
    }
    .card {
      width: min(460px, 100%);
      background: var(--card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(0, 103, 184, 0.12);
      color: var(--accent);
      margin-bottom: 12px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 600;
    }
    p {
      margin: 0 0 20px;
      font-size: 14px;
      line-height: 1.55;
      color: var(--muted);
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    button {
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: transform 0.12s ease, opacity 0.15s ease, background 0.15s ease;
    }
    button:active { transform: scale(0.97); }
    .btn-primary {
      border: none;
      background: var(--accent);
      color: #ffffff;
    }
    @media (prefers-color-scheme: dark) {
      .btn-primary { color: #000000; }
    }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-secondary {
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text);
    }
    .status {
      margin-top: 16px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      font-size: 13px;
      display: none;
    }
    .status.show { display: block; }
  </style>
</head>
<body>
  <section class="card">
    <div class="badge">HTML Writer • WinUI 3</div>
    <h1>Xin chào từ HTML Writer</h1>
    <p>
      Viết HTML, CSS và JavaScript trực tiếp ở khung bên trái, sau đó nhấn
      <strong>Run</strong> hoặc bật <strong>Auto-Run</strong> để xem kết quả ngay lập tức.
    </p>
    <div class="actions">
      <button class="btn-primary" id="btnTest">Chạy tương tác</button>
      <button class="btn-secondary" id="btnLog">Ghi log Console</button>
    </div>
    <div class="status" id="statusBox"></div>
  </section>

  <script>
    let clicks = 0;
    const statusBox = document.getElementById('statusBox');
    document.getElementById('btnTest').addEventListener('click', () => {
      clicks += 1;
      statusBox.classList.add('show');
      statusBox.textContent = 'Đã kích hoạt sự kiện JS lần thứ ' + clicks + ' lúc ' + new Date().toLocaleTimeString();
      console.log('Button clicked:', clicks);
    });
    document.getElementById('btnLog').addEventListener('click', () => {
      console.info('Thông báo mẫu từ trình chạy HTML Writer!');
    });
  </script>
</body>
</html>`,
  },
  {
    id: 'interactive-counter',
    name: 'Interactive Counter & Todo',
    description: 'Bộ đếm và danh sách việc cần làm tương tác',
    filename: 'counter-app.html',
    content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quick Counter & Checklist</title>
  <style>
    body {
      margin: 0;
      padding: 28px;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: #202328;
      color: #f4f4f5;
      display: flex;
      justify-content: center;
    }
    .app {
      width: min(440px, 100%);
      background: #2b2f36;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 20px;
    }
    .counter-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      margin-bottom: 18px;
    }
    .count { font-size: 28px; font-weight: 700; color: #4cc2ff; }
    button {
      background: #4cc2ff;
      color: #000;
      border: none;
      border-radius: 6px;
      padding: 7px 14px;
      font-weight: 600;
      cursor: pointer;
    }
    button.ghost {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    form { display: flex; gap: 8px; margin-bottom: 12px; }
    input {
      flex: 1;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: #1c1f24;
      color: #fff;
      outline: none;
    }
    ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
    li {
      padding: 8px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.04);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="counter-row">
      <div>
        <div style="font-size:12px;opacity:.7">Bộ đếm hiện tại</div>
        <div class="count" id="count">0</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="ghost" onclick="change(-1)">-1</button>
        <button onclick="change(1)">+1</button>
      </div>
    </div>

    <form id="todoForm">
      <input id="todoInput" placeholder="Thêm ghi chú nhanh..." />
      <button type="submit">Thêm</button>
    </form>
    <ul id="todoList"></ul>
  </div>
  <script>
    let n = 0;
    function change(delta) {
      n += delta;
      document.getElementById('count').textContent = n;
    }
    const list = document.getElementById('todoList');
    document.getElementById('todoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('todoInput');
      const val = input.value.trim();
      if (!val) return;
      const li = document.createElement('li');
      li.innerHTML = '<span>' + val.replace(/</g, '&lt;') + '</span>';
      const del = document.createElement('button');
      del.textContent = 'Xong';
      del.className = 'ghost';
      del.onclick = () => li.remove();
      li.appendChild(del);
      list.appendChild(li);
      input.value = '';
      console.log('Added item:', val);
    });
  </script>
</body>
</html>`,
  },
  {
    id: 'css-grid-dashboard',
    name: 'CSS Grid Dashboard',
    description: 'Bố cục thẻ thống kê Responsive bằng CSS Grid',
    filename: 'dashboard.html',
    content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fluent Grid Dashboard</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: #1b1e23;
      color: #f3f4f6;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      max-width: 900px;
      margin: 0 auto;
    }
    .tile {
      background: #272b32;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 16px;
    }
    .label { font-size: 12px; color: #9ca3af; }
    .val { font-size: 26px; font-weight: 700; margin-top: 6px; color: #4cc2ff; }
    .wide { grid-column: 1 / -1; }
    .bar-wrap {
      height: 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.08);
      margin-top: 12px;
      overflow: hidden;
    }
    .bar { height: 100%; width: 76%; background: linear-gradient(90deg, #0067b8, #4cc2ff); }
  </style>
</head>
<body>
  <div class="grid">
    <div class="tile"><div class="label">Phiên làm việc</div><div class="val">1,248</div></div>
    <div class="tile"><div class="label">Tốc độ dựng</div><div class="val">12 ms</div></div>
    <div class="tile"><div class="label">Độ ổn định</div><div class="val">99.9%</div></div>
    <div class="tile wide">
      <div class="label">Hiệu năng tổng thể</div>
      <div class="bar-wrap"><div class="bar"></div></div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'canvas-particles',
    name: 'HTML5 Canvas Particles',
    description: 'Hoạt ảnh hạt tương tác chuột trên Canvas 2D',
    filename: 'particles.html',
    content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Canvas Particles</title>
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; background: #13161b; }
    canvas { display: block; width: 100%; height: 100%; }
    .hud {
      position: fixed; top: 14px; left: 14px;
      padding: 6px 12px; border-radius: 6px;
      background: rgba(32, 35, 40, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #e5e7eb; font: 12px/1.4 "Segoe UI", sans-serif;
    }
  </style>
</head>
<body>
  <div class="hud">Di chuyển chuột để tương tác các hạt</div>
  <canvas id="c"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    let w, h;
    const mouse = { x: -999, y: -999 };
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    resize();

    const pts = Array.from({ length: 56 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 1.1,
      vy: (Math.random() - 0.5) * 1.1,
      r: Math.random() * 2 + 1.5
    }));

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 120) {
          ctx.strokeStyle = 'rgba(76, 194, 255, ' + (1 - d / 120) * 0.6 + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = '#4cc2ff';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
  </script>
</body>
</html>`,
  },
  {
    id: 'blank-html5',
    name: 'Blank HTML5',
    description: 'Khung HTML5 tối giản để tự do sáng tác từ đầu',
    filename: 'untitled.html',
    content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Untitled Page</title>
  <style>
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      padding: 24px;
      margin: 0;
    }
  </style>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`,
  },
];

const QUICK_SNIPPETS = [
  {
    label: 'HTML5',
    code: `<!DOCTYPE html>\n<html lang="vi">\n<head>\n  <meta charset="UTF-8" />\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>`,
  },
  {
    label: '<style>',
    code: `<style>\n  \n</style>`,
  },
  {
    label: '<script>',
    code: `<script>\n  console.log('Ready');\n</script>`,
  },
  {
    label: 'Card',
    code: `<div style="padding:16px;border-radius:10px;border:1px solid rgba(128,128,128,.25)">\n  <h3>Card Title</h3>\n  <p>Nội dung thẻ WinUI 3</p>\n</div>`,
  },
  {
    label: 'Button',
    code: `<button onclick="console.log('Clicked!')">Nhấn vào đây</button>`,
  },
];

function formatHtmlCode(raw: string): string {
  const tokens = raw
    .replace(/>\s+</g, '><')
    .trim()
    .split(/(<[^>]+>)/g)
    .filter((t) => t.trim().length > 0);

  const voidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]);

  let indent = 0;
  const lines: string[] = [];
  let inRawBlock = false;

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('</')) {
      const tag = trimmed.slice(2, -1).trim().toLowerCase();
      if (tag === 'script' || tag === 'style') inRawBlock = false;
      indent = Math.max(0, indent - 1);
      lines.push(`${'  '.repeat(indent)}${trimmed}`);
      continue;
    }

    if (trimmed.startsWith('<!') || trimmed.startsWith('<?')) {
      lines.push(`${'  '.repeat(indent)}${trimmed}`);
      continue;
    }

    if (trimmed.startsWith('<')) {
      const match = trimmed.match(/^<([a-zA-Z0-9-]+)/);
      const tagName = match ? match[1].toLowerCase() : '';
      const selfClosing = trimmed.endsWith('/>') || voidTags.has(tagName);
      lines.push(`${'  '.repeat(indent)}${trimmed}`);
      if (!selfClosing) {
        indent += 1;
        if (tagName === 'script' || tagName === 'style') inRawBlock = true;
      }
      continue;
    }

    if (inRawBlock) {
      const subLines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const sl of subLines) {
        lines.push(`${'  '.repeat(indent)}${sl}`);
      }
    } else {
      lines.push(`${'  '.repeat(indent)}${trimmed}`);
    }
  }

  return lines.join('\n');
}

function buildSandboxedSrcDoc(rawHtml: string, sessionId: string): string {
  const bridgeScript = `<script>
(function () {
  var SID = ${JSON.stringify(sessionId)};
  function serialize(arg) {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.stack || arg.message;
    try { return JSON.stringify(arg); } catch (e) { return String(arg); }
  }
  function send(level, args) {
    try {
      window.parent.postMessage({
        source: 'sparkle-html-writer',
        sessionId: SID,
        level: level,
        message: Array.prototype.slice.call(args).map(serialize).join(' '),
        timestamp: new Date().toLocaleTimeString()
      }, '*');
    } catch (e) {}
  }
  ['log', 'info', 'warn', 'error'].forEach(function (lvl) {
    var orig = console[lvl];
    console[lvl] = function () {
      send(lvl, arguments);
      if (orig) return orig.apply(console, arguments);
    };
  });
  window.addEventListener('error', function (ev) {
    send('error', [ev.message + (ev.lineno ? ' (Line ' + ev.lineno + ')' : '')]);
  });
  window.addEventListener('unhandledrejection', function (ev) {
    send('error', ['Unhandled Promise Rejection:', ev.reason]);
  });
})();
</script>`;

  const trimmed = rawHtml.trim();
  if (!trimmed) {
    return `<!DOCTYPE html><html><head>${bridgeScript}</head><body style="font-family:Segoe UI,sans-serif;padding:24px;color:#888">Empty HTML document</body></html>`;
  }

  if (/<head[^>]*>/i.test(trimmed)) {
    return trimmed.replace(/<head([^>]*)>/i, `<head$1>\n${bridgeScript}`);
  }
  if (/<html[^>]*>/i.test(trimmed)) {
    return trimmed.replace(/<html([^>]*)>/i, `<html$1>\n<head>${bridgeScript}</head>`);
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8" />${bridgeScript}</head><body>${trimmed}</body></html>`;
}

function extractHtmlTitle(html: string, fallback: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const t = m ? m[1].trim() : '';
  return t || fallback;
}

export const HtmlWriter: React.FC = () => {
  const isMobile = useIsMobile();

  const [files, setFiles] = useState<HtmlDocumentItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'doc-default-1',
        name: HTML_TEMPLATES[0].filename,
        content: HTML_TEMPLATES[0].content,
        updatedAt: Date.now(),
      },
    ];
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_ID_KEY);
      if (saved) return saved;
    } catch {}
    return 'doc-default-1';
  });

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) || files[0],
    [files, activeFileId]
  );

  const [draftCode, setDraftCode] = useState<string>(activeFile?.content || '');
  const [executedCode, setExecutedCode] = useState<string>(activeFile?.content || '');
  const [runCounter, setRunCounter] = useState<number>(1);
  const [sessionId, setSessionId] = useState<string>(() => `hw-${Date.now()}`);
  const [autoRun, setAutoRun] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [viewportPreset, setViewportPreset] = useState<ViewportPreset>('full');
  const [wordWrap, setWordWrap] = useState<boolean>(false);
  const [editorFontSize, setEditorFontSize] = useState<number>(13.5);
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const [lastSavedAt, setLastSavedAt] = useState<number>(activeFile?.updatedAt || Date.now());

  // Flyouts & WinUI 3 ContentDialogs
  const [isFilesMenuOpen, setIsFilesMenuOpen] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [fileDialogMode, setFileDialogMode] = useState<'create' | 'rename' | null>(null);
  const [fileDialogInput, setFileDialogInput] = useState<string>('');
  const [deleteTargetFile, setDeleteTargetFile] = useState<HtmlDocumentItem | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const filesMenuAnchorRef = useRef<HTMLDivElement | null>(null);
  const templatesAnchorRef = useRef<HTMLDivElement | null>(null);

  // Sync draftCode when switching files
  useEffect(() => {
    if (!activeFile) return;
    setDraftCode(activeFile.content);
    setExecutedCode(activeFile.content);
    setSessionId(`hw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    setRunCounter((c) => c + 1);
    setConsoleEntries([]);
    setLastSavedAt(activeFile.updatedAt);
  }, [activeFile?.id]);

  // Persist files & active ID to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch {}
  }, [files]);

  useEffect(() => {
    try {
      if (activeFile?.id) localStorage.setItem(ACTIVE_ID_KEY, activeFile.id);
    } catch {}
  }, [activeFile?.id]);

  // Listen to postMessage console bridge from preview iframe
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || data.source !== 'sparkle-html-writer' || data.sessionId !== sessionId) return;
      const entry: ConsoleEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        level: data.level || 'log',
        message: String(data.message ?? ''),
        timestamp: data.timestamp || new Date().toLocaleTimeString(),
      };
      setConsoleEntries((prev) => [...prev.slice(-199), entry]);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sessionId]);

  // Close flyouts on outside click
  useEffect(() => {
    if (!isFilesMenuOpen && !isTemplatesOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isFilesMenuOpen && filesMenuAnchorRef.current && !filesMenuAnchorRef.current.contains(target)) {
        setIsFilesMenuOpen(false);
      }
      if (isTemplatesOpen && templatesAnchorRef.current && !templatesAnchorRef.current.contains(target)) {
        setIsTemplatesOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isFilesMenuOpen, isTemplatesOpen]);

  // Close fullscreen preview on Escape
  useEffect(() => {
    if (!isFullscreenPreview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreenPreview(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreenPreview]);

  const runPreview = useCallback(
    (codeOverride?: string) => {
      const source = codeOverride !== undefined ? codeOverride : draftCode;
      setConsoleEntries([]);
      setSessionId(`hw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
      setExecutedCode(source);
      setRunCounter((c) => c + 1);
    },
    [draftCode]
  );

  // Debounced auto-save & auto-run when draftCode changes
  useEffect(() => {
    if (!activeFile) return;
    const saveTimer = setTimeout(() => {
      const now = Date.now();
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile.id && f.content !== draftCode
            ? { ...f, content: draftCode, updatedAt: now }
            : f
        )
      );
      setLastSavedAt(now);
    }, 250);

    let runTimer: ReturnType<typeof setTimeout> | undefined;
    if (autoRun) {
      runTimer = setTimeout(() => {
        runPreview(draftCode);
      }, 360);
    }

    return () => {
      clearTimeout(saveTimer);
      if (runTimer) clearTimeout(runTimer);
    };
  }, [draftCode, activeFile?.id, autoRun]);

  // Split resizer mouse drag
  useEffect(() => {
    if (!isDraggingSplit) return;
    const onMove = (e: PointerEvent) => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(24, Math.min(76, pct)));
    };
    const onUp = () => setIsDraggingSplit(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDraggingSplit]);

  const saveCurrentNow = useCallback(() => {
    if (!activeFile) return;
    const now = Date.now();
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, content: draftCode, updatedAt: now } : f))
    );
    setLastSavedAt(now);
    showAppToast(`Đã lưu ${activeFile.name}`, { appName: 'HTML Writer' });
  }, [activeFile, draftCode]);

  const updateCursorPosition = useCallback((el: HTMLTextAreaElement) => {
    const upToCursor = el.value.slice(0, el.selectionStart);
    const lines = upToCursor.split('\n');
    setCursorPos({
      line: lines.length,
      col: (lines[lines.length - 1]?.length || 0) + 1,
    });
  }, []);

  const handleEditorScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;

    // Run HTML: Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runPreview();
      return;
    }

    // Save HTML: Ctrl/Cmd + S
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveCurrentNow();
      return;
    }

    // Tab / Shift+Tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const value = el.value;

      if (start === end && !e.shiftKey) {
        const next = value.slice(0, start) + '  ' + value.slice(end);
        setDraftCode(next);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 2;
          updateCursorPosition(el);
        });
        return;
      }

      // Multi-line or Shift+Tab indent/outdent
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEndIndex = value.indexOf('\n', end);
      const blockEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
      const selectedBlock = value.slice(lineStart, blockEnd);
      const lines = selectedBlock.split('\n');

      const transformed = e.shiftKey
        ? lines.map((line) => (line.startsWith('  ') ? line.slice(2) : line.startsWith('\t') ? line.slice(1) : line))
        : lines.map((line) => '  ' + line);

      const replaced = transformed.join('\n');
      const next = value.slice(0, lineStart) + replaced + value.slice(blockEnd);
      setDraftCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = lineStart;
        el.selectionEnd = lineStart + replaced.length;
        updateCursorPosition(el);
      });
    }
  };

  const insertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setDraftCode((prev) => (prev ? `${prev}\n${snippet}` : snippet));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = el.value.slice(0, start) + snippet + el.value.slice(end);
    setDraftCode(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
      updateCursorPosition(el);
    });
  };

  const handleFormatCode = () => {
    const formatted = formatHtmlCode(draftCode);
    setDraftCode(formatted);
    showAppToast('Đã định dạng mã HTML', { appName: 'HTML Writer' });
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(draftCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
      showAppToast('Đã sao chép mã HTML vào Clipboard', { appName: 'HTML Writer' });
    } catch {}
  };

  const handleDownloadHtml = () => {
    if (!activeFile) return;
    const filename = activeFile.name.toLowerCase().endsWith('.html') || activeFile.name.toLowerCase().endsWith('.htm')
      ? activeFile.name
      : `${activeFile.name}.html`;
    const blob = new Blob([draftCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showAppToast(`Đã tải xuống ${filename}`, { appName: 'HTML Writer' });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const newDoc: HtmlDocumentItem = {
        id: `doc-${Date.now()}`,
        name: file.name || 'imported.html',
        content: text,
        updatedAt: Date.now(),
      };
      setFiles((prev) => [newDoc, ...prev]);
      setActiveFileId(newDoc.id);
      showAppToast(`Đã nhập tệp ${newDoc.name}`, { appName: 'HTML Writer' });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyTemplate = (tpl: HtmlTemplate) => {
    setIsTemplatesOpen(false);
    setDraftCode(tpl.content);
    runPreview(tpl.content);
    showAppToast(`Đã nạp mẫu "${tpl.name}"`, { appName: 'HTML Writer' });
  };

  const handleConfirmFileDialog = () => {
    const trimmed = fileDialogInput.trim();
    if (!trimmed) return;
    const normalizedName = /\.(html|htm)$/i.test(trimmed) ? trimmed : `${trimmed}.html`;

    if (fileDialogMode === 'create') {
      const newDoc: HtmlDocumentItem = {
        id: `doc-${Date.now()}`,
        name: normalizedName,
        content: HTML_TEMPLATES[4].content.replace('Untitled Page', normalizedName.replace(/\.(html|htm)$/i, '')),
        updatedAt: Date.now(),
      };
      setFiles((prev) => [newDoc, ...prev]);
      setActiveFileId(newDoc.id);
      setIsFilesMenuOpen(false);
      showAppToast(`Đã tạo ${normalizedName}`, { appName: 'HTML Writer' });
    } else if (fileDialogMode === 'rename' && activeFile) {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFile.id ? { ...f, name: normalizedName, updatedAt: Date.now() } : f))
      );
      showAppToast(`Đã đổi tên thành ${normalizedName}`, { appName: 'HTML Writer' });
    }
    setFileDialogMode(null);
    setFileDialogInput('');
  };

  const handleDuplicateActiveFile = () => {
    if (!activeFile) return;
    const baseName = activeFile.name.replace(/\.(html|htm)$/i, '');
    const newDoc: HtmlDocumentItem = {
      id: `doc-${Date.now()}`,
      name: `${baseName}-copy.html`,
      content: draftCode,
      updatedAt: Date.now(),
    };
    setFiles((prev) => [newDoc, ...prev]);
    setActiveFileId(newDoc.id);
    setIsFilesMenuOpen(false);
    showAppToast(`Đã nhân bản thành ${newDoc.name}`, { appName: 'HTML Writer' });
  };

  const handleConfirmDeleteFile = () => {
    if (!deleteTargetFile) return;
    const remaining = files.filter((f) => f.id !== deleteTargetFile.id);
    if (remaining.length === 0) {
      const resetDoc: HtmlDocumentItem = {
        id: `doc-${Date.now()}`,
        name: 'index.html',
        content: HTML_TEMPLATES[0].content,
        updatedAt: Date.now(),
      };
      setFiles([resetDoc]);
      setActiveFileId(resetDoc.id);
    } else {
      setFiles(remaining);
      if (activeFile?.id === deleteTargetFile.id) {
        setActiveFileId(remaining[0].id);
      }
    }
    showAppToast(`Đã xóa ${deleteTargetFile.name}`, { appName: 'HTML Writer' });
    setDeleteTargetFile(null);
  };

  const lineCount = useMemo(() => Math.max(1, draftCode.split('\n').length), [draftCode]);
  const lineNumbers = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);
  const byteSize = useMemo(() => new Blob([draftCode]).size, [draftCode]);
  const compiledSrcDoc = useMemo(() => buildSandboxedSrcDoc(executedCode, sessionId), [executedCode, sessionId]);
  const pageTitle = useMemo(() => extractHtmlTitle(executedCode, activeFile?.name || 'Preview'), [executedCode, activeFile?.name]);
  const errorCount = useMemo(() => consoleEntries.filter((c) => c.level === 'error').length, [consoleEntries]);

  const effectiveViewMode: ViewMode = isMobile && viewMode === 'split' ? 'code' : viewMode;
  const showCodePane = effectiveViewMode === 'split' || effectiveViewMode === 'code';
  const showPreviewPane = effectiveViewMode === 'split' || effectiveViewMode === 'preview';

  const viewportWidthClass =
    viewportPreset === 'mobile'
      ? 'w-[375px] max-w-full shadow-xl border border-black/15 dark:border-white/15 rounded-[10px]'
      : viewportPreset === 'tablet'
      ? 'w-[768px] max-w-full shadow-xl border border-black/15 dark:border-white/15 rounded-[10px]'
      : viewportPreset === 'desktop'
      ? 'w-[1280px] max-w-full shadow-xl border border-black/15 dark:border-white/15 rounded-[10px]'
      : 'w-full h-full';

  return (
    <div
      id="html-writer-page"
      className="w-full h-full flex flex-col overflow-hidden bg-transparent text-[#1b1b1b] dark:text-[#f3f3f3] select-none"
    >
      {/* Hidden file importer */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.txt"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* WinUI 3 Top CommandBar */}
      <header className="shrink-0 px-3 py-2 bg-white/75 dark:bg-[#272b32]/80 backdrop-blur-xl border-b border-black/[0.08] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 z-20">
        {/* Left: App Title + Document Selector */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 pr-1">
            <Fluent3DHtmlWriterIcon className="w-6 h-6 shrink-0" />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#111827] dark:text-white">
                HTML Writer
              </span>
              <span className="text-[10.5px] text-[#6b7280] dark:text-[#9ca3af]">
                WinUI 3 Web Studio
              </span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-black/[0.08] dark:bg-white/[0.1] hidden sm:block" />

          {/* Document Selector Flyout */}
          <div ref={filesMenuAnchorRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsFilesMenuOpen((v) => !v);
                setIsTemplatesOpen(false);
              }}
              className="h-[32px] px-2.5 rounded-[6px] bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] border border-black/[0.08] dark:border-white/[0.09] flex items-center gap-2 text-[12.5px] font-medium transition-colors cursor-pointer max-w-[190px]"
              title="Chọn hoặc quản lý tệp HTML"
            >
              <Code2 className="w-3.5 h-3.5 shrink-0 text-[#0067b8] dark:text-[#4cc2ff]" />
              <span className="truncate">{activeFile?.name || 'index.html'}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
            </button>

            <AnimatePresence>
              {isFilesMenuOpen && (
                <motion.div
                  {...contextMenuMotionProps}
                  style={flyoutPanelStyle}
                  className={`${flyoutPanelClassName} absolute left-0 top-[calc(100%+6px)] w-64 p-1.5 z-50`}
                >
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af] flex items-center justify-between">
                    <span>Tệp đã lưu ({files.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFilesMenuOpen(false);
                        setFileDialogInput(`page-${files.length + 1}.html`);
                        setFileDialogMode('create');
                      }}
                      className="text-[11px] font-semibold text-[#0067b8] dark:text-[#4cc2ff] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <FilePlus2 className="w-3 h-3" /> Mới
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5 my-1">
                    {files.map((file) => {
                      const isCurrent = file.id === activeFile?.id;
                      return (
                        <div
                          key={file.id}
                          className={`group flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-[5px] text-[12.5px] cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-[#0067b8]/12 dark:bg-[#4cc2ff]/15 text-[#0067b8] dark:text-[#4cc2ff] font-medium'
                              : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.07]'
                          }`}
                          onClick={() => {
                            setActiveFileId(file.id);
                            setIsFilesMenuOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Code2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFileId(file.id);
                                setFileDialogInput(file.name);
                                setFileDialogMode('rename');
                                setIsFilesMenuOpen(false);
                              }}
                              title="Đổi tên"
                              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetFile(file);
                                setIsFilesMenuOpen(false);
                              }}
                              title="Xóa tệp"
                              className="p-1 rounded hover:bg-rose-500/15 text-rose-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-black/[0.08] dark:border-white/[0.08] pt-1 mt-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeFile) return;
                        setFileDialogInput(activeFile.name);
                        setFileDialogMode('rename');
                        setIsFilesMenuOpen(false);
                      }}
                      className="w-full px-2 py-1.5 rounded-[5px] text-[12.5px] flex items-center gap-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Đổi tên tệp hiện tại
                    </button>
                    <button
                      type="button"
                      onClick={handleDuplicateActiveFile}
                      className="w-full px-2 py-1.5 rounded-[5px] text-[12.5px] flex items-center gap-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] cursor-pointer"
                    >
                      <Files className="w-3.5 h-3.5" /> Nhân bản tệp
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CommandBar File & Template Actions */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setFileDialogInput(`page-${files.length + 1}.html`);
                setFileDialogMode('create');
              }}
              className="h-[32px] px-2.5 rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center gap-1.5 text-[12.5px] transition-colors cursor-pointer"
              title="Tạo tệp HTML mới"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Tạo mới</span>
            </button>

            <div ref={templatesAnchorRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsTemplatesOpen((v) => !v);
                  setIsFilesMenuOpen(false);
                }}
                className="h-[32px] px-2.5 rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center gap-1.5 text-[12.5px] transition-colors cursor-pointer"
                title="Chọn mẫu HTML có sẵn"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Mẫu</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              <AnimatePresence>
                {isTemplatesOpen && (
                  <motion.div
                    {...contextMenuMotionProps}
                    style={flyoutPanelStyle}
                    className={`${flyoutPanelClassName} absolute left-0 top-[calc(100%+6px)] w-72 p-1.5 z-50`}
                  >
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">
                      Mẫu HTML5 WinUI 3
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {HTML_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className="w-full text-left px-2.5 py-2 rounded-[5px] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] transition-colors cursor-pointer"
                        >
                          <div className="text-[12.5px] font-medium text-[#111827] dark:text-white">{tpl.name}</div>
                          <div className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] leading-snug mt-0.5">
                            {tpl.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-[32px] px-2.5 rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center gap-1.5 text-[12.5px] transition-colors cursor-pointer"
              title="Nhập tệp .html từ máy tính"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Mở</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="h-[32px] px-2.5 rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center gap-1.5 text-[12.5px] transition-colors cursor-pointer"
              title="Xuất và tải xuống tệp .html"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất</span>
            </button>

            <button
              type="button"
              onClick={handleFormatCode}
              className="h-[32px] px-2.5 rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center gap-1.5 text-[12.5px] transition-colors cursor-pointer"
              title="Tự động căn lề mã HTML"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Định dạng</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="h-[32px] px-2.5 rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center gap-1.5 text-[12.5px] transition-colors cursor-pointer"
              title="Sao chép toàn bộ mã HTML"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Đã chép' : 'Chép'}</span>
            </button>
          </div>
        </div>

        {/* Right: View Mode Segmented Control + Auto-Run Switch + Run Button */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Compact actions on smaller widths */}
          <div className="flex lg:hidden items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-center cursor-pointer"
              title="Mở tệp .html"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="w-8 h-8 rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-center cursor-pointer"
              title="Tải xuống .html"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFormatCode}
              className="w-8 h-8 rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-center cursor-pointer"
              title="Định dạng HTML"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* WinUI 3 View Mode Segmented Selector */}
          <div className="h-[32px] p-0.5 rounded-[7px] bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.07] dark:border-white/[0.08] flex items-center gap-0.5">
            {!isMobile && (
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`h-[26px] px-2.5 rounded-[5px] text-[12px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  effectiveViewMode === 'split'
                    ? 'bg-white dark:bg-[#383c44] shadow-xs text-[#111827] dark:text-white'
                    : 'text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white'
                }`}
                title="Chia đôi Code & Preview"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Split</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`h-[26px] px-2.5 rounded-[5px] text-[12px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                effectiveViewMode === 'code'
                  ? 'bg-white dark:bg-[#383c44] shadow-xs text-[#111827] dark:text-white'
                  : 'text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white'
              }`}
              title="Chỉ xem trình soạn thảo Code"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`h-[26px] px-2.5 rounded-[5px] text-[12px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                effectiveViewMode === 'preview'
                  ? 'bg-white dark:bg-[#383c44] shadow-xs text-[#111827] dark:text-white'
                  : 'text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white'
              }`}
              title="Chỉ xem kết quả chạy"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          {/* WinUI 3 Auto-Run Toggle Switch */}
          <div className="hidden sm:flex items-center gap-2 px-1.5">
            <span className="text-[12px] font-medium text-[#374151] dark:text-[#d1d5db]">Auto-Run</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoRun}
              aria-label="Toggle Auto-Run"
              onClick={() => setAutoRun((v) => !v)}
              className={`relative w-[38px] h-[20px] rounded-full transition-colors cursor-pointer shrink-0 border ${
                autoRun
                  ? 'bg-[#0067b8] dark:bg-[#4cc2ff] border-transparent'
                  : 'bg-black/[0.08] dark:bg-white/[0.1] border-black/25 dark:border-white/30'
              }`}
            >
              <span
                className={`block w-[12px] h-[12px] rounded-full transition-transform duration-150 ${
                  autoRun
                    ? 'translate-x-[21px] bg-white dark:bg-[#111827]'
                    : 'translate-x-[3px] bg-[#4b5563] dark:bg-[#d1d5db]'
                }`}
              />
            </button>
          </div>

          {/* Primary WinUI 3 Run Button */}
          <button
            type="button"
            id="html-writer-run-btn"
            onClick={() => {
              runPreview();
              if (isMobile && effectiveViewMode === 'code') {
                setViewMode('preview');
              }
            }}
            className="fluent-btn-primary h-[32px] px-3.5 rounded-[6px] text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Chạy mã HTML ngay (Ctrl + Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
        </div>
      </header>

      {/* Main Split Workspace */}
      <div
        ref={workspaceRef}
        className="flex-1 min-h-0 flex flex-row overflow-hidden p-2 gap-0"
      >
        {/* Left Pane: WinUI 3 Code Editor */}
        {showCodePane && (
          <section
            style={
              effectiveViewMode === 'split'
                ? { width: `${splitPercent}%` }
                : { width: '100%' }
            }
            className="h-full min-w-0 flex flex-col rounded-[8px] bg-white/85 dark:bg-[#22252b]/85 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.08] shadow-xs overflow-hidden"
          >
            {/* Editor Sub-Toolbar & Snippets */}
            <div className="shrink-0 h-[36px] px-2.5 border-b border-black/[0.07] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.025] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af] mr-1">
                  Snippets:
                </span>
                {QUICK_SNIPPETS.map((sn) => (
                  <button
                    key={sn.label}
                    type="button"
                    onClick={() => insertSnippet(sn.code)}
                    className="h-[22px] px-2 rounded-[4px] bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#0067b8]/12 dark:hover:bg-[#4cc2ff]/18 border border-black/[0.06] dark:border-white/[0.08] text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    {sn.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setWordWrap((v) => !v)}
                  className={`h-[24px] px-2 rounded-[4px] flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${
                    wordWrap
                      ? 'bg-[#0067b8]/15 dark:bg-[#4cc2ff]/20 text-[#0067b8] dark:text-[#4cc2ff] font-semibold'
                      : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-[#6b7280] dark:text-[#9ca3af]'
                  }`}
                  title="Bật/tắt xuống dòng tự động (Word Wrap)"
                >
                  <WrapText className="w-3 h-3" />
                  <span className="hidden md:inline">Wrap</span>
                </button>
                <div className="flex items-center rounded-[4px] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setEditorFontSize((s) => Math.max(11, s - 1))}
                    className="w-6 h-[22px] flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer"
                    title="Giảm cỡ chữ"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-1.5 text-[11px] tabular-nums">{Math.round(editorFontSize)}</span>
                  <button
                    type="button"
                    onClick={() => setEditorFontSize((s) => Math.min(20, s + 1))}
                    className="w-6 h-[22px] flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer"
                    title="Tăng cỡ chữ"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Code Gutter + Monospace Textarea */}
            <div className="flex-1 min-h-0 flex overflow-hidden relative">
              <div
                ref={gutterRef}
                aria-hidden="true"
                style={{ fontSize: `${editorFontSize}px`, lineHeight: 1.6 }}
                className="w-11 shrink-0 py-3 pr-2 text-right font-mono text-[#9ca3af] dark:text-[#6b7280] bg-black/[0.02] dark:bg-black/20 border-r border-black/[0.06] dark:border-white/[0.06] overflow-hidden select-none"
              >
                {lineNumbers.map((num) => (
                  <div key={num} className={num === cursorPos.line ? 'text-[#0067b8] dark:text-[#4cc2ff] font-semibold' : ''}>
                    {num}
                  </div>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                value={draftCode}
                onChange={(e) => {
                  setDraftCode(e.target.value);
                  updateCursorPosition(e.target);
                }}
                onKeyDown={handleEditorKeyDown}
                onScroll={handleEditorScroll}
                onClick={(e) => updateCursorPosition(e.currentTarget)}
                onKeyUp={(e) => updateCursorPosition(e.currentTarget)}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                aria-label="Trình soạn thảo mã HTML"
                style={{ fontSize: `${editorFontSize}px`, lineHeight: 1.6 }}
                className={`flex-1 min-w-0 h-full p-3 font-mono bg-transparent text-[#111827] dark:text-[#eef2f7] outline-none resize-none select-text ${
                  wordWrap ? 'whitespace-pre-wrap break-words overflow-x-hidden' : 'whitespace-pre overflow-x-auto'
                }`}
                placeholder="Nhập mã HTML / CSS / JavaScript tại đây..."
              />
            </div>
          </section>
        )}

        {/* Resizable WinUI 3 Splitter Handle */}
        {effectiveViewMode === 'split' && (
          <div
            role="separator"
            aria-orientation="vertical"
            title="Kéo để thay đổi kích thước (nhấp đúp để cân bằng 50/50)"
            onPointerDown={() => setIsDraggingSplit(true)}
            onDoubleClick={() => setSplitPercent(50)}
            className="w-2 shrink-0 h-full flex items-center justify-center cursor-col-resize group"
          >
            <div
              className={`w-[3px] h-10 rounded-full transition-colors ${
                isDraggingSplit
                  ? 'bg-[#0067b8] dark:bg-[#4cc2ff]'
                  : 'bg-black/15 dark:bg-white/15 group-hover:bg-[#0067b8] dark:group-hover:bg-[#4cc2ff]'
              }`}
            />
          </div>
        )}

        {/* Right Pane: WinUI 3 Live Preview + Console */}
        {showPreviewPane && (
          <section
            style={
              effectiveViewMode === 'split'
                ? { width: `calc(${100 - splitPercent}% - 8px)` }
                : { width: '100%' }
            }
            className="h-full min-w-0 flex flex-col rounded-[8px] bg-white/85 dark:bg-[#22252b]/85 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.08] shadow-xs overflow-hidden"
          >
            {/* Preview Browser-Style Toolbar */}
            <div className="shrink-0 h-[36px] px-2.5 border-b border-black/[0.07] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.025] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => runPreview()}
                  className="w-6 h-6 rounded-[5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.09] flex items-center justify-center cursor-pointer shrink-0"
                  title="Tải lại bản xem trước"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 min-w-0 h-[24px] px-2.5 rounded-[5px] bg-black/[0.04] dark:bg-black/25 border border-black/[0.06] dark:border-white/[0.07] flex items-center gap-1.5 text-[11.5px] text-[#4b5563] dark:text-[#cbd5e1] truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate font-medium">{pageTitle}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Viewport Width Presets */}
                <div className="hidden md:flex items-center rounded-[5px] bg-black/[0.04] dark:bg-white/[0.05] p-0.5 border border-black/[0.06] dark:border-white/[0.07]">
                  {(
                    [
                      { id: 'full', label: 'Full', icon: Maximize2 },
                      { id: 'desktop', label: 'Desktop', icon: Monitor },
                      { id: 'tablet', label: 'Tablet', icon: Tablet },
                      { id: 'mobile', label: 'Mobile', icon: Smartphone },
                    ] as const
                  ).map((vp) => {
                    const Icon = vp.icon;
                    const active = viewportPreset === vp.id;
                    return (
                      <button
                        key={vp.id}
                        type="button"
                        onClick={() => setViewportPreset(vp.id)}
                        title={`Khung ${vp.label}`}
                        className={`w-6 h-[20px] rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
                          active
                            ? 'bg-white dark:bg-[#383c44] shadow-2xs text-[#0067b8] dark:text-[#4cc2ff]'
                            : 'text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                      </button>
                    );
                  })}
                </div>

                {/* Console Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => setIsConsoleOpen((v) => !v)}
                  className={`h-[24px] px-2 rounded-[5px] flex items-center gap-1.5 text-[11.5px] font-medium transition-colors cursor-pointer ${
                    isConsoleOpen
                      ? 'bg-[#0067b8]/15 dark:bg-[#4cc2ff]/20 text-[#0067b8] dark:text-[#4cc2ff]'
                      : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                  }`}
                  title="Mở/đóng Console đầu ra JS"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Console</span>
                  {consoleEntries.length > 0 && (
                    <span
                      className={`px-1.5 py-0 rounded-full text-[10px] font-semibold ${
                        errorCount > 0
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/10 dark:bg-white/15'
                      }`}
                    >
                      {consoleEntries.length}
                    </span>
                  )}
                </button>

                {/* Fullscreen Preview Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFullscreenPreview(true)}
                  className="w-6 h-[24px] rounded-[5px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-center cursor-pointer"
                  title="Phóng to toàn màn hình"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sandboxed Live HTML Output Area */}
            <div
              className={`flex-1 min-h-0 flex justify-center overflow-auto bg-[#e5e7eb]/50 dark:bg-[#16181d]/70 ${
                viewportPreset === 'full' ? 'p-0' : 'p-4'
              }`}
            >
              <iframe
                key={runCounter}
                title={`HTML Preview - ${activeFile?.name || 'document'}`}
                sandbox="allow-scripts allow-forms allow-modals"
                srcDoc={compiledSrcDoc}
                className={`bg-white ${viewportWidthClass} ${
                  viewportPreset === 'full' ? 'h-full' : 'h-full min-h-[360px]'
                } border-0 ${isDraggingSplit ? 'pointer-events-none' : ''}`}
              />
            </div>

            {/* Collapsible WinUI 3 Console Drawer */}
            <AnimatePresence initial={false}>
              {isConsoleOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 156, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="shrink-0 border-t border-black/[0.08] dark:border-white/[0.08] bg-[#f8f9fa]/95 dark:bg-[#1a1d22]/95 flex flex-col overflow-hidden"
                >
                  <div className="h-[28px] px-2.5 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px] font-semibold text-[#6b7280] dark:text-[#9ca3af]">
                    <span>CONSOLE ({consoleEntries.length})</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConsoleEntries([])}
                        className="hover:text-[#111827] dark:hover:text-white cursor-pointer"
                      >
                        Xóa log
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConsoleOpen(false)}
                        className="hover:text-[#111827] dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[11.5px] select-text">
                    {consoleEntries.length === 0 ? (
                      <div className="text-[#9ca3af] dark:text-[#6b7280] italic px-1 py-2">
                        Chưa có log hoặc lỗi JavaScript nào từ bản xem trước.
                      </div>
                    ) : (
                      consoleEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`px-2 py-1 rounded-[4px] flex items-start gap-2 ${
                            entry.level === 'error'
                              ? 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                              : entry.level === 'warn'
                              ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
                              : entry.level === 'info'
                              ? 'bg-[#0067b8]/10 dark:bg-[#4cc2ff]/12 text-[#0067b8] dark:text-[#4cc2ff]'
                              : 'bg-black/[0.03] dark:bg-white/[0.04]'
                          }`}
                        >
                          {entry.level === 'error' ? (
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          ) : entry.level === 'warn' ? (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />
                          )}
                          <span className="flex-1 break-all whitespace-pre-wrap">{entry.message}</span>
                          <span className="text-[10px] opacity-60 shrink-0">{entry.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}
      </div>

      {/* WinUI 3 Status Bar */}
      <footer className="shrink-0 h-[28px] px-3 bg-white/70 dark:bg-[#22252b]/80 backdrop-blur-xl border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-[#525866] dark:text-[#9ca3af]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Đã lưu {new Date(lastSavedAt).toLocaleTimeString()}</span>
          </span>
          <span className="hidden sm:inline opacity-50">|</span>
          <span className="hidden sm:inline truncate">{activeFile?.name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 tabular-nums">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="hidden sm:inline">{lineCount} dòng</span>
          <span>{byteSize.toLocaleString()} bytes</span>
          <span className="hidden md:inline font-medium text-[#0067b8] dark:text-[#4cc2ff]">HTML5</span>
        </div>
      </footer>

      {/* Fullscreen Preview Overlay Modal (in-DOM, no window.open) */}
      {isFullscreenPreview &&
        createPortal(
          <div className="fixed inset-0 z-[9990] bg-[#16181d] flex flex-col">
            <div className="h-[42px] px-3 bg-[#22252b] text-white border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Fluent3DHtmlWriterIcon className="w-5 h-5 shrink-0" />
                <span className="text-[13px] font-medium truncate">{pageTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => runPreview()}
                  className="h-[28px] px-2.5 rounded-[5px] bg-white/10 hover:bg-white/15 text-[12px] flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Tải lại
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreenPreview(false)}
                  className="h-[28px] px-2.5 rounded-[5px] bg-white/10 hover:bg-[#c42b1c] text-[12px] flex items-center gap-1.5 cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" /> Thu nhỏ (Esc)
                </button>
              </div>
            </div>
            <iframe
              key={`fs-${runCounter}`}
              title={`Fullscreen HTML Preview - ${activeFile?.name}`}
              sandbox="allow-scripts allow-forms allow-modals"
              srcDoc={compiledSrcDoc}
              className="flex-1 w-full h-full bg-white border-0"
            />
          </div>,
          document.body
        )}

      {/* WinUI 3 ContentDialog: Create / Rename File */}
      {createPortal(
        <AnimatePresence>
          {fileDialogMode && (
            <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
              <motion.div
                variants={modalBackdropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={() => setFileDialogMode(null)}
                className="fixed inset-0 bg-black/45 backdrop-blur-xs"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                variants={modalDialogVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="fluent-modal-dialog relative w-full max-w-md rounded-[10px] bg-white dark:bg-[#2b2f36] border border-black/10 dark:border-white/12 shadow-2xl overflow-hidden"
              >
                <div className="p-5">
                  <h3 className="text-[17px] font-semibold text-[#111827] dark:text-white">
                    {fileDialogMode === 'create' ? 'Tạo tệp HTML mới' : 'Đổi tên tệp HTML'}
                  </h3>
                  <p className="text-[12.5px] text-[#6b7280] dark:text-[#9ca3af] mt-1">
                    Nhập tên tệp (ví dụ: portfolio.html). Đuôi .html sẽ tự động được bổ sung nếu thiếu.
                  </p>
                  <input
                    type="text"
                    autoFocus
                    value={fileDialogInput}
                    onChange={(e) => setFileDialogInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmFileDialog();
                      if (e.key === 'Escape') setFileDialogMode(null);
                    }}
                    className="mt-3 w-full h-[36px] px-3 rounded-[6px] bg-black/[0.04] dark:bg-black/25 border border-black/15 dark:border-white/15 focus:border-[#0067b8] dark:focus:border-[#4cc2ff] outline-none text-[13.5px] text-[#111827] dark:text-white"
                    placeholder="index.html"
                  />
                </div>
                <div className="fluent-modal-footer px-5 py-3.5 bg-black/[0.03] dark:bg-black/20 border-t border-black/[0.08] dark:border-white/[0.08] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setFileDialogMode(null)}
                    className="h-[32px] px-4 rounded-[6px] border border-black/15 dark:border-white/15 bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] text-[13px] font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmFileDialog}
                    className="fluent-btn-primary h-[32px] px-4 rounded-[6px] text-[13px] font-semibold cursor-pointer"
                  >
                    {fileDialogMode === 'create' ? 'Tạo tệp' : 'Lưu tên'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* WinUI 3 ContentDialog: Confirm Delete */}
      {createPortal(
        <AnimatePresence>
          {deleteTargetFile && (
            <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
              <motion.div
                variants={modalBackdropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={() => setDeleteTargetFile(null)}
                className="fixed inset-0 bg-black/45 backdrop-blur-xs"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                variants={modalDialogVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="fluent-modal-dialog relative w-full max-w-md rounded-[10px] bg-white dark:bg-[#2b2f36] border border-black/10 dark:border-white/12 shadow-2xl overflow-hidden"
              >
                <div className="p-5">
                  <h3 className="text-[17px] font-semibold text-[#111827] dark:text-white">
                    Xóa tệp HTML?
                  </h3>
                  <p className="text-[13px] text-[#6b7280] dark:text-[#9ca3af] mt-1.5">
                    Bạn có chắc chắn muốn xóa tệp <strong>{deleteTargetFile.name}</strong> khỏi bộ nhớ cục bộ không?
                  </p>
                </div>
                <div className="fluent-modal-footer px-5 py-3.5 bg-black/[0.03] dark:bg-black/20 border-t border-black/[0.08] dark:border-white/[0.08] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetFile(null)}
                    className="h-[32px] px-4 rounded-[6px] border border-black/15 dark:border-white/15 bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] text-[13px] font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteFile}
                    className="h-[32px] px-4 rounded-[6px] bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
