import React, { useState } from 'react';
import {
  Camera,
  Paintbrush,
  Upload,
  Waves,
  Zap,
  RotateCcw,
  Play,
  Pause,
  Download,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from 'lucide-react';
import { PhysicsParams } from '../graphics/ParticleEngine.ts';

interface ControlHUDProps {
  fps: number;
  particleCount: number;
  morphProgress: number;
  isPaused: boolean;
  activeSource: 'webcam' | 'drawing' | 'image' | 'pattern';
  webcamActive: boolean;
  isAutoResolution: boolean;
  onToggleAutoResolution: () => void;
  physics: PhysicsParams;
  onUpdatePhysics: (params: Partial<PhysicsParams>) => void;
  onParticleResolutionChange: (count: number) => void;
  onToggleWebcam: () => void;
  onOpenDrawing: () => void;
  onOpenUpload: () => void;
  onSelectPattern: () => void;
  onMorph: () => void;
  onExplode: () => void;
  onElectricSurge: () => void;
  onResetToSource: () => void;
  onTogglePause: () => void;
  onOpenStandalone: () => void;
}

export const ControlHUD: React.FC<ControlHUDProps> = ({
  fps,
  particleCount,
  morphProgress,
  isPaused,
  activeSource,
  webcamActive,
  isAutoResolution,
  onToggleAutoResolution,
  physics,
  onUpdatePhysics,
  onParticleResolutionChange,
  onToggleWebcam,
  onOpenDrawing,
  onOpenUpload,
  onSelectPattern,
  onMorph,
  onExplode,
  onElectricSurge,
  onResetToSource,
  onTogglePause,
  onOpenStandalone,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-30 w-80 md:w-88 transition-all duration-300">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-2xl backdrop-blur-xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            <div>
              <h1 className="text-xs font-bold tracking-wider uppercase text-zinc-100">
                Tesla Pixel-Morph
              </h1>
              <span className="text-[10px] text-zinc-400 font-medium">
                Fluid Optimal Transport
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-400 tabular-nums">
              <strong className="text-zinc-200">{fps}</strong> FPS
            </span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title={isCollapsed ? 'Expand Controls' : 'Collapse Controls'}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Morph Progress Meter */}
        <div className="mt-2.5 mb-3">
          <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
            <span>Morph Coalescence</span>
            <span className="text-sky-400 font-semibold tabular-nums">
              {Math.round(morphProgress * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-amber-400 transition-all duration-150"
              style={{ width: `${morphProgress * 100}%` }}
            />
          </div>
        </div>

        {!isCollapsed && (
          <div className="space-y-3.5">
            {/* Source Input Selector */}
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Source Visual Input
              </span>
              <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900/70 border border-zinc-800/70 rounded-xl">
                <button
                  onClick={onToggleWebcam}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                    activeSource === 'webcam'
                      ? 'bg-sky-500 text-zinc-950 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                  title="Live Webcam stream"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Webcam</span>
                </button>

                <button
                  onClick={onOpenDrawing}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                    activeSource === 'drawing'
                      ? 'bg-sky-500 text-zinc-950 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                  title="Freehand Neon Paint Canvas"
                >
                  <Paintbrush className="w-4 h-4 mb-0.5" />
                  <span>Drawing</span>
                </button>

                <button
                  onClick={onOpenUpload}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                    activeSource === 'image'
                      ? 'bg-sky-500 text-zinc-950 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                  title="Upload Custom Image or Preset"
                >
                  <Upload className="w-4 h-4 mb-0.5" />
                  <span>Upload</span>
                </button>

                <button
                  onClick={onSelectPattern}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                    activeSource === 'pattern'
                      ? 'bg-sky-500 text-zinc-950 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                  title="Procedural Electric Wave"
                >
                  <Waves className="w-4 h-4 mb-0.5" />
                  <span>Wave</span>
                </button>
              </div>
            </div>

            {/* Core Action CTAs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onMorph}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Morph to Tesla</span>
              </button>

              <button
                onClick={onElectricSurge}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Electric Surge</span>
              </button>
            </div>

            {/* Physics & Flow Controls */}
            <div className="space-y-2.5 pt-1">
              {/* Automatic Particle Resolution (Image-Based) */}
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-100">Automatic Particle Count</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-mono">
                      {isAutoResolution ? 'Auto (Image)' : 'Manual'}
                    </span>
                  </div>
                  <button
                    onClick={onToggleAutoResolution}
                    className="text-[10px] font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    {isAutoResolution ? 'Switch to Manual' : 'Set to Auto'}
                  </button>
                </div>
                <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono mb-1">
                  <span>Image Pixels Sampled:</span>
                  <span className="text-zinc-200 font-semibold tabular-nums">
                    {particleCount.toLocaleString()} particles
                  </span>
                </div>
                {!isAutoResolution && (
                  <input
                    type="range"
                    min={15000}
                    max={85000}
                    step={5000}
                    value={particleCount}
                    onChange={(e) => onParticleResolutionChange(parseInt(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer mt-1"
                  />
                )}
              </div>

              {/* Spring Pull */}
              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Spring Attraction (Easing)</span>
                  <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                    {physics.springStiffness.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={4.0}
                  step={0.1}
                  value={physics.springStiffness}
                  onChange={(e) => onUpdatePhysics({ springStiffness: parseFloat(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Fluid Viscosity / Damping */}
              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Fluid Viscosity (Damping)</span>
                  <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                    {physics.damping.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.82}
                  max={0.98}
                  step={0.01}
                  value={physics.damping}
                  onChange={(e) => onUpdatePhysics({ damping: parseFloat(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Advanced Toggle */}
            <div className="pt-1">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Sliders className="w-3 h-3" />
                <span>{showAdvanced ? 'Hide Particle Settings' : 'Advanced Particle Settings'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-2 space-y-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-xs">
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Point Size</span>
                      <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                        {physics.pointSize.toFixed(1)}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={5.0}
                      step={0.2}
                      value={physics.pointSize}
                      onChange={(e) => onUpdatePhysics({ pointSize: parseFloat(e.target.value) })}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Motion Trail Persistence</span>
                      <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                        {(1 - physics.trailPersistence).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.4}
                      step={0.02}
                      value={physics.trailPersistence}
                      onChange={(e) => onUpdatePhysics({ trailPersistence: parseFloat(e.target.value) })}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-300">Additive Glow Blending</span>
                    <button
                      onClick={() => onUpdatePhysics({ additiveBlending: !physics.additiveBlending })}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        physics.additiveBlending
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {physics.additiveBlending ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Simulation Secondary Controls */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={onExplode}
                className="py-1.5 px-2 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 transition-colors"
                title="Disperse particles outward"
              >
                Disperse
              </button>
              <button
                onClick={onResetToSource}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 transition-colors"
                title="Return particles to original source layout"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Source</span>
              </button>
              <button
                onClick={onTogglePause}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 transition-colors"
                title={isPaused ? 'Resume simulation' : 'Pause simulation'}
              >
                {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                <span>{isPaused ? 'Play' : 'Pause'}</span>
              </button>
            </div>

            {/* Standalone HTML Export Banner */}
            <div className="pt-2 border-t border-zinc-800/60">
              <button
                onClick={onOpenStandalone}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-sky-500/40 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Export Standalone HTML</span>
              </button>
              <span className="text-[10px] text-zinc-500 text-center block mt-1">
                Single-file self-contained bundle for local browsers
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tip Pill / Helper info */}
      <div className="mt-2 px-3 py-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800/40 backdrop-blur-md flex items-center gap-2 text-[11px] text-zinc-400">
        <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span>Move mouse or drag finger to swirl fluid vortex</span>
      </div>
    </div>
  );
};
