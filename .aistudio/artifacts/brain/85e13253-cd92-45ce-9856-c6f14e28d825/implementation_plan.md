# Nikola Tesla Pixel-Morphing Fluid Dynamics Simulation

A high-performance creative technology web application that takes live visual inputs (webcam, interactive freehand canvas, image upload, or animated test patterns) and fluidly morphs their pixels into the iconic portrait of Nikola Tesla using optimal luminance transport and curl-noise fluid physics.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core architectural and algorithmic choices were confirmed during Phase 1:

- **Rendering Engine**: High-performance WebGL with GPU instanced/point-sprite shaders and additive blend fluid trails running at 60 FPS across 50,000–100,000+ particles.
- **Pixel Mapping Algorithm**: 1D Monge-Kantorovich Luminance Sorting (optimal brightness assignment) combined with Perlin/Simplex Curl Noise velocity advection, steering particles along fluid vortices toward their designated Tesla target positions.
- **Source Input Modalities**: All four modalities supported: Live Webcam feed with real-time video sampling, Interactive Freehand Drawing Canvas (with customizable brush/spray), Custom Image/Video Upload, and Procedural Animated Test Patterns (optical spirals, RGB waves, electric arcs).
- **Dual Deliverable**: Full reactive web application running live in the AI Studio environment with an instant "Export Standalone HTML" tool generating a 100% self-contained single-file HTML bundle with embedded base64 assets for running offline anywhere.

---

### 1. Overview & Core Concept

- **What It Does**: The user provides or creates visual content (moving their face in front of the webcam, drawing neon brushstrokes, uploading an artwork, or running procedural patterns). The engine discretizes both the source and target Nikola Tesla portrait into a particle field. It computes an optimal transport assignment matching source colors to target luminance coordinates, then unleashes a fluid velocity field where particles swirl, collide, and smoothly coalesce into Nikola Tesla.
- **Target Audience**: Creative technologists, digital artists, interactive installation designers, and physics simulation enthusiasts.
- **Key Value**: Recreates the viral pixel-morphing visual phenomenon at real-time 60fps in the browser with tangible, interactive physics controls.

---

### 2. User Experience & Visual Design

- **Viewport Presence**: Full-bleed WebGL viewport with a floating dark glass HUD (`backdrop-blur-md bg-zinc-950/70 border border-zinc-800/80`) optimized for immersion.
- **Typography**: Clean, technical Neo-Grotesque sans (`Plus Jakarta Sans`) paired with tabular numerals (`font-mono tabular-nums`) for physics metrics (particle count, FPS, viscosity, curl scale).
- **Color Discipline**: 60% deep obsidian canvas (`#09090b`), 30% muted slate UI structural frames (`#18181b`, `#27272a`), 10% electric amber/cyan accent (`#f59e0b`, `#38bdf8`) evoking Tesla's electrical heritage.
- **Interactive Controls**:
  - **Source Switcher**: Segmented control switching between `Webcam`, `Draw Canvas`, `Upload Image`, and `Electric Wave`.
  - **Simulation State**: `Morph to Tesla`, `Disperse / Explode`, `Source Recapture`, and `Freeze / Resume`.
  - **Physics Sliders**:
    - Particle Resolution (15,000 to 100,000 particles)
    - Fluid Curl Noise / Turbulence
    - Viscosity & Drag Dampening
    - Spring Attraction / Easing Speed
    - Particle Trail Persistence (Fade length)
    - Particle Point Size (1px to 6px)
  - **Draw Canvas Tools**: Brush size, color picker, clear, spray effect, and instant morph trigger.
  - **Interactive Cursor Physics**: Mouse / touch interaction attracts or repels nearby particles with fluid disturbance vortices.
  - **Export Action**: One-click download of the complete standalone, single-file HTML bundle.

---

### 3. Key Product Decisions & Trade-Offs

- **WebGL 2 Point Sprites with Float32 Typed Arrays**:
  - *Chosen Approach*: Maintain high-speed particle position, velocity, target position, and source color buffers in interleaved `Float32Array` buffers with WebGL point-primitive rendering.
  - *Why*: Enables 60fps rendering of up to 100,000 simultaneous particles even on integrated graphics, avoiding the memory overhead of mesh geometries.
- **Monge-Kantorovich Luminance Optimal Transport**:
  - *Chosen Approach*: Sort target Tesla coordinates by grayscale luminance once at initialization (or resize). When a source frame arrives, sort source pixels by luminance and map index-to-index.
  - *Why*: O(N log N) lightning speed (5-10ms for 60,000 particles). Highlights seamlessly flow into Tesla's forehead, shirt collar, and cheek, while shadows flow into his suit jacket and hair, producing a photographic reassembly.
- **Analytical Curl-Noise Flow Field**:
  - *Chosen Approach*: Calculate velocity vectors from the curl of a 2D/3D Simplex noise potential field, blended with a damped harmonic spring force directed at each particle's Tesla target point.
  - *Why*: Guarantees divergence-free fluid movement (no unnatural particle clustering or vacuum voids), delivering that organic smoke/liquid flow seen in the viral video.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SOURCE INPUT GENERATOR                          │
│   Webcam Stream (60fps)  │  Freehand Canvas  │  File Upload  │ Pattern │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Offscreen Canvas 2D Sampling
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     OPTIMAL TRANSPORT ENGINE                           │
│  Source Pixels (RGB + Lum)  ◄───────────►  Tesla Target (X, Y, Lum)     │
│                 Sort & Pair: idx[i] -> target[i]                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Target Coordinates + Source Colors
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     PHYSICS SIMULATION WORKER                          │
│  - Curl Noise Velocity Field: v += curl(x, y, t) * turbulence          │
│  - Spring Attraction: a = (target - pos) * spring - vel * damping      │
│  - Mouse Vortex Disturbance: impulse on cursor drag                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Update Float32Array Buffers
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   WEBGL 2 POINT-SPRITE RENDERER                        │
│  - Custom Vertex & Fragment Shaders                                    │
│  - Alpha / Additive Trail Blending                                     │
│  - Post-Process Exposure & Sharpness                                   │
└────────────────────────────────────────────────────────────────────────┘
```

- **Standalone HTML Packager**:
  - An in-browser export utility converts the Nikola Tesla reference image into an embedded Base64 Data URI, bundles the WebGL shader source code, particle physics engine, and GUI into an independent `.html` file that can be downloaded and opened with zero web server dependencies.

---

### 5. Step-by-Step Implementation Sequence

1. **Target Image Preprocessor**:
   - Load `/public/assets/aistudio/1790850885226_2_1da8f38b.jpg` into an offscreen canvas.
   - Extract aspect ratio (9:16), sample pixel brightness, and pre-calculate luminance sorted coordinate arrays.
2. **WebGL Particle Engine Core (`src/graphics/ParticleSystem.ts`)**:
   - WebGL context initialization, buffer allocation (`a_position`, `a_target`, `a_color`, `a_size`).
   - Vertex shader with point size attenuation and target-lerp dynamics.
   - Fragment shader with soft circular anti-aliased particle points.
   - Particle update loop integrating Curl Noise (Simplex noise implementation) and spring dynamics with mouse repulsion/vortex.
3. **Input Pipeline (`src/inputs/`)**:
   - `WebcamManager`: Request camera stream with fallback permission handling and canvas pixel downsampler.
   - `DrawingCanvas`: Interactive HTML5 Canvas with smooth Bézier strokes, color palettes, and clear/spray tools.
   - `ImageUploader`: Drag-and-drop or file picker with instant aspect-preserving downsampling.
   - `PatternGenerator`: Real-time generative patterns (electric plasma, chromatic vortex).
4. **App Interface & HUD (`src/App.tsx`, `src/components/`)**:
   - Modern floating glassmorphism control panel with collapsible drawer.
   - Real-time stats (FPS counter, particle count, morph completion %).
   - Preset buttons: "Subtle Fluid", "Violent Electric Storm", "Slow Dreamlike Morph", "Instant Magnetism".
   - Export button: downloads `nikola-tesla-pixel-morph.html`.
5. **Standalone HTML Template Generator**:
   - Self-contained HTML generator embedded in the app for local execution.
