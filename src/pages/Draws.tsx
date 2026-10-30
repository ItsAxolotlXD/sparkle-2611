import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pencil, 
  Paintbrush, 
  PenTool, 
  Highlighter, 
  Eraser, 
  PaintBucket, 
  Pipette, 
  Type, 
  Slash, 
  Square, 
  Circle, 
  Triangle, 
  Star, 
  Heart, 
  ArrowRight, 
  Undo2, 
  Redo2, 
  Save, 
  ChevronDown, 
  Download, 
  Image as ImageIcon, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Grid,
  Maximize2,
  Minimize2,
  Plus
} from 'lucide-react';
import { galleryDB, GalleryMediaItem } from '../services/galleryStorage';
import { CanvasContextMenu, type CanvasContextAction } from '../components/CanvasContextMenu';
import { FluentDeleteIcon } from '../components/FluentIcons';
import { PromptDialog } from '../components/gallery/GalleryDialogs';

interface DrawsProps {
  navigate: (route: string) => void;
}

type DrawTool = 
  | 'pencil' 
  | 'brush' 
  | 'calligraphy' 
  | 'highlighter' 
  | 'eraser' 
  | 'bucket' 
  | 'picker' 
  | 'text'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'roundedRect'
  | 'ellipse'
  | 'triangle'
  | 'star'
  | 'heart';

const PRESET_COLORS = [
  '#000000', '#ffffff', '#7f7f7f', '#c3c3c3',
  '#880015', '#b97a57', '#ed1c24', '#ffaec9',
  '#ff7f27', '#ffc90e', '#fff200', '#efe4b0',
  '#22b14c', '#b5e61d', '#00a2e8', '#99d9ea',
  '#3f48cc', '#7092be', '#a349a4', '#c8bfe7',
  '#4cc2ff', '#005fb8', '#107c41', '#e81123'
];

const PRESET_SIZES = [1, 2, 4, 8, 12, 16, 24, 32];

// Staggered slide up variant for cascading entrance animation from top to bottom
const slideUpVariant = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.52,
      ease: [0.16, 1, 0.3, 1],
      delay: Math.min(i * 0.046, 1.1),
    },
  }),
};

export const Draws: React.FC<DrawsProps> = ({ navigate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tool states
  const [activeTool, setActiveTool] = useState<DrawTool>('brush');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [color1, setColor1] = useState<string>('#000000'); // Foreground
  const [color2, setColor2] = useState<string>('#ffffff'); // Background
  const [activeColorSlot, setActiveColorSlot] = useState<1 | 2>(1);
  const [opacity, setOpacity] = useState<number>(1);
  const [fillShape, setFillShape] = useState<boolean>(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [isTypingText, setIsTypingText] = useState<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasSpaceHeight, setCanvasSpaceHeight] = useState(2200);
  const [canvasSpaceWidth, setCanvasSpaceWidth] = useState(1200);
  const [showExpansionActions, setShowExpansionActions] = useState(true);
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(() => {
    const id = window.location.pathname.split('/').pop();
    return id && id !== 'draws' ? id : null;
  });
  const [canvasList, setCanvasList] = useState(() => [
    { id: 'new-canvas', title: 'Untitled canvas', updated: 'Just now', color: '#4cc2ff' },
    { id: 'brainstorm', title: 'Brainstorming board', updated: 'Yesterday', color: '#f59e0b' },
    { id: 'moodboard', title: 'Moodboard', updated: 'Oct 12, 2026', color: '#ec4899' },
  ]);
  const [toastMessage, setToastMessage] = useState<{ text: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number; y: number; canvasId: string } | null>(null);
  const [canvasTilt, setCanvasTilt] = useState<Record<string, { x: number; y: number }>>({});
  const [isCreateCanvasOpen, setIsCreateCanvasOpen] = useState(false);
  const [canvasToRename, setCanvasToRename] = useState<{ id: string; title: string } | null>(null);

  const handleCreateCanvas = (canvasTitle: string) => {
    setIsCreateCanvasOpen(false);
    const title = canvasTitle.trim() || 'Untitled canvas';
    const id = `canvas-${Date.now()}`;
    setCanvasList((items) => [{ id, title, updated: 'Just now', color: '#4cc2ff' }, ...items]);
    setSelectedCanvasId(id);
    navigate(`/draws/${id}`);
  };

  const handleConfirmRenameCanvas = (newTitle: string) => {
    if (!canvasToRename) return;
    const title = newTitle.trim() || canvasToRename.title;
    setCanvasList((items) => items.map((c) => c.id === canvasToRename.id ? { ...c, title } : c));
    setCanvasToRename(null);
    showToast('Canvas renamed');
  };

  // Undo / Redo history
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const showToast = (text: string, actionLabel?: string, onAction?: () => void) => {
    setToastMessage({ text, actionLabel, onAction });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Canvas Dimensions
  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1080;

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Fill white canvas initially
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Save initial state to undo stack
    const initialData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    undoStackRef.current = [initialData];

    // Preview canvas
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      previewCanvas.width = CANVAS_WIDTH;
      previewCanvas.height = CANVAS_HEIGHT;
    }
  }, []);

  const saveStateToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    undoStackRef.current.push(data);
    if (undoStackRef.current.length > 30) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
  };

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const current = undoStackRef.current.pop();
    if (current) redoStackRef.current.push(current);

    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    if (prev) {
      ctx.putImageData(prev, 0, 0);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const next = redoStackRef.current.pop();
    if (next) {
      undoStackRef.current.push(next);
      ctx.putImageData(next, 0, 0);
    }
  }, []);

  // Keyboard Shortcuts: Ctrl+Z for Undo, Ctrl+D for Redo (prevent browser default bookmark)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          e.preventDefault();
          e.stopPropagation();
          handleUndo();
        } else if (key === 'd' || key === 'y') {
          e.preventDefault();
          e.stopPropagation();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleUndo, handleRedo]);

  const handleClearCanvas = () => {
    if (!window.confirm('Clear the whole canvas?')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    saveStateToHistory();
    showToast('Canvas cleared');
  };

  // Convert client pointer coordinate to canvas coordinate
  const getCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Flood Fill algorithm for bucket tool
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imgData.data;

    const startXInt = Math.floor(startX);
    const startYInt = Math.floor(startY);
    if (startXInt < 0 || startXInt >= CANVAS_WIDTH || startYInt < 0 || startYInt >= CANVAS_HEIGHT) return;

    const startIndex = (startYInt * CANVAS_WIDTH + startXInt) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    // Helper to parse hex to rgba
    const tempEl = document.createElement('div');
    tempEl.style.color = fillColor;
    document.body.appendChild(tempEl);
    const rgbStr = window.getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    const match = rgbStr.match(/\d+/g);
    if (!match) return;
    const fillR = parseInt(match[0], 10);
    const fillG = parseInt(match[1], 10);
    const fillB = parseInt(match[2], 10);
    const fillA = 255;

    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) return;

    const matchTarget = (idx: number) => {
      return (
        Math.abs(data[idx] - targetR) < 25 &&
        Math.abs(data[idx + 1] - targetG) < 25 &&
        Math.abs(data[idx + 2] - targetB) < 25 &&
        Math.abs(data[idx + 3] - targetA) < 25
      );
    };

    const pixelStack: [number, number][] = [[startXInt, startYInt]];

    while (pixelStack.length > 0) {
      const [x, y] = pixelStack.pop()!;
      let currentY = y;
      let idx = (currentY * CANVAS_WIDTH + x) * 4;

      while (currentY >= 0 && matchTarget(idx)) {
        currentY--;
        idx -= CANVAS_WIDTH * 4;
      }
      idx += CANVAS_WIDTH * 4;
      currentY++;

      let reachLeft = false;
      let reachRight = false;

      while (currentY < CANVAS_HEIGHT && matchTarget(idx)) {
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = fillA;

        if (x > 0) {
          if (matchTarget(idx - 4)) {
            if (!reachLeft) {
              pixelStack.push([x - 1, currentY]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (x < CANVAS_WIDTH - 1) {
          if (matchTarget(idx + 4)) {
            if (!reachRight) {
              pixelStack.push([x + 1, currentY]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        currentY++;
        idx += CANVAS_WIDTH * 4;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveStateToHistory();
  };

  // Eyedropper tool
  const pickColor = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    if (activeColorSlot === 1) setColor1(hex);
    else setColor2(hex);
    setActiveTool('brush');
    showToast(`Picked color: ${hex}`);
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    startPosRef.current = pos;
    isDrawingRef.current = true;

    if (activeTool === 'bucket') {
      floodFill(pos.x, pos.y, color1);
      isDrawingRef.current = false;
      return;
    }

    if (activeTool === 'picker') {
      pickColor(pos.x, pos.y);
      isDrawingRef.current = false;
      return;
    }

    if (activeTool === 'text') {
      setIsTypingText(pos);
      isDrawingRef.current = false;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  // Draw Shape Preview or Final
  const drawShapeOnContext = (
    ctx: CanvasRenderingContext2D,
    tool: DrawTool,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    ctx.strokeStyle = color1;
    ctx.fillStyle = fillShape ? color2 : color1;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = opacity;

    ctx.beginPath();

    if (tool === 'line') {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (tool === 'arrow') {
      const headlen = Math.max(15, strokeWidth * 2.5);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = color1;
      ctx.fill();
    } else if (tool === 'rectangle') {
      const w = x2 - x1;
      const h = y2 - y1;
      if (fillShape) ctx.fillRect(x1, y1, w, h);
      ctx.strokeRect(x1, y1, w, h);
    } else if (tool === 'roundedRect') {
      const w = x2 - x1;
      const h = y2 - y1;
      const r = Math.min(Math.abs(w), Math.abs(h)) * 0.15;
      ctx.roundRect(x1, y1, w, h, r);
      if (fillShape) ctx.fill();
      ctx.stroke();
    } else if (tool === 'ellipse') {
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      if (fillShape) ctx.fill();
      ctx.stroke();
    } else if (tool === 'triangle') {
      ctx.moveTo((x1 + x2) / 2, y1);
      ctx.lineTo(x1, y2);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      if (fillShape) ctx.fill();
      ctx.stroke();
    } else if (tool === 'star') {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const r = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
      const spikes = 5;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - r);
      for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * r;
        let y = cy + Math.sin(rot) * r;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * (r / 2);
        y = cy + Math.sin(rot) * (r / 2);
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.closePath();
      if (fillShape) ctx.fill();
      ctx.stroke();
    } else if (tool === 'heart') {
      const cx = (x1 + x2) / 2;
      const topY = y1;
      const botY = y2;
      const w = Math.abs(x2 - x1);
      const h = Math.abs(botY - topY);

      ctx.moveTo(cx, topY + h * 0.3);
      ctx.bezierCurveTo(cx, topY, cx - w / 2, topY, cx - w / 2, topY + h * 0.3);
      ctx.bezierCurveTo(cx - w / 2, topY + h * 0.6, cx, topY + h * 0.8, cx, botY);
      ctx.bezierCurveTo(cx, topY + h * 0.8, cx + w / 2, topY + h * 0.6, cx + w / 2, topY + h * 0.3);
      ctx.bezierCurveTo(cx + w / 2, topY, cx, topY, cx, topY + h * 0.3);
      ctx.closePath();
      if (fillShape) ctx.fill();
      ctx.stroke();
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const currentPos = getCanvasPos(e);

    const isShapeTool = [
      'line', 'arrow', 'rectangle', 'roundedRect', 'ellipse', 'triangle', 'star', 'heart'
    ].includes(activeTool);

    if (isShapeTool) {
      const previewCanvas = previewCanvasRef.current;
      if (!previewCanvas) return;
      const pCtx = previewCanvas.getContext('2d');
      if (!pCtx) return;

      pCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawShapeOnContext(pCtx, activeTool, startPosRef.current.x, startPosRef.current.y, currentPos.x, currentPos.y);
      return;
    }

    // Freehand stroke tools
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = strokeWidth * 2;
      ctx.globalAlpha = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (activeTool === 'pencil') {
      ctx.strokeStyle = color1;
      ctx.lineWidth = Math.max(1, Math.min(2, strokeWidth));
      ctx.globalAlpha = 1;
      ctx.lineCap = 'square';
    } else if (activeTool === 'calligraphy') {
      ctx.strokeStyle = color1;
      ctx.lineWidth = strokeWidth * 1.5;
      ctx.globalAlpha = opacity;
      ctx.lineCap = 'butt';
    } else if (activeTool === 'highlighter') {
      ctx.strokeStyle = color1;
      ctx.lineWidth = strokeWidth * 3;
      ctx.globalAlpha = 0.3;
      ctx.lineCap = 'square';
    } else {
      ctx.strokeStyle = color1;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const currentPos = getCanvasPos(e);
    const isShapeTool = [
      'line', 'arrow', 'rectangle', 'roundedRect', 'ellipse', 'triangle', 'star', 'heart'
    ].includes(activeTool);

    if (isShapeTool) {
      const previewCanvas = previewCanvasRef.current;
      if (previewCanvas) {
        const pCtx = previewCanvas.getContext('2d');
        if (pCtx) pCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawShapeOnContext(ctx, activeTool, startPosRef.current.x, startPosRef.current.y, currentPos.x, currentPos.y);
        }
      }
    }

    saveStateToHistory();
  };

  // Commit text tool
  const handleCommitText = () => {
    if (!isTypingText || !textInput.trim()) {
      setIsTypingText(null);
      setTextInput('');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = color1;
    ctx.font = `bold ${strokeWidth * 4 + 16}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillText(textInput, isTypingText.x, isTypingText.y);

    saveStateToHistory();
    setIsTypingText(null);
    setTextInput('');
  };

  // Save to Device handler
  const handleSaveToDevice = (format: 'png' | 'jpeg') => {
    setShowSaveDropdown(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `Sparkle_Drawing_${timestamp}.${format}`;
    link.href = dataUrl;
    link.click();
    showToast(`Saved drawing as .${format} to device`);
  };

  // Save to Gallery handler
  const handleSaveToGallery = async () => {
    setShowSaveDropdown(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dateLabel = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    const id = `ink-canvas-${Date.now()}`;

    const newMedia: GalleryMediaItem = {
      id,
      title: `Drawing ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      type: 'image',
      url: dataUrl,
      thumbnailUrl: dataUrl,
      mimeType: 'image/png',
      size: Math.round(dataUrl.length * 0.75),
      dateAdded: now.toISOString(),
      dateLabel,
      year: now.getFullYear(),
      dimensions: { width: CANVAS_WIDTH, height: canvasSpaceHeight },
      aspectRatio: CANVAS_WIDTH / canvasSpaceHeight,
      isFavorite: false,
      tags: ['Ink Canvas', 'Artwork', 'Paint'],
      description: 'Created with Sparkle Ink Canvas',
      source: 'draws',
    };

    try {
      await galleryDB.add(newMedia);
      showToast('Artwork saved to Gallery!', 'Open Gallery', () => navigate('/gallery'));
    } catch (e) {
      console.error(e);
      showToast('Failed to save to Gallery');
    }
  };

  const handleCanvasContextAction = async (action: CanvasContextAction) => {
    if (!canvasContextMenu) return;
    const selectedCanvas = canvasList.find((canvas) => canvas.id === canvasContextMenu.canvasId);
    setCanvasContextMenu(null);
    if (!selectedCanvas) return;

    if (action === 'rename') {
      setCanvasToRename(selectedCanvas);
      return;
    }
    if (action === 'delete') {
      setCanvasList((items) => items.filter((canvas) => canvas.id !== selectedCanvas.id));
      showToast(`Deleted "${selectedCanvas.title}"`);
      return;
    }
    setSelectedCanvasId(selectedCanvas.id);
    navigate(`/draws/${selectedCanvas.id}`);
    if (action === 'export') {
      setTimeout(() => handleSaveToDevice('png'), 350);
    } else {
      setTimeout(() => handleSaveToGallery(), 350);
    }
  };

  if (!selectedCanvasId) {
    let animIdx = 0;
    return (
      <div className="min-h-screen bg-transparent text-[#111827] dark:text-white p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4 mb-8">
            <motion.div
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              custom={animIdx++}
            >
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Your canvases</h1>
              <p className="text-sm text-black/55 dark:text-white/55 mt-2">Pick up where you left off or start with a blank sheet.</p>
            </motion.div>
            <motion.button
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              custom={animIdx++}
              type="button" 
              onClick={() => setIsCreateCanvasOpen(true)} 
              className="h-10 px-4 rounded-lg bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
            >
              <span className="flex size-6 items-center justify-center"><Plus aria-hidden="true" className="size-5" strokeWidth={2.5} /></span>
              <span className="light-mode-white-label">Create canvas</span>
            </motion.button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 [perspective:900px]">
            {canvasList.map((canvas) => {
              const tilt = canvasTilt[canvas.id] ?? { x: 0, y: 0 };
              const itemIdx = animIdx++;
              return (
                <motion.button
                  key={canvas.id}
                  variants={slideUpVariant}
                  initial="hidden"
                  animate="visible"
                  custom={itemIdx}
                  type="button"
                  onClick={() => { setSelectedCanvasId(canvas.id); navigate(`/draws/${canvas.id}`); }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setCanvasContextMenu({ x: event.clientX, y: event.clientY, canvasId: canvas.id });
                  }}
                  onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setCanvasTilt((items) => ({ ...items, [canvas.id]: { x: ((event.clientY - rect.top) / rect.height - 0.5) * -26, y: ((event.clientX - rect.left) / rect.width - 0.5) * 28 } })); }}
                  onMouseLeave={() => setCanvasTilt((items) => ({ ...items, [canvas.id]: { x: 0, y: 0 } }))}
                  style={{ rotateX: tilt.x, rotateY: tilt.y, zIndex: tilt.x || tilt.y ? 20 : 1, transformStyle: 'preserve-3d' }}
                  className="group relative text-left rounded-2xl overflow-hidden bg-white dark:bg-[#2c3037] border border-black/8 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:z-20 cursor-pointer"
                >
                  <div className="h-44 p-5 bg-white relative overflow-hidden"><div className="absolute inset-5 rounded-xl border border-black/5" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.045) 1px, transparent 1px)', backgroundSize: '22px 22px' }} /><div className="absolute left-12 top-14 h-2 w-28 rounded-full opacity-60 rotate-[-8deg]" style={{ backgroundColor: canvas.color }} /><div className="absolute right-14 bottom-12 h-2 w-20 rounded-full opacity-40 rotate-[12deg]" style={{ backgroundColor: canvas.color }} /></div>
                  <div className="p-4"><div className="font-semibold truncate">{canvas.title}</div><div className="text-xs text-black/45 dark:text-white/45 mt-1">Edited {canvas.updated}</div></div>
                </motion.button>
              );
            })}
          </div>
          <AnimatePresence>
            {canvasContextMenu && <CanvasContextMenu x={canvasContextMenu.x} y={canvasContextMenu.y} onAction={handleCanvasContextAction} onClose={() => setCanvasContextMenu(null)} />}
          </AnimatePresence>

          <PromptDialog
            isOpen={isCreateCanvasOpen}
            title="Create a new canvas"
            label="Canvas title"
            placeholder="Enter canvas name..."
            initialValue="Untitled canvas"
            confirmLabel="Create"
            onConfirm={handleCreateCanvas}
            onClose={() => setIsCreateCanvasOpen(false)}
          />

          <PromptDialog
            isOpen={Boolean(canvasToRename)}
            title="Rename canvas"
            label="Canvas title"
            placeholder="Enter canvas name..."
            initialValue={canvasToRename?.title || ''}
            confirmLabel="Save"
            onConfirm={handleConfirmRenameCanvas}
            onClose={() => setCanvasToRename(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-transparent text-[#111827] dark:text-[#F3F4F6] relative select-none">
      {/* Toast notification - Adaptive light mode, bottom position, button radius, no sparkle icon */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/95 dark:bg-[#20242a]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 text-[#111827] dark:text-white text-xs sm:text-sm px-4 py-2.5 rounded-[6px] shadow-xl flex items-center gap-3 font-medium"
          >
            <span>{toastMessage.text}</span>
            {toastMessage.actionLabel && toastMessage.onAction && (
              <button
                type="button"
                onClick={toastMessage.onAction}
                className="px-2.5 py-1 rounded-[4px] bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer border-none"
              >
                {toastMessage.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ink Canvas toolbar */}
      <motion.header
        variants={slideUpVariant}
        initial="hidden"
        animate="visible"
        custom={0}
        className="sticky top-0 z-40 bg-transparent border-b border-black/10 dark:border-white/10 px-3 sm:px-5 py-2 flex flex-col gap-2 shrink-0"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Undo, Redo, Clear Canvas */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStackRef.current.length <= 1}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-[5px] text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStackRef.current.length === 0}
              title="Redo (Ctrl+D)"
              className="p-1.5 rounded-[5px] text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-1" />

            <button
              type="button"
              onClick={handleClearCanvas}
              title="Clear Canvas"
              className="p-1.5 rounded-[5px] text-[#4b5563] dark:text-neutral-300 hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 cursor-pointer transition-all"
            >
              <FluentDeleteIcon className="w-4 h-4 text-current" />
            </button>
          </div>

          {/* Right: Canvas actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Full screen canvas'}
              className="h-8 px-2.5 rounded-[6px] border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-200 flex items-center gap-1.5 text-xs cursor-pointer transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full screen'}</span>
            </button>
            {/* Save Dropdown adhering to standard app buttons */}
            <div className="relative">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                className="h-8 px-3 rounded-l-[6px] bg-[#005fb8] dark:bg-[#4cc2ff] hover:bg-[#0067c0] dark:hover:bg-[#6bd0ff] active:scale-95 text-white dark:text-black text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                className="h-8 px-2 rounded-r-[6px] bg-[#0051a2] dark:bg-[#3bb2ef] hover:bg-[#00458b] dark:hover:bg-[#2aa2df] text-white dark:text-black flex items-center justify-center cursor-pointer border-l border-white/20 transition-all"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSaveDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Save Dropdown Options */}
            <AnimatePresence>
              {showSaveDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-white dark:bg-[#1f2329] border border-black/10 dark:border-white/15 rounded-[8px] shadow-2xl p-1.5 space-y-1 text-[#111827] dark:text-white select-none"
                >
                  <div className="px-2 py-1 text-[11px] font-semibold text-[#6b7280] dark:text-neutral-400 uppercase tracking-wider">
                    Save Options
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveToDevice('png')}
                    className="w-full px-2.5 py-2 rounded-[5px] flex items-center justify-between text-xs hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-[#005fb8] dark:text-[#4cc2ff]" />
                      <span>Save to device (.png)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveToDevice('jpeg')}
                    className="w-full px-2.5 py-2 rounded-[5px] flex items-center justify-between text-xs hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-[#005fb8] dark:text-[#4cc2ff]" />
                      <span>Save to device (.jpg)</span>
                    </div>
                  </button>

                  <div className="h-[1px] bg-black/10 dark:bg-white/10 my-1" />

                  <button
                    type="button"
                    onClick={handleSaveToGallery}
                    className="w-full px-2.5 py-2 rounded-[5px] flex items-center justify-between text-xs hover:bg-[#005fb8]/10 dark:hover:bg-[#4cc2ff]/10 active:scale-95 text-[#005fb8] dark:text-[#4cc2ff] font-semibold transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-[#005fb8] dark:text-[#4cc2ff]" />
                      <span>Save to Gallery</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#005fb8]/15 dark:bg-[#4cc2ff]/20 text-[#005fb8] dark:text-[#4cc2ff]">Direct</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>

        {/* Secondary Ribbon Row: Tools, Shapes, Thickness Slider, Colors */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-black/5 dark:border-white/5 overflow-x-auto no-scrollbar">
          {/* 1. Freehand / Drawing Tools */}
          <div className="flex items-center gap-1 shrink-0 bg-black/5 dark:bg-white/5 p-1 rounded-[6px] border border-black/5 dark:border-white/5">
            {[
              { id: 'brush', icon: Paintbrush, label: 'Brush' },
              { id: 'pencil', icon: Pencil, label: 'Pencil' },
              { id: 'calligraphy', icon: PenTool, label: 'Calligraphy' },
              { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
              { id: 'eraser', icon: Eraser, label: 'Eraser' },
              { id: 'bucket', icon: PaintBucket, label: 'Fill Bucket' },
              { id: 'picker', icon: Pipette, label: 'Eyedropper' },
              { id: 'text', icon: Type, label: 'Text' },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTool(t.id as DrawTool)}
                  title={t.label}
                  className={`p-1.5 rounded-[5px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black shadow-xs font-semibold'
                      : 'text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* 2. Shape Tools */}
          <div className="flex items-center gap-1 shrink-0 bg-black/5 dark:bg-white/5 p-1 rounded-[6px] border border-black/5 dark:border-white/5">
            {[
              { id: 'line', icon: Slash, label: 'Line' },
              { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
              { id: 'rectangle', icon: Square, label: 'Rectangle' },
              { id: 'ellipse', icon: Circle, label: 'Circle' },
              { id: 'triangle', icon: Triangle, label: 'Triangle' },
              { id: 'star', icon: Star, label: 'Star' },
              { id: 'heart', icon: Heart, label: 'Heart' },
            ].map((s) => {
              const Icon = s.icon;
              const isSelected = activeTool === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveTool(s.id as DrawTool)}
                  title={s.label}
                  className={`p-1.5 rounded-[5px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black shadow-xs font-semibold'
                      : 'text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}

            {/* Shape Fill Toggle */}
            <button
              type="button"
              onClick={() => setFillShape(!fillShape)}
              title={fillShape ? 'Shape: Filled' : 'Shape: Outline only'}
              className={`px-2 py-1 rounded-[5px] text-[11px] font-semibold transition-all cursor-pointer ml-1 ${
                fillShape 
                  ? 'bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black font-bold shadow-xs' 
                  : 'text-[#4b5563] dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {fillShape ? 'Solid' : 'Outline'}
            </button>
          </div>

          {/* 3. Stroke Thickness (Độ dày mực) Control adhering to standard sliders */}
          <div className="flex items-center gap-2 shrink-0 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-[6px] border border-black/5 dark:border-white/5">
            <span className="text-[11px] text-[#6b7280] dark:text-neutral-400 font-medium hidden sm:inline">Size:</span>
            
            {/* Live ink thickness preview dot */}
            <div className="w-6 h-6 rounded-[4px] bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/10 dark:border-white/10">
              <div
                className="rounded-full transition-all"
                style={{
                  width: Math.min(20, Math.max(2, strokeWidth)),
                  height: Math.min(20, Math.max(2, strokeWidth)),
                  backgroundColor: color1,
                }}
              />
            </div>

            {/* Standard App Slider */}
            <input
              type="range"
              min="1"
              max="48"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
              className="w-20 sm:w-24 accent-[#005fb8] dark:accent-[#4cc2ff] cursor-pointer"
              title={`Stroke width: ${strokeWidth}px`}
            />

            <span className="text-[11px] text-[#111827] dark:text-neutral-200 font-mono w-7 text-right">
              {strokeWidth}px
            </span>

            {/* Quick preset sizes */}
            <div className="flex items-center gap-1 pl-1 border-l border-black/10 dark:border-white/10">
              {PRESET_SIZES.slice(0, 4).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setStrokeWidth(sz)}
                  className={`w-5 h-5 rounded text-[10px] flex items-center justify-center cursor-pointer transition-colors ${
                    strokeWidth === sz 
                      ? 'bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black font-bold shadow-xs' 
                      : 'text-[#6b7280] dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Color Palette & Slots (Color 1 & Color 2) */}
          <div className="flex items-center gap-2 shrink-0 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-[6px] border border-black/5 dark:border-white/5">
            {/* Color 1 (Primary) */}
            <div
              onClick={() => setActiveColorSlot(1)}
              className={`flex flex-col items-center cursor-pointer p-0.5 rounded ${
                activeColorSlot === 1 ? 'ring-2 ring-[#005fb8] dark:ring-[#4cc2ff]' : 'opacity-70'
              }`}
              title="Color 1 (Foreground)"
            >
              <div className="w-5 h-5 rounded-[4px] border border-black/20 dark:border-white/20 shadow-xs" style={{ backgroundColor: color1 }} />
              <span className="text-[9px] text-[#6b7280] dark:text-neutral-400 leading-none mt-0.5">Col 1</span>
            </div>

            {/* Color 2 (Secondary / Fill) */}
            <div
              onClick={() => setActiveColorSlot(2)}
              className={`flex flex-col items-center cursor-pointer p-0.5 rounded ${
                activeColorSlot === 2 ? 'ring-2 ring-[#005fb8] dark:ring-[#4cc2ff]' : 'opacity-70'
              }`}
              title="Color 2 (Background / Fill)"
            >
              <div className="w-5 h-5 rounded-[4px] border border-black/20 dark:border-white/20 shadow-xs" style={{ backgroundColor: color2 }} />
              <span className="text-[9px] text-[#6b7280] dark:text-neutral-400 leading-none mt-0.5">Col 2</span>
            </div>

            {/* Color Swatches Grid */}
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-1 px-1">
              {PRESET_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    if (activeColorSlot === 1) setColor1(col);
                    else setColor2(col);
                  }}
                  className="w-3.5 h-3.5 rounded-[3px] border border-black/30 dark:border-black/50 transition-colors cursor-pointer"
                  style={{ backgroundColor: col }}
                  title={col}
                />
              ))}
            </div>

            {/* Custom Color Input */}
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={activeColorSlot === 1 ? color1 : color2}
                onChange={(e) => {
                  if (activeColorSlot === 1) setColor1(e.target.value);
                  else setColor2(e.target.value);
                }}
                className="opacity-0 w-5 h-5 absolute inset-0 cursor-pointer"
              />
              <div className="w-5 h-5 rounded-[4px] bg-gradient-to-tr from-rose-500 via-green-500 to-blue-500 border border-black/20 dark:border-white/30 flex items-center justify-center text-[10px] text-white font-bold">
                +
              </div>
            </label>
          </div>
        </div>
      </motion.header>

      {/* Main Drawing Canvas Area with pan/zoom container and default page background */}
      <motion.div 
        variants={slideUpVariant}
        initial="hidden"
        animate="visible"
        custom={1}
        ref={containerRef}
        onScroll={(event) => {
          const target = event.currentTarget;
          setShowExpansionActions(target.scrollTop + target.clientHeight > target.scrollHeight - 500);
        }}
        className="flex-1 min-h-[100vh] overflow-auto bg-[#f3f4f6] dark:bg-[#202328] flex items-start justify-start p-0 relative select-none"
        style={{
          minHeight: isFullscreen ? '100vh' : 'calc(100vh - 86px)',
          backgroundImage: showGrid 
            ? 'radial-gradient(currentColor 1px, transparent 1px)' 
            : 'none',
          backgroundSize: '24px 24px',
          opacity: showGrid ? 0.95 : 1,
        }}
      >
        <div 
          className="relative shadow-xl rounded-[6px] overflow-hidden bg-white max-w-full border border-black/10 dark:border-white/10"
          style={{
            minHeight: canvasSpaceHeight,
            width: canvasSpaceWidth,
            maxWidth: 'none',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out',
          }}
        >
          {/* Main Drawing Canvas */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="block touch-none cursor-crosshair bg-white max-w-full h-auto"
            style={{
              width: '100%',
              maxWidth: '1280px',
              aspectRatio: '16/9',
            }}
          />

          {/* Live Preview Overlay Canvas for Shapes */}
          <canvas
            ref={previewCanvasRef}
            className="absolute inset-0 pointer-events-none w-full h-full"
          />

          {/* Floating Text Input Box when Text tool is active */}
          {isTypingText && (
            <div
              className="absolute z-30 flex items-center gap-1.5 p-1 bg-black/80 backdrop-blur-md rounded-[6px] border border-white/20 shadow-xl"
              style={{
                left: `${(isTypingText.x / CANVAS_WIDTH) * 100}%`,
                top: `${(isTypingText.y / CANVAS_HEIGHT) * 100}%`,
              }}
            >
              <input
                type="text"
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitText();
                  if (e.key === 'Escape') setIsTypingText(null);
                }}
                placeholder="Type text..."
                className="bg-transparent text-white text-xs px-2 py-1 outline-none border border-white/20 rounded"
              />
              <button
                type="button"
                onClick={handleCommitText}
                className="px-2 py-1 rounded bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black text-xs font-semibold cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}
        </div>
        {showExpansionActions && (
          <div className="flex flex-wrap justify-center gap-3 py-8 z-20 bg-[#f3f4f6] dark:bg-[#202328]">
            <button type="button" onClick={() => setCanvasSpaceHeight((height) => height + 1200)} className="rounded-lg border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#30343b]/95 px-4 py-2.5 text-sm font-medium shadow-lg hover:bg-white dark:hover:bg-[#3a4049] transition-colors">Create more space down</button>
          </div>
        )}
      </motion.div>

      {/* Bottom Status & View Controls Bar */}
      <motion.footer
        variants={slideUpVariant}
        initial="hidden"
        animate="visible"
        custom={2}
        className="sticky bottom-0 z-30 px-3 sm:px-5 py-1.5 bg-transparent border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-[#6b7280] dark:text-neutral-400 shrink-0"
      >
        <div className="flex items-center gap-3">
          <span>{CANVAS_WIDTH} × {CANVAS_HEIGHT} px</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Tool: <strong className="text-[#111827] dark:text-white capitalize">{activeTool}</strong></span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline text-[11px]">Undo: <strong>Ctrl+Z</strong> / Redo: <strong>Ctrl+D</strong></span>
        </div>

        {/* Zoom & Grid view controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid Lines"
            className={`p-1 rounded cursor-pointer ${showGrid ? 'text-[#005fb8] dark:text-[#4cc2ff] bg-black/5 dark:bg-white/10' : 'hover:text-[#111827] dark:hover:text-white'}`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
            title="Zoom Out"
            className="p-1 hover:text-[#111827] dark:hover:text-white cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono text-[#111827] dark:text-white w-9 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.1).toFixed(1))))}
            title="Zoom In"
            className="p-1 hover:text-[#111827] dark:hover:text-white cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            title="Reset Zoom (100%)"
            className="p-1 hover:text-[#111827] dark:hover:text-white cursor-pointer ml-1 text-[11px]"
          >
            100%
          </button>
        </div>
      </motion.footer>
    </div>
  );
};
