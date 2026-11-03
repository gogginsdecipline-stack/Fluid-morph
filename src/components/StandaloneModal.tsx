import React, { useState } from 'react';
import { Download, Copy, Check, Terminal, FileCode, X, Globe } from 'lucide-react';
import { generateStandaloneHTML } from '../utils/exportStandaloneHtml.ts';

interface StandaloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  base64Image?: string | null;
}

export const StandaloneModal: React.FC<StandaloneModalProps> = ({
  isOpen,
  onClose,
  base64Image,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlCode = generateStandaloneHTML(base64Image || undefined);

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nikola-tesla-pixel-morph.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400 border border-sky-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
                Single-File Standalone HTML
              </h3>
              <p className="text-xs text-zinc-400">
                Zero external dependencies · Runs offline in any modern browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="my-4 flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download nikola-tesla-pixel-morph.html
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl border border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy HTML</span>
              </>
            )}
          </button>
        </div>

        {/* Local Run Instructions */}
        <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-zinc-200">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>How to Run Locally</span>
          </div>

          <div className="space-y-2 text-zinc-400">
            <div>
              <span className="font-medium text-zinc-300">Method 1 (Quickest):</span>
              <p className="mt-0.5">
                Double-click the downloaded <code className="text-sky-300 font-mono">nikola-tesla-pixel-morph.html</code> file to open it in Chrome, Safari, Firefox, or Edge.
              </p>
            </div>

            <div>
              <span className="font-medium text-zinc-300">Method 2 (Recommended for Webcam access):</span>
              <p className="mt-0.5">
                Modern browsers require a local HTTP server (<code className="text-zinc-200 font-mono">localhost</code>) to grant camera permissions. Run one of these in your terminal in the downloaded folder:
              </p>
              <div className="mt-1.5 rounded-lg bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800/60 select-all">
                # Python 3:
                <br />
                python3 -m http.server 8080
                <br />
                <br />
                # Or Node / npx:
                <br />
                npx serve .
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Then open <span className="text-sky-400 font-mono">http://localhost:8080/nikola-tesla-pixel-morph.html</span> in your browser.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
