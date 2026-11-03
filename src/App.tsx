/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ParticleEngine, DEFAULT_PHYSICS, PhysicsParams } from './graphics/ParticleEngine.ts';
import { TeslaTargetProcessor, TargetPixel } from './utils/teslaTarget.ts';
import { ControlHUD } from './components/ControlHUD.tsx';
import { DrawingPad } from './components/DrawingPad.tsx';
import { ImageUploader } from './components/ImageUploader.tsx';
import { StandaloneModal } from './components/StandaloneModal.tsx';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const engineRef = useRef<ParticleEngine | null>(null);
  const targetProcessorRef = useRef<TeslaTargetProcessor>(new TeslaTargetProcessor());
  const targetPixelsRef = useRef<TargetPixel[]>([]);
  const lastImageRef = useRef<HTMLImageElement | null>(null);
  const lastDrawingRef = useRef<HTMLCanvasElement | null>(null);

  // Simulation Parameters & State
  const [particleCount, setParticleCount] = useState<number>(50000);
  const [isAutoResolution, setIsAutoResolution] = useState<boolean>(true);
  const [physics, setPhysics] = useState<PhysicsParams>({ ...DEFAULT_PHYSICS });
  const [fps, setFps] = useState<number>(60);
  const [morphProgress, setMorphProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Active Source Mode
  const [activeSource, setActiveSource] = useState<'webcam' | 'drawing' | 'image' | 'pattern'>('pattern');
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Modals
  const [isDrawingOpen, setIsDrawingOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isStandaloneOpen, setIsStandaloneOpen] = useState<boolean>(false);

  // Target base64 cache for standalone exports
  const [base64Tesla, setBase64Tesla] = useState<string | null>(null);

  /**
   * Helper: Generate procedural generative wave canvas
   */
  const createGenerativeWaveCanvas = useCallback((): HTMLCanvasElement => {
    const cvs = document.createElement('canvas');
    cvs.width = 300;
    cvs.height = 400;
    const ctx = cvs.getContext('2d');
    if (ctx) {
      // Cosmic dark violet background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      // Multi-layer glowing sinusoidal waves
      const colors = ['#38bdf8', '#f59e0b', '#ec4899', '#a855f7', '#ffffff'];
      for (let layer = 0; layer < colors.length; layer++) {
        ctx.strokeStyle = colors[layer];
        ctx.lineWidth = 4 + layer * 2;
        ctx.shadowColor = colors[layer];
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let x = 0; x < cvs.width; x += 4) {
          const y =
            cvs.height / 2 +
            Math.sin(x * 0.03 + layer * 1.2) * 50 * Math.cos(layer * 0.5) +
            (layer - 2) * 35;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    return cvs;
  }, []);

  /**
   * Sample source visual and morph into Tesla
   */
  const applySourceToTesla = useCallback(
    (source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement) => {
      const engine = engineRef.current;
      if (!engine || targetPixelsRef.current.length === 0) return;

      const { positions, targets, colors } = TeslaTargetProcessor.mapSourceToTargets(
        source,
        targetPixelsRef.current
      );

      engine.setParticleData(positions, targets, colors);
      engine.mode = 'morph';
    },
    []
  );

  /**
   * Initialize Tesla Target Grid
   */
  const refreshTeslaGrid = useCallback(
    (count: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const processor = targetProcessorRef.current;
      const targets = processor.sampleTeslaTarget(count, canvas.width, canvas.height);
      targetPixelsRef.current = targets;
      setBase64Tesla(processor.getBase64Image());

      // Re-apply current source
      if (activeSource === 'webcam' && videoRef.current && webcamActive) {
        applySourceToTesla(videoRef.current);
      } else if (activeSource === 'image' && lastImageRef.current) {
        applySourceToTesla(lastImageRef.current);
      } else if (activeSource === 'drawing' && lastDrawingRef.current) {
        applySourceToTesla(lastDrawingRef.current);
      } else {
        const wave = createGenerativeWaveCanvas();
        applySourceToTesla(wave);
      }
    },
    [activeSource, webcamActive, applySourceToTesla, createGenerativeWaveCanvas]
  );

  /**
   * Initialize WebGL Canvas & Engine on Mount
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let engine: ParticleEngine;
    try {
      engine = new ParticleEngine(canvas);
      engineRef.current = engine;
    } catch (err) {
      console.error('Failed to initialize WebGL:', err);
      return;
    }

    // Load Tesla Target Image
    targetProcessorRef.current.init().then(() => {
      refreshTeslaGrid(particleCount);
    });

    // Resize handler
    const handleResize = () => {
      if (canvas && engine) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.resize(canvas.width, canvas.height);
        refreshTeslaGrid(particleCount);
      }
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      engine.step(dt);
      engine.render();

      setFps(engine.fps);
      setMorphProgress(engine.morphProgress);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  /**
   * Handle particle count resolution change
   */
  const handleParticleResolutionChange = (count: number) => {
    setParticleCount(count);
    refreshTeslaGrid(count);
  };

  /**
   * Handle physics parameter changes
   */
  const handleUpdatePhysics = (updated: Partial<PhysicsParams>) => {
    setPhysics((prev) => {
      const next = { ...prev, ...updated };
      if (engineRef.current) {
        engineRef.current.params = next;
      }
      return next;
    });
  };

  /**
   * Webcam toggle
   */
  const handleToggleWebcam = async () => {
    if (webcamActive) {
      // Turn off
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setWebcamActive(false);
      setActiveSource('pattern');
      const wave = createGenerativeWaveCanvas();
      applySourceToTesla(wave);
    } else {
      // Turn on
      try {
        setWebcamError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setWebcamActive(true);
            setActiveSource('webcam');
            // Sample frame
            setTimeout(() => {
              if (videoRef.current) {
                applySourceToTesla(videoRef.current);
              }
            }, 300);
          };
        }
      } catch (err: unknown) {
        console.warn('Camera access error:', err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Camera permission denied or camera not found.';
        setWebcamError(errorMsg);
        alert(`Camera access unavailable: ${errorMsg}\nPlease check browser permissions.`);
      }
    }
  };

  /**
   * Freehand Drawing Handler
   */
  const handleApplyDrawing = (drawnCanvas: HTMLCanvasElement) => {
    lastDrawingRef.current = drawnCanvas;
    setActiveSource('drawing');
    applySourceToTesla(drawnCanvas);
  };

  /**
   * Image Upload Handler
   */
  const handleSelectImage = (img: HTMLImageElement) => {
    lastImageRef.current = img;
    setActiveSource('image');

    if (isAutoResolution) {
      const w = img.naturalWidth || img.width || 400;
      const h = img.naturalHeight || img.height || 600;
      const totalPixels = w * h;
      // Calculate automatic particle resolution proportional to image size (30,000 to 75,000 particles)
      let autoCount = 52000;
      if (totalPixels >= 1200000) {
        autoCount = 70000;
      } else if (totalPixels >= 600000) {
        autoCount = 60000;
      } else if (totalPixels <= 150000) {
        autoCount = 35000;
      } else {
        autoCount = 48000;
      }

      setParticleCount(autoCount);
      // Refresh Tesla grid with new automatic count
      const canvas = canvasRef.current;
      if (canvas) {
        const processor = targetProcessorRef.current;
        const targets = processor.sampleTeslaTarget(autoCount, canvas.width, canvas.height);
        targetPixelsRef.current = targets;
        applySourceToTesla(img);
        return;
      }
    }

    applySourceToTesla(img);
  };

  /**
   * Procedural Pattern Handler
   */
  const handleSelectPattern = () => {
    setActiveSource('pattern');
    const wave = createGenerativeWaveCanvas();
    applySourceToTesla(wave);
  };

  /**
   * Actions
   */
  const handleMorph = () => {
    if (engineRef.current) {
      engineRef.current.mode = 'morph';
    }
  };

  const handleExplode = () => {
    if (engineRef.current) {
      engineRef.current.explode();
    }
  };

  const handleElectricSurge = () => {
    if (engineRef.current) {
      engineRef.current.triggerElectricShock();
    }
  };

  const handleResetToSource = () => {
    if (engineRef.current) {
      engineRef.current.resetPositionsToSource();
    }
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.isPaused = !engineRef.current.isPaused;
      setIsPaused(engineRef.current.isPaused);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans select-none">
      {/* Full-bleed WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair z-0"
      />

      {/* Hidden Video element for webcam capture */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ display: 'none' }}
      />

      {/* Modern Floating Glass Control HUD */}
      <ControlHUD
        fps={fps}
        particleCount={particleCount}
        morphProgress={morphProgress}
        isPaused={isPaused}
        activeSource={activeSource}
        webcamActive={webcamActive}
        isAutoResolution={isAutoResolution}
        onToggleAutoResolution={() => setIsAutoResolution(!isAutoResolution)}
        physics={physics}
        onUpdatePhysics={handleUpdatePhysics}
        onParticleResolutionChange={handleParticleResolutionChange}
        onToggleWebcam={handleToggleWebcam}
        onOpenDrawing={() => setIsDrawingOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onSelectPattern={handleSelectPattern}
        onMorph={handleMorph}
        onExplode={handleExplode}
        onElectricSurge={handleElectricSurge}
        onResetToSource={handleResetToSource}
        onTogglePause={handleTogglePause}
        onOpenStandalone={() => setIsStandaloneOpen(true)}
      />

      {/* Target Reference Watermark Badge */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md">
        <div className="w-5 h-7 rounded overflow-hidden border border-zinc-700/60 bg-zinc-900 shrink-0">
          <img
            src="/assets/aistudio/1790850885226_2_1da8f38b.jpg"
            alt="Nikola Tesla Target Reference"
            className="w-full h-full object-cover grayscale contrast-125"
          />
        </div>
        <div className="text-[11px] leading-tight text-zinc-300">
          <span className="font-semibold text-zinc-100 block">Nikola Tesla</span>
          <span className="text-[10px] text-zinc-500">Immutable Target Reference</span>
        </div>
      </div>

      {/* Freehand Drawing Modal */}
      <DrawingPad
        isOpen={isDrawingOpen}
        onClose={() => setIsDrawingOpen(false)}
        onApplyDrawing={handleApplyDrawing}
      />

      {/* Image Uploader & Presets Modal */}
      <ImageUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSelectImage={handleSelectImage}
      />

      {/* Standalone HTML Export Modal & Instructions */}
      <StandaloneModal
        isOpen={isStandaloneOpen}
        onClose={() => setIsStandaloneOpen(false)}
        base64Image={base64Tesla}
      />
    </div>
  );
}
