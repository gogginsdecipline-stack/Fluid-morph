import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, X } from 'lucide-react';

interface ImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (image: HTMLImageElement) => void;
}

const PRESET_IMAGES = [
  {
    name: 'Electric Lightning',
    desc: 'High-voltage violet plasma arc',
    url: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=500&auto=format&fit=crop&q=80',
    fallbackHue: 'violet',
  },
  {
    name: 'Cosmic Nebula',
    desc: 'Vibrant stellar dust cloud',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=500&auto=format&fit=crop&q=80',
    fallbackHue: 'cyan',
  },
  {
    name: 'Neon Cyber Grid',
    desc: 'Retro synthwave gradient',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop&q=80',
    fallbackHue: 'pink',
  },
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  isOpen,
  onClose,
  onSelectImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        onSelectImage(img);
        onClose();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof PRESET_IMAGES[0]) => {
    // Generate high quality canvas gradient fallback to prevent any CORS issues
    const cvs = document.createElement('canvas');
    cvs.width = 400;
    cvs.height = 500;
    const ctx = cvs.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 400, 500);
      if (preset.fallbackHue === 'violet') {
        grad.addColorStop(0, '#7c3aed');
        grad.addColorStop(0.5, '#3b82f6');
        grad.addColorStop(1, '#06b6d4');
      } else if (preset.fallbackHue === 'cyan') {
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(0.5, '#ec4899');
        grad.addColorStop(1, '#f59e0b');
      } else {
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(0.5, '#8b5cf6');
        grad.addColorStop(1, '#1e1b4b');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 500);

      // Add fluid decorative waves
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 12;
      ctx.beginPath();
      for (let i = 0; i < 400; i += 20) {
        ctx.arc(i, 250 + Math.sin(i * 0.05) * 60, 20, 0, Math.PI * 2);
      }
      ctx.stroke();

      const img = new Image();
      img.onload = () => {
        onSelectImage(img);
        onClose();
      };
      img.src = cvs.toDataURL();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
              Upload Source Image
            </h3>
            <p className="text-xs text-zinc-400">
              Transform any photo or graphic into Nikola Tesla
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="my-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/40 p-6 hover:border-sky-500/50 hover:bg-zinc-900/70 cursor-pointer transition-all group"
        >
          <div className="rounded-full bg-zinc-800/80 p-3 group-hover:bg-sky-500/20 group-hover:text-sky-400 text-zinc-300 transition-colors">
            <Upload className="w-6 h-6" />
          </div>
          <span className="mt-3 text-xs font-medium text-zinc-200">
            Click to upload custom image (PNG, JPG, WebP)
          </span>
          <span className="text-[11px] text-zinc-500 mt-1">
            Pixel colors will be sampled and mapped onto Tesla
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Preset Palettes */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Or Choose Generative Preset
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_IMAGES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className="flex flex-col items-center p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-sky-500/40 hover:bg-zinc-800/80 transition-all text-center group"
              >
                <Sparkles className="w-4 h-4 text-sky-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-zinc-200 leading-tight">
                  {preset.name}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                  {preset.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
