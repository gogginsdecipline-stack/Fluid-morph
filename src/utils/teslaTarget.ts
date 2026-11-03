/**
 * Nikola Tesla Target Image Sampler & Luminance Optimal Transport Mapper
 * Reference image: /assets/aistudio/1790850885226_2_1da8f38b.jpg
 */

export interface TargetPixel {
  x: number; // Normalized coordinate [-1, 1]
  y: number; // Normalized coordinate [-1, 1]
  luminance: number; // 0..1
  r: number;
  g: number;
  b: number;
}

export interface SourcePixel {
  r: number; // 0..1
  g: number; // 0..1
  b: number; // 0..1
  a: number; // 0..1
  luminance: number; // 0..1
  originalX: number; // [-1, 1]
  originalY: number; // [-1, 1]
}

export class TeslaTargetProcessor {
  public static readonly TARGET_IMAGE_URL = '/assets/aistudio/1790850885226_2_1da8f38b.jpg';
  private imageElement: HTMLImageElement | null = null;
  private isLoaded = false;
  private cachedBase64: string | null = null;

  public async init(): Promise<void> {
    if (this.isLoaded && this.imageElement) return;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageElement = img;
        this.isLoaded = true;
        // Generate base64 cache for standalone exports
        try {
          const cvs = document.createElement('canvas');
          cvs.width = img.naturalWidth || 600;
          cvs.height = img.naturalHeight || 1067;
          const ctx = cvs.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
            this.cachedBase64 = cvs.toDataURL('image/jpeg', 0.85);
          }
        } catch {
          // Ignore canvas security errors
        }
        resolve();
      };
      img.onerror = () => {
        console.warn('Failed to load target image directly. Using fallback synthetic portrait.');
        this.isLoaded = true;
        resolve();
      };
      img.src = TeslaTargetProcessor.TARGET_IMAGE_URL;
    });
  }

  public getBase64Image(): string | null {
    return this.cachedBase64;
  }

  /**
   * Sample the target image into a grid of N points sorted by luminance.
   * Maintains aspect ratio (portrait 9:16) inside the viewport.
   */
  public sampleTeslaTarget(
    particleCount: number,
    viewportWidth: number,
    viewportHeight: number
  ): TargetPixel[] {
    const pixels: TargetPixel[] = [];

    // Calculate grid dimensions preserving aspect ratio ~ 9:16 (0.5625)
    const targetAspect = 9 / 16;
    const viewAspect = viewportWidth / viewportHeight;

    // Scale so Tesla fills the center nicely without clipping
    let fitWidth: number;
    let fitHeight: number;
    if (viewAspect > targetAspect) {
      fitHeight = 1.7; // Normalized height [-0.85, 0.85]
      fitWidth = fitHeight * targetAspect * (viewportHeight / viewportWidth);
    } else {
      fitWidth = 1.6;
      fitHeight = fitWidth / (targetAspect * (viewportHeight / viewportWidth));
    }

    // Determine grid resolution W * H approx equal to particleCount
    const gridCols = Math.round(Math.sqrt(particleCount * targetAspect));
    const gridRows = Math.round(particleCount / gridCols);
    const actualCount = gridCols * gridRows;

    const canvas = document.createElement('canvas');
    canvas.width = gridCols;
    canvas.height = gridRows;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx && this.imageElement && this.imageElement.complete && this.imageElement.naturalWidth > 0) {
      ctx.drawImage(this.imageElement, 0, 0, gridCols, gridRows);
      const imgData = ctx.getImageData(0, 0, gridCols, gridRows).data;

      for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
          const idx = (y * gridCols + x) * 4;
          const r = imgData[idx] / 255;
          const g = imgData[idx + 1] / 255;
          const b = imgData[idx + 2] / 255;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Normalized centered coords [-fitWidth/2, fitWidth/2] and inverted Y for WebGL
          const normX = ((x / (gridCols - 1)) - 0.5) * fitWidth;
          const normY = (0.5 - (y / (gridRows - 1))) * fitHeight;

          pixels.push({
            x: normX,
            y: normY,
            luminance: lum,
            r,
            g,
            b,
          });
        }
      }
    } else {
      // Procedural synthetic high-contrast portrait fallback
      for (let i = 0; i < actualCount; i++) {
        const xIdx = i % gridCols;
        const yIdx = Math.floor(i / gridCols);
        const u = (xIdx / gridCols - 0.5);
        const v = (0.5 - yIdx / gridRows);

        // Head and shoulders oval intensity
        const headDist = Math.sqrt((u * 1.8) ** 2 + ((v - 0.2) * 1.4) ** 2);
        const bodyDist = Math.sqrt((u * 1.1) ** 2 + ((v + 0.5) * 1.8) ** 2);
        let lum = 0.05;
        if (headDist < 0.45) lum = 0.85 - headDist * 1.4;
        if (bodyDist < 0.6) lum = Math.max(lum, 0.2);

        pixels.push({
          x: u * fitWidth,
          y: v * fitHeight,
          luminance: Math.min(1, Math.max(0, lum)),
          r: lum,
          g: lum,
          b: lum,
        });
      }
    }

    // Sort target coordinates by luminance ascending
    pixels.sort((a, b) => a.luminance - b.luminance);
    return pixels;
  }

  /**
   * Samples a source Canvas/Video/Image into N source pixels,
   * sorts them by luminance, and performs 1D Optimal Transport mapping.
   */
  public static mapSourceToTargets(
    sourceCanvas: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
    targetPixels: TargetPixel[]
  ): {
    positions: Float32Array; // Starting positions [x, y, ...]
    targets: Float32Array;   // Tesla targets [tx, ty, ...]
    colors: Float32Array;    // Source colors [r, g, b, a, ...]
  } {
    const count = targetPixels.length;
    const cols = Math.round(Math.sqrt(count * (16 / 9)));
    const rows = Math.max(1, Math.round(count / cols));
    const actualN = Math.min(count, cols * rows);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cols;
    tempCanvas.height = rows;
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });

    const sourcePixels: SourcePixel[] = [];

    if (ctx) {
      ctx.drawImage(sourceCanvas, 0, 0, cols, rows);
      const data = ctx.getImageData(0, 0, cols, rows).data;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (sourcePixels.length >= actualN) break;
          const idx = (y * cols + x) * 4;
          const r = data[idx] / 255;
          const g = data[idx + 1] / 255;
          const b = data[idx + 2] / 255;
          const a = (data[idx + 3] ?? 255) / 255;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Normalized start position
          const normX = (x / (cols - 1) - 0.5) * 1.8;
          const normY = (0.5 - y / (rows - 1)) * 1.8;

          sourcePixels.push({
            r,
            g,
            b,
            a: Math.max(0.4, a),
            luminance: lum,
            originalX: normX,
            originalY: normY,
          });
        }
      }
    }

    // Sort source pixels by luminance ascending
    sourcePixels.sort((a, b) => a.luminance - b.luminance);

    const positions = new Float32Array(actualN * 2);
    const targets = new Float32Array(actualN * 2);
    const colors = new Float32Array(actualN * 4);

    for (let i = 0; i < actualN; i++) {
      const src = sourcePixels[i];
      const tgt = targetPixels[i];

      // Starting pos = source grid coordinate
      positions[i * 2] = src.originalX;
      positions[i * 2 + 1] = src.originalY;

      // Target pos = matched Tesla coordinate
      targets[i * 2] = tgt.x;
      targets[i * 2 + 1] = tgt.y;

      // Source color preserved!
      colors[i * 4] = src.r;
      colors[i * 4 + 1] = src.g;
      colors[i * 4 + 2] = src.b;
      colors[i * 4 + 3] = src.a;
    }

    return { positions, targets, colors };
  }
}
