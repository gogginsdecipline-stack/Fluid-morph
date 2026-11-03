import React, { useRef, useState, useEffect } from 'react';
import { Brush, Eraser, Trash2, Sparkles, X } from 'lucide-react';

interface DrawingPadProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDrawing: (canvas: HTMLCanvasElement) => void;
}

const PRESET_COLORS = [
  '#38bdf8', // Electric Cyan
  '#f59e0b', // Amber / Gold
  '#ec4899', // Hot Pink
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#ffffff', // Pure White
];

export const DrawingPad: React.FC<DrawingPadProps> = ({
  isOpen,
  onClose,
  onApplyDrawing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState('#38bdf8');
  const [brushSize, setBrushSize] = useState(14);
  const [isEraser, setIsEraser] = useState(false);
  const [isSpray, setIsSpray] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        // Initial dark background with subtle center glow
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        // Draw initial welcoming neon signature / smile
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cvs.width / 2, cvs.height / 2 - 20, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const rect = cvs.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.save();
    if (isEraser) {
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(x, y, brushSize * 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (isSpray) {
      ctx.fillStyle = color;
      const density = 25;
      for (let i = 0; i < density; i++) {
        const radius = Math.random() * brushSize * 1.5;
        const angle = Math.random() * Math.PI * 2;
        const sx = x + Math.cos(angle) * radius;
        const sy = y + Math.sin(angle) * radius;
        ctx.fillRect(sx, sy, 2, 2);
      }
    } else {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = brushSize > 10 ? 12 : 6;
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const handleClear = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
  };

  const handleApply = () => {
    if (canvasRef.current) {
      onApplyDrawing(canvasRef.current);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
              Freehand Drawing Canvas
            </h3>
            <p className="text-xs text-zinc-400">
              Paint neon strokes to transform into Tesla particles
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawing Surface */}
        <div className="my-4 flex justify-center">
          <canvas
            ref={canvasRef}
            width={340}
            height={420}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            className="rounded-xl border border-zinc-800 cursor-crosshair touch-none shadow-inner"
          />
        </div>

        {/* Tools & Palette */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setIsEraser(false);
                  }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c && !isEraser
                      ? 'scale-125 ring-2 ring-white/60'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsEraser(false);
                  setIsSpray(false);
                }}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !isEraser && !isSpray
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
                title="Brush"
              >
                <Brush className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsSpray(true);
                  setIsEraser(false);
                }}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSpray
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
                title="Spray Particles"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEraser(true)}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isEraser
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                title="Clear Canvas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="w-16 shrink-0">Size: {brushSize}px</span>
            <input
              type="range"
              min={4}
              max={40}
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-semibold shadow-lg shadow-sky-500/20 transition-colors"
            >
              Morph Drawing into Tesla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
